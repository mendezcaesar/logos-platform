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

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // 🌐 Running in the Browser: Initialize the full Supabase Client
      this.supabase = createClient(
        environment.supabaseUrl,
        environment.supabaseKey
      );
    } else {
      // 🖥️ Running on the Server (SSR Build Time): Create a safe Mock Object
      // This prevents the application from crashing due to missing browser window elements
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
