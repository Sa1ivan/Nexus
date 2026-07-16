# Complete Landing Builder Design

## Product Goal

Nexus must let a user assemble, customize, preview, save, and demo-publish a complete one-page website without encountering decorative placeholders. A control is only offered when it changes rendered content, layout, style, or behavior. Every repeated content element can be edited, added, removed, duplicated, and reordered where those actions make sense.

The burger menu is one acceptance example, not the center of the product: selecting it must create a working menu, just as selecting FAQ must create working disclosure panels and selecting a form must create real editable fields.

## Scope Of The Complete V1

The block library contains eleven sections sufficient for restaurant, hotel, beauty/service, product, and education landing pages:

| Block           | Editable content                                             | Layout recipes                                  | Functional behavior                                       |
| --------------- | ------------------------------------------------------------ | ----------------------------------------------- | --------------------------------------------------------- |
| Header          | brand/logo, navigation items, CTA, booking labels            | inline, centered, stretched, burger, booking    | anchors, external links, responsive drawer, sticky option |
| Hero            | eyebrow, title, text, two CTAs, image and alt                | split, centered, cover, minimal                 | links, focal point, overlay                               |
| Content + media | eyebrow, title, body, CTA, image and alt                     | text only, media left, media right              | links and focal point                                     |
| Features        | section heading; item icon/image, title, text, link          | cards, editorial list, numbered steps           | item links and ordered content                            |
| Offers          | heading; item image, meta, price, badge, copy, CTA           | menu, rooms, pricing, catalog                   | item CTAs and comparison hierarchy                        |
| Gallery         | heading; images, alt, caption                                | uniform grid, collage, strip                    | optional lightbox                                         |
| Testimonials    | heading; quote, name, role, avatar, rating                   | cards, featured quote, compact list             | accessible content without fake carousel controls         |
| FAQ             | heading; question and answer                                 | bordered accordion, separated list, two columns | keyboard-accessible expand/collapse                       |
| CTA             | title, text, primary/secondary CTA, optional image           | banner, split, cover                            | links and responsive composition                          |
| Form            | heading, text, fields, consent, submit/success copy          | stacked, compact, split                         | required validation and lead submission                   |
| Footer          | brand, contacts, link groups, social links, map/address, CTA | compact, columns, contact/map, conversion       | links and configured map target                           |

Spacer, raw HTML, animation timelines, arbitrary absolute positioning, ecommerce checkout, domains, and backend uploads are outside this local-demo release.

`SiteConfig` also owns editable SEO title, description, social image, and favicon. Demo-publish runs a readiness gate for required copy, image alt text, broken anchors, unsafe links, duplicate ids, and placeholder URLs. Publication remains explicitly local; a hosted production URL still requires a backend repository.

`SiteBusinessConfig` stores shared brand name/logo, phone, email, address, hours, messengers, and social links. Header and footer blocks inherit these values by default and can detach a local override. Form fields remain visitor inputs and do not inherit business contact data. The wizard creates a complete industry-specific vertical recipe rather than the same five generic sections.

## Customization Model

### Site Theme

`SiteConfig` owns one `SiteThemeConfig` with:

- page background, surface, text, muted text, and accent colors;
- heading/body font pairing and type scale;
- content width and section spacing;
- button shape and default radius.

Changing the theme updates every block that does not override that token.

### Block Appearance

Every `BlockConfig` has optional `BlockAppearanceOverrides` for background, text, accent, content width, spacing, and radius. Preview blocks resolve `theme -> block overrides`. Alignment and other composition-specific properties stay in the individual block layout contract.

### Elements

Content is structured, never flattened into comma-separated strings. Repeated elements have stable ids so edits and reorder operations preserve identity. Relevant element properties include content, media, link target/kind, visibility, and semantic options such as price, rating, required field, or initially-open FAQ.

`LinkConfig` has a stable id and supports label, typed target, and new-tab behavior. Internal links are selected from existing visible anchors; manual safe URL, email, and phone modes remain available.

Image fields support a URL and local JPEG/PNG/WebP upload. Local uploads are resized before being stored as data URLs to reduce `localStorage` pressure. SVG and non-image files are rejected. The UI clearly identifies local-demo storage limits.

## Editor UX

The desktop builder retains three columns but changes their jobs:

