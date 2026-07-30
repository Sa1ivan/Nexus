import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_SITE_CONFIG } from './default-site.config';
import { SiteConfigCodec } from './site-config.codec';

describe('SiteConfigCodec', () => {
  let codec: SiteConfigCodec;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    codec = TestBed.inject(SiteConfigCodec);
  });

  it('round-trips the current schema', () => {
    const encoded = codec.encode(DEFAULT_SITE_CONFIG);

    expect(codec.decode(encoded)).toEqual({
      ok: true,
      value: DEFAULT_SITE_CONFIG,
    });
  });

  it('rejects an unsupported schema without a fallback project', () => {
    const input = JSON.stringify({ ...DEFAULT_SITE_CONFIG, schemaVersion: 999 });

    expect(codec.decode(input)).toEqual({
      ok: false,
      reason: 'unsupported-schema',
    });
  });

  it.each([1, 2])('migrates schema version %s SEO to every page', (schemaVersion) => {
    const legacySocialImage = {
      src: 'https://example.com/social.jpg',
      alt: 'Legacy social image',
    };
    const legacyFavicon = {
      src: 'https://example.com/favicon.png',
      alt: '',
    };
    const input = {
      ...DEFAULT_SITE_CONFIG,
      schemaVersion,
      seo: {
        title: 'Legacy page title',
        description: 'Legacy page description',
        language: 'en',
        socialImage: legacySocialImage,
        favicon: legacyFavicon,
      },
      pages: DEFAULT_SITE_CONFIG.pages.map((page) => ({
        ...page,
        seo: {
          title: 'Page SEO must be ignored for a legacy schema',
          description: 'Legacy pages did not own SEO.',
          socialImage: null,
          noIndex: true,
        },
      })),
    };

    const result = codec.decode(JSON.stringify(input));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.schemaVersion).toBe(3);
      expect(result.value.seo).toMatchObject({
        language: 'en',
        favicon: {
          src: legacyFavicon.src,
        },
      });
      expect(result.value.pages[0]?.seo).toMatchObject({
        title: 'Legacy page title',
        description: 'Legacy page description',
        socialImage: {
          src: legacySocialImage.src,
          alt: legacySocialImage.alt,
        },
        noIndex: false,
      });
    }
  });

  it('sanitizes unsafe link targets during normalization', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Page fixture is missing.');
    }

    const value = {
      ...DEFAULT_SITE_CONFIG,
      pages: [
        {
          ...page,
          blocks: page.blocks.map((block) =>
            block.type === 'hero' ? { ...block, buttonHref: 'javascript:alert(1)' } : block,
          ),
        },
      ],
    };

    const result = codec.decode(JSON.stringify(value));

    expect(result.ok).toBe(true);

    if (result.ok) {
      const normalizedHero = result.value.pages[0]?.blocks.find((block) => block.type === 'hero');
      expect(normalizedHero?.type === 'hero' ? normalizedHero.buttonHref : '').toBe('#');
    }
  });

  it('round-trips custom design colors and additional font stacks', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Page fixture is missing.');
    }

    const value = {
      ...DEFAULT_SITE_CONFIG,
      theme: {
        ...DEFAULT_SITE_CONFIG.theme,
        accentColor: '#0c2238',
        fontPairing: 'humanist',
      },
      pages: [
        {
          ...page,
          blocks: page.blocks.map((block) => ({
            ...block,
            design: {
              accentColor: '#0c2238',
              fontPairing: 'humanist',
              density: 'balanced',
              templateStyle: 'classic',
            },
          })),
        },
      ],
    };

    const result = codec.decode(JSON.stringify(value));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.theme.fontPairing).toBe('humanist');
      expect(result.value.pages[0]?.blocks[0]?.design).toMatchObject({
        accentColor: '#0c2238',
        fontPairing: 'humanist',
      });
    }
  });

  it('migrates the legacy hero button style into the shared appearance contract', () => {
    const value = withLegacyHeroStyles({
      buttonVariant: 'outline',
      buttonBackgroundColor: '#102030',
      buttonTextColor: '#f0f1f2',
    });

    const result = codec.decode(JSON.stringify(value));

    expect(result.ok).toBe(true);

    if (result.ok) {
      const hero = result.value.pages[0]?.blocks.find((block) => block.type === 'hero');

      expect(hero?.type === 'hero' ? hero.primaryButtonAppearance : null).toEqual({
        variant: 'outline',
        backgroundColor: '#102030',
        textColor: '#f0f1f2',
        borderColor: '#102030',
      });
    }
  });

  it('normalizes independent appearances for primary and secondary actions', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Page fixture is missing.');
    }

    const value = {
      ...DEFAULT_SITE_CONFIG,
      pages: [
        {
          ...page,
          blocks: page.blocks.map((block) =>
            block.type === 'hero'
              ? {
                  ...block,
                  primaryButtonAppearance: {
                    variant: 'ghost',
                    backgroundColor: '#112233',
                    textColor: '#abcdef',
                    borderColor: '#445566',
                  },
                  secondaryButton: {
                    ...block.secondaryButton,
                    appearance: {
                      variant: 'outline',
                      backgroundColor: '#778899',
                      textColor: '#010203',
                      borderColor: '#aabbcc',
                    },
                  },
                }
              : block,
          ),
        },
      ],
    };

    const result = codec.decode(JSON.stringify(value));

    expect(result.ok).toBe(true);

    if (result.ok) {
      const hero = result.value.pages[0]?.blocks.find((block) => block.type === 'hero');

      expect(hero?.type === 'hero' ? hero.primaryButtonAppearance : null).toEqual({
        variant: 'ghost',
        backgroundColor: '#112233',
        textColor: '#abcdef',
        borderColor: '#445566',
      });
      expect(hero?.type === 'hero' ? hero.secondaryButton?.appearance : null).toEqual({
        variant: 'outline',
        backgroundColor: '#778899',
        textColor: '#010203',
        borderColor: '#aabbcc',
      });
    }
  });

  it('falls back from malformed custom design colors', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Page fixture is missing.');
    }

    const value = {
      ...DEFAULT_SITE_CONFIG,
      pages: [
        {
          ...page,
          blocks: page.blocks.map((block) => ({
            ...block,
            design: {
              accentColor: '#oops',
              fontPairing: 'grotesk',
              density: 'balanced',
              templateStyle: 'classic',
            },
          })),
        },
      ],
    };

    const result = codec.decode(JSON.stringify(value));

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.pages[0]?.blocks[0]?.design?.accentColor).toBe('teal');
    }
  });

  it('migrates previously built-in Unsplash media to the bundled asset', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Page fixture is missing.');
    }

    const value = {
      ...DEFAULT_SITE_CONFIG,
      pages: [
        {
          ...page,
          blocks: page.blocks.map((block) =>
            block.type === 'hero'
              ? {
                  ...block,
                  media: {
                    src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
                    alt: 'Legacy built-in image',
                  },
                }
              : block,
          ),
        },
      ],
    };

    const result = codec.decode(JSON.stringify(value));

    expect(result.ok).toBe(true);

    if (result.ok) {
      const hero = result.value.pages[0]?.blocks.find((block) => block.type === 'hero');

      expect(hero?.type === 'hero' ? hero.media?.src : null).toBe(
        'images/landing/office-studio.webp',
      );
    }
  });

  it('reports an invalid shape when normalization throws', () => {
    const page = DEFAULT_SITE_CONFIG.pages[0];

    if (page === undefined) {
      throw new Error('Page fixture is missing.');
    }

    const value = {
      ...DEFAULT_SITE_CONFIG,
      pages: [
        {
          ...page,
          blocks: [
            ...page.blocks,
            {
              id: 'footer',
              anchor: 'footer',
              type: 'siteFooter',
              map: {
                address: '\ud800',
                embedUrl: 'https://maps.example.com',
              },
            },
          ],
        },
      ],
    };

    expect(codec.decode(JSON.stringify(value))).toEqual({
      ok: false,
      reason: 'invalid-shape',
    });
  });
});

function withLegacyHeroStyles(styles: Readonly<Record<string, unknown>>) {
  const page = DEFAULT_SITE_CONFIG.pages[0];

  if (page === undefined) {
    throw new Error('Page fixture is missing.');
  }

  return {
    ...DEFAULT_SITE_CONFIG,
    pages: [
      {
        ...page,
        blocks: page.blocks.map((block) =>
          block.type === 'hero'
            ? (({ primaryButtonAppearance, ...legacyBlock }) => {
                void primaryButtonAppearance;

                return {
                  ...legacyBlock,
                  styles: {
                    ...block.styles,
                    ...styles,
                  },
                };
              })(block)
            : block,
        ),
      },
    ],
  };
}
