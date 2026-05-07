import type { CollectionMovie, TmdbGenresResponse, TmdbMovie } from './tmdb.models';

export function toCollectionMovie(movie: TmdbMovie): CollectionMovie {
  return {
    id: movie.id,
    title: movie.title,
    poster_path: movie.poster_path,
    vote_average: movie.vote_average,
    genre_ids: movie.genre_ids,
  };
}

export function toGenreMap(response: TmdbGenresResponse): Record<number, string> {
  return Object.fromEntries(response.genres.map((genre) => [genre.id, genre.name]));
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error && error.message ? error.message : 'Request failed';
}
