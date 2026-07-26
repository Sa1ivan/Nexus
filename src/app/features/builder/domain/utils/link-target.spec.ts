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

  it('keeps an internal page target inside a published site', () => {
    expect(resolveLandingHref('/about', '/p/project-1/home', '', '/')).toBe('/p/project-1/about');
  });

  it('keeps an internal page target inside a deployed base path', () => {
    expect(resolveLandingHref('/about', '/nexus/p/project-1/home', '', '/nexus/')).toBe(
      '/nexus/p/project-1/about',
    );
  });

  it('keeps ordinary application internal links outside published routes', () => {
    expect(resolveLandingHref('/projects', '/builder', '', '/')).toBe('/projects');
  });
});
