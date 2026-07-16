# Complete Landing Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Nexus from a five-section demo into a complete, customizable eleven-section landing-page builder with functional output.

**Architecture:** Add a site theme and block appearance layer, keep all persistent changes in the Signals store, and extend the exhaustive registry/renderer/persistence pipeline for every block. Extract selected-block editing from the builder page into focused inspector components while keeping published preview components Material-free.

**Tech Stack:** Angular 20 standalone components, Signals, Angular Material/CDK, SCSS, strict TypeScript, Node test runner, browser File/Canvas APIs, Playwright verification.

---

### Task 1: Define Complete-Builder Contracts In RED Tests

**Files:**

- Modify: `tests/unit.test.mjs`
- Modify: `tests/e2e-smoke.test.mjs`

- [ ] **Step 1: Extend the registry completeness contract**

Require these exact block types:

```js
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
```

For each type, assert registry metadata, default creation, cloning, persistence normalization, validation switch coverage, renderer switch coverage, and inspector switch coverage.

- [ ] **Step 2: Add theme, appearance, and repeated-element contracts**

Assert that `SiteConfig` includes `theme`, `BlockConfig` includes `appearance`, repeated items include `id`, the store exposes generic move/duplicate/remove paths for each repeated collection, and `resolveBlockAppearance` exists.

- [ ] **Step 3: Add functional output contracts**

Assert burger expanded/control bindings, FAQ expanded/control bindings, gallery dialog semantics, real form field rendering, individual navigation label/target inputs, block variant selectors, and media URL/file controls.

- [ ] **Step 4: Run tests and verify RED**

Run: `npm test && npm run e2e`

Expected: both commands fail because the new block types, contracts, renderers, and editors do not exist.

### Task 2: Build Theme, Appearance, Registry, Migration, And Collection Foundation

**Files:**

- Create: `src/app/features/builder/domain/models/site-theme.model.ts`
- Create: `src/app/features/builder/domain/models/block-appearance.model.ts`
- Create: `src/app/features/builder/domain/models/site-seo.model.ts`
- Create: `src/app/features/builder/domain/models/site-business.model.ts`
- Create: `src/app/features/builder/domain/utils/collection-update.ts`
- Modify: `src/app/features/builder/domain/models/site-config.model.ts`
- Modify: `src/app/features/builder/domain/models/block-config.model.ts`
- Modify: `src/app/features/builder/domain/models/index.ts`
- Modify: `src/app/features/builder/domain/registry/block-registry.ts` for existing-block defaults only; new block registrations are Task 4
- Modify: `src/app/features/builder/data-access/default-site.config.ts`
- Modify: `src/app/features/builder/data-access/landing-draft.factory.ts`
- Modify: `src/app/features/builder/data-access/project-persistence.service.ts`
- Modify: `src/app/features/builder/domain/utils/site-config-validation.ts`
- Modify: `src/app/features/builder/stores/builder.store.ts`

- [ ] **Step 1: Add theme and appearance types**

Implement strict contracts:

```ts
export type ContentWidth = 'narrow' | 'wide' | 'full';
export type SectionSpacing = 'compact' | 'balanced' | 'spacious';
export type ButtonShape = 'square' | 'rounded' | 'pill';

export interface SiteThemeConfig {
  readonly pageBackground: string;
  readonly surfaceColor: string;
  readonly textColor: string;
  readonly mutedTextColor: string;
  readonly accentColor: string;
  readonly fontPairing: LandingFontPairing;
  readonly typeScale: 'compact' | 'balanced' | 'display';
  readonly contentWidth: ContentWidth;
  readonly sectionSpacing: SectionSpacing;
  readonly buttonShape: ButtonShape;
  readonly radius: number;
}

export interface BlockAppearanceOverrides {
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly accentColor?: string;
  readonly contentWidth?: ContentWidth;
  readonly spacing?: SectionSpacing;
  readonly radius?: number;
}
```

