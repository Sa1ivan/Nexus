import { describe, expect, it } from 'vitest';

import { DEFAULT_SITE_CONFIG } from '../../data-access/default-site.config';
import { duplicatePage } from './page-config-update';
import { isSafeMediaSource, validateSiteConfig } from './site-config-validation';

describe('site config validation', () => {
  it('allows the same anchors on different pages', () => {
    const duplicated = duplicatePage(
      DEFAULT_SITE_CONFIG.pages,
      DEFAULT_SITE_CONFIG.pages[0]?.id ?? '',
    );

    expect(duplicated.ok).toBe(true);

    if (duplicated.ok) {
      expect(
        validateSiteConfig({
          ...DEFAULT_SITE_CONFIG,
          pages: duplicated.pages,
        }),
      ).toEqual({ valid: true, errors: [] });
    }
  });

  it('rejects duplicate anchors within one page', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined || page.blocks.length < 2) {
      throw new Error('Default page must contain at least two blocks.');
    }

    const firstAnchor = page.blocks[0]!.anchor;
    const result = validateSiteConfig({
      ...DEFAULT_SITE_CONFIG,
      pages: [
        {
          ...page,
          blocks: page.blocks.map((block, index) =>
            index === 1 ? { ...block, anchor: firstAnchor } : block,
          ),
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      `На странице "${page.title}" дублируется anchor "${firstAnchor}".`,
    );
  });

  it('validates page slug and SEO limits', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Default page fixture is missing.');
    }

    const result = validateSiteConfig({
      ...DEFAULT_SITE_CONFIG,
      pages: [
        {
          ...page,
          slug: 'Invalid slug',
          seo: {
            title: ' ',
            description: 'x'.repeat(181),
            socialImage: {
              src: 'javascript:alert(1)',
              alt: 'Unsafe',
            },
            noIndex: false,
          },
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('slug'),
        expect.stringContaining('SEO title'),
        expect.stringContaining('SEO description'),
        expect.stringContaining('social image'),
      ]),
    );
  });

  it('allows bundled image paths without allowing path traversal', () => {
    expect(isSafeMediaSource('images/landing/restaurant-1.webp')).toBe(true);
    expect(isSafeMediaSource('./images/landing/product-hero.webp')).toBe(true);
    expect(isSafeMediaSource('../private/image.webp')).toBe(false);
  });
});
