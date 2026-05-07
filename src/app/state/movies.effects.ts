import { Injectable, inject } from '@angular/core';
import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, filter, map, of, switchMap } from 'rxjs';
import { TmdbApiService } from '../core/tmdb-api.service';
import { toErrorMessage } from '../core/tmdb-mappers';
import { MoviesActions } from './movies.actions';
import { moviesFeature } from './movies.feature';

@Injectable()
export class MoviesEffects {
  private readonly actions$ = inject(Actions);
  private readonly tmdb = inject(TmdbApiService);
  private readonly store = inject(Store);

  loadGenresOnInit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      switchMap(() =>
        this.tmdb.getGenreMap().pipe(
          map((genres) => MoviesActions.genresLoaded({ genres })),
          catchError(() => of(MoviesActions.genresLoaded({ genres: {} }))),
        ),
      ),
    ),
  );

  loadPopularOnInit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => MoviesActions.loadPopular()),
    ),
  );

  loadPopular$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MoviesActions.loadPopular),
      switchMap(() =>
        this.tmdb.getPopular(1).pipe(
          map((response) =>
            MoviesActions.loadPopularSuccess({
              movies: response.results,
              page: response.page,
              totalPages: response.total_pages,
            }),
          ),
          catchError((error) =>
            of(MoviesActions.discoveryFailure({ error: toErrorMessage(error) })),
          ),
        ),
      ),
    ),
  );

  search$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MoviesActions.searchSubmit),
      switchMap(({ query }) => {
        const trimmed = query.trim();
        if (!trimmed) return of(MoviesActions.loadPopular());
        return this.tmdb.searchMovies(trimmed, 1).pipe(
          map((response) =>
            MoviesActions.searchSuccess({
              movies: response.results,
              page: response.page,
              totalPages: response.total_pages,
              query: trimmed,
            }),
          ),
          catchError((error) =>
            of(MoviesActions.discoveryFailure({ error: toErrorMessage(error) })),
          ),
        );
      }),
    ),
  );

  loadMore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MoviesActions.loadMore),
      concatLatestFrom(() => [
        this.store.select(moviesFeature.selectMode),
        this.store.select(moviesFeature.selectQuery),
        this.store.select(moviesFeature.selectPage),
        this.store.select(moviesFeature.selectTotalPages),
      ]),
      filter(([, , , page, totalPages]) => page > 0 && page < totalPages),
      exhaustMap(([, mode, query, page]) => {
        const nextPage = page + 1;
        const request$ =
          mode === 'popular'
            ? this.tmdb.getPopular(nextPage)
            : this.tmdb.searchMovies(query, nextPage);
        return request$.pipe(
          map((response) =>
            MoviesActions.loadMoreSuccess({
              movies: response.results,
              page: response.page,
              totalPages: response.total_pages,
            }),
          ),
          catchError((error) =>
            of(MoviesActions.discoveryFailure({ error: toErrorMessage(error) })),
          ),
        );
      }),
    ),
  );
}
