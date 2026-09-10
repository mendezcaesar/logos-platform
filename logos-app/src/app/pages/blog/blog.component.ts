import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  // Core Reactivity: Signals to hold our live database records matrix array
  posts = signal<any[]>([]);
  isLoading = signal<boolean>(true);

  /**
   * Automatically executes the query the millisecond the component initializes on screen [13ffeeb].
   */
  async ngOnInit(): Promise<void> {
    await this.fetchPublicArticles();
  }

  /**
   * Executes an anonymous public read request against the cloud posts container table.
   */
  private async fetchPublicArticles(): Promise<void> {
    this.isLoading.set(true);

    // Fetch the ID, title, excerpt, slug, and creation date columns from the cloud database
    const { data, error } = await this.supabaseService.client
      .from('posts')
      .select('id, title, excerpt, slug, created_at')
      .order('created_at', { ascending: false }); // Sort so newest articles display first

    this.isLoading.set(false);

    if (error) {
      console.error('Failed to pull public feed streams:', error.message);
    } else if (data) {
      this.posts.set(data);
    }
  }
}