Add `DEFAULT_SITE_THEME`, `DEFAULT_BLOCK_APPEARANCE`, and `resolveBlockAppearance(theme, overrides)` with radius clamped to `0..32`.

- [ ] **Step 2: Add stable collection helpers**

Implement immutable `moveCollectionItem`, `duplicateCollectionItem`, and `removeCollectionItem`. Invalid indices return the original array reference; successful edits return a new array; remove can enforce `minimumItems`.

- [ ] **Step 3: Add site/store theme mutations**

Add `updateSiteTheme(update)` and `updateBlockAppearance(blockId, update)`. Theme updates must not overwrite existing block overrides. Add store wrappers that use collection helpers for repeated navigation, offer, form, footer, and later new-block items.

Add `updateSiteBusiness(update)` and `updateSiteSeo(update)`. Shared business fields are the default source for header/footer identity and contact content; an explicit block value remains a local override. Form fields remain visitor inputs and do not inherit business contacts. Extend `LinkConfig` with stable `id` and `openInNewTab`, preserving old links during normalization.

Add block visibility and anchor mutations. Implement bounded undo/redo snapshots for persistent `SiteConfig` mutations; loading/saving establishes a clean history baseline and preview-only signals never create snapshots.

- [ ] **Step 4: Upgrade persistence safely**

Increase `SITE_CONFIG_SCHEMA_VERSION` to `2`. `normalizeSiteConfig` supplies `DEFAULT_SITE_THEME` and default SEO metadata; every known block receives appearance defaults and stable repeated ids. Preserve schema-version-1 projects, sanitize hrefs, clamp numeric style values, reject arbitrary image `data:` URLs, and accept only validated JPEG/PNG/WebP data URLs produced by the media input.

- [ ] **Step 5: Run RED/GREEN foundation checks**

Run: `npm test`

Expected: theme/appearance contracts pass; missing-block contracts remain red until Task 4.

### Task 3: Complete Existing Header, Hero, Offers, Form, And Footer

**Files:**

- Modify: `src/app/features/builder/domain/models/site-header-block-config.model.ts`
- Modify: `src/app/features/builder/domain/models/hero-block-config.model.ts`
- Modify: `src/app/features/builder/domain/models/offer-list-block-config.model.ts`
- Modify: `src/app/features/builder/domain/models/lead-form-block-config.model.ts`
- Modify: `src/app/features/builder/domain/models/site-footer-block-config.model.ts`
- Modify: `src/app/features/builder/domain/registry/block-registry.ts`
- Modify: `src/app/features/preview/ui/site-header-block/site-header-block.component.ts`
- Modify: `src/app/features/preview/ui/site-header-block/site-header-block.component.html`
- Modify: `src/app/features/preview/ui/site-header-block/site-header-block.component.scss`
- Modify: `src/app/features/preview/ui/hero-block/hero-block.component.ts`
- Modify: `src/app/features/preview/ui/hero-block/hero-block.component.html`
- Modify: `src/app/features/preview/ui/hero-block/hero-block.component.scss`
- Modify: `src/app/features/preview/ui/offer-list-block/offer-list-block.component.ts`
- Modify: `src/app/features/preview/ui/offer-list-block/offer-list-block.component.html`
- Modify: `src/app/features/preview/ui/offer-list-block/offer-list-block.component.scss`
- Modify: `src/app/features/preview/ui/lead-form-block/lead-form-block.component.ts`
- Modify: `src/app/features/preview/ui/lead-form-block/lead-form-block.component.html`
- Modify: `src/app/features/preview/ui/lead-form-block/lead-form-block.component.scss`
- Modify: `src/app/features/preview/ui/site-footer-block/site-footer-block.component.ts`
- Modify: `src/app/features/preview/ui/site-footer-block/site-footer-block.component.html`
- Modify: `src/app/features/preview/ui/site-footer-block/site-footer-block.component.scss`

- [ ] **Step 1: Make header navigation and burger functional**

