import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(
      routes,
      // Route params & query params (id, name, from) arrive as signal inputs.
      withComponentInputBinding(),
      // Browser back from details restores the list's scroll position.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
  ],
};
