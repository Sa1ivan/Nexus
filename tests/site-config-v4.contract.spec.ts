import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { SiteConfigCodec } from '../src/app/features/builder/data-access/site-config.codec';
import { validateAndCanonicalizeCloudSiteConfigV4Json } from '../src/app/features/builder/data-access/site-config-v4-cloud-validation';

const fixtureRoot = join(process.cwd(), 'contracts/site-config/fixtures');
const contractRoot = join(process.cwd(), 'contracts/site-config');
const mirroredManifestSha256 = 'e0c1d861d1da41572ac19914d2afbbe326aa6c72e5ea80727f7b7f900bb84071';
const requiredFixtureNames = [
  'future-version-rejected.json',
  'legacy-v1-import.json',
  'legacy-v2-import.json',
  'legacy-v3-import.json',
  'v4-blocks-at-limit.json',
  'v4-blocks-over-limit.json',
  'v4-bundled-dot-images-valid.json',
  'v4-bundled-images-valid.json',
  'v4-bundled-traversal-rejected.json',
  'v4-collection-at-limit.json',
  'v4-collection-over-limit.json',
  'v4-data-url-rejected.json',
  'v4-depth-at-limit.json',
  'v4-depth-over-limit.json',
  'v4-document-at-limit.json',
  'v4-document-over-limit.json',
  'v4-duplicate-identifiers.json',
  'v4-envelope-at-limit.json',
  'v4-envelope-over-limit.json',
  'v4-form-fields-at-limit.json',
  'v4-form-fields-over-limit.json',
  'v4-full-valid.json',
  'v4-minimal-valid.json',
  'v4-pages-at-limit.json',
  'v4-pages-over-limit.json',
  'v4-shared-chrome-valid.json',
  'v4-string-at-limit.json',
  'v4-string-over-limit.json',
  'v4-unsafe-link.json',
  'v5-bundled-traversal.json',
  'v5-external-unsafe.json',
  'v5-managed-missing-asset-id.json',
  'v5-managed-valid.json',
] as const;

function fixture(name: string): string {
  return readFileSync(join(fixtureRoot, name), 'utf8');
}

function validConfig(): Record<string, unknown> {
  return JSON.parse(fixture('valid-v4.json')) as Record<string, unknown>;
}

function firstLeadField(config: Record<string, unknown>): Record<string, unknown> {
  const pages = config['pages'] as Record<string, unknown>[];
  const blocks = pages[0]!['blocks'] as Record<string, unknown>[];
  const leadForm = blocks.find((block) => block['type'] === 'leadForm');
  const fields = leadForm?.['fields'] as Record<string, unknown>[] | undefined;
  if (fields?.[0] === undefined) throw new Error('Lead-form fixture is missing');
  return fields[0];
}

