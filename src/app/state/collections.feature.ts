import { createFeature, createReducer, createSelector, on } from '@ngrx/store';
import type { Collection } from '../core/tmdb.models';
import { CollectionsActions } from './collections.actions';

export interface CollectionsState {
  readonly collections: readonly Collection[];
}

export const initialCollectionsState: CollectionsState = {
  collections: [],
};

export const collectionsFeature = createFeature({
  name: 'collections',
  reducer: createReducer(
    initialCollectionsState,
    on(
      CollectionsActions.hydrate,
      (state, { collections }): CollectionsState => ({ ...state, collections }),
    ),
    on(CollectionsActions.create, (state, { id, name }): CollectionsState => {
      const trimmed = name.trim();
      if (!trimmed) return state;
      const collection: Collection = { id, name: trimmed, movies: [] };
      return { ...state, collections: [...state.collections, collection] };
    }),
    on(
      CollectionsActions.delete,
      (state, { id }): CollectionsState => ({
        ...state,
        collections: state.collections.filter((collection) => collection.id !== id),
      }),
    ),
    on(CollectionsActions.addMovie, (state, { collectionId, movie }): CollectionsState => {
      const collections = state.collections.map((collection) => {
        if (collection.id !== collectionId) return collection;
        if (collection.movies.some((existing) => existing.id === movie.id)) return collection;
        return { ...collection, movies: [...collection.movies, movie] };
      });
      return { ...state, collections };
    }),
    on(CollectionsActions.removeMovie, (state, { collectionId, movieId }): CollectionsState => {
      const collections = state.collections.map((collection) => {
        if (collection.id !== collectionId) return collection;
        return {
          ...collection,
          movies: collection.movies.filter((movie) => movie.id !== movieId),
        };
      });
      return { ...state, collections };
    }),
  ),
  extraSelectors: ({ selectCollections }) => ({
    selectCollectionNamesByMovieId: createSelector(selectCollections, (collections) => {
      return collections.reduce((acc, entry) => {
        for (const movie of entry.movies) {
          const names = acc.get(movie.id) ?? [];
          names.push(entry.name);
          acc.set(movie.id, names);
        }
        return acc;
      }, new Map<number, string[]>());
    }),
  }),
});
