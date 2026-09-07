import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = (context: any) => bootstrapApplication(AppComponent, config, context);

export default bootstrap;
