import { collectionMovie } from '../testing/fixtures';
import { genreLabelFromIds, genreLabelsMapForCollectionMovies } from './genre-labels';

describe('genreLabelFromIds', () => {
  it('joins resolved names in id order', () => {
    expect(genreLabelFromIds([28, 12], { 28: 'Action', 12: 'Adventure' })).toBe('Action, Adventure');
  });

  it('returns em dash when ids are missing or unknown', () => {
    expect(genreLabelFromIds(undefined, {})).toBe('—');
    expect(genreLabelFromIds([], {})).toBe('—');
    expect(genreLabelFromIds([999], {})).toBe('—');
  });
});

describe('genreLabelsMapForCollectionMovies', () => {
  it('maps each collection movie id to a label from the genre dictionary', () => {
    const movies = [
      collectionMovie({ id: 10, genre_ids: [28, 12] }),
      collectionMovie({ id: 11, genre_ids: [999] }),
    ];
    const map = genreLabelsMapForCollectionMovies(movies, { 28: 'Action', 12: 'Adventure' });
    expect(map.get(10)).toBe('Action, Adventure');
    expect(map.get(11)).toBe('—');
  });

  it('returns an empty map for an empty movie list', () => {
    expect([...genreLabelsMapForCollectionMovies([], {})]).toEqual([]);
  });
});
