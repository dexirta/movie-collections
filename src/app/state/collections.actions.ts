import { createActionGroup, props } from '@ngrx/store';
import type { Collection, CollectionMovie } from '../core/tmdb.models';

export const CollectionsActions = createActionGroup({
  source: 'Collections',
  events: {
    'Hydrate': props<{ collections: readonly Collection[] }>(),
    'Create': props<{ id: string; name: string }>(),
    'Delete': props<{ id: string }>(),
    'Add Movie': props<{ collectionId: string; movie: CollectionMovie }>(),
    'Remove Movie': props<{ collectionId: string; movieId: number }>(),
  },
});
