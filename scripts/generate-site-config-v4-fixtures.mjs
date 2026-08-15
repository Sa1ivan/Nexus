import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { format } from 'prettier';

const JSON_ENVELOPE_BYTES_LIMIT = 1_310_720;
const CANONICAL_BYTES_LIMIT = 1_048_576;
const contractRoot = resolve(process.argv[2] ?? 'contracts/site-config');
const fixtureRoot = join(contractRoot, 'fixtures');

mkdirSync(fixtureRoot, { recursive: true });

const sourceName = readdirSync(fixtureRoot).includes('valid-v4.json')
  ? 'valid-v4.json'
  : 'v4-full-valid.json';
const full = JSON.parse(readFileSync(join(fixtureRoot, sourceName), 'utf8'));
const v4Schema = JSON.parse(readFileSync(join(contractRoot, 'v4.schema.json'), 'utf8'));

function clone(value) {
  return structuredClone(value);
}

function writeJson(name, value) {
  writeFileSync(join(fixtureRoot, name), `${JSON.stringify(value, null, 2)}\n`);
}

function writeRaw(name, value) {
  writeFileSync(join(fixtureRoot, name), value);
}

function stableJsonStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableJsonStringify).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function firstBlock(config, type) {
  const block = config.pages.flatMap((page) => page.blocks).find((item) => item.type === type);
  if (block === undefined) throw new Error(`Missing ${type} source block`);
  return block;
}

function firstLeadField(config) {
  const field = firstBlock(config, 'leadForm').fields[0];
  if (field === undefined) throw new Error('Missing lead field');
  return field;
}

function createV5Schema() {
  const schema = clone(v4Schema);
  schema.$id = 'https://nexus.local/contracts/site-config/v5.schema.json';
  schema.title = 'Nexus SiteConfig v5';
  schema.properties.schemaVersion.const = 5;

  const focalPoint = clone(schema.definitions.media.properties.focalPoint);
  const alt = { $ref: '#/definitions/shortText' };
  schema.definitions.media = {
    oneOf: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { const: 'managed' },
          assetId: { $ref: '#/definitions/id' },
          alt,
          focalPoint,
        },
        required: ['kind', 'assetId', 'alt'],
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { const: 'external' },
          src: { $ref: '#/definitions/url' },
          alt,
          focalPoint,
        },
        required: ['kind', 'src', 'alt'],
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          kind: { const: 'bundled' },
          path: { $ref: '#/definitions/url' },
          alt,
          focalPoint,
        },
        required: ['kind', 'path', 'alt'],
      },
    ],
  };
  return schema;
}

function minimalConfig() {
  const value = clone(full);
  value.name = 'M';
  value.pages = [
    {
      ...value.pages[0],
      id: 'page-minimal',
      slug: 'minimal',
      title: 'M',
      seo: {
        title: 'M',
        description: '',
        socialImage: null,
        noIndex: false,
      },
      blocks: [],
    },
  ];
  return value;
}

function withPages(count) {
  const value = minimalConfig();
  const page = value.pages[0];
  value.pages = Array.from({ length: count }, (_, index) => ({
    ...clone(page),
    id: `page-${index + 1}`,
    slug: `page-${index + 1}`,
    title: `Page ${index + 1}`,
    seo: { ...page.seo, title: `Page ${index + 1}` },
  }));
  return value;
}

function withBlocks(count) {
  const value = minimalConfig();
  const hero = clone(firstBlock(full, 'hero'));
  value.pages[0].blocks = Array.from({ length: count }, (_, index) => ({
    ...clone(hero),
    id: `hero-${index + 1}`,
    anchor: `hero-${index + 1}`,
  }));
  return value;
}

function withNavigationItems(count) {
  const value = minimalConfig();
  const link = clone(value.chrome.header.navigationItems[0]);
  value.chrome.header.navigationItems = Array.from({ length: count }, (_, index) => ({
    ...clone(link),
    id: `nav-${index + 1}`,
    label: `Link ${index + 1}`,
  }));
  return value;
}

