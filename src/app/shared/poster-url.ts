import { TMDB_IMG_BASE } from '../core/tmdb.models';

export function buildPosterUrl(path: string | null): string | null {
  return path ? `${TMDB_IMG_BASE}${path}` : null;
}
