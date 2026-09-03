import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { SupabaseService } from './services/supabase.service';
import { AuthService } from './services/auth.service';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Explicitly guarantee the server worker can resolve injection tokens during pre-rendering execution loops
    SupabaseService,
    AuthService
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
