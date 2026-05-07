import { createActionGroup, emptyProps, props } from '@ngrx/store';
import type { TmdbMovie } from '../core/tmdb.models';

export const MoviesActions = createActionGroup({
  source: 'Movies',
  events: {
    'Genres Loaded': props<{ genres: Record<number, string> }>(),
    'Load Popular': emptyProps(),
    'Load Popular Success': props<{
      movies: readonly TmdbMovie[];
      page: number;
      totalPages: number;
    }>(),
    'Search Submit': props<{ query: string }>(),
    'Search Success': props<{
      movies: readonly TmdbMovie[];
      page: number;
      totalPages: number;
      query: string;
    }>(),
    'Discovery Failure': props<{ error: string }>(),
    'Load More': emptyProps(),
    'Load More Success': props<{
      movies: readonly TmdbMovie[];
      page: number;
      totalPages: number;
    }>(),
  },
});
