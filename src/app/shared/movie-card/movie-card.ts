import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';
import type { CollectionMovie, TmdbMovie } from '../../core/tmdb.models';
import { Poster } from '../poster/poster';

@Component({
  selector: 'app-movie-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Poster, Tooltip],
  templateUrl: './movie-card.html',
  styleUrl: './movie-card.scss',
})
export class MovieCard {
  readonly movie = input.required<TmdbMovie | CollectionMovie>();
  readonly posterPriority = input(false);
  readonly genreLabel = input.required<string>();
  readonly removable = input(false);
  readonly addToCollectionDisabled = input(false);
  readonly inCollectionNames = input<string[]>([]);
  readonly addToCollectionClick = output<void>();
  readonly removed = output<number>();

  protected onAddToCollectionClick(): void {
    this.addToCollectionClick.emit();
  }

  protected onRemove(): void {
    this.removed.emit(this.movie().id);
  }
}
