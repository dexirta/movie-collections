import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideState, provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import Aura from '@primeuix/themes/aura';
import { ConfirmationService } from 'primeng/api';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { CollectionsEffects } from './state/collections.effects';
import { collectionsFeature } from './state/collections.feature';
import { MoviesEffects } from './state/movies.effects';
import { moviesFeature } from './state/movies.feature';

function tmdbImageLoader(config: ImageLoaderConfig): string {
  return config.src;
}

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: IMAGE_LOADER, useValue: tmdbImageLoader },
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideStore(),
    provideState(moviesFeature),
    provideState(collectionsFeature),
    provideEffects(MoviesEffects, CollectionsEffects),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    providePrimeNG({ theme: { preset: Aura } }),
    ConfirmationService,
  ],
};
