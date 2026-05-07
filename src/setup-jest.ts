import { setupZonelessTestEnv } from 'jest-preset-angular/setup-env/zoneless';

setupZonelessTestEnv();

/** Jsdom does not load `index.html`; NgOptimizedImage (NG02956) expects this preconnect like production. */
function ensureTmdbImagePreconnect(): void {
  const href = 'https://image.tmdb.org';
  if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = href;
  link.crossOrigin = '';
  document.head.appendChild(link);
}

ensureTmdbImagePreconnect();
