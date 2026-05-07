import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { catchError, concat, filter, map, of, switchMap } from 'rxjs';
import { genreLabelsMapForCollectionMovies } from '../../../core/genre-labels';
import { TmdbApiService } from '../../../core/tmdb-api.service';
import { toCollectionMovie, toErrorMessage } from '../../../core/tmdb-mappers';
import type { TmdbMovie } from '../../../core/tmdb.models';
import { toDebouncedFormValueSignal } from '../../../shared/debounced-form-value';
import { focusOnInit } from '../../../shared/focus-on-init';
import { MovieCard } from '../../../shared/movie-card/movie-card';
import { CollectionsActions } from '../../../state/collections.actions';
import { collectionsFeature } from '../../../state/collections.feature';
import { moviesFeature } from '../../../state/movies.feature';

type AddSearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface AddSearchLocalState {
  readonly status: AddSearchStatus;
  readonly results: readonly TmdbMovie[];
  readonly error: string | null;
  readonly lastTrimmedQuery: string | null;
}

const idleAddSearch: AddSearchLocalState = {
  status: 'idle',
  results: [],
  error: null,
  lastTrimmedQuery: null,
};

@Component({
  selector: 'app-collection-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    Button,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Message,
    ProgressSpinner,
    MovieCard,
  ],
  templateUrl: './collection-detail.html',
  styleUrl: './collection-detail.scss',
})
export class CollectionDetail {
  private readonly store = inject(Store);
  private readonly tmdb = inject(TmdbApiService);

  readonly id = input.required<string>();

  protected readonly addQueryControl = new FormControl('', { nonNullable: true });
  protected readonly addDialogOpen = signal(false);

  private readonly collections = this.store.selectSignal(collectionsFeature.selectCollections);
  protected readonly collection = computed(() =>
    this.collections().find((entry) => entry.id === this.id()),
  );
  protected readonly collectionMovies = computed(() => this.collection()?.movies ?? []);

  protected readonly movieIds = computed(
    () => new Set(this.collectionMovies().map((movie) => movie.id)),
  );

  private readonly genres = this.store.selectSignal(moviesFeature.selectGenres);
  protected readonly collectionGenreLabels = computed(() =>
    genreLabelsMapForCollectionMovies(this.collectionMovies(), this.genres()),
  );

  private readonly debouncedSearch = toDebouncedFormValueSignal(this.addQueryControl);

  private readonly addSearchLocal = toSignal(
    toObservable(this.debouncedSearch).pipe(
      filter((value): value is string => value !== undefined),
      switchMap((value) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return of(idleAddSearch);
        }
        return concat(
          of<AddSearchLocalState>({
            status: 'loading',
            results: [],
            error: null,
            lastTrimmedQuery: trimmed,
          }),
          this.tmdb.searchMovies(trimmed, 1).pipe(
            map((response) => ({
              status: 'success' as const,
              results: response.results,
              error: null,
              lastTrimmedQuery: trimmed,
            })),
            catchError((error) =>
              of<AddSearchLocalState>({
                status: 'error',
                results: [],
                error: toErrorMessage(error),
                lastTrimmedQuery: trimmed,
              }),
            ),
          ),
        );
      }),
    ),
    { initialValue: idleAddSearch },
  );

  protected readonly addStatus = computed(() => this.addSearchLocal().status);
  protected readonly addResults = computed(() => this.addSearchLocal().results);
  protected readonly addError = computed(() => this.addSearchLocal().error);
  protected readonly addLastTrimmedQuery = computed(() => this.addSearchLocal().lastTrimmedQuery);

  protected readonly addSearchLoading = computed(
    () => this.addStatus() === 'loading' && !this.addResults().length,
  );

  private readonly headingRef = viewChild<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    focusOnInit(this.headingRef);
  }

  protected openAddDialog(): void {
    this.addQueryControl.reset('');
    this.addDialogOpen.set(true);
  }

  protected onAddDialogChange(open: boolean): void {
    this.addDialogOpen.set(open);
    if (!open) {
      this.addQueryControl.reset('');
    }
  }

  protected addMovie(movie: TmdbMovie): void {
    this.store.dispatch(
      CollectionsActions.addMovie({
        collectionId: this.id(),
        movie: toCollectionMovie(movie),
      }),
    );
  }

  protected removeMovie(movieId: number): void {
    this.store.dispatch(CollectionsActions.removeMovie({ collectionId: this.id(), movieId }));
  }

  protected isAlreadyAdded(movieId: number): boolean {
    return this.movieIds().has(movieId);
  }
}