describe('mirrored SiteConfig v4 contract', () => {
  it('covers every mirrored artifact exactly once in the local manifest', () => {
    const manifestBytes = readFileSync(join(contractRoot, 'manifest.sha256'));
    expect(createHash('sha256').update(manifestBytes).digest('hex')).toBe(mirroredManifestSha256);
    const manifest = manifestBytes.toString('utf8').trim();
    const manifestPaths = manifest.split('\n').map((line) => line.slice(66));
    const actualPaths = [
      'v4.schema.json',
      'v5.schema.json',
      ...readdirSync(fixtureRoot).map((name) => `fixtures/${name}`),
    ].sort();

    expect([...new Set(manifestPaths)].sort()).toEqual(actualPaths);
    expect(manifestPaths).toHaveLength(actualPaths.length);
    expect(actualPaths).toEqual(
      expect.arrayContaining(requiredFixtureNames.map((name) => `fixtures/${name}`)),
    );
    for (const line of manifest.split('\n')) {
      const match = /^(?<hash>[a-f\d]{64}) {2}(?<path>.+)$/u.exec(line);
      const bytes = readFileSync(join(contractRoot, match!.groups!['path']!));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(match!.groups!['hash']);
    }
  });

  it.each([
    'v4-minimal-valid.json',
    'v4-full-valid.json',
    'v4-shared-chrome-valid.json',
    'v4-bundled-images-valid.json',
    'v4-bundled-dot-images-valid.json',
    'v4-pages-at-limit.json',
    'v4-blocks-at-limit.json',
    'v4-collection-at-limit.json',
    'v4-form-fields-at-limit.json',
    'v4-string-at-limit.json',
    'v4-envelope-at-limit.json',
    'v4-document-at-limit.json',
  ])('accepts the exact boundary fixture %s', (name) => {
    expect(validateAndCanonicalizeCloudSiteConfigV4Json(fixture(name))).toMatchObject({
      ok: true,
    });
  });

  it.each([
    ['v4-bundled-traversal-rejected.json', 'invalid-site-config'],
    ['v4-data-url-rejected.json', 'invalid-site-config'],
    ['v4-envelope-over-limit.json', 'json-envelope-too-large'],
    ['v4-document-over-limit.json', 'canonical-document-too-large'],
    ['v4-pages-over-limit.json', 'invalid-site-config'],
    ['v4-blocks-over-limit.json', 'invalid-site-config'],
    ['v4-collection-over-limit.json', 'invalid-site-config'],
    ['v4-form-fields-over-limit.json', 'invalid-site-config'],
    ['v4-depth-over-limit.json', 'json-depth-exceeded'],
    ['v4-duplicate-identifiers.json', 'invalid-site-config'],
    ['v4-string-over-limit.json', 'invalid-site-config'],
    ['v4-unsafe-link.json', 'invalid-site-config'],
    ['future-version-rejected.json', 'unsupported-schema'],
  ] as const)('rejects the exact boundary fixture %s with %s', (name, code) => {
    expect(validateAndCanonicalizeCloudSiteConfigV4Json(fixture(name))).toEqual({
      ok: false,
      code,
    });
  });

  it('keeps bundled path spellings canonically equivalent', () => {
    const direct = validateAndCanonicalizeCloudSiteConfigV4Json(
      fixture('v4-bundled-images-valid.json'),
    );
    const dotted = validateAndCanonicalizeCloudSiteConfigV4Json(
      fixture('v4-bundled-dot-images-valid.json'),
    );

    expect(direct.ok).toBe(true);
    expect(dotted.ok).toBe(true);
    if (direct.ok && dotted.ok) expect(dotted.canonicalJson).toBe(direct.canonicalJson);
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

  it.each(['legacy-v1.json', 'legacy-v2.json', 'legacy-v3.json', 'valid-v4.json'])(
    'normalizes %s deterministically',
    (name) => {
      const input = JSON.parse(fixture(name)) as Record<string, unknown>;
      const codec = new SiteConfigCodec();

      const first = codec.normalize(structuredClone(input));
      const second = codec.normalize(structuredClone(input));

      expect(second).toEqual(first);
    },
  );

  it('keeps deterministic migration ids unique beside explicit ids', () => {
    const input = validConfig();
    const chrome = input['chrome'] as Record<string, unknown>;
    const header = chrome['header'] as Record<string, unknown>;
    const links = header['navigationItems'] as Record<string, unknown>[];
    const missingIdLink = structuredClone(links[0]!);
    delete missingIdLink['id'];
    links.push(missingIdLink);

    const first = new SiteConfigCodec().normalize(structuredClone(input));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const generatedId = first.value.chrome.header.navigationItems[1]!.id;
    links[0]!['id'] = generatedId;

    const second = new SiteConfigCodec().normalize(input);
    expect(second.ok).toBe(true);
    if (second.ok) {
      const normalizedIds = second.value.chrome.header.navigationItems.map((link) => link.id);
      expect(new Set(normalizedIds).size).toBe(normalizedIds.length);
    }
  });

  it('preserves an explicitly empty footer link collection', () => {
    const result = new SiteConfigCodec().decode(fixture('valid-v4.json'));

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.chrome.footer.links).toEqual([]);
  });

  it('accepts empty lead placeholders and long help text at the exact boundary', () => {
    const accepted = validConfig();
    const acceptedField = firstLeadField(accepted);
    acceptedField['placeholder'] = '';
    acceptedField['helpText'] = 'h'.repeat(10_000);

    const rejected = structuredClone(accepted);
    firstLeadField(rejected)['helpText'] = 'h'.repeat(10_001);

    expect(validateAndCanonicalizeCloudSiteConfigV4Json(JSON.stringify(accepted))).toMatchObject({
      ok: true,
    });
    expect(validateAndCanonicalizeCloudSiteConfigV4Json(JSON.stringify(rejected))).toMatchObject({
      ok: false,
      code: 'invalid-site-config',
    });
  });

  it('accepts v4 for cloud persistence and canonicalizes bundled media paths', () => {
    const result = validateAndCanonicalizeCloudSiteConfigV4Json(fixture('valid-v4.json'));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.canonicalJson).toContain('"src":"images/landing/office-studio.webp"');
      expect(result.canonicalJson).not.toContain('./images/');
    }
  });

  it('measures URL limits in Unicode code points like JSON Schema', () => {
    const config = validConfig();
    const prefix = 'https://example.com/';
    const source = `${prefix}${'😀'.repeat(2_048 - [...prefix].length)}`;
    const page = (config['pages'] as Record<string, unknown>[])[0]!;
    const hero = (page['blocks'] as Record<string, unknown>[])[0]!;
    (hero['media'] as Record<string, unknown>)['src'] = source;

    expect(source.length).toBeGreaterThan(2_048);
    expect([...source]).toHaveLength(2_048);
    expect(validateAndCanonicalizeCloudSiteConfigV4Json(JSON.stringify(config))).toMatchObject({
      ok: true,
    });
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
