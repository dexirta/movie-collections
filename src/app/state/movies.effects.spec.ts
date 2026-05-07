import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject, firstValueFrom, of, throwError } from 'rxjs';
import { TmdbApiService } from '../core/tmdb-api.service';
import { tmdbMovie, moviesState } from '../testing/fixtures';
import { MoviesActions } from './movies.actions';
import { MoviesEffects } from './movies.effects';

describe('MoviesEffects', () => {
  let actions$: ReplaySubject<Action>;
  let api: { getGenreMap: jest.Mock; getPopular: jest.Mock; searchMovies: jest.Mock };

  function setup(state = moviesState()) {
    actions$ = new ReplaySubject<Action>(1);
    api = {
      getGenreMap: jest.fn().mockReturnValue(of({})),
      getPopular: jest.fn(),
      searchMovies: jest.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        MoviesEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: { movies: state, collections: { collections: [] } } }),
        { provide: TmdbApiService, useValue: api },
      ],
    });
  }

  describe('loadGenresOnInit$', () => {
    it.each([
      {
        label: 'maps genre payload to genresLoaded',
        stream: () => of({ 28: 'Action' }),
        expected: MoviesActions.genresLoaded({ genres: { 28: 'Action' } }),
      },
      {
        label: 'maps HTTP error to empty genresLoaded',
        stream: () => throwError(() => new Error('x')),
        expected: MoviesActions.genresLoaded({ genres: {} }),
      },
    ])('$label', async ({ stream, expected }) => {
      setup();
      api.getGenreMap.mockReturnValue(stream());
      const effect$ = TestBed.inject(MoviesEffects).loadGenresOnInit$;
      actions$.next({ type: '@ngrx/effects/init' });
      await expect(firstValueFrom(effect$)).resolves.toEqual(expected);
    });
  });

  it('loadPopular$ maps a TMDB page to loadPopularSuccess', async () => {
    setup();
    const movie = tmdbMovie({ id: 1 });
    api.getPopular.mockReturnValue(
      of({ page: 1, total_pages: 4, total_results: 1, results: [movie] }),
    );
    const effect$ = TestBed.inject(MoviesEffects).loadPopular$;
    actions$.next(MoviesActions.loadPopular());
    await expect(firstValueFrom(effect$)).resolves.toEqual(
      MoviesActions.loadPopularSuccess({ movies: [movie], page: 1, totalPages: 4 }),
    );
  });

  it('loadPopular$ maps HTTP error to discoveryFailure', async () => {
    setup();
    api.getPopular.mockReturnValue(throwError(() => new Error('network')));
    const effect$ = TestBed.inject(MoviesEffects).loadPopular$;
    actions$.next(MoviesActions.loadPopular());
    await expect(firstValueFrom(effect$)).resolves.toEqual(
      MoviesActions.discoveryFailure({ error: 'network' }),
    );
  });

  describe('search$', () => {
    it.each([
      { label: 'blank query falls back to loadPopular', query: '   ', expected: MoviesActions.loadPopular() },
      { label: 'tab-only query falls back to loadPopular', query: '\t\n', expected: MoviesActions.loadPopular() },
    ])('$label', async ({ query, expected }) => {
      setup();
      const effect$ = TestBed.inject(MoviesEffects).search$;
      actions$.next(MoviesActions.searchSubmit({ query }));
      await expect(firstValueFrom(effect$)).resolves.toEqual(expected);
    });

    it('non-blank query maps to searchSuccess with trimmed query', async () => {
      setup();
      const movie = tmdbMovie({ id: 9 });
      api.searchMovies.mockReturnValue(
        of({ page: 1, total_pages: 2, total_results: 1, results: [movie] }),
      );
      const effect$ = TestBed.inject(MoviesEffects).search$;
      actions$.next(MoviesActions.searchSubmit({ query: '  matrix  ' }));
      await expect(firstValueFrom(effect$)).resolves.toEqual(
        MoviesActions.searchSuccess({ movies: [movie], page: 1, totalPages: 2, query: 'matrix' }),
      );
    });

    it('search failure maps to discoveryFailure', async () => {
      setup();
      api.searchMovies.mockReturnValue(throwError(() => new Error('search down')));
      const effect$ = TestBed.inject(MoviesEffects).search$;
      actions$.next(MoviesActions.searchSubmit({ query: 'matrix' }));
      await expect(firstValueFrom(effect$)).resolves.toEqual(
        MoviesActions.discoveryFailure({ error: 'search down' }),
      );
    });
  });

  describe('loadMore$', () => {
    it.each([
      {
        label: 'requests popular when mode is popular',
        state: moviesState({ mode: 'popular', query: '', page: 1, totalPages: 5 }),
        expectedCall: 'getPopular' as const,
      },
      {
        label: 'requests search when mode is search',
        state: moviesState({ mode: 'search', query: 'matrix', page: 1, totalPages: 5 }),
        expectedCall: 'searchMovies' as const,
      },
    ])('$label', async ({ state, expectedCall }) => {
      setup(state);
      const movie = tmdbMovie({ id: 99 });
      const result = of({ page: 2, total_pages: 5, total_results: 1, results: [movie] });
      api.getPopular.mockReturnValue(result);
      api.searchMovies.mockReturnValue(result);
      const effect$ = TestBed.inject(MoviesEffects).loadMore$;
      actions$.next(MoviesActions.loadMore());
      await expect(firstValueFrom(effect$)).resolves.toEqual(
        MoviesActions.loadMoreSuccess({ movies: [movie], page: 2, totalPages: 5 }),
      );
      if (expectedCall === 'getPopular') {
        expect(api.getPopular).toHaveBeenCalledWith(2);
      } else {
        expect(api.searchMovies).toHaveBeenCalledWith('matrix', 2);
      }
    });

    it.each([
      { label: 'page is zero',         state: moviesState({ page: 0, totalPages: 5 }) },
      { label: 'already on last page', state: moviesState({ page: 5, totalPages: 5 }) },
    ])('does not request when $label', async ({ state }) => {
      setup(state);
      api.getPopular.mockReturnValue(of({ page: 1, total_pages: 1, total_results: 0, results: [] }));
      TestBed.inject(MoviesEffects).loadMore$.subscribe();
      actions$.next(MoviesActions.loadMore());
      expect(api.getPopular).not.toHaveBeenCalled();
      expect(api.searchMovies).not.toHaveBeenCalled();
    });

    it('maps loadMore request failures to discoveryFailure', async () => {
      setup(moviesState({ mode: 'popular', page: 1, totalPages: 5 }));
      api.getPopular.mockReturnValue(throwError(() => new Error('pagination failed')));
      const effect$ = TestBed.inject(MoviesEffects).loadMore$;
      actions$.next(MoviesActions.loadMore());
      await expect(firstValueFrom(effect$)).resolves.toEqual(
        MoviesActions.discoveryFailure({ error: 'pagination failed' }),
      );
    });
  });

  it('loadPopularOnInit$ dispatches loadPopular on ROOT_EFFECTS_INIT', async () => {
    setup();
    const effect$ = TestBed.inject(MoviesEffects).loadPopularOnInit$;
    actions$.next({ type: '@ngrx/effects/init' });
    await expect(firstValueFrom(effect$)).resolves.toEqual(MoviesActions.loadPopular());
  });
});
