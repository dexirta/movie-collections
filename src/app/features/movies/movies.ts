import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Select } from 'primeng/select';
import { toCollectionMovie } from '../../core/tmdb-mappers';
import type { TmdbMovie } from '../../core/tmdb.models';
import { toDebouncedFormValueSignal } from '../../shared/debounced-form-value';
import { focusOnInit } from '../../shared/focus-on-init';
import { MovieCard } from '../../shared/movie-card/movie-card';
import { CollectionsActions } from '../../state/collections.actions';
import { collectionsFeature } from '../../state/collections.feature';
import { MoviesActions } from '../../state/movies.actions';
import { moviesFeature } from '../../state/movies.feature';

const EMPTY_NAMES: string[] = [];

interface CollectionOption {
  readonly label: string;
  readonly value: string;
}

@Component({
  selector: 'app-movies',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Button,
    Dialog,
    IconField,
    InputIcon,
    InputText,
    Message,
    ProgressSpinner,
    Select,
    MovieCard,
  ],
  templateUrl: './movies.html',
  styleUrl: './movies.scss',
})
export class Movies {
  private readonly store = inject(Store);

  protected readonly searchControl = new FormControl('', { nonNullable: true });

  protected readonly items = this.store.selectSignal(moviesFeature.selectItems);
  protected readonly query = this.store.selectSignal(moviesFeature.selectQuery);
  protected readonly mode = this.store.selectSignal(moviesFeature.selectMode);
  protected readonly discoveryStatus = this.store.selectSignal(moviesFeature.selectStatus);
  protected readonly isLoading = this.store.selectSignal(moviesFeature.selectIsLoading);
  protected readonly errorMessage = this.store.selectSignal(moviesFeature.selectError);
  protected readonly hasMore = this.store.selectSignal(moviesFeature.selectHasMore);

  protected readonly collections = this.store.selectSignal(collectionsFeature.selectCollections);
  protected readonly namesByMovieId = this.store.selectSignal(
    collectionsFeature.selectCollectionNamesByMovieId,
  );

  protected readonly collectionOptions = computed<CollectionOption[]>(() =>
    this.collections().map((entry) => ({ label: entry.name, value: entry.id })),
  );

  protected readonly genreLabelByMovieId = this.store.selectSignal(
    moviesFeature.selectGenreLabelsByMovieId,
  );

  protected readonly searchUi = computed(() => {
    const items = this.items();
    const mode = this.mode();
    const loading = mode === 'search' && this.isLoading() && !items.length;
    let emptyMessage = '';
    if (mode === 'search' && this.discoveryStatus() === 'success' && !items.length && !this.errorMessage()) {
      const searchQuery = this.query().trim();
      if (searchQuery) emptyMessage = `No matches for "${searchQuery}".`;
    }
    return { loading, emptyMessage };
  });

  private readonly debouncedSearch = toDebouncedFormValueSignal(this.searchControl);

  private readonly headingRef = viewChild<ElementRef<HTMLHeadingElement>>('heading');

  protected readonly addToCollectionDialogOpen = signal(false);
  protected readonly moviePendingAdd = signal<TmdbMovie | null>(null);
  protected readonly addToCollectionCollectionId = new FormControl<string | null>(null);

  protected readonly addToCollectionDialogTitle = computed(() => {
    const movie = this.moviePendingAdd();
    return movie ? `Add “${movie.title}” to a collection` : 'Add to collection';
  });

  constructor() {
    effect(() => {
      const currentQuery = this.query();
      if (this.searchControl.value === currentQuery) return;
      this.searchControl.setValue(currentQuery, { emitEvent: false });
    });

    effect(() => {
      const value = this.debouncedSearch();
      if (value === undefined) return;
      this.store.dispatch(MoviesActions.searchSubmit({ query: value }));
    });

    focusOnInit(this.headingRef);
  }

  protected genreLabel(movieId: number): string {
    return this.genreLabelByMovieId().get(movieId) ?? '—';
  }

  protected collectionsContaining(movieId: number): string[] {
    return this.namesByMovieId().get(movieId) ?? EMPTY_NAMES;
  }

  protected loadMore(): void {
    this.store.dispatch(MoviesActions.loadMore());
  }

  protected openAddToCollection(movie: TmdbMovie): void {
    this.moviePendingAdd.set(movie);
    this.addToCollectionCollectionId.setValue(null);
    this.addToCollectionDialogOpen.set(true);
  }

  protected onAddToCollectionDialogChange(open: boolean): void {
    this.addToCollectionDialogOpen.set(open);
    if (!open) {
      this.moviePendingAdd.set(null);
      this.addToCollectionCollectionId.setValue(null);
    }
  }

  protected confirmAddToCollection(): void {
    const movie = this.moviePendingAdd();
    const collectionId = this.addToCollectionCollectionId.value;
    if (!movie || !collectionId) return;
    this.store.dispatch(
      CollectionsActions.addMovie({ collectionId, movie: toCollectionMovie(movie) }),
    );
    this.addToCollectionDialogOpen.set(false);
    this.moviePendingAdd.set(null);
    this.addToCollectionCollectionId.setValue(null);
    queueMicrotask(() => this.headingRef()?.nativeElement.focus());
  }
}
