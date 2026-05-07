import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { collection, collectionsState } from '../testing/fixtures';
import { CollectionsActions } from './collections.actions';
import { CollectionsEffects } from './collections.effects';
import { collectionsFeature } from './collections.feature';
import { COLLECTIONS_STORAGE_KEY, STORAGE } from './collections.storage';

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('CollectionsEffects', () => {
  let actions$: ReplaySubject<Action>;
  let storage: MemoryStorage;

  function setup(initialCollections: readonly ReturnType<typeof collection>[] = []) {
    actions$ = new ReplaySubject<Action>(1);
    storage = new MemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        CollectionsEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          initialState: {
            movies: {
              mode: 'popular',
              query: '',
              items: [],
              page: 0,
              totalPages: 1,
              status: 'idle',
              error: null,
              genres: {},
            },
            collections: collectionsState({ collections: initialCollections }),
          },
        }),
        { provide: STORAGE, useValue: storage },
      ],
    });
  }

  it.each([
    {
      label: 'hydrate$ reads an empty array when storage is empty',
      seed: undefined,
      expected: [],
    },
    {
      label: 'hydrate$ reads persisted collections',
      seed: [collection({ id: 'a', name: 'A' })],
      expected: [collection({ id: 'a', name: 'A' })],
    },
    {
      label: 'hydrate$ recovers when storage is malformed',
      seed: 'not json',
      expected: [],
    },
  ])('$label', async ({ seed, expected }) => {
    setup();
    if (seed !== undefined) {
      storage.setItem(
        COLLECTIONS_STORAGE_KEY,
        typeof seed === 'string' ? seed : JSON.stringify(seed),
      );
    }
    const warnSpy =
      seed === 'not json' ? jest.spyOn(console, 'warn').mockImplementation(() => {}) : undefined;
    try {
      const effect$ = TestBed.inject(CollectionsEffects).hydrate$;
      actions$.next({ type: '@ngrx/effects/init' });
      await expect(firstValueFrom(effect$)).resolves.toEqual(
        CollectionsActions.hydrate({ collections: expected }),
      );
    } finally {
      warnSpy?.mockRestore();
    }
  });

  it('persist$ writes the post-reducer collections snapshot to storage', () => {
    setup([]);
    const store = TestBed.inject(MockStore);
    const after = [collection({ id: 'c2', name: 'C2' })];
    store.overrideSelector(collectionsFeature.selectCollections, after);
    TestBed.inject(CollectionsEffects).persist$.subscribe();
    actions$.next(CollectionsActions.create({ id: 'c2', name: 'C2' }));
    const raw = storage.getItem(COLLECTIONS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual(after);
  });
});
