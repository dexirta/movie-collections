import { TMDB_IMG_BASE } from '../core/tmdb.models';
import { buildPosterUrl } from './poster-url';

describe('buildPosterUrl', () => {
  it.each([
    { label: 'returns null for null', input: null as string | null, expected: null },
    { label: 'returns null for empty', input: '', expected: null },
  ])('$label', ({ input, expected }) => {
    expect(buildPosterUrl(input)).toBe(expected);
  });

  it.each([
    { input: '/poster.jpg', expected: `${TMDB_IMG_BASE}/poster.jpg` },
    { input: '/foo/bar.png', expected: `${TMDB_IMG_BASE}/foo/bar.png` },
  ])('prefixes the TMDB base for $input', ({ input, expected }) => {
    expect(buildPosterUrl(input)).toBe(expected);
  });
});
