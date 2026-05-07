import { moviesState, tmdbMovie } from '../testing/fixtures';
import { MoviesActions } from './movies.actions';
import { genreLabelsByMovieId, initialMoviesState, moviesFeature } from './movies.feature';

describe('moviesFeature reducer', () => {
  it('returns initial state for an unknown action', () => {
    expect(moviesFeature.reducer(undefined, { type: '@@init' } as never)).toEqual(initialMoviesState);
  });

  it('genresLoaded replaces the genres map', () => {
    const next = moviesFeature.reducer(
      initialMoviesState,
      MoviesActions.genresLoaded({ genres: { 28: 'Action' } }),
    );
    expect(next.genres).toEqual({ 28: 'Action' });
  });

  it.each([
    {
      label: 'searchSubmit clears items and switches to search mode',
      previous: moviesState({
        items: [tmdbMovie({ id: 1 })],
        page: 2,
        mode: 'popular' as const,
      }),
      action: MoviesActions.searchSubmit({ query: 'matrix' }),
      expected: { mode: 'search', query: 'matrix', items: [] as ReturnType<typeof tmdbMovie>[], status: 'loading' },
    },
    {
      label: 'loadPopular clears items and resets to popular mode',
      previous: moviesState({
        items: [tmdbMovie({ id: 1 })],
        page: 4,
        mode: 'search' as const,
        query: 'old',
      }),
      action: MoviesActions.loadPopular(),
      expected: { mode: 'popular', query: '', items: [] as ReturnType<typeof tmdbMovie>[], status: 'loading' },
    },
  ])('$label', ({ previous, action, expected }) => {
    const next = moviesFeature.reducer(previous, action);
    expect(next).toMatchObject(expected);
  });

  it.each([
    {
      label: 'loadPopularSuccess replaces items',
      previous: moviesState({ items: [tmdbMovie({ id: 1 })] }),
      movies: [tmdbMovie({ id: 2 })],
      page: 1,
      totalPages: 5,
      expectedIds: [2],
    },
  ])('$label', ({ previous, movies, page, totalPages, expectedIds }) => {
    const next = moviesFeature.reducer(
      previous,
      MoviesActions.loadPopularSuccess({ movies, page, totalPages }),
    );
    expect(next.items.map((movie) => movie.id)).toEqual(expectedIds);
    expect(next.page).toBe(page);
    expect(next.totalPages).toBe(totalPages);
    expect(next.status).toBe('success');
  });

  it.each([
    {
      label: 'loadMoreSuccess appends new ids',
      seed: [tmdbMovie({ id: 1 })],
      append: [tmdbMovie({ id: 2 })],
      expectedIds: [1, 2],
    },
    {
      label: 'loadMoreSuccess deduplicates by id',
      seed: [tmdbMovie({ id: 1 })],
      append: [tmdbMovie({ id: 1 }), tmdbMovie({ id: 3 })],
      expectedIds: [1, 3],
    },
  ])('$label', ({ seed, append, expectedIds }) => {
    const previous = moviesState({ items: seed, page: 1, totalPages: 5 });
    const next = moviesFeature.reducer(
      previous,
      MoviesActions.loadMoreSuccess({ movies: append, page: 2, totalPages: 5 }),
    );
    expect(next.items.map((movie) => movie.id)).toEqual(expectedIds);
  });

  it('discoveryFailure sets error and clears loading', () => {
    const previous = moviesState({ status: 'loading' });
    const next = moviesFeature.reducer(
      previous,
      MoviesActions.discoveryFailure({ error: 'boom' }),
    );
    expect(next.status).toBe('error');
    expect(next.error).toBe('boom');
  });
});

describe('genreLabelsByMovieId', () => {
  it('joins resolved genre names in id order', () => {
    const items = [tmdbMovie({ id: 1, genre_ids: [28, 12] })];
    const map = genreLabelsByMovieId(items, { 28: 'Action', 12: 'Adventure' });
    expect(map.get(1)).toBe('Action, Adventure');
  });

  it('includes every resolved genre without a cap', () => {
    const items = [tmdbMovie({ id: 3, genre_ids: [1, 2, 3, 4, 5, 6] })];
    const map = genreLabelsByMovieId(items, { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F' });
    expect(map.get(3)).toBe('A, B, C, D, E, F');
  });

  it('returns em dash when no ids resolve', () => {
    const items = [tmdbMovie({ id: 2, genre_ids: [999] })];
    expect(genreLabelsByMovieId(items, {}).get(2)).toBe('—');
  });
});

describe('moviesFeature selectors', () => {
  const stateOf = (overrides = {}) => ({ movies: moviesState(overrides), collections: { collections: [] } });

  it('selectGenreLabelsByMovieId reads items and genres from state', () => {
    const state = stateOf({
      items: [tmdbMovie({ id: 7, genre_ids: [28] })],
      genres: { 28: 'Action' },
    });
    expect(moviesFeature.selectGenreLabelsByMovieId(state).get(7)).toBe('Action');
  });

  it.each([
    { label: 'page 1 of 5  → has more',  page: 1, totalPages: 5, expected: true  },
    { label: 'page 5 of 5  → done',      page: 5, totalPages: 5, expected: false },
    { label: 'page 0 (idle) → false',     page: 0, totalPages: 0, expected: false },
  ])('$label', ({ page, totalPages, expected }) => {
    expect(moviesFeature.selectHasMore(stateOf({ page, totalPages }))).toBe(expected);
  });

  it.each([
    { status: 'idle'    as const, expected: false },
    { status: 'loading' as const, expected: true },
    { status: 'success' as const, expected: false },
    { status: 'error'   as const, expected: false },
  ])('selectIsLoading returns $expected when status=$status', ({ status, expected }) => {
    expect(moviesFeature.selectIsLoading(stateOf({ status }))).toBe(expected);
  });
});
