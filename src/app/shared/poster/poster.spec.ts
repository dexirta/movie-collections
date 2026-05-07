import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TMDB_IMG_BASE } from '../../core/tmdb.models';
import { Poster } from './poster';

describe('Poster', () => {
  let fixture: ComponentFixture<Poster>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Poster],
      providers: [
        provideZonelessChangeDetection(),
        { provide: IMAGE_LOADER, useValue: (config: ImageLoaderConfig) => config.src },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Poster);
  });

  it('sets ngSrc from posterPath', async () => {
    fixture.componentRef.setInput('posterPath', '/x.jpg');
    fixture.componentRef.setInput('alt', 'A movie');
    fixture.detectChanges();
    await fixture.whenStable();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img?.getAttribute('ngSrc') ?? img?.getAttribute('src')).toContain(`${TMDB_IMG_BASE}/x.jpg`);
  });

  it('shows placeholder when posterPath is null', async () => {
    fixture.componentRef.setInput('posterPath', null);
    fixture.componentRef.setInput('alt', 'None');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('img')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).querySelector('.poster-placeholder')).not.toBeNull();
  });
});
