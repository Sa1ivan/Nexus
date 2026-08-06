import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SiteConfigCodec } from '../src/app/features/builder/data-access/site-config.codec';
import { validateAndCanonicalizeCloudSiteConfigV4Json } from '../src/app/features/builder/data-access/site-config-v4-cloud-validation';

const fixtureRoot = join(process.cwd(), 'contracts/site-config/fixtures');
const contractRoot = join(process.cwd(), 'contracts/site-config');

function fixture(name: string): string {
  return readFileSync(join(fixtureRoot, name), 'utf8');
}

function validConfig(): Record<string, unknown> {
  return JSON.parse(fixture('valid-v4.json')) as Record<string, unknown>;
}

describe('mirrored SiteConfig v4 contract', () => {
  it('covers every mirrored artifact exactly once in the local manifest', () => {
    const manifest = readFileSync(join(contractRoot, 'manifest.sha256'), 'utf8').trim();
    const manifestPaths = manifest.split('\n').map((line) => line.slice(66));
    const actualPaths = [
      'v4.schema.json',
      ...readdirSync(fixtureRoot).map((name) => `fixtures/${name}`),
    ].sort();

    expect([...new Set(manifestPaths)].sort()).toEqual(actualPaths);
    expect(manifestPaths).toHaveLength(actualPaths.length);
    for (const line of manifest.split('\n')) {
      const match = /^(?<hash>[a-f\d]{64}) {2}(?<path>.+)$/u.exec(line);
      const bytes = readFileSync(join(contractRoot, match!.groups!['path']!));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(match!.groups!['hash']);
    }
  });

  it('migrates the representative v1 shape with missing theme, business, SEO, and chrome', () => {
    const input = JSON.parse(fixture('legacy-v1.json')) as Record<string, unknown>;
    expect(input['theme']).toBeUndefined();
    expect(input['business']).toBeUndefined();
    expect(input['seo']).toBeUndefined();
    expect(input['chrome']).toBeUndefined();

    const result = new SiteConfigCodec().normalize(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(4);
      expect(result.value.business.phone).toBe('');
      expect(result.value.pages[0]?.seo).toMatchObject({
        title: 'Главная',
        description: '',
        socialImage: null,
        noIndex: false,
      });
    }
  });

  it('migrates v2 site-level SEO into page SEO', () => {
    const input = JSON.parse(fixture('legacy-v2.json')) as Record<string, unknown>;
    const page = (input['pages'] as Record<string, unknown>[])[0]!;
    expect(input['chrome']).toBeUndefined();
    expect(page['seo']).toBeUndefined();

    const result = new SiteConfigCodec().normalize(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(4);
      expect(result.value.seo).toMatchObject({
        language: 'en',
        favicon: { src: 'https://cdn.example.com/favicon.png' },
      });
      expect(result.value.pages[0]?.seo).toMatchObject({
        title: 'Legacy v2 title',
        description: 'Legacy v2 description',
        socialImage: { src: 'https://cdn.example.com/social.png' },
        noIndex: false,
      });
    }
  });

  it('extracts v3 page-owned header/footer into shared chrome and keeps page SEO', () => {
    const input = JSON.parse(fixture('legacy-v3.json')) as Record<string, unknown>;
    const page = (input['pages'] as Record<string, unknown>[])[0]!;
    const inputTypes = (page['blocks'] as Record<string, unknown>[]).map((block) => block['type']);
    expect(input['chrome']).toBeUndefined();
    expect(inputTypes).toContain('siteHeader');
    expect(inputTypes).toContain('siteFooter');

    const result = new SiteConfigCodec().normalize(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.schemaVersion).toBe(4);
      expect(result.value.chrome.header.id).toBe('header-main');
      expect(result.value.chrome.footer.id).toBe('footer-main');
      expect(result.value.pages[0]?.seo.title).toBe('Nexus Studio');
      expect(
        result.value.pages[0]?.blocks.every(
          (block) => block.type !== 'siteHeader' && block.type !== 'siteFooter',
        ),
      ).toBe(true);
    }
  });

  it('normalizes the full current v4 fixture without migration', () => {
    const result = new SiteConfigCodec().decode(fixture('valid-v4.json'));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.schemaVersion).toBe(4);
  });

  it('accepts v4 for cloud persistence and canonicalizes bundled media paths', () => {
    const result = validateAndCanonicalizeCloudSiteConfigV4Json(fixture('valid-v4.json'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.canonicalJson).toContain('"src":"images/landing/office-studio.webp"');
      expect(result.canonicalJson).not.toContain('./images/');
    }
  });

  it.each([
    ['legacy-v3.json', 'unsupported-schema'],
    ['future-v5.json', 'unsupported-schema'],
    ['invalid-data-url-v4.json', 'invalid-site-config'],
    ['invalid-unsafe-path-v4.json', 'invalid-site-config'],
  ] as const)('rejects %s from normal cloud persistence', (name, code) => {
    expect(validateAndCanonicalizeCloudSiteConfigV4Json(fixture(name))).toMatchObject({
      ok: false,
      code,
    });
  });

  it.each([
    'http://example.com/image.png',
    'https://user:secret@example.com/image.png',
    'https://cdn.example.com/%2e%2e/secrets.png',
    'https://cdn.example.com/%252e%252e/secrets.png',
    'https://cdn.example.com/image%2500.png',
    'https://cdn.example.com\\..\\secrets.png',
    '//example.com/image.png',
    'blob:https://example.com/id',
    'file:///tmp/image.png',
    '/assets/image.png',
    '/builder/image.png',
    'images/image.png?download=1',
    'images/image.png#fragment',
    'images\\image.png',
    'images/%252e%252e/secrets.png',
    'images/image%2500.png',
  ])('rejects unsafe cloud media source %s', (src) => {
    const config = validConfig();
    const page = (config['pages'] as Record<string, unknown>[])[0]!;
    const hero = (page['blocks'] as Record<string, unknown>[])[0]!;
    (hero['media'] as Record<string, unknown>)['src'] = src;

    expect(validateAndCanonicalizeCloudSiteConfigV4Json(JSON.stringify(config))).toMatchObject({
      ok: false,
      code: 'invalid-site-config',
    });
  });

  it('enforces link discriminants, map HTTPS, and contained link id uniqueness', () => {
    const wrongKind = validConfig();
    const wrongKindHeader = (wrongKind['chrome'] as Record<string, Record<string, unknown>>)[
      'header'
    ]!;
    wrongKindHeader['cta'] = {
      ...(wrongKindHeader['cta'] as Record<string, unknown>),
      kind: 'external',
      target: '#lead-form',
    };

    const unsafeMap = validConfig();
    const unsafeFooter = (unsafeMap['chrome'] as Record<string, Record<string, unknown>>)[
      'footer'
    ]!;
    unsafeFooter['map'] = { label: 'Map', address: '', embedUrl: '/internal-map' };

    const duplicateNavigation = validConfig();
    const duplicateHeader = (
      duplicateNavigation['chrome'] as Record<string, Record<string, unknown>>
    )['header']!;
    const navigationItems = duplicateHeader['navigationItems'] as Record<string, unknown>[];
    navigationItems.push(structuredClone(navigationItems[0]!));

    for (const config of [wrongKind, unsafeMap, duplicateNavigation]) {
      expect(validateAndCanonicalizeCloudSiteConfigV4Json(JSON.stringify(config))).toMatchObject({
        ok: false,
        code: 'invalid-site-config',
      });
    }
  });
});
