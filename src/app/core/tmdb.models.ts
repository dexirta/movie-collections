export interface TmdbMovie {
  readonly id: number;
  readonly title: string;
  readonly poster_path: string | null;
  readonly vote_average: number;
  readonly genre_ids: readonly number[];
}

export interface TmdbPagedMovies {
  readonly page: number;
  readonly total_pages: number;
  readonly total_results: number;
  readonly results: readonly TmdbMovie[];
}

export interface TmdbGenre {
  readonly id: number;
  readonly name: string;
}

export interface TmdbGenresResponse {
  readonly genres: readonly TmdbGenre[];
}

export interface CollectionMovie {
  readonly id: number;
  readonly title: string;
  readonly poster_path: string | null;
  readonly vote_average: number;
  readonly genre_ids?: readonly number[];
}

export interface Collection {
  readonly id: string;
  readonly name: string;
  readonly movies: readonly CollectionMovie[];
}

export const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p/w500';