- Left: segmented `Добавить / Слои / Тема` views. The block palette is grouped as `Основа`, `Контент`, `Доверие`, and `Конверсия`. Layers expose visibility and anchor editing.
- Center: a continuous page canvas. Selected-section controls float over the section instead of permanently consuming vertical space.
- Right: `Контент / Макет / Стиль`. Only controls relevant to the selected block are shown.

Undo and redo are first-class canvas commands backed by bounded in-memory configuration history. Save and load reset the history baseline; transient preview interactions never enter history.

Repeated items use compact accordions with summary, thumbnail/title, drag or move actions, duplicate, and remove. Variant selection uses small layout tiles with icon, title, and description. Boolean settings use toggles; finite visual choices use segmented controls; colors use swatches plus native color input; numbers use bounded inputs/sliders.

On mobile, `Блоки / Холст / Настройки` remains a non-overlapping top switch. Each view occupies the viewport independently; the inspector does not appear below the canvas.

## Architecture

Domain contracts stay in `features/builder/domain/models`. `BlockRegistry` remains the source for palette grouping, labels, icons, default factories, clone behavior, variants, and validation metadata. New block preview components stay in `features/preview/ui` and use no Angular Material.

`BuilderStore` owns all persistent mutations. Repeated-item helpers operate immutably and mark dirty only after a real change. Transient UI state such as open burger, FAQ panel, lightbox, active inspector tab, or expanded editor item stays in component signals and is never persisted.

The oversized builder inspector is extracted from `BuilderPageComponent`. `BuilderPageComponent` orchestrates page/canvas/save/publish state; `BlockInspectorComponent` owns selected-block controls; focused per-block editor components own their own fields and call `BuilderStore`.

The renderer remains exhaustive over the discriminated `PageBlockConfig` union. Registry completeness tests ensure every type has metadata, defaults, clone support, normalization, validation, renderer, and inspector.

## Persistence And Migration

`SITE_CONFIG_SCHEMA_VERSION` increases. `ProjectPersistenceService` normalizes schema-version-1 projects into the new theme, appearance, stable item ids, and block defaults. Unknown block types are dropped safely; known blocks with partial fields are repaired. Safe href rules remain in force for all links. Stored media accepts only `https`, `http`, same-page anchors, and validated image data URLs generated by the media input.

## Accessibility And Responsive Behavior

Interactive output uses native controls and semantic landmarks. Burger exposes expanded/control relationships, closes by Escape/backdrop/link, and restores focus. FAQ uses buttons with expanded/control relationships. Lightbox has a close button, Escape path, labelled dialog semantics, and focus restoration. All controls have visible focus states and reduced-motion fallbacks.

Every block uses the existing `site-preview` container so mobile preview responds to canvas width rather than browser width. Acceptance requires no horizontal overflow at 390 px and readable layouts at 320 px, 768 px, and desktop.

## Error Handling

Invalid media files show a local field error and do not mutate the project. Empty required content remains editable but blocks demo-publish through validation with a specific message. Failed lead submission retains entered values. Corrupted localStorage falls back through normalization without crashing the builder.

## Acceptance Criteria

1. A user can create a landing containing all eleven blocks and customize all visible text, links, images, and repeated items.
2. Each block offers at least three composition recipes that materially change hierarchy or layout.
3. Add, duplicate, reorder, and remove actions work for navigation, features, offers, gallery media, testimonials, FAQ, form fields, and footer links where applicable.
4. Burger, FAQ, gallery lightbox, content/CTA links, form validation/submission, and map/contact links work in preview and published routes.
5. Global theme changes propagate while per-block overrides remain intact.
6. Old local projects open with safe defaults and can be saved again.
7. Builder and published preview pass desktop/mobile Playwright interaction and overflow checks.
8. Unit contracts, smoke tests, lint, format check, and production build pass.
9. Each wizard industry produces a coherent full-page recipe using the relevant subset of the eleven block types and shared business data.

## Delivery Slices

The work is implemented as one product upgrade in four internally reviewable slices:

1. Theme, appearance, stable repeated elements, migration, and registry foundation.
2. Complete existing header/hero/offers/form/footer behavior and inspectors.
3. Content+media/features/gallery/testimonials/FAQ/CTA blocks with defaults, renderers, inspectors, validation, and persistence.
4. Builder information architecture, media upload, responsive/browser verification, documentation, and final review.
