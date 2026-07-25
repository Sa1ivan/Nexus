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
