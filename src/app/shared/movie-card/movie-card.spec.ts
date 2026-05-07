import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MovieCard } from './movie-card';
import { collectionMovie, tmdbMovie } from '../../testing/fixtures';

@Component({
  standalone: true,
  imports: [MovieCard],
  template: `
    <app-movie-card
      [movie]="movie"
      [genreLabel]="'—'"
      (addToCollectionClick)="addCount = addCount + 1"
    />
  `,
})
class MovieCardAddHost {
  movie = tmdbMovie({ id: 42 });
  addCount = 0;
}

describe('MovieCard', () => {
  let fixture: ComponentFixture<MovieCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovieCard],
      providers: [
        provideZonelessChangeDetection(),
        { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(MovieCard);
  });

  it.each([
    { label: 'renders TMDB image when poster_path is set',  posterPath: '/poster.jpg', expectImg: true  },
    { label: 'renders placeholder when poster_path is null', posterPath: null,          expectImg: false },
  ])('$label', async ({ posterPath, expectImg }) => {
    fixture.componentRef.setInput('movie', tmdbMovie({ id: 1, title: 'Dune', poster_path: posterPath }));
    fixture.componentRef.setInput('genreLabel', 'Sci-Fi');
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const image = host.querySelector('img');
    if (expectImg) {
      expect(image?.getAttribute('src')).toContain('image.tmdb.org');
    } else {
      expect(image).toBeNull();
      expect(host.querySelector('.poster-placeholder')).not.toBeNull();
    }
  });

  it('shows collection membership tags when movie is already in collections', async () => {
    fixture.componentRef.setInput('movie', tmdbMovie());
    fixture.componentRef.setInput('genreLabel', '—');
    fixture.componentRef.setInput('inCollectionNames', ['Favorites', 'Watchlist']);
    await fixture.whenStable();
    const tags = (fixture.nativeElement as HTMLElement).querySelector('.tags');
    expect(tags?.textContent).toContain('Favorites, Watchlist');
  });

  it('in removable mode emits removed with movie id and omits add controls', async () => {
    fixture.componentRef.setInput('movie', collectionMovie({ id: 7, title: 'Dune' }));
    fixture.componentRef.setInput('genreLabel', 'Sci-Fi');
    fixture.componentRef.setInput('removable', true);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect([...host.querySelectorAll('button')].some((b) => b.textContent?.includes('Add to collection'))).toBe(
      false,
    );
    expect(host.querySelector('.tags')).toBeNull();

    const emissions: number[] = [];
    fixture.componentInstance.removed.subscribe((id) => emissions.push(id));

    const removeBtn = [...host.querySelectorAll('button')].find((b) => b.textContent?.includes('Remove'));
    removeBtn?.click();
    await fixture.whenStable();

    expect(emissions).toEqual([7]);
  });
});

describe('MovieCard addToCollectionClick', () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MovieCardAddHost],
      providers: [
        provideZonelessChangeDetection(),
        { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
      ],
    }).compileComponents();
  });

  it('notifies the parent when Add to collection is clicked', async () => {
    const hostFixture = TestBed.createComponent(MovieCardAddHost);
    hostFixture.detectChanges();
    await hostFixture.whenStable();

    const btn = (hostFixture.nativeElement as HTMLElement).querySelector('button');
    expect(btn?.textContent).toContain('Add to collection');
    btn?.click();
    await hostFixture.whenStable();

    expect(hostFixture.componentInstance.addCount).toBe(1);
  });
});
