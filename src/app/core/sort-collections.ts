import type { Collection } from './tmdb.models';

export type CollectionSortPreset =
  | 'name-asc'
  | 'name-desc'
  | 'movieCount-desc'
  | 'movieCount-asc';

export function sortCollections(
  collections: readonly Collection[],
  preset: CollectionSortPreset,
): Collection[] {
  const parts = preset.split('-');
  const direction = parts.pop() as 'asc' | 'desc';
  const key = parts.join('-') as 'name' | 'movieCount';
  const sign = direction === 'asc' ? 1 : -1;

  return [...collections].sort((a, b) => {
    const primary =
      key === 'name'
        ? a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        : a.movies.length - b.movies.length;
    const cmp = sign * primary;
    if (cmp !== 0) {
      return cmp;
    }
    return a.id.localeCompare(b.id);
  });
}
