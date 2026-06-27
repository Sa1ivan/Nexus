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
