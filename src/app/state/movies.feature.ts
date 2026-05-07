import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import { genreLabelFromIds } from '../core/genre-labels';
import type { TmdbMovie } from '../core/tmdb.models';
import { MoviesActions } from './movies.actions';

export function genreLabelsByMovieId(
  items: readonly TmdbMovie[],
  genres: Record<number, string>,
): ReadonlyMap<number, string> {
  return new Map(items.map((movie) => [movie.id, genreLabelFromIds(movie.genre_ids, genres)]));
}

type DiscoveryMode = 'popular' | 'search';
type DiscoveryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface MoviesState {
  readonly genres: Record<number, string>;
  readonly mode: DiscoveryMode;
  readonly query: string;
  readonly items: readonly TmdbMovie[];
  readonly page: number;
  readonly totalPages: number;
  readonly status: DiscoveryStatus;
  readonly error: string | null;
}

export const initialMoviesState: MoviesState = {
  genres: {},
  mode: 'popular',
  query: '',
  items: [],
  page: 0,
  totalPages: 1,
  status: 'idle',
  error: null,
};

function appendUnique(
  existing: readonly TmdbMovie[],
  incoming: readonly TmdbMovie[],
): readonly TmdbMovie[] {
  const existingIds = new Set(existing.map((movie) => movie.id));
  return [...existing, ...incoming.filter((movie) => !existingIds.has(movie.id))];
}

export const moviesFeature = createFeature({
  name: 'movies',
  reducer: createReducer(
    initialMoviesState,
    on(MoviesActions.genresLoaded, (state, { genres }) => ({ ...state, genres })),
    on(MoviesActions.loadPopular, (state) => ({
      ...state,
      mode: 'popular' as const,
      query: '',
      items: [],
      page: 0,
      status: 'loading' as const,
      error: null,
    })),
    on(MoviesActions.loadPopularSuccess, (state, { movies, page, totalPages }) => ({
      ...state,
      mode: 'popular' as const,
      items: movies,
      page,
      totalPages,
      status: 'success' as const,
      error: null,
    })),
    on(MoviesActions.searchSubmit, (state, { query }) => ({
      ...state,
      mode: 'search' as const,
      query,
      items: [],
      page: 0,
      status: 'loading' as const,
      error: null,
    })),
    on(MoviesActions.searchSuccess, (state, { movies, page, totalPages, query }) => ({
      ...state,
      mode: 'search' as const,
      query,
      items: movies,
      page,
      totalPages,
      status: 'success' as const,
      error: null,
    })),
    on(MoviesActions.loadMore, (state) => ({ ...state, status: 'loading' as const, error: null })),
    on(MoviesActions.loadMoreSuccess, (state, { movies, page, totalPages }) => ({
      ...state,
      items: appendUnique(state.items, movies),
      page,
      totalPages,
      status: 'success' as const,
      error: null,
    })),
    on(MoviesActions.discoveryFailure, (state, { error }) => ({
      ...state,
      status: 'error' as const,
      error,
    })),
  ),
  extraSelectors: ({ selectStatus, selectPage, selectTotalPages, selectItems, selectGenres }) => ({
    selectIsLoading: createSelector(selectStatus, (status) => status === 'loading'),
    selectHasMore: createSelector(
      selectPage,
      selectTotalPages,
      (page, totalPages) => page > 0 && page < totalPages,
    ),
    selectGenreLabelsByMovieId: createSelector(selectItems, selectGenres, (items, genres) =>
      genreLabelsByMovieId(items, genres),
    ),
  }),
});
