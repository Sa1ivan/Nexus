import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

async function importTypeScriptModule(path) {
  const compiled = ts.transpileModule(await source(path), {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

  return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}

test('Pages CI uses the pinned runtime and installs Chromium before browser tests', async () => {
  const [workflow, nodeVersion, packageJsonSource] = await Promise.all([
    source('.github/workflows/pages.yml'),
    source('.nvmrc'),
    source('package.json'),
  ]);
  const buildJobStart = workflow.indexOf('  build:\n');
  const nextJobStart = workflow.indexOf('\n  deploy:\n', buildJobStart);
  const buildJob = workflow.slice(buildJobStart, nextJobStart);
  const runCommands = buildJob
    .split('\n')
    .flatMap((line) => line.match(/^\s+run:\s*(.+)$/)?.[1].trim() ?? []);
  const installBrowserStep = runCommands.indexOf('npx playwright install --with-deps chromium');
  const runBrowserTestsStep = runCommands.indexOf('npm run e2e');

  assert.notEqual(buildJobStart, -1);
  assert.notEqual(nextJobStart, -1);
  assert.notEqual(installBrowserStep, -1);
  assert.notEqual(runBrowserTestsStep, -1);
  assert.equal(installBrowserStep + 1, runBrowserTestsStep);
  assert.match(buildJob, /^\s+uses: actions\/checkout@v6$/m);
  assert.match(buildJob, /^\s+uses: actions\/setup-node@v6$/m);
  assert.match(buildJob, /^\s+node-version: 24$/m);
  assert.equal(nodeVersion.trim(), '24');
  assert.equal(JSON.parse(packageJsonSource).engines.node, '>=24 <25');
});

test('CI runs the complete verification gate on Node.js 24', async () => {
  const workflow = await source('.github/workflows/ci.yml').catch(() => '');
  const runCommands = workflow
    .split('\n')
    .flatMap((line) => line.match(/^\s+- run:\s*(.+)$/)?.[1].trim() ?? []);

  assert.match(workflow, /^name: CI$/m);
  assert.match(workflow, /^\s+pull_request:$/m);
  assert.match(workflow, /^\s+- develop$/m);
  assert.match(workflow, /^\s+- main$/m);
  assert.match(workflow, /^\s+- uses: actions\/checkout@v6$/m);
  assert.match(workflow, /^\s+- uses: actions\/setup-node@v6$/m);
  assert.match(workflow, /^\s+node-version: 24$/m);
  assert.deepEqual(runCommands, [
    'npm ci',
    'npx playwright install --with-deps chromium',
    'npm run verify',
  ]);
  assert.match(workflow, /^\s+- uses: actions\/upload-artifact@v4$/m);
  assert.match(workflow, /^\s+if: failure\(\)$/m);
  assert.match(workflow, /^\s+playwright-report$/m);
  assert.match(workflow, /^\s+test-results$/m);
});

test('workspace and GitHub Pages use the Nexus.UI technical identity', async () => {
  const [angularSource, packageSource, lockSource, workflow, index, readme] = await Promise.all([
    source('angular.json'),
    source('package.json'),
    source('package-lock.json'),
    source('.github/workflows/pages.yml'),
    source('src/index.html'),
    source('README.md'),
  ]);
  const angularConfig = JSON.parse(angularSource);
  const packageJson = JSON.parse(packageSource);
  const packageLock = JSON.parse(lockSource);
  const uiProject = angularConfig.projects['nexus.ui'];

  assert.equal(packageJson.name, 'nexus.ui');
  assert.equal(packageLock.name, 'nexus.ui');
  assert.equal(packageLock.packages[''].name, 'nexus.ui');
  assert.ok(uiProject);
  assert.equal(angularConfig.projects.nexus, undefined);
  assert.equal(
    uiProject.architect.serve.configurations.production.buildTarget,
    'nexus.ui:build:production',
  );
  assert.equal(
    uiProject.architect.serve.configurations.development.buildTarget,
    'nexus.ui:build:development',
  );
  assert.match(workflow, /npm run build -- --base-href=\/Nexus\.UI\//u);
  assert.match(workflow, /dist\/nexus\.ui\/browser/u);
  assert.match(index, /<title>Nexus\.UI<\/title>/u);
  assert.match(readme, /^# Nexus\.UI$/m);
});

test('cloud plan targets the separate Nexus.BC repository', async () => {
  const [roadmap, phaseOnePlan] = await Promise.all([
    source('ROADMAP.md'),
    source('docs/superpowers/plans/2026-07-26-nexus-cloud-alpha-phase-1.md'),
  ]);

  assert.match(roadmap, /`Sa1ivan\/Nexus\.BC`/u);
  assert.match(phaseOnePlan, /Frontend остаётся в `Sa1ivan\/Nexus\.UI`/u);
  assert.match(phaseOnePlan, /backend — только в `Sa1ivan\/Nexus\.BC`/u);
  assert.match(phaseOnePlan, /git clone git@github\.com:Sa1ivan\/Nexus\.BC\.git/u);
  assert.match(phaseOnePlan, /Backend local path: sibling `\.\.\/Nexus\.BC`/u);
  assert.doesNotMatch(phaseOnePlan, /Nexus(?:-Backend|\.Backend)/u);
});

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
    'callToAction',
    'contentMedia',
    'faq',
    'featureGrid',
    'gallery',
    'hero',
    'leadForm',
    'offerList',
    'siteFooter',
    'siteHeader',
    'testimonials',
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
  const [repository, projectStorageCodec, siteConfigCodec, validation] = await Promise.all([
    source('src/app/features/builder/data-access/local-project.repository.ts'),
    source('src/app/features/builder/data-access/project-storage.codec.ts'),
    source('src/app/features/builder/data-access/site-config.codec.ts'),
    source('src/app/features/builder/domain/utils/site-config-validation.ts'),
  ]);

  assert.match(repository, /projectStorageCodec\.decode\(rawState\)/);
  assert.match(repository, /projectStorageCodec\.encode\(state\)/);
  assert.match(repository, /MAX_REVISIONS_PER_PROJECT/);
  assert.doesNotMatch(repository, /normalizeBlock/);
  assert.match(projectStorageCodec, /normalizeStorageState/);
  assert.match(projectStorageCodec, /Existing storage is corrupted and was not modified/);
  assert.match(siteConfigCodec, /normalizeBlock/);
  assert.match(siteConfigCodec, /readLink/);
  assert.match(siteConfigCodec, /normalizeLinkTarget/);
  assert.match(validation, /validateHref/);
  assert.match(validation, /isSafeLinkTarget/);
  assert.match(validation, /Дублируется id страницы/);
});

test('complete builder exposes site theme, business data, SEO and stable element contracts', async () => {
  const [siteConfig, blockConfig, linkModel, headerModel, offerModel, store, siteConfigCodec] =
    await Promise.all([
      source('src/app/features/builder/domain/models/site-config.model.ts'),
      source('src/app/features/builder/domain/models/block-config.model.ts'),
      source('src/app/features/builder/domain/models/link-config.model.ts'),
      source('src/app/features/builder/domain/models/site-header-block-config.model.ts'),
      source('src/app/features/builder/domain/models/offer-list-block-config.model.ts'),
      source('src/app/features/builder/stores/builder.store.ts'),
      source('src/app/features/builder/data-access/site-config.codec.ts'),
    ]);

  assert.match(siteConfig, /theme: SiteThemeConfig/);
  assert.match(siteConfig, /business: SiteBusinessConfig/);
  assert.match(siteConfig, /seo: SiteSeoConfig/);
  assert.match(blockConfig, /appearance\?: BlockAppearanceOverrides/);
  assert.match(blockConfig, /hidden: boolean/);
  assert.match(linkModel, /id: string/);
  assert.match(linkModel, /openInNewTab: boolean/);
  assert.match(headerModel, /navigationItems: readonly LinkConfig\[\]/);
  assert.match(offerModel, /readonly id: string/);
  assert.match(store, /updateSiteTheme/);
  assert.match(store, /updateSiteBusiness/);
  assert.match(store, /updateSiteSeo/);
  assert.match(store, /updateBlockAppearance/);
  assert.match(store, /updateBlockAnchor/);
  assert.match(store, /toggleBlockVisibility/);
  assert.match(store, /undo\(\)/);
  assert.match(store, /redo\(\)/);
  assert.match(store, /updateHeaderNavigationItem/);
  assert.match(store, /duplicateOfferListItem/);
  assert.match(store, /moveOfferListItem/);
  assert.match(siteConfigCodec, /DEFAULT_SITE_THEME/);
  assert.match(siteConfigCodec, /readFocalPoint/);
});

test('existing preview blocks render functional content and accessible interactions', async () => {
  const [headerTs, headerHtml, heroTs, heroHtml, offers, formTs, formHtml, footer] =
    await Promise.all([
      source('src/app/features/preview/ui/site-header-block/site-header-block.component.ts'),
      source('src/app/features/preview/ui/site-header-block/site-header-block.component.html'),
      source('src/app/features/preview/ui/hero-block/hero-block.component.ts'),
      source('src/app/features/preview/ui/hero-block/hero-block.component.html'),
      source('src/app/features/preview/ui/offer-list-block/offer-list-block.component.html'),
      source('src/app/features/preview/ui/lead-form-block/lead-form-block.component.ts'),
      source('src/app/features/preview/ui/lead-form-block/lead-form-block.component.html'),
      source('src/app/features/preview/ui/site-footer-block/site-footer-block.component.html'),
    ]);

  assert.match(headerTs, /menuOpen = signal/);
  assert.match(headerTs, /document:keydown\.escape/);
  assert.match(headerHtml, /aria-expanded/);
  assert.match(headerHtml, /aria-controls/);
  assert.match(headerHtml, /\(click\)="toggleMenu\(\)"/);
  assert.match(headerHtml, /noopener noreferrer/);
  assert.match(headerHtml, /type="date"/);
  assert.match(headerHtml, /booking\.partySizeLabel/);

  assert.match(heroTs, /layoutVariant/);
  assert.match(heroHtml, /hero-block--cover/);
  assert.match(heroHtml, /object-position/);

  assert.match(offers, /track item\.id/);
  assert.match(offers, /item\.image/);
  assert.match(offers, /item\.price/);
  assert.match(offers, /item\.cta/);
  assert.match(offers, /noopener noreferrer/);

  assert.match(formTs, /reportValidity\(\)/);
  assert.match(formHtml, /novalidate/);
  assert.match(formHtml, /aria-live="polite"/);

  assert.match(footer, /block\(\)\.socialLinks/);
  assert.match(footer, /block\(\)\.map/);
  assert.match(footer, /noopener noreferrer/);
});

test('rendered output contracts require real interactive recipes instead of placeholders', async () => {
  const [header, hero, offers, footer, form, renderer, builder] = await Promise.all([
    source('src/app/features/preview/ui/site-header-block/site-header-block.component.html'),
    source('src/app/features/preview/ui/hero-block/hero-block.component.html'),
    source('src/app/features/preview/ui/offer-list-block/offer-list-block.component.html'),
    source('src/app/features/preview/ui/site-footer-block/site-footer-block.component.html'),
    source('src/app/features/preview/ui/lead-form-block/lead-form-block.component.html'),
    source('src/app/features/preview/ui/block-renderer/block-renderer.component.html'),
    source('src/app/features/builder/pages/builder-page/builder-page.component.html'),
  ]);

  assert.match(header, /aria-expanded/);
  assert.match(header, /aria-controls/);
  assert.match(header, /menuOpen\(\)/);
  assert.match(hero, /hero-block--cover/);
  assert.match(hero, /object-position/);
  assert.match(offers, /offer-list--pricing/);
  assert.match(footer, /socialLinks/);
  assert.match(form, /aria-live/);
  assert.match(renderer, /case \('contentMedia'\)/);
  assert.match(renderer, /case \('featureGrid'\)/);
  assert.match(renderer, /case \('gallery'\)/);
  assert.match(renderer, /case \('testimonials'\)/);
  assert.match(renderer, /case \('faq'\)/);
  assert.match(renderer, /case \('callToAction'\)/);
  assert.match(builder, /Добавить/);
  assert.match(builder, /Слои/);
  assert.match(builder, /Тема/);
  assert.match(builder, /app-block-inspector/);
  assert.match(builder, /undo\(\)/);
  assert.match(builder, /redo\(\)/);
});

test('builder guards media removal and waits for confirmed lead persistence', async () => {
  const [mediaInput, inspector, leadForm, renderer, publicPreview, builderStyles] =
    await Promise.all([
      source('src/app/features/builder/ui/media-input/media-input.component.ts'),
      source('src/app/features/builder/ui/block-inspector/block-inspector.component.ts'),
      source('src/app/features/preview/ui/lead-form-block/lead-form-block.component.ts'),
      source('src/app/features/preview/ui/block-renderer/block-renderer.component.ts'),
      source('src/app/features/preview/pages/public-preview-page/public-preview-page.component.ts'),
      source('src/app/features/builder/pages/builder-page/builder-page.component.scss'),
    ]);

  assert.match(mediaInput, /readonly required = input\(false\)/);
  assert.match(inspector, /value === '' && field === 'src' \? null/);
  assert.match(leadForm, /complete: \(saved: boolean\) => void/);
  assert.match(leadForm, /status\.set\('submitting'\)/);
  assert.match(renderer, /event\.complete\(false\)/);
  assert.match(publicPreview, /event\.complete\(true\)/);
  assert.match(publicPreview, /event\.complete\(false\)/);
  assert.match(builderStyles, /container: builder-workspace \/ inline-size/);
  assert.match(builderStyles, /@container builder-workspace \(max-width: 860px\)/);
});

test('new landing blocks expose structured content, stable ids and real layout recipes', async () => {
  const [contentMedia, features, gallery, testimonials, faq, cta] = await Promise.all([
    source('src/app/features/builder/domain/models/content-media-block-config.model.ts'),
    source('src/app/features/builder/domain/models/feature-grid-block-config.model.ts'),
    source('src/app/features/builder/domain/models/gallery-block-config.model.ts'),
    source('src/app/features/builder/domain/models/testimonials-block-config.model.ts'),
    source('src/app/features/builder/domain/models/faq-block-config.model.ts'),
    source('src/app/features/builder/domain/models/call-to-action-block-config.model.ts'),
  ]);

  assert.match(contentMedia, /'textOnly' \| 'mediaLeft' \| 'mediaRight'/);
  assert.match(contentMedia, /media\?: MediaAsset/);
  assert.match(contentMedia, /cta\?: LinkConfig/);
  assert.match(features, /readonly id: string/);
  assert.match(features, /'cards' \| 'editorialList' \| 'numberedSteps'/);
  assert.match(features, /link\?: LinkConfig/);
  assert.match(gallery, /readonly id: string/);
  assert.match(gallery, /lightboxEnabled: boolean/);
  assert.match(gallery, /'uniformGrid' \| 'collage' \| 'strip'/);
  assert.match(testimonials, /readonly id: string/);
  assert.match(testimonials, /rating: number/);
  assert.match(testimonials, /'cards' \| 'featuredQuote' \| 'compactList'/);
  assert.match(faq, /readonly id: string/);
  assert.match(faq, /initiallyOpen: boolean/);
  assert.match(faq, /allowMultipleOpen: boolean/);
  assert.match(faq, /'borderedAccordion' \| 'separatedList' \| 'twoColumns'/);
  assert.match(cta, /primaryAction: LinkConfig/);
  assert.match(cta, /secondaryAction\?: LinkConfig/);
  assert.match(cta, /'banner' \| 'split' \| 'cover'/);
});

test('block renderer applies the site theme, skips hidden blocks and keeps interactions accessible', async () => {
  const [
    rendererTs,
    rendererHtml,
    rendererScss,
    publicPreview,
    wizardPreview,
    faq,
    gallery,
    galleryTs,
    scrollLock,
    createPage,
  ] = await Promise.all([
    source('src/app/features/preview/ui/block-renderer/block-renderer.component.ts'),
    source('src/app/features/preview/ui/block-renderer/block-renderer.component.html'),
    source('src/app/features/preview/ui/block-renderer/block-renderer.component.scss'),
    source('src/app/features/preview/pages/public-preview-page/public-preview-page.component.html'),
    source(
      'src/app/features/builder/pages/create-landing-page/landing-wizard-preview/landing-wizard-preview.component.html',
    ),
    source('src/app/features/preview/ui/faq-block/faq-block.component.html'),
    source('src/app/features/preview/ui/gallery-block/gallery-block.component.html'),
    source('src/app/features/preview/ui/gallery-block/gallery-block.component.ts'),
    source('src/app/shared/utils/document-scroll-lock.ts'),
    source('src/app/features/builder/pages/create-landing-page/create-landing-page.component.ts'),
  ]);

  assert.match(rendererTs, /theme = input<SiteThemeConfig>\(DEFAULT_SITE_THEME\)/);
  assert.match(rendererHtml, /@if \(!block\.hidden\)/);
  assert.match(rendererHtml, /--site-page-background/);
  assert.match(rendererHtml, /--site-accent/);
  assert.match(rendererHtml, /--site-content-width/);
  assert.match(rendererHtml, /--landing-accent/);
  assert.match(rendererHtml, /--block-font/);
  assert.match(rendererScss, /var\(--site-page-background\)/);
  assert.match(publicPreview, /\[theme\]="publishedRelease\.siteConfig\.theme"/);
  assert.match(wizardPreview, /\[theme\]="siteConfig\(\)\.theme"/);
  assert.match(faq, /aria-expanded/);
  assert.match(faq, /aria-controls/);
  assert.match(gallery, /role="dialog"/);
  assert.match(gallery, /aria-modal="true"/);
  assert.match(galleryTs, /lockDocumentScroll/);
  assert.match(galleryTs, /keepFocusInsideDialog/);
  assert.match(createPage, /lockDocumentScroll/);
  assert.match(createPage, /A11yModule/);
  assert.match(createPage, /previewTrigger/);
  assert.match(scrollLock, /root\.style\.overflow = 'hidden'/);
  assert.match(scrollLock, /body\.style\.overflow = 'hidden'/);
  assert.match(scrollLock, /activeLocks = new WeakMap/);
  assert.match(scrollLock, /lockState\.count -= 1/);
});

test('generated footer maps use a real editable search target', async () => {
  const [registry, factory, store] = await Promise.all([
    source('src/app/features/builder/domain/registry/block-registry.ts'),
    source('src/app/features/builder/data-access/landing-draft.factory.ts'),
    source('src/app/features/builder/stores/builder.store.ts'),
  ]);

  assert.match(registry, /createMapSearchUrl/);
  assert.match(registry, /openstreetmap\.org\/search/);
  assert.match(factory, /createMapSearchUrl\(business\.address\)/);
  assert.match(factory, /NAVIGATION_TARGETS\[selection\.industry\]/);
  assert.match(store, /createMapSearchUrl\(address\)/);
  assert.doesNotMatch(`${registry}\n${factory}`, /maps\.example\.com/);
});

test('published pages apply SEO and insights cover every registered block', async () => {
  const [publicPage, insights] = await Promise.all([
    source('src/app/features/preview/pages/public-preview-page/public-preview-page.component.ts'),
    source('src/app/features/workspace/data-access/project-insights.service.ts'),
  ]);

  assert.match(publicPage, /applySeo/);
  assert.match(publicPage, /root\.lang = siteSeo\.language/);
  assert.match(publicPage, /this\.title\.setTitle\(pageSeo\.title\)/);
  assert.match(publicPage, /pageSeo\.noIndex/);
  assert.match(publicPage, /name: 'robots'/);
  assert.match(publicPage, /name: 'description'/);
  assert.match(publicPage, /updateOptionalMeta\('og:image'/);
  assert.match(insights, /BLOCK_PALETTE\.map/);
  assert.match(insights, /project\.draft\.pages\[0\]\?\.slug \?\? 'home'/);
  assert.doesNotMatch(insights, /const BLOCK_TYPE_META: readonly BlockTypeMeta\[\] = \[/);
});

test('local Material Icons font remains deployable from a GitHub Pages subpath', async () => {
  const globalStyles = await source('src/styles.scss');

  assert.match(globalStyles, /url\(['"]\.\.\/public\/fonts\/material-icons\.woff2['"]\)/);
  assert.doesNotMatch(globalStyles, /url\(['"]\/fonts\/material-icons\.woff2['"]\)/);
});

test('built-in landing images are bundled for GitHub Pages instead of hotlinked', async () => {
  const builtInMediaSources = await Promise.all(
    [
      'src/app/features/builder/data-access/default-site.config.ts',
      'src/app/features/builder/data-access/landing-draft.factory.ts',
      'src/app/features/builder/domain/registry/block-registry.ts',
      'src/app/features/builder/stores/builder.store.ts',
    ].map(source),
  );
  const combinedSources = builtInMediaSources.join('\n');
  const bundledImagePaths = [
    ...combinedSources.matchAll(/['"]((?:\.\/)?images\/landing\/[^'"]+\.webp)['"]/g),
  ].map((match) => match[1].replace(/^\.\//u, ''));

  assert.doesNotMatch(combinedSources, /https:\/\/images\.unsplash\.com/u);
  assert.ok(bundledImagePaths.length >= 18);

  for (const imagePath of new Set(bundledImagePaths)) {
    const image = await readFile(new URL(`../public/${imagePath}`, import.meta.url));

    assert.ok(image.byteLength > 0, `${imagePath} must not be empty`);
  }
});

test('landing creation surfaces repository and validation errors in the wizard', async () => {
  const [component, template] = await Promise.all([
    source('src/app/features/builder/pages/create-landing-page/create-landing-page.component.ts'),
    source('src/app/features/builder/pages/create-landing-page/create-landing-page.component.html'),
  ]);

  assert.match(component, /readonly projectError = this\.builderStore\.projectError/u);
  assert.match(template, /@if \(projectError\(\); as error\)/u);
  assert.match(template, /role="alert"/u);
});

test('builder teardown stops debounce before flushing the pending edit', async () => {
  const builderPage = await source(
    'src/app/features/builder/pages/builder-page/builder-page.component.ts',
  );

  assert.match(
    builderPage,
    /ngOnDestroy\(\): void \{[\s\S]*this\.autosave\.stop\(\);[\s\S]*void this\.autosave\.flushPending\(\);[\s\S]*\}/u,
  );
});

test('landing fragment links keep the current published route', async () => {
  const directive = await source(
    'src/app/features/preview/ui/landing-link/landing-link.directive.ts',
  );
  const { resolveLandingHref } = await importTypeScriptModule(
    'src/app/features/builder/domain/utils/link-target.ts',
  );
  const linkedTemplates = await Promise.all(
    [
      'site-header-block',
      'hero-block',
      'content-media-block',
      'feature-grid-block',
      'offer-list-block',
      'call-to-action-block',
      'site-footer-block',
    ].map((name) => source(`src/app/features/preview/ui/${name}/${name}.component.html`)),
  );

  assert.equal(
    resolveLandingHref('#offers', '/p/project-1', '?preview=1', '/'),
    '/p/project-1?preview=1#offers',
  );
  assert.equal(
    resolveLandingHref('#offers', '/Nexus.UI/p/project-1', '', '/Nexus.UI/'),
    '/Nexus.UI/p/project-1#offers',
  );
  assert.equal(
    resolveLandingHref('/pricing', '/Nexus.UI/p/project-1', '', '/Nexus.UI/'),
    '/Nexus.UI/p/project-1/pricing',
  );
  assert.equal(
    resolveLandingHref('https://example.com', '/Nexus.UI/p/project-1', '', '/Nexus.UI/'),
    'https://example.com',
  );
  assert.equal(
    resolveLandingHref('//evil.example', '/Nexus.UI/p/project-1', '', '/Nexus.UI/'),
    '/Nexus.UI/p/project-1#',
  );
  assert.equal(
    resolveLandingHref('javascript:alert(1)', '/Nexus.UI/p/project-1', '', '/Nexus.UI/'),
    '/Nexus.UI/p/project-1#',
  );
  assert.match(directive, /get resolvedHref\(\)/);
  assert.doesNotMatch(directive, /computed\(/);
  linkedTemplates.forEach((template) => assert.match(template, /\[appLandingLink\]=/));
});

test('public landing controls use compact icon buttons and structured booking fields', async () => {
  const header = await source(
    'src/app/features/preview/ui/site-header-block/site-header-block.component.html',
  );
  const headerStyles = await source(
    'src/app/features/preview/ui/site-header-block/site-header-block.component.scss',
  );
  const gallery = await source(
    'src/app/features/preview/ui/gallery-block/gallery-block.component.html',
  );
  const leadForm = await source(
    'src/app/features/preview/ui/lead-form-block/lead-form-block.component.ts',
  );

  assert.match(header, /site-header__booking-field/);
  assert.match(header, /role="group"/);
  assert.match(header, /\(click\)="captureBooking\(\$event\)"/);
  assert.match(header, /\[attr\.aria-disabled\]="!bookingDate\(\)"/);
  assert.match(header, /type="date"[\s\S]*required/u);
  assert.match(header, /material-icons site-header__burger-icon/);
  assert.match(headerStyles, /grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\) auto/);
  assert.match(headerStyles, /site-header--burger\.site-header--menu-open \.site-header__cta/u);
  assert.match(gallery, /material-icons gallery-dialog__control-icon/);
  assert.doesNotMatch(gallery, />\s*[‹›×]\s*</u);
  assert.match(leadForm, /bookingDate/);
  assert.match(leadForm, /bookingPartySize/);
});

test('workspace chrome uses one font system and container-aware topbar controls', async () => {
  const globalStyles = await source('src/styles.scss');
  const builderStyles = await source(
    'src/app/features/builder/pages/builder-page/builder-page.component.scss',
  );

  assert.match(globalStyles, /\$nexus-ui-font:/);
  assert.match(globalStyles, /plain-family: \$nexus-ui-font/);
  assert.match(globalStyles, /brand-family: \$nexus-ui-font/);
  assert.doesNotMatch(globalStyles, /typography: Roboto/);
  assert.match(builderStyles, /@container builder-workspace \(max-width: 1400px\)/);
  assert.match(builderStyles, /\.builder-page__action-button/);
});
