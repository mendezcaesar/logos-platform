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
  
  // High-Security In-Memory Cache String
  private tokenCache: string = '';

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey,
        {
          auth: {
            storage: {
              getItem: (key: string): string | null => this.tokenCache || null,
              setItem: (key: string, value: string): void => { this.tokenCache = value; },
              removeItem: (key: string): void => { this.tokenCache = ''; }
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
          signOut: async () => ({ error: null }),
          getSession: async () => ({ data: { session: null }, error: null })
        },
        from: () => ({
          select: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          })
        })
      } as unknown as SupabaseClient;
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