Add stable navigation ids, optional logo media, sticky setting, and burger presentation. Use a local signal for open state; implement trigger/backdrop/Escape/link close paths with expanded/control attributes and focus restoration. Inline variants render actual individually configured links.

- [ ] **Step 2: Add four real hero recipes**

Implement `split`, `centered`, `cover`, and `minimal` with distinct modifier classes and responsive composition. Support eyebrow, two CTAs, media focal point/side/radius, overlay opacity, and all theme/appearance tokens.

- [ ] **Step 3: Differentiate offer recipes and item actions**

Menu becomes price-led rows, rooms image-led cards, pricing comparison columns, and catalog stable product tiles. All items retain image, copy, meta, price, badge, and CTA; add/duplicate/move/remove preserve ids.

- [ ] **Step 4: Finish form behavior**

Support text, email, phone, textarea, and select fields; editable options for select; required validation; consent label/link; stacked/compact/split layouts; retained values on validation failure; success state only after submission output succeeds.

- [ ] **Step 5: Finish footer content**

Model link groups and individual social/contact links rather than flattened strings. Implement compact, columns, contact/map, and conversion layouts. Render configured links and map target; do not show inert map chrome.

- [ ] **Step 6: Run focused quality checks**

Run: `npm test && npm run lint && npm run build`

Expected: all existing-block contracts pass; no TypeScript or lint errors.

### Task 4: Add Six Missing Production Blocks

**Files:**

- Create: `src/app/features/builder/domain/models/feature-grid-block-config.model.ts`
- Create: `src/app/features/builder/domain/models/gallery-block-config.model.ts`
- Create: `src/app/features/builder/domain/models/testimonials-block-config.model.ts`
- Create: `src/app/features/builder/domain/models/faq-block-config.model.ts`
- Create: `src/app/features/builder/domain/models/call-to-action-block-config.model.ts`
- Create: `src/app/features/preview/ui/feature-grid-block/feature-grid-block.component.ts`
- Create: `src/app/features/preview/ui/feature-grid-block/feature-grid-block.component.html`
- Create: `src/app/features/preview/ui/feature-grid-block/feature-grid-block.component.scss`
- Create: `src/app/features/preview/ui/gallery-block/gallery-block.component.ts`
- Create: `src/app/features/preview/ui/gallery-block/gallery-block.component.html`
- Create: `src/app/features/preview/ui/gallery-block/gallery-block.component.scss`
- Create: `src/app/features/preview/ui/testimonials-block/testimonials-block.component.ts`
- Create: `src/app/features/preview/ui/testimonials-block/testimonials-block.component.html`
- Create: `src/app/features/preview/ui/testimonials-block/testimonials-block.component.scss`
- Create: `src/app/features/preview/ui/faq-block/faq-block.component.ts`
- Create: `src/app/features/preview/ui/faq-block/faq-block.component.html`
- Create: `src/app/features/preview/ui/faq-block/faq-block.component.scss`
- Create: `src/app/features/preview/ui/call-to-action-block/call-to-action-block.component.ts`
- Create: `src/app/features/preview/ui/call-to-action-block/call-to-action-block.component.html`
- Create: `src/app/features/preview/ui/call-to-action-block/call-to-action-block.component.scss`
- Modify: `src/app/features/builder/domain/models/index.ts`
- Modify: `src/app/features/builder/domain/models/block-type.model.ts`
- Modify: `src/app/features/builder/domain/models/page-config.model.ts`
- Modify: `src/app/features/builder/domain/registry/block-registry.ts`
- Modify: `src/app/features/builder/data-access/project-persistence.service.ts`
- Modify: `src/app/features/builder/domain/utils/site-config-validation.ts`
- Modify: `src/app/features/builder/stores/builder.store.ts`
- Modify: `src/app/features/preview/ui/block-renderer/block-renderer.component.ts`
- Modify: `src/app/features/preview/ui/block-renderer/block-renderer.component.html`

