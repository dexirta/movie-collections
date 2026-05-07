import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { toGenreMap } from './tmdb-mappers';
import type { TmdbGenresResponse, TmdbPagedMovies } from './tmdb.models';

const BASE_URL = 'https://api.themoviedb.org/3';

@Injectable({ providedIn: 'root' })
export class TmdbApiService {
  private readonly http = inject(HttpClient);

  getPopular(page: number): Observable<TmdbPagedMovies> {
    return this.http.get<TmdbPagedMovies>(`${BASE_URL}/movie/popular`, {
      params: this.authParams().set('page', String(page)),
    });
  }

  searchMovies(query: string, page: number): Observable<TmdbPagedMovies> {
    return this.http.get<TmdbPagedMovies>(`${BASE_URL}/search/movie`, {
      params: this.authParams().set('query', query).set('page', String(page)),
    });
  }

  getGenreMap(): Observable<Record<number, string>> {
    return this.http
      .get<TmdbGenresResponse>(`${BASE_URL}/genre/movie/list`, { params: this.authParams() })
      .pipe(map(toGenreMap));
  }

  private authParams(): HttpParams {
    return new HttpParams().set('api_key', environment.tmdbApiKey);
  }
}
