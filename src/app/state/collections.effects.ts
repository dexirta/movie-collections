import { Injectable, inject } from '@angular/core';
import { Actions, ROOT_EFFECTS_INIT, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { map, tap } from 'rxjs';
import { CollectionsActions } from './collections.actions';
import { collectionsFeature } from './collections.feature';
import { STORAGE, readCollections, writeCollections } from './collections.storage';

@Injectable()
export class CollectionsEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly storage = inject(STORAGE);

  hydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROOT_EFFECTS_INIT),
      map(() => CollectionsActions.hydrate({ collections: readCollections(this.storage) })),
    ),
  );

  persist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          CollectionsActions.create,
          CollectionsActions.delete,
          CollectionsActions.addMovie,
          CollectionsActions.removeMovie,
        ),
        concatLatestFrom(() => this.store.select(collectionsFeature.selectCollections)),
        tap(([, collections]) => writeCollections(this.storage, collections)),
      ),
    { dispatch: false },
  );
}
