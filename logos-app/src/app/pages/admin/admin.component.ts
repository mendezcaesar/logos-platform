import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminComponent {
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  
  user = this.authService.user;
  isSaving = signal<boolean>(false);

  // Form Field Signal States
  title = signal<string>('');
  content = signal<string>('');
  excerpt = signal<string>('');

  /**
   * Helper function to automatically convert title text into an SEO-friendly URL slug string.
   * Example: "Hello World Blog!" becomes "hello-world-blog"
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Dispatches form field payload states directly to our cloud Supabase posts table container.
   * Leverages high-security dynamic in-memory session validations before dispatching payloads.
   */
  async handleCreatePost(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!this.title() || !this.content()) {
      alert('Title and Content are strictly required fields!');
      return;
    }

    // Security Verification: Grab the live session tokens from our in-memory client wrapper
    const { data: { session }, error: sessionError } = await this.supabaseService.client.auth.getSession();

    if (sessionError || !session) {
      alert('Security violation: Your session token is missing or expired. Please re-authenticate!');
      return;
    }

    this.isSaving.set(true);

    const payload = {
      title: this.title(),
      slug: this.generateSlug(this.title()),
      content: this.content(),
      excerpt: this.excerpt() || null
    };

    // Execute the insertion script with your active session context attached natively
    const { error } = await this.supabaseService.client
      .from('posts')
      .insert([payload]);

    this.isSaving.set(false);

    if (error) {
      console.error('Database Rejected Request:', error.message);
      alert(`Database rejected article creation: ${error.message}`);
    } else {
      alert('Article successfully written to the cloud database!');
      this.title.set('');
      this.content.set('');
      this.excerpt.set('');
    }
  }

  /**
   * Terminates the session securely across cloud boundaries.
   */
  async handleLogout(): Promise<void> {
    await this.authService.logout();
  }
}
