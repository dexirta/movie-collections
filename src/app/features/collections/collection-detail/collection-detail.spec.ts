import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject, of, throwError } from 'rxjs';
import { TmdbApiService } from '../../../core/tmdb-api.service';
import type { TmdbPagedMovies } from '../../../core/tmdb.models';
import { CollectionsActions } from '../../../state/collections.actions';
import { collection, collectionMovie, collectionsState, moviesState, tmdbMovie } from '../../../testing/fixtures';
import { CollectionDetail } from './collection-detail';

describe('CollectionDetail', () => {
  let fixture: ComponentFixture<CollectionDetail>;
  let store: MockStore;
  let searchMovies: jest.Mock;

  async function setup(
    initialCollections = [collection({ id: 'c1', name: 'Mine', movies: [collectionMovie({ id: 1, title: 'A' })] })],
  ) {
    searchMovies = jest.fn().mockReturnValue(
      of<TmdbPagedMovies>({ page: 1, total_pages: 1, total_results: 0, results: [] }),
    );
    await TestBed.configureTestingModule({
      imports: [CollectionDetail],
      providers: [
        provideZonelessChangeDetection(),
        { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
        provideRouter([]),
        provideMockStore({
          initialState: {
            movies: moviesState(),
            collections: collectionsState({ collections: initialCollections }),
          },
        }),
        { provide: TmdbApiService, useValue: { searchMovies } },
      ],
    }).compileComponents();
    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(CollectionDetail);
    fixture.componentRef.setInput('id', 'c1');
    fixture.detectChanges();
  }

  it.each([
    { label: 'renders the collection name',  selector: 'h1', expectedText: 'Mine' },
    { label: 'renders the back link',        selector: 'a.back-link', expectedText: 'Back to collections' },
    { label: 'renders the movie list grid',  selector: 'ul.grid', expectedText: undefined },
  ])('$label', async ({ selector, expectedText }) => {
    await setup();
    const element = (fixture.nativeElement as HTMLElement).querySelector(selector);
    expect(element).not.toBeNull();
    if (expectedText !== undefined) expect(element?.textContent?.trim()).toContain(expectedText);
  });

  it('renders "Collection not found" when the id does not match', async () => {
    await setup([]);
    const heading = (fixture.nativeElement as HTMLElement).querySelector('h1');
    expect(heading?.textContent).toContain('Collection not found');
  });

  it('removeMovie dispatches CollectionsActions.removeMovie', async () => {
    await setup();
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    fixture.componentInstance['removeMovie'](1);
    expect(dispatchSpy).toHaveBeenCalledWith(
      CollectionsActions.removeMovie({ collectionId: 'c1', movieId: 1 }),
    );
  });

  it('addMovie dispatches CollectionsActions.addMovie with the snapshot', async () => {
    await setup();
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const movie = tmdbMovie({ id: 2, title: 'New', poster_path: '/n.jpg', vote_average: 6.5 });
    fixture.componentInstance['addMovie'](movie);
    expect(dispatchSpy).toHaveBeenCalledWith(
      CollectionsActions.addMovie({
        collectionId: 'c1',
        movie: {
          id: 2,
          title: 'New',
          poster_path: '/n.jpg',
          vote_average: 6.5,
          genre_ids: [],
        },
      }),
    );
  });

  it.each([
    { label: 'isAlreadyAdded returns true when the movie is in the collection',  movieId: 1, expected: true },
    { label: 'isAlreadyAdded returns false when the movie is not in it',          movieId: 99, expected: false },
  ])('$label', async ({ movieId, expected }) => {
    await setup();
    expect(fixture.componentInstance['isAlreadyAdded'](movieId)).toBe(expected);
  });

  it('calls searchMovies when query changes after debounce', async () => {
    jest.useFakeTimers();
    await setup();

    fixture.componentInstance['addQueryControl'].setValue('matrix');
    jest.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(searchMovies).toHaveBeenCalledWith('matrix', 1);
    jest.useRealTimers();
  });

  it('reflects loading then success from TMDB search', async () => {
    jest.useFakeTimers();
    await setup();
    const pending = new Subject<TmdbPagedMovies>();
    searchMovies.mockReturnValue(pending.asObservable());

    fixture.componentInstance['addQueryControl'].setValue('x');
    jest.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(fixture.componentInstance['addStatus']()).toBe('loading');

    pending.next({ page: 1, total_pages: 1, total_results: 1, results: [tmdbMovie({ id: 9 })] });
    pending.complete();
    fixture.detectChanges();
    expect(fixture.componentInstance['addStatus']()).toBe('success');
    expect(fixture.componentInstance['addResults']()).toEqual([tmdbMovie({ id: 9 })]);

    jest.useRealTimers();
  });

  it('reflects error when search fails', async () => {
    jest.useFakeTimers();
    await setup();
    searchMovies.mockReturnValue(throwError(() => new Error('network down')));

    fixture.componentInstance['addQueryControl'].setValue('q');
    jest.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(fixture.componentInstance['addStatus']()).toBe('error');
    expect(fixture.componentInstance['addError']()).toBe('network down');

    jest.useRealTimers();
  });
});
