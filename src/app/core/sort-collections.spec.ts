import { collection, collectionMovie } from '../testing/fixtures';
import { sortCollections } from './sort-collections';

describe('sortCollections', () => {
  const row = (id: string, name: string, movieCount: number) =>
    collection({
      id,
      name,
      movies: Array.from({ length: movieCount }, (_, i) =>
        collectionMovie({ id: i, title: `m${i}`, poster_path: null, vote_average: 0 }),
      ),
    });

  it('sorts by name ascending with id tie-break', () => {
    const rows = [row('b', 'Beta', 0), row('a', 'alpha', 0), row('c', 'alpha', 0)];
    expect(sortCollections(rows, 'name-asc').map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });

  it('sorts by movie count descending', () => {
    const rows = [row('a', 'A', 1), row('b', 'B', 3), row('c', 'C', 2)];
    expect(sortCollections(rows, 'movieCount-desc').map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('returns a new array and does not mutate the input', () => {
    const rows = [row('a', 'A', 1)];
    const out = sortCollections(rows, 'name-asc');
    expect(out).not.toBe(rows);
    expect(rows).toHaveLength(1);
  });
});
