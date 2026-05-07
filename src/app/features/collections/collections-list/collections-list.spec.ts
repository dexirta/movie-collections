import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideEffects } from '@ngrx/effects';
import { provideStore, provideState } from '@ngrx/store';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConfirmationService } from 'primeng/api';
import { ID_GENERATOR } from '../../../core/id-generator';
import { collection, collectionsState, moviesState } from '../../../testing/fixtures';
import { CollectionsActions } from '../../../state/collections.actions';
import { CollectionsEffects } from '../../../state/collections.effects';
import { collectionsFeature } from '../../../state/collections.feature';
import { COLLECTIONS_STORAGE_KEY, STORAGE } from '../../../state/collections.storage';
import { CollectionsList } from './collections-list';

class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  key(index: number): string | null { return [...this.store.keys()][index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, value); }
}

describe('CollectionsList', () => {
  let fixture: ComponentFixture<CollectionsList>;
  let store: MockStore;
  let confirmation: ConfirmationService;
  let confirmSpy: jest.SpiedFunction<ConfirmationService['confirm']>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionsList],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideMockStore({
          initialState: {
            movies: moviesState(),
            collections: collectionsState({ collections: [collection({ id: 'c1', name: 'Mine' })] }),
          },
        }),
        ConfirmationService,
        { provide: ID_GENERATOR, useValue: () => 'generated-id' },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    confirmation = TestBed.inject(ConfirmationService);
    confirmSpy = jest.spyOn(confirmation, 'confirm').mockImplementation((options) => {
      options.accept?.();
      return confirmation;
    });
    fixture = TestBed.createComponent(CollectionsList);
    fixture.detectChanges();
  });

  it.each([
    { label: 'dispatches create with the trimmed name',         input: '  Watchlist  ', expectedDispatch: true },
    { label: 'does not dispatch when name is whitespace',       input: '   \t',         expectedDispatch: false },
    { label: 'does not dispatch when name is empty',            input: '',              expectedDispatch: false },
  ])('$label', ({ input, expectedDispatch }) => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const component = fixture.componentInstance;
    component['nameControl'].setValue(input);
    component['create']();
    if (expectedDispatch) {
      expect(dispatchSpy).toHaveBeenCalledTimes(1);
      const action = dispatchSpy.mock.calls[0][0];
      expect(action).toEqual(
        expect.objectContaining({
          type: CollectionsActions.create.type,
          id: 'generated-id',
          name: 'Watchlist',
        }),
      );
    } else {
      expect(dispatchSpy).not.toHaveBeenCalled();
    }
  });

  it('confirmDelete asks for confirmation and dispatches delete on accept', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    fixture.componentInstance['confirmDelete']('c1', 'Mine');
    expect(confirmSpy).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(CollectionsActions.delete({ id: 'c1' }));
  });

  it('renders a link to the collection detail route', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a.link');
    expect(link?.getAttribute('href')).toBe('/collections/c1');
  });

  it('lists collections sorted by name A–Z by default', () => {
    store.setState({
      movies: moviesState(),
      collections: collectionsState({
        collections: [
          collection({ id: 'x', name: 'Zebra' }),
          collection({ id: 'y', name: 'Alpha' }),
        ],
      }),
    });
    fixture.detectChanges();
    const names = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('a.link .name'),
    ].map((el) => el.textContent?.trim());
    expect(names).toEqual(['Alpha', 'Zebra']);
  });
});

describe('CollectionsList integration', () => {
  let fixture: ComponentFixture<CollectionsList>;
  let storage: MemoryStorage;

  beforeEach(async () => {
    storage = new MemoryStorage();
    await TestBed.configureTestingModule({
      imports: [CollectionsList],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideStore(),
        provideState(collectionsFeature),
        provideEffects(CollectionsEffects),
        ConfirmationService,
        { provide: STORAGE, useValue: storage },
        { provide: ID_GENERATOR, useValue: () => 'integration-id' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CollectionsList);
    fixture.detectChanges();
  });

  it('creates collection from dialog click path and persists to storage', async () => {
    const host = fixture.nativeElement as HTMLElement;

    const newCollectionButton = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('New collection'),
    );
    newCollectionButton?.click();
    fixture.detectChanges();

    const input = host.querySelector('#collection-name') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    input!.value = 'Watchlist';
    input!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const createButton = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.trim() === 'Create',
    );
    expect(createButton).not.toBeUndefined();
    createButton!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('Watchlist');

    const raw = storage.getItem(COLLECTIONS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([
      { id: 'integration-id', name: 'Watchlist', movies: [] },
    ]);
  });

  it('creates collection when the dialog form is submitted (Enter in name field)', async () => {
    const host = fixture.nativeElement as HTMLElement;

    const newCollectionButton = [...host.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('New collection'),
    );
    newCollectionButton?.click();
    fixture.detectChanges();

    const input = host.querySelector('#collection-name') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    input!.value = 'From Enter';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();

    const form = host.querySelector('form.dialog-form') as HTMLFormElement | null;
    expect(form).not.toBeNull();
    form!.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(host.textContent).toContain('From Enter');
    const raw = storage.getItem(COLLECTIONS_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([
      { id: 'integration-id', name: 'From Enter', movies: [] },
    ]);
  });
});