function withLeadFields(count) {
  const value = clone(full);
  const leadForm = firstBlock(value, 'leadForm');
  const field = clone(leadForm.fields[0]);
  leadForm.fields = Array.from({ length: count }, (_, index) => ({
    ...clone(field),
    id: `field-${index + 1}`,
    label: `Field ${index + 1}`,
    order: index + 1,
  }));
  return value;
}

function faqBlock(blockIndex) {
  return {
    id: `faq-padding-${blockIndex}`,
    anchor: `faq-padding-${blockIndex}`,
    type: 'faq',
    appearance: {},
    hidden: false,
    variant: 'borderedAccordion',
    eyebrow: '',
    title: 'Padding',
    description: '',
    items: Array.from({ length: 100 }, (_, itemIndex) => ({
      id: `faq-${blockIndex}-${itemIndex + 1}`,
      question: 'Q',
      answer: '',
      initiallyOpen: false,
    })),
    allowMultipleOpen: false,
  };
}

function exactCanonicalDocument(bytes) {
  const value = minimalConfig();
  value.pages[0].blocks = [faqBlock(1), faqBlock(2)];
  const slots = [];
  for (const block of value.pages[0].blocks) {
    slots.push({ owner: block, key: 'description', maximum: 10_000 });
    for (const item of block.items) {
      slots.push({ owner: item, key: 'question', maximum: 256 });
      slots.push({ owner: item, key: 'answer', maximum: 10_000 });
    }
  }

  for (const slot of slots) {
    const size = Buffer.byteLength(stableJsonStringify(value));
    if (size === bytes) return value;
    const current = slot.owner[slot.key];
    const addition = Math.min(bytes - size, slot.maximum - current.length);
    if (addition > 0) slot.owner[slot.key] = `${current}${'x'.repeat(addition)}`;
  }

  const actual = Buffer.byteLength(stableJsonStringify(value));
  if (actual !== bytes) {
    throw new Error(`Unable to generate ${bytes} canonical bytes; produced ${actual}`);
  }
  return value;
}

writeJson('v4-full-valid.json', full);
writeJson('v4-minimal-valid.json', minimalConfig());

const sharedChrome = minimalConfig();
sharedChrome.pages.push({
  ...clone(sharedChrome.pages[0]),
  id: 'page-shared-2',
  slug: 'shared-2',
  title: 'Shared 2',
  seo: { ...sharedChrome.pages[0].seo, title: 'Shared 2' },
});
writeJson('v4-shared-chrome-valid.json', sharedChrome);

const bundled = clone(full);
firstBlock(bundled, 'hero').media.src = 'images/landing/office-studio.webp';
writeJson('v4-bundled-images-valid.json', bundled);
const bundledDot = clone(bundled);
firstBlock(bundledDot, 'hero').media.src = './images/landing/office-studio.webp';
writeJson('v4-bundled-dot-images-valid.json', bundledDot);
const traversal = clone(bundled);
firstBlock(traversal, 'hero').media.src = 'images/../secrets.txt';
writeJson('v4-bundled-traversal-rejected.json', traversal);
const dataUrl = clone(bundled);
firstBlock(dataUrl, 'hero').media.src = 'data:image/png;base64,AA==';
writeJson('v4-data-url-rejected.json', dataUrl);

writeJson('v4-pages-at-limit.json', withPages(50));
writeJson('v4-pages-over-limit.json', withPages(51));
writeJson('v4-blocks-at-limit.json', withBlocks(100));
writeJson('v4-blocks-over-limit.json', withBlocks(101));
writeJson('v4-collection-at-limit.json', withNavigationItems(100));
writeJson('v4-collection-over-limit.json', withNavigationItems(101));
writeJson('v4-form-fields-at-limit.json', withLeadFields(32));
writeJson('v4-form-fields-over-limit.json', withLeadFields(33));

const stringAtLimit = clone(full);
firstLeadField(stringAtLimit).placeholder = '';
firstLeadField(stringAtLimit).helpText = 'h'.repeat(10_000);
writeJson('v4-string-at-limit.json', stringAtLimit);
const stringOverLimit = clone(stringAtLimit);
firstLeadField(stringOverLimit).helpText += 'h';
writeJson('v4-string-over-limit.json', stringOverLimit);