- [ ] **Step 1: Add content + media end-to-end**

Model eyebrow/title/body, optional CTA, optional media, focal point, and text-only/media-left/media-right recipes. Add defaults, clone, normalize, validate, store edits, renderer, and inspector contract.

- [ ] **Step 2: Add feature grid end-to-end**

Model section eyebrow/title/description and stable items with icon, optional image, title, description, and optional link. Add cards/list/steps recipes, defaults, clone, normalize, validate, store edits, and renderer.

- [ ] **Step 3: Add gallery end-to-end**

Model stable media items with image/alt/caption. Add grid/collage/strip recipes and optional lightbox. Lightbox uses dialog semantics, Escape/close/backdrop paths, previous/next controls, and focus restoration.

- [ ] **Step 4: Add testimonials end-to-end**

Model stable quote items with quote, author, role, avatar, and rating `1..5`. Add cards/featured/list recipes. No carousel controls are rendered because carousel state is not part of v1.

- [ ] **Step 5: Add FAQ end-to-end**

Model stable question/answer items and single/multiple-open behavior. Add accordion/list/two-column recipes. Use native buttons with expanded/control attributes and keyboard-accessible disclosure state.

- [ ] **Step 6: Add CTA end-to-end**

Model eyebrow/title/text, two links, optional media, and banner/split/cover recipes. Reuse media focal point and resolved appearance tokens.

- [ ] **Step 7: Run complete registry tests**

Run: `npm test && npm run e2e && npm run lint && npm run build`

Expected: all eleven types are complete across union, registry, defaults, clone, persistence, validation, renderer, and source contracts.

### Task 5: Extract And Redesign The Builder Inspector

**Files:**

- Create: `src/app/features/builder/ui/block-inspector/block-inspector.component.ts`
- Create: `src/app/features/builder/ui/block-inspector/block-inspector.component.html`
- Create: `src/app/features/builder/ui/block-inspector/block-inspector.component.scss`
- Create: `src/app/features/builder/ui/block-inspector/block-item-actions.component.ts`
- Create: `src/app/features/builder/ui/block-inspector/block-item-actions.component.html`
- Create: `src/app/features/builder/ui/block-inspector/block-item-actions.component.scss`
- Create: `src/app/features/builder/ui/media-input/media-input.component.ts`
- Create: `src/app/features/builder/ui/media-input/media-input.component.html`
- Create: `src/app/features/builder/ui/media-input/media-input.component.scss`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.html`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.scss`
- Modify: `src/app/features/builder/pages/create-landing-page/create-landing-page.component.ts`
- Modify: `src/app/features/builder/data-access/landing-draft.factory.ts`

- [ ] **Step 1: Move selected-block editing out of the page**

`BuilderPageComponent` retains page/canvas/save/publish orchestration. `BlockInspectorComponent` accepts the selected block and exposes `content`, `layout`, and `style` tabs. It injects `BuilderStore` for typed edits and exhaustively switches over block type.

- [ ] **Step 2: Implement progressive disclosure**

Repeated items render as compact native `details` editors. `BlockItemActionsComponent` provides move up/down, duplicate, and remove icon actions with accessible labels and boundary disabled states. Only selected-block fields are present in the DOM.

- [ ] **Step 3: Rebuild sidebar information architecture**

Add `Добавить / Слои / Тема` segmented views. Group palette entries from registry metadata into `Основа`, `Контент`, `Доверие`, and `Конверсия`. Theme controls edit `SiteThemeConfig`; layers retain block selection and drag/drop.

Add undo/redo icon commands, block visibility, editable anchors, and an anchor picker for internal links. The picker lists current visible block anchors and retains explicit safe external URL mode.

- [ ] **Step 4: Add real variant tiles and relevant controls**

Layout recipes display icon, title, and description in stable two-column tiles. Content fields edit each structured element. Style shows theme values plus block overrides and a `Сбросить настройки блока` command.

- [ ] **Step 5: Keep mobile panels independent**

