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
  
  // Silicon Valley Pattern: Inject the PLATFORM_ID token to detect if code is running on server vs browser
  private platformId = inject(PLATFORM_ID);

  private currentUserSignal = signal<User | null>(null);
  readonly user = this.currentUserSignal.asReadonly();

  constructor() {
    // Crucial Guard: Only execute state listeners if we are running safely inside the user's browser
    if (isPlatformBrowser(this.platformId)) {
      this.supabaseService.client.auth.onAuthStateChange((event, session) => {
        this.currentUserSignal.set(session?.user ?? null);
        
        if (event === 'SIGNED_OUT') {
          this.router.navigate(['/login']);
        }
      });
    }
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
    if (error) {
      console.error('Sign Out Error:', error.message);
    }
  }
}
