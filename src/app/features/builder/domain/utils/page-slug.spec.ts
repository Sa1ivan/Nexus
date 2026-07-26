import { describe, expect, it } from 'vitest';

import { isReservedPageSlug, normalizePageSlug } from './page-slug';

describe('page slug', () => {
  it('normalizes Cyrillic, ASCII and separators deterministically', () => {
    expect(normalizePageSlug('  О нас  ')).toBe('o-nas');
    expect(normalizePageSlug('Price / 2026')).toBe('price-2026');
    expect(normalizePageSlug('---')).toBe('');
  });

  it('recognizes builder routes reserved by the application', () => {
    expect(isReservedPageSlug('builder')).toBe(true);
    expect(isReservedPageSlug('about')).toBe(false);
  });
});
