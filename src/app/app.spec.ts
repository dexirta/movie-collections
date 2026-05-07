import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  it('renders the brand, primary nav, and a router outlet', async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.brand')?.textContent?.trim()).toContain('Movie Collections');
    expect(host.querySelector('nav[aria-label="Primary"]')).not.toBeNull();
    expect(host.querySelector('router-outlet')).not.toBeNull();
    expect(host.querySelector('#main')).not.toBeNull();
  });
});
