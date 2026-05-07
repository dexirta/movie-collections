import { collection, collectionMovie, collectionsState } from '../testing/fixtures';
import { CollectionsActions } from './collections.actions';
import { collectionsFeature, initialCollectionsState } from './collections.feature';

describe('collectionsFeature reducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(collectionsFeature.reducer(undefined, { type: '@@init' } as never)).toEqual(
      initialCollectionsState,
    );
  });

  it('hydrate replaces the collections array', () => {
    const next = collectionsFeature.reducer(
      initialCollectionsState,
      CollectionsActions.hydrate({ collections: [collection({ id: 'a', name: 'A' })] }),
    );
    expect(next.collections).toEqual([collection({ id: 'a', name: 'A' })]);
  });

  it.each([
    {
      label: 'create adds one collection',
      action: CollectionsActions.create({ id: 'new-id', name: 'Watchlist' }),
      previous: initialCollectionsState,
      expected: [{ id: 'new-id', name: 'Watchlist', movies: [] }],
    },
    {
      label: 'create trims surrounding whitespace',
      action: CollectionsActions.create({ id: 'x', name: '  Watchlist  ' }),
      previous: initialCollectionsState,
      expected: [{ id: 'x', name: 'Watchlist', movies: [] }],
    },
    {
      label: 'create with whitespace-only name is a no-op',
      action: CollectionsActions.create({ id: 'noop', name: '   \t' }),
      previous: initialCollectionsState,
      expected: [],
    },
    {
      label: 'delete removes the matching id',
      action: CollectionsActions.delete({ id: 'collection-1' }),
      previous: collectionsState({ collections: [collection()] }),
      expected: [],
    },
    {
      label: 'delete on a missing id is a no-op',
      action: CollectionsActions.delete({ id: 'missing' }),
      previous: collectionsState({ collections: [collection()] }),
      expected: [collection()],
    },
  ])('$label', ({ action, previous, expected }) => {
    const next = collectionsFeature.reducer(previous, action);
    expect(next.collections).toEqual(expected);
  });

  it.each([
    {
      label: 'addMovie inserts a snapshot',
      previous: collectionsState({ collections: [collection({ id: 'c1' })] }),
      action: CollectionsActions.addMovie({ collectionId: 'c1', movie: collectionMovie({ id: 1 }) }),
      expectedMovieIds: [1],
    },
    {
      label: 'addMovie rejects duplicates by id',
      previous: collectionsState({
        collections: [collection({ id: 'c1', movies: [collectionMovie({ id: 1 })] })],
      }),
      action: CollectionsActions.addMovie({ collectionId: 'c1', movie: collectionMovie({ id: 1 }) }),
      expectedMovieIds: [1],
    },
    {
      label: 'addMovie on a missing collection is a no-op',
      previous: collectionsState({ collections: [collection({ id: 'c1' })] }),
      action: CollectionsActions.addMovie({ collectionId: 'missing', movie: collectionMovie({ id: 1 }) }),
      expectedMovieIds: [],
    },
    {
      label: 'removeMovie drops the matching id',
      previous: collectionsState({
        collections: [collection({ id: 'c1', movies: [collectionMovie({ id: 1 })] })],
      }),
      action: CollectionsActions.removeMovie({ collectionId: 'c1', movieId: 1 }),
      expectedMovieIds: [],
    },
    {
      label: 'removeMovie on missing id is a no-op',
      previous: collectionsState({
        collections: [collection({ id: 'c1', movies: [collectionMovie({ id: 1 })] })],
      }),
      action: CollectionsActions.removeMovie({ collectionId: 'c1', movieId: 999 }),
      expectedMovieIds: [1],
    },
  ])('$label', ({ previous, action, expectedMovieIds }) => {
    const next = collectionsFeature.reducer(previous, action);
    const target = next.collections.find((entry) => entry.id === 'c1');
    expect(target?.movies.map((movie) => movie.id) ?? []).toEqual(expectedMovieIds);
  });
});

describe('collectionsFeature selectors', () => {
  const stateOf = (collections = []) => ({ collections: collectionsState({ collections }) });

  it('selectCollectionNamesByMovieId groups names by movie id across collections', () => {
    const state = stateOf([
      collection({ id: 'c1', name: 'Favs', movies: [collectionMovie({ id: 1 })] }),
      collection({ id: 'c2', name: 'Watchlist', movies: [collectionMovie({ id: 1 }), collectionMovie({ id: 2 })] }),
    ] as never);
    const result = collectionsFeature.selectCollectionNamesByMovieId(state);
    expect(result.get(1)).toEqual(['Favs', 'Watchlist']);
    expect(result.get(2)).toEqual(['Watchlist']);
    expect(result.get(99)).toBeUndefined();
  });
});
