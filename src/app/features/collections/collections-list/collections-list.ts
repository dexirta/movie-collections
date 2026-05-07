import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfirmationService } from 'primeng/api';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ID_GENERATOR } from '../../../core/id-generator';
import { type CollectionSortPreset, sortCollections } from '../../../core/sort-collections';
import { focusOnInit } from '../../../shared/focus-on-init';
import { CollectionsActions } from '../../../state/collections.actions';
import { collectionsFeature } from '../../../state/collections.feature';

const SORT_PRESET_OPTIONS: { label: string; value: CollectionSortPreset }[] = [
  { label: 'Name (A–Z)', value: 'name-asc' },
  { label: 'Name (Z–A)', value: 'name-desc' },
  { label: 'Most movies', value: 'movieCount-desc' },
  { label: 'Fewest movies', value: 'movieCount-asc' },
];

@Component({
  selector: 'app-collections-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    Button,
    Dialog,
    ConfirmDialog,
    InputText,
    Select,
  ],
  templateUrl: './collections-list.html',
  styleUrl: './collections-list.scss',
})
export class CollectionsList {
  private readonly store = inject(Store);
  private readonly confirmation = inject(ConfirmationService);
  private readonly createId = inject(ID_GENERATOR);

  protected readonly collections = this.store.selectSignal(collectionsFeature.selectCollections);
  protected readonly sortPreset = signal<CollectionSortPreset>('name-asc');
  protected readonly sortPresetOptions: { label: string; value: CollectionSortPreset }[] =
    SORT_PRESET_OPTIONS;

  protected readonly sortedCollections = computed(() =>
    sortCollections(this.collections(), this.sortPreset()),
  );

  protected readonly dialogOpen = signal(false);

  protected readonly nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/\S/)],
  });

  private readonly headingRef = viewChild<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    focusOnInit(this.headingRef);
  }

  protected openCreate(): void {
    this.nameControl.reset('');
    this.dialogOpen.set(true);
  }

  protected closeCreate(): void {
    this.dialogOpen.set(false);
  }

  protected onCreateFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.create();
  }

  protected create(): void {
    const name = this.nameControl.value.trim();
    if (!name) return;
    this.store.dispatch(
      CollectionsActions.create({ id: this.createId(), name }),
    );
    this.dialogOpen.set(false);
    queueMicrotask(() => this.headingRef()?.nativeElement.focus());
  }

  protected confirmDelete(id: string, name: string): void {
    this.confirmation.confirm({
      message: `Delete collection "${name}"?`,
      header: 'Confirm delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.store.dispatch(CollectionsActions.delete({ id })),
    });
  }
}
