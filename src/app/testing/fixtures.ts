import type { Collection, CollectionMovie, TmdbMovie } from '../core/tmdb.models';
import type { CollectionsState } from '../state/collections.feature';
import type { MoviesState } from '../state/movies.feature';

export function tmdbMovie(overrides: Partial<TmdbMovie> = {}): TmdbMovie {
  return {
    id: 100,
    title: 'A Movie',
    poster_path: '/poster.jpg',
    vote_average: 7.5,
    genre_ids: [],
    ...overrides,
  };
}

export function collectionMovie(overrides: Partial<CollectionMovie> = {}): CollectionMovie {
  return {
    id: 100,
    title: 'A Movie',
    poster_path: '/poster.jpg',
    vote_average: 7.5,
    ...overrides,
  };
}

export function collection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 'collection-1',
    name: 'Favorites',
    movies: [],
    ...overrides,
  };
}

export function moviesState(overrides: Partial<MoviesState> = {}): MoviesState {
  return {
    genres: {},
    mode: 'popular',
    query: '',
    items: [],
    page: 0,
    totalPages: 1,
    status: 'idle',
    error: null,
    ...overrides,
  };
}

export function collectionsState(overrides: Partial<CollectionsState> = {}): CollectionsState {
  return {
    collections: [],
    ...overrides,
  };
}
