import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom } from 'rxjs';
import { TmdbApiService } from './tmdb-api.service';

jest.mock('../../environments/environment', () => ({
  environment: { production: false, tmdbApiKey: 'test-key' },
}));

describe('TmdbApiService', () => {
  let service: TmdbApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TmdbApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const cases: Array<{
    label: string;
    action: () => Observable<unknown>;
    urlPart: string;
    expectedParams: Record<string, string>;
    response: Record<string, unknown>;
    expected: unknown;
  }> = [
    {
      label: 'getPopular passes page and api_key',
      action: () => service.getPopular(2),
      urlPart: '/movie/popular',
      expectedParams: { page: '2', api_key: 'test-key' },
      response: { page: 2, total_pages: 1, total_results: 0, results: [] },
      expected: { page: 2, total_pages: 1, total_results: 0, results: [] },
    },
    {
      label: 'searchMovies passes query, page and api_key',
      action: () => service.searchMovies('batman', 1),
      urlPart: '/search/movie',
      expectedParams: { query: 'batman', page: '1', api_key: 'test-key' },
      response: { page: 1, total_pages: 1, total_results: 0, results: [] },
      expected: { page: 1, total_pages: 1, total_results: 0, results: [] },
    },
    {
      label: 'getGenreMap maps the genres array into a record',
      action: () => service.getGenreMap(),
      urlPart: '/genre/movie/list',
      expectedParams: { api_key: 'test-key' },
      response: { genres: [{ id: 28, name: 'Action' }] },
      expected: { 28: 'Action' },
    },
  ];

  it.each(cases)('$label', async ({ action, urlPart, expectedParams, response, expected }) => {
    const result = firstValueFrom(action());
    const request = http.expectOne((req) => req.url.includes(urlPart));
    for (const [name, value] of Object.entries(expectedParams)) {
      expect(request.request.params.get(name)).toBe(value);
    }
    request.flush(response);
    expect(await result).toEqual(expected);
  });
});