const duplicateIdentifiers = clone(full);
duplicateIdentifiers.chrome.footer.id = duplicateIdentifiers.chrome.header.id;
writeJson('v4-duplicate-identifiers.json', duplicateIdentifiers);
const unsafeLink = clone(full);
unsafeLink.chrome.header.cta.target = 'javascript:alert(1)';
writeJson('v4-unsafe-link.json', unsafeLink);

writeRaw('v4-depth-at-limit.json', `${'{"nested":'.repeat(32)}null${'}'.repeat(32)}\n`);
writeRaw('v4-depth-over-limit.json', `${'{"nested":'.repeat(33)}null${'}'.repeat(33)}\n`);

const envelopeBase = JSON.stringify(minimalConfig());
function exactEnvelope(bytes) {
  const paddingBytes = bytes - Buffer.byteLength(envelopeBase);
  if (paddingBytes < 0) {
    throw new Error(`Envelope base exceeds ${bytes} bytes`);
  }
  return `{${' '.repeat(paddingBytes)}${envelopeBase.slice(1)}`;
}
writeRaw('v4-envelope-at-limit.json', exactEnvelope(JSON_ENVELOPE_BYTES_LIMIT));
writeRaw('v4-envelope-over-limit.json', exactEnvelope(JSON_ENVELOPE_BYTES_LIMIT + 1));

const documentAtLimit = exactCanonicalDocument(CANONICAL_BYTES_LIMIT);
writeJson('v4-document-at-limit.json', documentAtLimit);
const documentOverLimit = clone(documentAtLimit);
const expandableAnswer = documentOverLimit.pages[0].blocks
  .flatMap((block) => block.items)
  .find((item) => item.answer.length < 10_000);
if (expandableAnswer === undefined) throw new Error('Missing document overflow slot');
expandableAnswer.answer += 'x';
writeJson('v4-document-over-limit.json', documentOverLimit);

writeJson('legacy-v1-import.json', JSON.parse(readFileSync(join(fixtureRoot, 'legacy-v1.json'))));
writeJson('legacy-v2-import.json', JSON.parse(readFileSync(join(fixtureRoot, 'legacy-v2.json'))));
writeJson('legacy-v3-import.json', JSON.parse(readFileSync(join(fixtureRoot, 'legacy-v3.json'))));
writeJson(
  'future-version-rejected.json',
  JSON.parse(readFileSync(join(fixtureRoot, 'future-v5.json'))),
);

const managedV5 = clone(full);
managedV5.schemaVersion = 5;
firstBlock(managedV5, 'hero').media = {
  kind: 'managed',
  assetId: 'asset-managed-1',
  alt: 'Managed media',
};
writeJson('v5-managed-valid.json', managedV5);
const missingAssetV5 = clone(managedV5);
delete firstBlock(missingAssetV5, 'hero').media.assetId;
writeJson('v5-managed-missing-asset-id.json', missingAssetV5);
const unsafeExternalV5 = clone(managedV5);
firstBlock(unsafeExternalV5, 'hero').media = {
  kind: 'external',
  src: 'http://example.com/unsafe.webp',
  alt: 'Unsafe external media',
};
writeJson('v5-external-unsafe.json', unsafeExternalV5);
const traversalV5 = clone(managedV5);
firstBlock(traversalV5, 'hero').media = {
  kind: 'bundled',
  path: 'images/../unsafe.webp',
  alt: 'Unsafe bundled media',
};
writeJson('v5-bundled-traversal.json', traversalV5);

writeFileSync(
  join(contractRoot, 'v5.schema.json'),
  await format(JSON.stringify(createV5Schema()), {
    parser: 'json',
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    endOfLine: 'lf',
  }),
);

const artifactNames = [
  'v4.schema.json',
  'v5.schema.json',
  ...readdirSync(fixtureRoot).map((name) => `fixtures/${name}`),
].sort();
const manifest = artifactNames
  .map((name) => {
    const digest = createHash('sha256')
      .update(readFileSync(join(contractRoot, name)))
      .digest('hex');
    return `${digest}  ${name}`;
  })
  .join('\n');
writeFileSync(join(contractRoot, 'manifest.sha256'), `${manifest}\n`);

process.stdout.write(
  `Generated ${artifactNames.length - 2} SiteConfig fixtures in ${basename(contractRoot)}\n`,
);
