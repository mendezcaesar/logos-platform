import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './blog.html',
  styleUrl: './blog.css'
})
export class BlogComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  private platformId = inject(PLATFORM_ID);

  posts = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  isBrowser = signal<boolean>(false);
  
  // Diagnostic Tracker
  errorMessage = signal<string>('');

  async ngOnInit(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      this.isBrowser.set(true);
      await this.fetchPublicArticles();
    }
  }

  private async fetchPublicArticles(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      const { data, error } = await this.supabaseService.client
        .from('posts')
        .select('id, title, excerpt, slug, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        this.errorMessage.set(error.message);
        console.error('Database Error logs:', error.message);
      } else if (data) {
        this.posts.set(data);
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Unknown runtime fetch rejection.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
