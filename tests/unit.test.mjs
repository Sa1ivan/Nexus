import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('domain model includes publishable MVP contracts', async () => {
  const [siteConfig, blockType, blockConfig, projectModel] = await Promise.all([
    source('src/app/features/builder/domain/models/site-config.model.ts'),
    source('src/app/features/builder/domain/models/block-type.model.ts'),
    source('src/app/features/builder/domain/models/block-config.model.ts'),
    source('src/app/features/builder/domain/models/project.model.ts'),
  ]);

  assert.match(siteConfig, /SITE_CONFIG_SCHEMA_VERSION/);
  assert.match(siteConfig, /schemaVersion: number/);
  assert.match(blockType, /leadForm/);
  assert.match(blockConfig, /anchor: BlockAnchor/);
  assert.match(projectModel, /interface Project/);
  assert.match(projectModel, /interface PublishedRelease/);
  assert.match(projectModel, /interface LeadSubmission/);
});

test('landing draft creates a valid lead capture section', async () => {
  const factory = await source('src/app/features/builder/data-access/landing-draft.factory.ts');

  assert.match(factory, /schemaVersion: SITE_CONFIG_SCHEMA_VERSION/);
  assert.match(factory, /type: 'leadForm'/);
  assert.match(factory, /anchor: 'lead-form'/);
  assert.match(factory, /buttonHref: ctaDestination/);
  assert.match(factory, /enrichOffers/);
  assert.match(factory, /OFFER_IMAGE_URLS/);
  assert.match(factory, /createDefaultBooking/);
});

test('rendered blocks use dynamic anchors instead of duplicate hard-coded ids', async () => {
  const files = await Promise.all([
    source('src/app/features/preview/ui/hero-block/hero-block.component.html'),
    source('src/app/features/preview/ui/offer-list-block/offer-list-block.component.html'),
    source('src/app/features/preview/ui/site-footer-block/site-footer-block.component.html'),
    source('src/app/features/preview/ui/site-header-block/site-header-block.component.html'),
    source('src/app/features/preview/ui/lead-form-block/lead-form-block.component.html'),
  ]);

  for (const file of files) {
    assert.match(file, /\[id\]="block\(\)\.anchor"/);
    assert.doesNotMatch(file, /\sid="(hero|offers|contact|site-header)"/);
  }
});

test('block registry exposes a complete metadata contract for every block type', async () => {
  const [blockTypes, registry] = await Promise.all([
    source('src/app/features/builder/domain/models/block-type.model.ts'),
    source('src/app/features/builder/domain/registry/block-registry.ts'),
  ]);

  const supportedTypes = [...blockTypes.matchAll(/'([^']+)'/g)].map((match) => match[1]);

  assert.deepEqual([...supportedTypes].sort(), [
    'hero',
    'leadForm',
    'offerList',
    'siteFooter',
    'siteHeader',
  ]);

  for (const type of supportedTypes) {
    assert.match(registry, new RegExp(`${type}: \\{`));
    assert.match(registry, new RegExp(`type: '${type}'`));
  }

  assert.match(registry, /renderer: 'SiteHeaderBlockComponent'/);
  assert.match(registry, /inspector: 'SiteHeaderInspector'/);
  assert.match(registry, /export const BLOCK_PALETTE = Object\.values\(BLOCK_DEFINITIONS\)/);
  assert.match(registry, /createDefaultBlock/);
  assert.match(registry, /cloneRegisteredBlock/);
});

test('editable block models include richer Wix-like customization fields', async () => {
  const [linkModel, mediaModel, headerModel, heroModel, offerModel, footerModel, leadFormModel] =
    await Promise.all([
      source('src/app/features/builder/domain/models/link-config.model.ts'),
      source('src/app/features/builder/domain/models/media-asset.model.ts'),
      source('src/app/features/builder/domain/models/site-header-block-config.model.ts'),
      source('src/app/features/builder/domain/models/hero-block-config.model.ts'),
      source('src/app/features/builder/domain/models/offer-list-block-config.model.ts'),
      source('src/app/features/builder/domain/models/site-footer-block-config.model.ts'),
      source('src/app/features/builder/domain/models/lead-form-block-config.model.ts'),
    ]);

  assert.match(linkModel, /label: string/);
  assert.match(linkModel, /target: string/);
  assert.match(linkModel, /kind: LinkKind/);
  assert.match(mediaModel, /src: string/);
  assert.match(mediaModel, /alt: string/);
  assert.match(mediaModel, /focalPoint/);
  assert.match(headerModel, /HeaderBookingConfig/);
  assert.match(heroModel, /media\?: MediaAsset/);
  assert.match(heroModel, /secondaryButton\?: LinkConfig/);
  assert.match(offerModel, /price\?: string/);
  assert.match(offerModel, /image\?: MediaAsset/);
  assert.match(offerModel, /cta\?: LinkConfig/);
  assert.match(footerModel, /FooterMapConfig/);
  assert.match(footerModel, /socialLinks/);
  assert.match(leadFormModel, /helpText\?: string/);
  assert.match(leadFormModel, /order: number/);
});

test('storage normalization and validation harden local demo data', async () => {
  const [persistence, validation] = await Promise.all([
    source('src/app/features/builder/data-access/project-persistence.service.ts'),
    source('src/app/features/builder/domain/utils/site-config-validation.ts'),
  ]);

  assert.match(persistence, /normalizeStorageState\(JSON\.parse\(rawState\) as unknown\)/);
  assert.match(persistence, /normalizeBlock/);
  assert.match(persistence, /readLink/);
  assert.match(persistence, /normalizeLinkTarget/);
  assert.doesNotMatch(persistence, /JSON\.parse\(rawState\) as StorageState/);
  assert.match(validation, /validateHref/);
  assert.match(validation, /startsWith\('javascript:'\)/);
  assert.match(validation, /startsWith\('data:'\)/);
  assert.match(validation, /Дублируется id страницы/);
});