At `max-width: 820px`, only the active `Блоки`, `Холст`, or `Настройки` view is displayed. The top switch remains sticky without covering canvas. Each panel width is bounded to the viewport and has no nested horizontal scroll.

- [ ] **Step 6: Generate complete industry recipes**

Restaurant, hotel, beauty/service, product, and education wizard results create coherent full-page block sequences with niche copy, media, anchors, and shared business settings. The recipes use only registered defaults and remain editable after creation.

- [ ] **Step 7: Run builder checks**

Run: `npm test && npm run e2e && npm run lint && npm run build`

Expected: inspector contracts and all compile/lint checks pass.

### Task 6: Implement Safe Local Media Upload

**Files:**

- Create: `src/app/features/builder/ui/media-input/image-resize.service.ts`
- Modify: `src/app/features/builder/ui/media-input/media-input.component.ts`
- Modify: `src/app/features/builder/data-access/project-persistence.service.ts`
- Modify: `src/app/features/builder/domain/utils/site-config-validation.ts`

- [ ] **Step 1: Validate selected files before reading**

Accept only `image/jpeg`, `image/png`, and `image/webp`; reject files over 8 MB with a field error. Do not mutate the block on failure.

- [ ] **Step 2: Resize and encode locally**

Decode with browser `Image`, fit within `1600x1600`, draw to canvas, and encode WebP at `0.82` quality with JPEG fallback. Return a data URL plus intrinsic dimensions. Revoke temporary object URLs in `finally`.

- [ ] **Step 3: Persist only generated image data URLs**

Validation accepts `data:image/webp;base64`, `data:image/jpeg;base64`, and `data:image/png;base64` and rejects SVG/HTML/other data payloads. URL mode continues to use the existing safe URL path.

- [ ] **Step 4: Run focused and full checks**

Run: `npm test && npm run lint && npm run build`

Expected: media contracts, lint, and production build pass.

### Task 7: Full Browser Acceptance, Reviews, And Documentation

**Files:**

- Modify: `README.md`
- Modify: `tests/e2e-smoke.test.mjs`
- Modify after a failed browser acceptance check: the exact source file responsible for that failure

- [ ] **Step 1: Start the app**

Run: `npm start -- --port 3000`

Expected: Angular reports a successful local URL. Use 3001 only if 3000 is occupied.

- [ ] **Step 2: Verify complete landing creation in Playwright**

At desktop and 390x844, create or open a project; add all eleven blocks; switch every recipe; edit text, links, images, prices, ratings, FAQ, form fields, and footer links; exercise duplicate/move/remove; change global theme and one block override; exercise undo/redo, visibility, and anchors; save and demo-publish.

- [ ] **Step 3: Verify published interactions**

Check burger trigger/backdrop/Escape/link close, FAQ disclosure, gallery lightbox keyboard/close paths, anchors and external links, required form validation and successful lead submission. Assert `document.body.scrollWidth === window.innerWidth` on builder and public preview at 390 px.

- [ ] **Step 4: Run specialized reviews**

Delegate architecture, UX, accessibility/security, and final code review. Fix every Critical and Important finding, then rerun the affected acceptance scenario.

- [ ] **Step 5: Update README capability and architecture sections**

Document eleven block types, theme/override inheritance, structured item editing, SEO/readiness checks, local media limits, demo-publish boundaries, and commands used for verification.

- [ ] **Step 6: Run the final quality gate**

```bash
npm run format:check
npm test
npm run e2e
npm run lint
npm run build
```

Expected: every command exits 0; Node reports zero failed tests; Angular reports a successful production build.

- Create: `src/app/features/builder/domain/models/content-media-block-config.model.ts`
- Create: `src/app/features/preview/ui/content-media-block/content-media-block.component.ts`
- Create: `src/app/features/preview/ui/content-media-block/content-media-block.component.html`
- Create: `src/app/features/preview/ui/content-media-block/content-media-block.component.scss`
