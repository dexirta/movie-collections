import type { CollectionMovie } from './tmdb.models';

export function genreLabelFromIds(
  genreIds: readonly number[] | undefined,
  genres: Record<number, string>,
): string {
  const ids = genreIds ?? [];
  const labels = ids.map((id) => genres[id]).filter((label): label is string => Boolean(label));
  return labels.length ? labels.join(', ') : '—';
}

export function genreLabelsMapForCollectionMovies(
  movies: readonly CollectionMovie[],
  genres: Record<number, string>,
): ReadonlyMap<number, string> {
  return new Map(movies.map((movie) => [movie.id, genreLabelFromIds(movie.genre_ids, genres)]));
}
