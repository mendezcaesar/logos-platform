import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private currentUserSignal = signal<User | null>(null);
  readonly user = this.currentUserSignal.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Step 1: Instantly start listening for incoming OAuth credential redirections
      this.supabaseService.client.auth.onAuthStateChange((event, session) => {
        // Sync the reactive application states with the fresh session variables smoothly
        this.currentUserSignal.set(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/login']);
        }
      });
    }
  }

  /**
   * Technical Fix: Forces the code to wait until Supabase verifies the in-memory 
   * session before letting components fire data mutation requests.
   */
  async ensureAuthenticatedSession(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;
    
    const { data: { session } } = await this.supabaseService.client.auth.getSession();
    if (session) {
      this.currentUserSignal.set(session.user);
      return true;
    }
    return false;
  }

  async loginWithGitHub(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const { error } = await this.supabaseService.client.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/admin`
      }
    });

    if (error) {
      console.error('OAuth Handshake Error:', error.message);
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const { error } = await this.supabaseService.client.auth.signOut();
    if (error) console.error('Sign Out Error:', error.message);
  }
}
