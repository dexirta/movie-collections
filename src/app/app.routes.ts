import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'movies',
  },
  {
    path: 'movies',
    title: 'Movies — Movie Collections',
    loadComponent: () =>
      import('./features/movies/movies').then((m) => m.Movies),
  },
  {
    path: 'collections',
    title: 'Collections — Movie Collections',
    loadComponent: () =>
      import('./features/collections/collections-list/collections-list').then(
        (module) => module.CollectionsList,
      ),
  },
  {
    path: 'collections/:id',
    title: 'Collection — Movie Collections',
    loadComponent: () =>
      import('./features/collections/collection-detail/collection-detail').then(
        (module) => module.CollectionDetail,
      ),
  },
  {
    path: '**',
    redirectTo: 'movies',
  },
];
