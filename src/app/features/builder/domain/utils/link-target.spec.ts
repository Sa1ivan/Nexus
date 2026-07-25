import { describe, expect, it } from 'vitest';

import { normalizeLinkTarget, resolveLandingHref } from './link-target';

describe('link target', () => {
  it('rejects script links', () => {
    expect(normalizeLinkTarget('javascript:alert(1)')).toBe('#');
  });

  it('keeps an anchor on the current published route', () => {
    expect(resolveLandingHref('#lead-form', '/p/project-1/home', '?ref=test', '/')).toBe(
      '/p/project-1/home?ref=test#lead-form',
    );
  });
});
