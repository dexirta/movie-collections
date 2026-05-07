import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { buildPosterUrl } from '../poster-url';

@Component({
  selector: 'app-poster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage],
  templateUrl: './poster.html',
  styleUrl: './poster.scss',
})
export class Poster {
  readonly posterPath = input.required<string | null>();
  readonly alt = input.required<string>();
  readonly priority = input(false);

  protected readonly src = computed(() => buildPosterUrl(this.posterPath()));
}
