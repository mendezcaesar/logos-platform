import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase!: SupabaseClient;
  private platformId = inject(PLATFORM_ID);
  
  // High-Security In-Memory Cache: Keeps the active session safe from XSS storage scrapers
  private inMemoryTokenCache: string | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
        {
          auth: {
            // Silicon Valley Pattern: Explicitly override the default insecure localStorage adapter
            storage: {
              getItem: (key: string) => this.inMemoryTokenCache,
              setItem: (key: string, value: string) => { this.inMemoryTokenCache = value; },
              removeItem: (key: string) => { this.inMemoryTokenCache = null; }
            },
            autoRefreshToken: true,
            persistSession: true
          }
        }
      );
    } else {
      // Server Mode Mock Layer to protect SSR compiler
      this.supabase = {
        auth: {
          onAuthStateChange: () => ({ data: { subscription: null } }),
          signInWithOAuth: async () => ({ data: {}, error: null }),
          signOut: async () => ({ error: null })
        }
      } as unknown as SupabaseClient;
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
