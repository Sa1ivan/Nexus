---
name: angular-saas-builder
description: Build, extend, and fix this Angular SaaS website-builder project. Use when adding features, fixing bugs, changing architecture, creating blocks, stores, pages, shared UI, or project configuration for the Nexus Angular 20 standalone Signals Material application.
---

# Angular SaaS Builder

Use this skill for changes in the Nexus website-builder codebase.

## Project Rules

- Use Angular 20, standalone components, Signals, Angular Material, CDK, SCSS, and strict TypeScript.
- Do not create NgModules.
- Do not use NgRx Store.
- Do not use `any`; model data with reusable interfaces and discriminated unions.
- Keep local feature state in Signals-based stores.
- Prefer OnPush change detection for all components.
- Keep output page rendering separate from builder/editor UI.
- Use Angular Material for SaaS application controls; keep rendered website blocks clean and framework-neutral unless a block explicitly needs Material.
- Keep files production-ready: explicit types, readonly models where practical, small APIs, and no speculative abstractions.

## Architecture

Follow feature-based boundaries:

```text
src/app/
  core/
    services/
    guards/
    interceptors/
  shared/
    ui/
    types/
    utils/
  features/
    builder/
      domain/
        models/
      data-access/
      stores/
      services/
      ui/
      pages/
    preview/
      ui/
      pages/
```

## Builder Feature Patterns

- Put domain contracts in `features/builder/domain/models`.
- Add a new block by creating a specific `*BlockConfig` interface that extends `BlockConfig<'type'>`.
- Extend `BlockType` and `PageBlockConfig` when adding block types.
- Render blocks through `BlockRendererComponent` using `@switch (block.type)`.
- Keep block components in `features/builder/ui/<block-name>`.
- Keep page orchestration in `features/builder/pages`.
- Keep state mutations inside `BuilderStore`; expose readonly computed signals to components.
- Update immutable state with object and array copies.

## Validation

After implementation, run:

```bash
npm run lint
npm run build
```

If a command cannot run because dependencies are missing, install them first with `npm install`.
