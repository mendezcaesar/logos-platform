import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Silicon Valley Pattern: Inject services using the modern inject() token over constructors
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // Core Reactivity: Use Angular Signals to store the logged-in user state across the app
  private currentUserSignal = signal<User | null>(null);
  
  // Publicly expose the signal as read-only to guarantee a unidirectional data flow
  readonly user = this.currentUserSignal.asReadonly();

  constructor() {
    // Listen to changes in authentication state automatically (login, logout, token refresh)
    this.supabaseService.client.auth.onAuthStateChange((event, session) => {
      this.currentUserSignal.set(session?.user ?? null);
      
      // Clear data and redirect if the session expires or user logs out
      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Triggers the OAuth 2.0 PKCE authentication handshake with GitHub.
   * Redirects the user's browser securely to GitHub's authorization gate.
   */
  async loginWithGitHub(): Promise<void> {
    const { error } = await this.supabaseService.client.auth.signInWithOAuth({
      provider: 'github',
      options: {
        // Redirection target after successful cloud authorization handshakes
        redirectTo: `${window.location.origin}/admin`
      }
    });

    if (error) {
      console.error('OAuth Handshake Error:', error.message);
      throw error;
    }
  }

  /**
   * Clears session cookies and signs the current user out of all cloud scopes.
   */
  async logout(): Promise<void> {
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) {
      console.error('Sign Out Error:', error.message);
    }
  }
}
