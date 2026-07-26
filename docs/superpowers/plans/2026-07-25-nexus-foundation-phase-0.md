# Nexus Foundation Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current local landing-page demo into a reliably tested, repository-driven, multipage local site builder with project transfer, autosave and a real browser acceptance flow.

**Architecture:** Keep the versioned `SiteConfig` document and existing block renderer. Extract codecs and an asynchronous repository boundary from local storage, separate project/history state from document mutations, then add page operations and page-level SEO without changing block behavior. The local repository remains the only adapter in Phase 0, but every consumer uses the same async contract required by the Phase 1 HTTP adapter.

**Tech Stack:** Angular 20 standalone components, Signals, Angular Material/CDK, strict TypeScript, Angular TestBed with Vitest 3.2 and jsdom 26, Playwright 1.62 Chromium, Node source-contract tests, localStorage.

---

## Scope and non-goals

Phase 0 includes:

- behavioral unit/component tests;
- a real browser acceptance test;
- site/project storage codecs;
- asynchronous `ProjectRepository`;
- project-session and history state separation;
- project JSON export/import;
- page CRUD, ordering, page SEO and schema migration;
- multipage public routes and internal page links;
- autosave, recovery and optimistic conflicts;
- CI and developer commands.

Phase 0 does not include:

- a backend or HTTP repository;
- authentication;
- cloud media;
- SSR;
- custom domains;
- analytics;
- element-level freeform canvas;
- CMS, Bookings or eCommerce.

## Target file map

```text
src/app/
  app.config.ts
  app.routes.ts
  features/
    builder/
      data-access/
        local-project.repository.ts
        project-storage.codec.ts
        project-storage.model.ts
        project-transfer.service.ts
        site-config.codec.ts
      domain/
        models/
          page-config.model.ts
          page-seo.model.ts
          project-repository.model.ts
          site-seo.model.ts
        ports/
          project.repository.ts
        utils/
          page-config-update.ts
          page-slug.ts
      stores/
        builder-history.store.ts
        builder-project.store.ts
        builder.store.ts
      ui/
        page-manager/
          page-manager.component.ts
          page-manager.component.html
          page-manager.component.scss
    preview/
      pages/public-preview-page/*
      ui/landing-link/landing-link.directive.ts
    workspace/
      data-access/project-insights.service.ts
tests/
  e2e/builder-publish-flow.spec.ts
playwright.config.ts
tsconfig.spec.json
.github/workflows/ci.yml
```

## Task P0-01: Establish behavioral and browser testing

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `angular.json`
- Create: `tsconfig.spec.json`
- Create: `playwright.config.ts`
- Create: `src/app/features/builder/domain/utils/link-target.spec.ts`
- Create: `tests/e2e/builder-publish-flow.spec.ts`
- Modify: `.gitignore`
- Format: the six files currently reported by `npm run format:check`

- [x] **Step 1: Make the pre-existing formatting gate green**

Run:

```bash
npx prettier --write \
  src/app/features/preview/ui/landing-link/landing-link.directive.ts \
  src/app/features/workspace/pages/home-page/home-page.component.html \
  src/app/features/workspace/pages/home-page/home-page.component.scss \
  src/app/features/workspace/pages/profile-page/profile-page.component.ts \
  src/app/features/workspace/pages/statistics-page/statistics-page.component.html \
  tests/unit.test.mjs
```

Run:

```bash
npm run format:check
```

Expected: `All matched files use Prettier code style!`

- [x] **Step 2: Install the test runners**

Run:

```bash
npm install --save-dev vitest@^3.2.7 jsdom@^26.1.0 @playwright/test@^1.62.0
```

Run:

```bash
npx playwright install chromium
```

Expected: dependencies are recorded in `package.json` and Chromium installation exits
with code `0`. Keep `jsdom` on major version 26 while the project uses Node 22.12;
newer jsdom releases require Node 22.13 or later.

- [x] **Step 3: Configure Angular's Vitest runner**

Add this target to `projects.nexus.architect` in `angular.json`:

```json
"test": {
  "builder": "@angular/build:unit-test",
  "options": {
    "tsConfig": "tsconfig.spec.json",
    "runner": "vitest",
    "buildTarget": "::development"
  }
}
```

Create `tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": ["vitest/globals"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.d.ts"]
}
```

- [x] **Step 4: Add one behavioral unit characterization test**

Create `src/app/features/builder/domain/utils/link-target.spec.ts`:

```ts
import { beforeEach, describe, expect, it } from 'vitest';

import { normalizeLinkTarget, resolveLandingHref } from './link-target';

describe('link target', () => {
  it('rejects script links', () => {
    expect(normalizeLinkTarget('javascript:alert(1)')).toBe('#');
  });

  it('keeps an anchor on the current published route', () => {
    expect(resolveLandingHref('#lead-form', '/p/project-1/home', '?ref=test', '/')).toBe(
      '/p/project-1/home?ref=test#lead-form',
    );
  });
});
```

Run:

```bash
npx ng test --watch=false
```

Expected: `2 passed`.

- [x] **Step 5: Configure Playwright**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI']
    ? [['list']]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4300',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start:e2e',
    url: 'http://127.0.0.1:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
```

Add to `.gitignore`:

```gitignore
playwright-report/
test-results/
```

- [x] **Step 6: Write the browser characterization test**

Create `tests/e2e/builder-publish-flow.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('edit, save, publish and submit a lead', async ({ page }) => {
  await page.goto('/builder');

  await page.getByRole('textbox', { name: 'Заголовок' }).fill('Проверенный E2E лендинг');
  await page.getByRole('button', { name: 'Сохранить проект' }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Проверенный E2E лендинг' })).toBeVisible();

  await page.getByRole('button', { name: 'Опубликовать локальное демо' }).click();
  await page.getByRole('button', { name: 'Еще действия' }).click();
  await page.getByRole('menuitem', { name: 'Локальная ссылка' }).click();

  await expect(page).toHaveURL(/\/p\/project-/u);
  await expect(page.getByRole('heading', { name: 'Проверенный E2E лендинг' })).toBeVisible();

  await page.getByRole('textbox', { name: /Имя/u }).fill('Тестовый пользователь');
  await page.getByRole('textbox', { name: /Телефон или email/u }).fill('test@example.com');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByText('Заявка сохранена.')).toBeVisible();
});
```

Run:

```bash
npx playwright test tests/e2e/builder-publish-flow.spec.ts
```

Expected: `1 passed`.

- [x] **Step 7: Separate contracts, unit tests and browser tests**

Set the `scripts` section in `package.json` to include:

```json
"start:e2e": "ng serve --host 127.0.0.1 --port 4300",
"test": "npm run test:contracts && npm run test:unit",
"test:contracts": "node --test tests/unit.test.mjs",
"test:unit": "ng test --watch=false",
"e2e": "playwright test",
"e2e:contracts": "node --test tests/e2e-smoke.test.mjs",
"verify": "npm run lint && npm test && npm run e2e:contracts && npm run e2e && npm run build && npm run format:check"
```

- [x] **Step 8: Verify the complete baseline**

Run:

```bash
npm run verify
```

Expected: lint passes, 18 source-contract tests pass, 2 Vitest tests pass, the
source-contract smoke test passes, one Playwright test passes, the production build
passes and Prettier passes.

- [x] **Step 9: Commit**

```bash
git add \
  .gitignore \
  angular.json \
  package.json \
  package-lock.json \
  playwright.config.ts \
  tsconfig.spec.json \
  src/app/features/builder/domain/utils/link-target.spec.ts \
  tests/e2e/builder-publish-flow.spec.ts \
  src/app/features/preview/ui/landing-link/landing-link.directive.ts \
  src/app/features/workspace/pages/home-page/home-page.component.html \
  src/app/features/workspace/pages/home-page/home-page.component.scss \
  src/app/features/workspace/pages/profile-page/profile-page.component.ts \
  src/app/features/workspace/pages/statistics-page/statistics-page.component.html \
  tests/unit.test.mjs
git commit -m "test: add behavioral and browser verification"
```

## Task P0-02: Extract versioned persistence codecs

**Files:**

- Create: `src/app/features/builder/data-access/project-storage.model.ts`
- Create: `src/app/features/builder/data-access/site-config.codec.ts`
- Create: `src/app/features/builder/data-access/site-config.codec.spec.ts`
- Create: `src/app/features/builder/data-access/project-storage.codec.ts`
- Create: `src/app/features/builder/data-access/project-storage.codec.spec.ts`
- Modify: `src/app/features/builder/data-access/project-persistence.service.ts`

- [x] **Step 1: Write the failing site-config codec tests**

Create `site-config.codec.spec.ts` with these behaviors:

```ts
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

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
    if (page === undefined) throw new Error('Page fixture is missing.');
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
});
```

Run:

```bash
npm run test:unit -- --include src/app/features/builder/data-access/site-config.codec.spec.ts
```

Expected: FAIL because `SiteConfigCodec` does not exist.

- [x] **Step 2: Define the codec result and public API**

Create `site-config.codec.ts` with this public contract:

```ts
import { Injectable } from '@angular/core';

import type { SiteConfig } from '../domain/models';

export type SiteConfigDecodeResult =
  | { readonly ok: true; readonly value: SiteConfig }
  | {
      readonly ok: false;
      readonly reason: 'invalid-json' | 'invalid-shape' | 'unsupported-schema';
    };

@Injectable({ providedIn: 'root' })
export class SiteConfigCodec {
  encode(siteConfig: SiteConfig): string {
    return JSON.stringify(siteConfig);
  }

  decode(serialized: string): SiteConfigDecodeResult {
    let value: unknown;

    try {
      value = JSON.parse(serialized) as unknown;
    } catch {
      return { ok: false, reason: 'invalid-json' };
    }

    return this.normalize(value);
  }

  normalize(value: unknown): SiteConfigDecodeResult {
    // Move the existing schema and block normalization here.
  }
}
```

Move these existing responsibilities from `ProjectPersistenceService` into the
codec without changing their fallback values:

- `normalizeSiteConfig`;
- `normalizePage`;
- `normalizeBlock`;
- all `read*` methods used by those methods;
- `asRecord`, `asArray`, `readString`, `readNumber` and numeric clamps;
- media, link, theme, business, SEO and design normalization.

Keep ID creation private to the codec. Return `unsupported-schema` only when the
input is an object with a numeric schema version other than `1` or the current
version. Return `invalid-shape` for all other invalid values.

- [x] **Step 3: Run the site-config tests GREEN**

Run:

```bash
npm run test:unit -- --include src/app/features/builder/data-access/site-config.codec.spec.ts
```

Expected: `3 passed`.

- [x] **Step 4: Write the failing project-storage codec tests**

Create `project-storage.model.ts`:

```ts
import type { LeadSubmission, Project } from '../domain/models';

export interface ProjectStorageState {
  readonly projects: readonly Project[];
  readonly leads: readonly LeadSubmission[];
  readonly activeProjectId: string | null;
}
```

Create `project-storage.codec.spec.ts` and assert:

```ts
it('returns an empty state for invalid JSON', () => {
  expect(codec.decode('{')).toEqual({
    projects: [],
    leads: [],
    activeProjectId: null,
  });
});

it('drops a project whose draft cannot be normalized', () => {
  const result = codec.decode(
    JSON.stringify({
      projects: [{ id: 'broken', draft: { schemaVersion: 999 } }],
      leads: [],
      activeProjectId: 'broken',
    }),
  );
  expect(result.projects).toEqual([]);
  expect(result.activeProjectId).toBeNull();
});
```

Run:

```bash
npm run test:unit -- --include src/app/features/builder/data-access/project-storage.codec.spec.ts
```

Expected: FAIL because `ProjectStorageCodec` does not exist.

- [x] **Step 5: Extract project-level normalization**

Create `ProjectStorageCodec` and move these exact responsibilities from
`ProjectPersistenceService`:

- `normalizeStorageState`;
- `normalizeProject`;
- `normalizeRelease`;
- `normalizeRevision`;
- `normalizeLead`;
- unsupported stored-schema discovery.

Use `SiteConfigCodec.normalize()` for drafts, revisions and releases. After filtering
projects, keep `activeProjectId` only when that project still exists:

```ts
const activeProjectId =
  typeof record['activeProjectId'] === 'string' &&
  projects.some((project) => project.id === record['activeProjectId'])
    ? record['activeProjectId']
    : null;
```

- [x] **Step 6: Make local persistence delegate to codecs**

`ProjectPersistenceService.readState()` must call:

```ts
return this.projectStorageCodec.decode(rawState);
```

`writeState()` must call:

```ts
const serializedState = this.projectStorageCodec.encode(state);
```

The service must no longer contain block-specific normalization.

- [x] **Step 7: Run all checks**

Run:

```bash
npm test
npm run e2e:contracts
npm run build
```

Expected: all existing and new tests pass; published demo behavior is unchanged.

- [x] **Step 8: Commit**

```bash
git add src/app/features/builder/data-access
git commit -m "refactor: extract project persistence codecs"
```

## Task P0-03: Introduce the asynchronous repository boundary

**Files:**

- Create: `src/app/features/builder/domain/models/project-repository.model.ts`
- Create: `src/app/features/builder/domain/ports/project.repository.ts`
- Create: `src/app/features/builder/data-access/local-project.repository.ts`
- Create: `src/app/features/builder/data-access/local-project.repository.spec.ts`
- Modify: `src/app/features/builder/domain/models/index.ts`
- Modify: `src/app/app.config.ts`
- Delete after migration: `src/app/features/builder/data-access/project-persistence.service.ts`

- [x] **Step 1: Define request types**

Create `project-repository.model.ts`:

```ts
import type { SiteConfig } from './site-config.model';

export interface CreateProjectRequest {
  readonly siteConfig: SiteConfig;
}

export interface SaveDraftRequest {
  readonly projectId: string;
  readonly expectedDraftVersion: number;
  readonly siteConfig: SiteConfig;
}

export interface PublishProjectRequest {
  readonly projectId: string;
  readonly expectedDraftVersion: number;
  readonly siteConfig: SiteConfig;
}

export class ProjectVersionConflictError extends Error {
  constructor(
    readonly projectId: string,
    readonly expectedVersion: number,
    readonly actualVersion: number,
  ) {
    super('Project draft version conflict.');
  }
}
```

- [x] **Step 2: Define the repository port and token**

Create `project.repository.ts`:

```ts
import { InjectionToken } from '@angular/core';

import type {
  CreateProjectRequest,
  LeadSubmission,
  LeadSubmissionRequest,
  Project,
  PublishedRelease,
  PublishProjectRequest,
  SaveDraftRequest,
} from '../models';

export interface ProjectRepository {
  listProjects(): Promise<readonly Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  getActiveProject(): Promise<Project | null>;
  setActiveProject(projectId: string): Promise<void>;
  createProject(request: CreateProjectRequest): Promise<Project>;
  saveDraft(request: SaveDraftRequest): Promise<Project>;
  publishProject(request: PublishProjectRequest): Promise<Project>;
  getPublishedRelease(projectId: string): Promise<PublishedRelease | null>;
  submitLead(request: LeadSubmissionRequest): Promise<LeadSubmission>;
  listLeads(projectId: string): Promise<readonly LeadSubmission[]>;
}

export const PROJECT_REPOSITORY = new InjectionToken<ProjectRepository>('PROJECT_REPOSITORY');
```

Export the new request types, error, interface and token from their relevant barrel
files.

- [x] **Step 3: Write RED tests for optimistic conflicts**

Create `local-project.repository.spec.ts`:

```ts
it('rejects a stale save and preserves the latest draft', async () => {
  const created = await repository.createProject({ siteConfig: DEFAULT_SITE_CONFIG });
  const first = await repository.saveDraft({
    projectId: created.id,
    expectedDraftVersion: created.draftVersion,
    siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'Latest' },
  });

  await expect(
    repository.saveDraft({
      projectId: created.id,
      expectedDraftVersion: created.draftVersion,
      siteConfig: { ...DEFAULT_SITE_CONFIG, name: 'Stale' },
    }),
  ).rejects.toMatchObject({
    projectId: created.id,
    expectedVersion: created.draftVersion,
    actualVersion: first.draftVersion,
  });

  await expect(repository.getProject(created.id)).resolves.toMatchObject({
    draft: { name: 'Latest' },
  });
});
```

Use an in-memory `Storage` test double implementing `getItem`, `setItem`, `removeItem`,
`clear`, `key` and `length`. Inject it through a new `PROJECT_STORAGE` token so tests
do not mutate global browser storage.

Run:

```bash
npm run test:unit -- --include src/app/features/builder/data-access/local-project.repository.spec.ts
```

Expected: FAIL because the repository and storage token do not exist.

- [x] **Step 4: Implement the local adapter**

Move local state mutation from `ProjectPersistenceService` into
`LocalProjectRepository`.

Requirements:

- every public method is `async`;
- `saveDraft` and `publishProject` reload the stored project by ID;
- both compare `expectedDraftVersion` with the stored value;
- mismatch throws `ProjectVersionConflictError` before creating a revision or release;
- writes still enforce the existing size, revision, release and lead limits;
- cloning still protects stored snapshots from caller mutation.

Create this browser storage provider:

```ts
export const PROJECT_STORAGE = new InjectionToken<Storage | null>('PROJECT_STORAGE', {
  providedIn: 'root',
  factory: () => (typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage),
});
```

- [x] **Step 5: Register the adapter**

Add to `appConfig.providers`:

```ts
LocalProjectRepository,
{
  provide: PROJECT_REPOSITORY,
  useExisting: LocalProjectRepository,
},
```

- [x] **Step 6: Run repository tests GREEN**

Run:

```bash
npm run test:unit -- --include src/app/features/builder/data-access/local-project.repository.spec.ts
```

Expected: all local repository tests pass.

- [x] **Step 7: Create an uncommitted checkpoint**

```bash
npm run test:unit -- --include src/app/features/builder/data-access/local-project.repository.spec.ts
git diff --check
```

Expected: repository tests pass and the diff is clean. Do not commit yet: P0-03 and
P0-04 form one atomic refactor, so the branch must not contain an intermediate commit
that fails compilation.

## Task P0-04: Separate project and history state, then convert consumers

**Files:**

- Create: `src/app/features/builder/stores/builder-history.store.ts`
- Create: `src/app/features/builder/stores/builder-history.store.spec.ts`
- Create: `src/app/features/builder/stores/builder-project.store.ts`
- Create: `src/app/features/builder/stores/builder-project.store.spec.ts`
- Modify: `src/app/features/builder/stores/builder.store.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.ts`
- Modify: `src/app/features/builder/pages/create-landing-page/create-landing-page.component.ts`
- Modify: `src/app/features/preview/pages/public-preview-page/public-preview-page.component.ts`
- Modify: `src/app/features/preview/pages/public-preview-page/public-preview-page.component.html`
- Modify: `src/app/features/workspace/data-access/project-insights.service.ts`
- Modify: `src/app/features/workspace/pages/home-page/home-page.component.ts`
- Modify: `src/app/features/workspace/pages/home-page/home-page.component.html`
- Modify: `src/app/features/workspace/pages/projects-page/projects-page.component.ts`
- Modify: `src/app/features/workspace/pages/projects-page/projects-page.component.html`
- Modify: `src/app/features/workspace/pages/statistics-page/statistics-page.component.ts`
- Modify: `src/app/features/workspace/pages/statistics-page/statistics-page.component.html`
- Modify: `src/app/features/workspace/pages/profile-page/profile-page.component.ts`
- Modify: `src/app/features/workspace/pages/profile-page/profile-page.component.html`

- [x] **Step 1: Write RED history tests**

Test this public behavior:

```ts
it('moves the current document through undo and redo', () => {
  history.record(configA);
  history.record(configB);

  expect(history.undo(configC)).toEqual(configB);
  expect(history.redo(configB)).toEqual(configC);
});

it('keeps only fifty undo snapshots', () => {
  for (let index = 0; index < 55; index += 1) {
    history.record({ ...DEFAULT_SITE_CONFIG, name: `Version ${index}` });
  }
  expect(history.undoDepth()).toBe(50);
});
```

Run the spec and confirm failure because `BuilderHistoryStore` is missing.

- [x] **Step 2: Implement `BuilderHistoryStore`**

Expose:

```ts
readonly canUndo: Signal<boolean>;
readonly canRedo: Signal<boolean>;
readonly undoDepth: Signal<number>;
record(previous: SiteConfig): void;
undo(current: SiteConfig): SiteConfig | null;
redo(current: SiteConfig): SiteConfig | null;
reset(): void;
```

Use the existing `HISTORY_LIMIT = 50`. `record()` clears redo. `undo()` pushes current
onto redo. `redo()` pushes current onto undo.

- [x] **Step 3: Write RED project-session tests**

Use a fake `ProjectRepository` and assert:

```ts
it('publishes with the current draft version', async () => {
  await store.initialize('project-1');
  await store.publish(siteConfig);
  expect(repository.publishProject).toHaveBeenCalledWith({
    projectId: 'project-1',
    expectedDraftVersion: 3,
    siteConfig,
  });
});

it('surfaces a conflict without replacing the current project', async () => {
  repository.saveDraft.mockRejectedValue(new ProjectVersionConflictError('project-1', 2, 3));
  await store.save(siteConfig);
  expect(store.saveStatus()).toBe('error');
  expect(store.projectError()).toContain('другой вкладке');
  expect(store.currentProject()?.draftVersion).toBe(2);
});
```

- [x] **Step 4: Implement `BuilderProjectStore`**

Own these signals:

```ts
currentProject: Signal<Project | null>;
saveStatus: Signal<ProjectSaveStatus>;
projectError: Signal<string | null>;
publishedUrl: Signal<string | null>;
initialized: Signal<boolean>;
```

Expose:

```ts
initialize(projectId?: string): Promise<SiteConfig | null>;
create(siteConfig: SiteConfig): Promise<Project>;
save(siteConfig: SiteConfig): Promise<Project | null>;
publish(siteConfig: SiteConfig): Promise<Project | null>;
replaceCurrentProject(project: Project): void;
markDirty(): void;
```

`initialize(projectId)` loads that project or the active project. It returns the draft
for `BuilderStore` hydration and never stores a second copy of `SiteConfig` inside
the project store.

- [x] **Step 5: Reduce `BuilderStore` responsibilities**

Remove from `BuilderStore`:

- repository injection;
- `currentProjectSignal`;
- save-status and project-error signals;
- undo/redo arrays;
- local initialization in the constructor;
- storage calls.

Inject `BuilderProjectStore` and `BuilderHistoryStore`. Forward readonly project
signals for current component compatibility:

```ts
readonly currentProject = this.projectStore.currentProject;
readonly saveStatus = this.projectStore.saveStatus;
readonly projectError = this.projectStore.projectError;
readonly publishedUrl = this.projectStore.publishedUrl;
readonly canUndo = this.historyStore.canUndo;
readonly canRedo = this.historyStore.canRedo;
```

Add:

```ts
async initialize(projectId?: string): Promise<void> {
  const draft = await this.projectStore.initialize(projectId);
  if (draft !== null) this.hydrateSiteConfig(draft);
}

async saveCurrentProject(): Promise<boolean> {
  const project = await this.projectStore.save(this.siteConfig());
  return project !== null;
}

async publishCurrentProject(): Promise<boolean> {
  const project = await this.projectStore.publish(this.siteConfig());
  return project !== null;
}
```

Keep every block mutation and its public method signature unchanged.

- [x] **Step 6: Convert builder entry points to async**

`BuilderPageComponent.ngOnInit` becomes:

```ts
async ngOnInit(): Promise<void> {
  await this.builderStore.initialize(this.route.snapshot.paramMap.get('projectId') ?? undefined);
}
```

`saveProject` and `publishProject` become `async` and await the store.

The create wizard awaits project creation before routing to its builder URL.

- [x] **Step 7: Convert public preview to repository signals**

Replace the synchronous computed release with:

```ts
private readonly repository = inject(PROJECT_REPOSITORY);
private readonly releaseSignal = signal<PublishedRelease | null>(null);
private readonly loadingSignal = signal(true);

readonly release = this.releaseSignal.asReadonly();
readonly loading = this.loadingSignal.asReadonly();
```

An effect reads `projectId()` and calls an async `loadRelease(projectId)`. Use a
monotonic request ID so a slow earlier request cannot replace a later route result.
Await `submitLead` before calling `event.complete(true)`.

- [x] **Step 8: Convert workspace insights**

`ProjectInsightsService.getMetrics`, `getBlockDistribution` and
`getProjectLeadStats` become async. Load projects once per method and use:

```ts
const leadsByProject = new Map(
  await Promise.all(
    projects.map(async (project) => [project.id, await repository.listLeads(project.id)] as const),
  ),
);
```

Workspace page components replace fixed readonly values with signals and load in
`ngOnInit`. Templates call `metrics()` and the corresponding list signals.

- [x] **Step 9: Run the complete suite**

Run:

```bash
npm run verify
```

Expected: every consumer compiles, existing behavior passes and the Playwright flow
still succeeds.

- [x] **Step 10: Commit**

```bash
git add src/app/app.config.ts \
  src/app/features/builder \
  src/app/features/preview \
  src/app/features/workspace
git commit -m "refactor: add async repository and separate editor state"
```

## Task P0-05: Add safe project export and import

**Files:**

- Create: `src/app/features/builder/data-access/project-transfer.service.ts`
- Create: `src/app/features/builder/data-access/project-transfer.service.spec.ts`
- Modify: `src/app/features/builder/stores/builder.store.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.html`
- Modify: `tests/e2e/builder-publish-flow.spec.ts`

- [x] **Step 1: Write RED transfer tests**

Define the exported envelope:

```ts
export interface NexusProjectExport {
  readonly format: 'nexus-project';
  readonly formatVersion: 1;
  readonly exportedAt: string;
  readonly siteConfig: SiteConfig;
}
```

Test:

```ts
it('round-trips a project export', () => {
  const serialized = service.serialize(DEFAULT_SITE_CONFIG, '2026-07-25T00:00:00.000Z');
  expect(service.deserialize(serialized)).toEqual({
    ok: true,
    value: DEFAULT_SITE_CONFIG,
  });
});

it.each([
  ['invalid JSON', '{', 'invalid-json'],
  ['wrong format', JSON.stringify({ format: 'other' }), 'invalid-format'],
  [
    'future format',
    JSON.stringify({ format: 'nexus-project', formatVersion: 2 }),
    'unsupported-format',
  ],
])('rejects %s', (_label, serialized, reason) => {
  expect(service.deserialize(serialized)).toEqual({ ok: false, reason });
});
```

Run and confirm RED because the service is missing.

- [x] **Step 2: Implement the pure transfer format**

`serialize` returns pretty JSON with two-space indentation. `deserialize`:

1. rejects input longer than `5_000_000` characters with `file-too-large`;
2. parses JSON;
3. verifies exact `format` and `formatVersion`;
4. delegates `siteConfig` to `SiteConfigCodec.normalize`;
5. returns no partial project when validation fails.

- [x] **Step 3: Add file helpers**

Expose:

```ts
createDownload(siteConfig: SiteConfig): { readonly fileName: string; readonly blob: Blob };
readFile(file: File): Promise<ProjectTransferDecodeResult>;
```

The file name is a lowercase slug of the site name followed by `.nexus.json`.
`readFile` rejects files larger than 5 MB before reading.

- [x] **Step 4: Add store operations**

Add:

```ts
exportCurrentProject(): { readonly fileName: string; readonly blob: Blob };
importProjectFile(file: File): Promise<boolean>;
```

Import creates a new project through `BuilderProjectStore.create`, hydrates its draft,
resets history and sets it active. Failure sets a Russian error message and leaves the
current project and document unchanged.

- [x] **Step 5: Add builder menu actions**

Add menu items:

- `Экспортировать проект`;
- `Импортировать проект`.

Use a hidden:

```html
<input
  #projectFileInput
  type="file"
  accept=".json,.nexus.json,application/json"
  (change)="importProject($event)"
/>
```

Revoke every generated object URL immediately after the programmatic download click.
Reset the file input value after import so the same file can be selected twice.

- [x] **Step 6: Extend Playwright**

Add a second test that:

1. edits and saves a project;
2. starts a download and captures it with `page.waitForEvent('download')`;
3. reads the suggested filename and verifies `.nexus.json`;
4. opens a fresh browser context;
5. imports the downloaded file;
6. verifies the edited title appears.

- [x] **Step 7: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src/app/features/builder tests/e2e
git commit -m "feat: add project export and import"
```

## Task P0-06: Add multipage domain behavior and page SEO

**Files:**

- Create: `src/app/features/builder/domain/models/page-seo.model.ts`
- Modify: `src/app/features/builder/domain/models/page-config.model.ts`
- Modify: `src/app/features/builder/domain/models/site-seo.model.ts`
- Modify: `src/app/features/builder/domain/models/site-config.model.ts`
- Modify: `src/app/features/builder/domain/models/index.ts`
- Create: `src/app/features/builder/domain/utils/page-slug.ts`
- Create: `src/app/features/builder/domain/utils/page-slug.spec.ts`
- Create: `src/app/features/builder/domain/utils/page-config-update.ts`
- Create: `src/app/features/builder/domain/utils/page-config-update.spec.ts`
- Modify: `src/app/features/builder/domain/registry/block-registry.ts`
- Modify: `src/app/features/builder/domain/utils/site-config-validation.ts`
- Modify: `src/app/features/builder/data-access/default-site.config.ts`
- Modify: `src/app/features/builder/data-access/landing-draft.factory.ts`
- Modify: `src/app/features/builder/data-access/site-config.codec.ts`
- Modify: `src/app/features/builder/stores/builder.store.ts`

- [x] **Step 1: Write RED slug tests**

Test:

```ts
expect(normalizePageSlug('  О нас  ')).toBe('o-nas');
expect(normalizePageSlug('Price / 2026')).toBe('price-2026');
expect(normalizePageSlug('---')).toBe('');
expect(isReservedPageSlug('builder')).toBe(true);
expect(isReservedPageSlug('about')).toBe(false);
```

Reserved slugs are:

```ts
['builder', 'create', 'projects', 'statistics', 'profile', 'contacts', 'p'];
```

- [x] **Step 2: Implement slug normalization**

Use a fixed Cyrillic transliteration map, lowercase output, replace every run of
non-ASCII alphanumeric characters with one hyphen, and trim leading/trailing hyphens.
Do not use locale-dependent transliteration APIs.

- [x] **Step 3: Define page SEO and schema version 3**

Create:

```ts
export interface PageSeoConfig {
  readonly title: string;
  readonly description: string;
  readonly socialImage: MediaAsset | null;
  readonly noIndex: boolean;
}
```

`PageConfig` becomes:

```ts
export interface PageConfig {
  readonly id: PageId;
  readonly slug: string;
  readonly title: string;
  readonly seo: PageSeoConfig;
  readonly blocks: readonly PageBlockConfig[];
}
```

`SiteSeoConfig` keeps only site-wide values:

```ts
export interface SiteSeoConfig {
  readonly language: string;
  readonly favicon: MediaAsset | null;
}
```

Set `SITE_CONFIG_SCHEMA_VERSION = 3`.

New pages start with `siteHeader`, `hero` and `siteFooter` blocks in that order,
created through the block registry. Override the new hero title with the page title
so a newly created page is immediately recognizable in the editor and preview.

- [x] **Step 4: Write RED page-update tests**

Test pure functions:

```ts
it('does not remove the last page', () => {
  expect(removePage([homePage], homePage.id)).toBeNull();
});

it('duplicates a page with new page and block ids but the same anchors', () => {
  const duplicated = duplicatePage([homePage], homePage.id);
  expect(duplicated?.page.id).not.toBe(homePage.id);
  expect(duplicated?.page.blocks.map((block) => block.id)).not.toEqual(
    homePage.blocks.map((block) => block.id),
  );
  expect(duplicated?.page.blocks.map((block) => block.anchor)).toEqual(
    homePage.blocks.map((block) => block.anchor),
  );
});

it('rejects a duplicate slug', () => {
  expect(updatePageSlug([homePage, aboutPage], aboutPage.id, 'home')).toEqual({
    ok: false,
    reason: 'duplicate-slug',
  });
});
```

- [x] **Step 5: Implement pure page mutations**

Expose:

```ts
createPage(pages: readonly PageConfig[], title: string): PageMutationResult;
renamePage(pages: readonly PageConfig[], pageId: string, title: string): PageMutationResult;
updatePageSlug(
  pages: readonly PageConfig[],
  pageId: string,
  slug: string,
): PageMutationResult;
updatePageSeo(
  pages: readonly PageConfig[],
  pageId: string,
  update: Partial<PageSeoConfig>,
): PageMutationResult;
duplicatePage(pages: readonly PageConfig[], pageId: string): PageMutationResult;
movePage(
  pages: readonly PageConfig[],
  pageId: string,
  direction: 'up' | 'down',
): PageMutationResult;
removePage(pages: readonly PageConfig[], pageId: string): PageMutationResult;
```

Use a discriminated result:

```ts
export type PageMutationResult =
  | {
      readonly ok: true;
      readonly pages: readonly PageConfig[];
      readonly activePageId: string;
    }
  | {
      readonly ok: false;
      readonly reason:
        | 'not-found'
        | 'last-page'
        | 'empty-title'
        | 'empty-slug'
        | 'reserved-slug'
        | 'duplicate-slug'
        | 'boundary';
    };
```

Add an option to `cloneRegisteredBlock`:

```ts
export interface CloneBlockOptions {
  readonly preserveAnchor?: boolean;
}
```

Page duplication passes `{ preserveAnchor: true }`; normal block duplication keeps
the current behavior.

- [x] **Step 6: Migrate schema versions 1 and 2**

For every old page, create page SEO from the old site SEO:

```ts
seo: {
  title: oldSiteSeo.title || page.title,
  description: oldSiteSeo.description,
  socialImage: oldSiteSeo.socialImage,
  noIndex: false,
}
```

Keep old language and favicon in site SEO. After normalization, output only schema
version 3.

- [x] **Step 7: Correct validation scope**

Page slugs are unique per site. Block IDs stay unique per site. Anchors become unique
per page, not across the whole site:

```ts
for (const page of siteConfig.pages) {
  const pageAnchors = new Set<string>();
  for (const block of page.blocks) {
    if (pageAnchors.has(block.anchor)) {
      errors.push(`На странице "${page.title}" дублируется anchor "${block.anchor}".`);
    }
    pageAnchors.add(block.anchor);
  }
}
```

Validate page SEO title after trimming as 1–70 characters. SEO description may be
empty and must not exceed 180 characters. Validate the social image shape and slug
format as well.

- [x] **Step 8: Add BuilderStore page operations**

Add methods with page IDs, not slugs:

```ts
addPage(title: string): boolean;
renamePage(pageId: string, title: string): boolean;
updatePageSlug(pageId: string, slug: string): boolean;
updatePageSeo(pageId: string, update: Partial<PageSeoConfig>): boolean;
duplicatePage(pageId: string): boolean;
movePage(pageId: string, direction: 'up' | 'down'): boolean;
removePage(pageId: string): boolean;
```

On success, commit one history snapshot, select `activePageId`, reconcile the
selected block and mark dirty. On failure, expose a page-specific Russian error
without changing `SiteConfig`.

- [x] **Step 9: Run domain and migration checks**

Run:

```bash
npm run test:unit
npm run test:contracts
npm run build
```

Expected: page operations, migration and all existing blocks pass.

- [x] **Step 10: Commit**

```bash
git add src/app/features/builder
git commit -m "feat: add multipage domain and page seo"
```

## Task P0-07: Build the page manager UI

**Files:**

- Create: `src/app/features/builder/ui/page-manager/page-manager.component.ts`
- Create: `src/app/features/builder/ui/page-manager/page-manager.component.html`
- Create: `src/app/features/builder/ui/page-manager/page-manager.component.scss`
- Create: `src/app/features/builder/ui/page-manager/page-manager.component.spec.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.html`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.scss`
- Modify: `tests/e2e/builder-publish-flow.spec.ts`

- [x] **Step 1: Write the RED component test**

Configure TestBed with `PageManagerComponent` and a fake `BuilderStore`. Assert:

```ts
const root = fixture.nativeElement as HTMLElement;
expect(root.querySelector('nav[aria-label="Страницы сайта"]')).not.toBeNull();
expect(
  [...root.querySelectorAll('button')].some(
    (button) => button.getAttribute('aria-label') === 'Добавить страницу',
  ),
).toBe(true);
expect(root.querySelector<HTMLInputElement>('#page-title')?.value).toBe('Главная');
expect(root.querySelector<HTMLInputElement>('#page-slug')?.value).toBe('home');
expect(root.querySelector<HTMLInputElement>('#page-seo-title')?.value).toBe('Главная');
```

Clicking `Добавить страницу` calls `store.addPage('Новая страница')`.

Run and confirm RED because the component is missing.

- [x] **Step 2: Implement the standalone component**

Use:

- `MatButtonModule`;
- `MatIconModule`;
- `MatMenuModule`;
- `ChangeDetectionStrategy.OnPush`;
- native labeled inputs and textarea.

The component injects `BuilderStore` and exposes its page signals. Each page row has
accessible actions:

- select;
- move up;
- move down;
- duplicate;
- delete.

The active page editor has:

- title;
- slug;
- SEO title;
- SEO description;
- noindex checkbox.

Associate labels with the stable input IDs `page-title`, `page-slug` and
`page-seo-title`. Give the description and noindex controls equivalent labeled IDs.
Update on `change`, not on every keystroke, so one completed field edit creates one
history entry.

- [x] **Step 3: Add deletion confirmation**

Use a small inline confirmation state in the component:

```ts
readonly pendingDeletePageId = signal<string | null>(null);
```

First click shows `Удалить страницу без возможности восстановления?`; explicit
`Удалить` performs the operation and `Отмена` clears the state. The last page delete
action is disabled.

- [x] **Step 4: Place the manager in the Layers tab**

Replace the current plain page navigation in `BuilderPageComponent` with:

```html
<app-page-manager />
```

Keep the existing block layer list immediately below it.

- [x] **Step 5: Extend browser coverage**

Before publishing:

1. open `Слои`;
2. add a page;
3. set title `О компании`;
4. set slug `about`;
5. set SEO title `О компании — E2E`;
6. return to home;
7. publish.

Assert both page buttons remain after a reload.

- [x] **Step 6: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src/app/features/builder tests/e2e
git commit -m "feat: add page management ui"
```

## Task P0-08: Render published pages by slug

**Files:**

- Modify: `src/app/app.routes.ts`
- Modify: `src/app/features/preview/pages/public-preview-page/public-preview-page.component.ts`
- Modify: `src/app/features/preview/pages/public-preview-page/public-preview-page.component.html`
- Modify: `src/app/features/preview/ui/landing-link/landing-link.directive.ts`
- Modify: `src/app/features/builder/domain/utils/link-target.ts`
- Modify: `src/app/features/builder/domain/utils/link-target.spec.ts`
- Modify: `src/app/features/workspace/data-access/project-insights.service.ts`
- Modify: `tests/e2e/builder-publish-flow.spec.ts`

- [x] **Step 1: Write RED internal-page-link tests**

Add:

```ts
it('keeps an internal page target inside a published site', () => {
  expect(resolveLandingHref('/about', '/p/project-1/home', '', '/')).toBe('/p/project-1/about');
});

it('keeps an internal page target inside a deployed base path', () => {
  expect(resolveLandingHref('/about', '/nexus/p/project-1/home', '', '/nexus/')).toBe(
    '/nexus/p/project-1/about',
  );
});

it('keeps ordinary application internal links outside published routes', () => {
  expect(resolveLandingHref('/projects', '/builder', '', '/')).toBe('/projects');
});
```

Run and confirm the first two assertions fail.

- [x] **Step 2: Resolve the published-site base**

In `resolveLandingHref`, when `safeTarget.startsWith('/')`, match the current path
after removing the deployment base:

```ts
const publishedMatch = relativeCurrentPath.match(/^\/p\/([^/]+)(?:\/[^/]+)?$/u);
```

If matched, return:

```ts
`${normalizedBasePath}/p/${publishedMatch[1]}${safeTarget}`;
```

Otherwise preserve existing application-link behavior.

- [x] **Step 3: Add both public routes**

In `app.routes.ts`, keep:

```ts
path: 'p/:projectId';
```

and add immediately after it:

```ts
path: 'p/:projectId/:pageSlug';
```

Both load `PublicPreviewPageComponent`.

- [x] **Step 4: Select the published page**

Add optional input:

```ts
readonly pageSlug = input<string>();
```

After loading the release:

- missing `pageSlug` selects `pages[0]`;
- a matching slug selects that page;
- a non-matching slug sets `pageMissing = true`;
- a missing release keeps the existing publication-missing state.

Render `activePage().blocks`, not `pages[0].blocks`.

- [x] **Step 5: Apply page SEO**

Change `applySeo` to accept both site and page SEO:

```ts
private applySeo(siteSeo: SiteSeoConfig, pageSeo: PageSeoConfig): () => void
```

Apply:

- page title;
- page description;
- page Open Graph title, description and image;
- site language;
- site favicon;
- `<meta name="robots" content="noindex,nofollow">` only when `pageSeo.noIndex`.

Restore every previous tag on effect cleanup.

- [x] **Step 6: Add page-level not found**

Render:

```html
<h1>Страница не найдена</h1>
<p>В опубликованной версии сайта нет страницы с таким адресом.</p>
```

Link back to `/p/:projectId`, not to the builder.

- [x] **Step 7: Correct workspace public URLs**

Published project summaries use:

```ts
`/p/${project.id}/${project.draft.pages[0]?.slug ?? 'home'}`;
```

The builder's `publishedUrl` may remain the shorter `/p/:projectId` canonical home
alias during Phase 0.

- [x] **Step 8: Extend Playwright**

After publishing:

1. open `/p/:projectId/about`;
2. assert heading or page content for `О компании`;
3. assert `document.title === 'О компании — E2E'`;
4. open `/p/:projectId/missing`;
5. assert `Страница не найдена`;
6. return to home and submit the lead.

- [x] **Step 9: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src/app tests/e2e
git commit -m "feat: publish pages by slug"
```

## Task P0-09: Add autosave, recovery and serialized writes

**Files:**

- Create: `src/app/features/builder/services/builder-autosave.service.ts`
- Create: `src/app/features/builder/services/builder-autosave.service.spec.ts`
- Modify: `src/app/features/builder/stores/builder-project.store.ts`
- Modify: `src/app/features/builder/stores/builder.store.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.ts`
- Modify: `src/app/features/builder/pages/builder-page/builder-page.component.html`
- Modify: `tests/e2e/builder-publish-flow.spec.ts`

- [x] **Step 1: Write RED autosave tests with fake timers**

Test:

```ts
it('saves once after 800 ms of inactivity', async () => {
  autosave.start();
  documentStore.updateSiteName('A');
  documentStore.updateSiteName('AB');
  documentStore.updateSiteName('ABC');

  await vi.advanceTimersByTimeAsync(799);
  expect(projectStore.save).not.toHaveBeenCalled();

  await vi.advanceTimersByTimeAsync(1);
  expect(projectStore.save).toHaveBeenCalledTimes(1);
  expect(projectStore.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'ABC' }));
});

it('keeps dirty status when the document changes during a save', async () => {
  projectStore.save.mockImplementation(() => pendingSave.promise);
  autosave.start();
  documentStore.updateSiteName('First');
  await vi.advanceTimersByTimeAsync(800);
  documentStore.updateSiteName('Second');
  pendingSave.resolve(project);
  await pendingSave.promise;
  expect(projectStore.saveStatus()).toBe('dirty');
});
```

Run and confirm RED because the service is missing.

- [x] **Step 2: Expose document revision identity**

Add a monotonically increasing `documentRevisionSignal` to `BuilderStore`. Increment
it exactly once in `commitSiteConfig`. Do not increment for selection, canvas mode,
load or history reset.

Expose:

```ts
readonly documentRevision: Signal<number>;
```

- [x] **Step 3: Implement the autosave service**

Use `toObservable(builderStore.documentRevision)` with:

```ts
skip(1),
debounceTime(800),
```

On each emission capture:

```ts
const revision = builderStore.documentRevision();
const snapshot = builderStore.siteConfig();
```

Serialize saves through one promise chain:

```ts
this.saveQueue = this.saveQueue
  .catch(() => undefined)
  .then(async () => {
    await this.projectStore.save(snapshot);
    if (this.builderStore.documentRevision() !== revision) {
      this.projectStore.markDirty();
    }
  });
```

`start()` is idempotent. `stop()` unsubscribes. `flush()` immediately saves the latest
dirty revision and returns its promise.

- [x] **Step 4: Start and stop autosave with the builder page**

Implement `OnDestroy`. After `await builderStore.initialize()`, call
`autosave.start()`. In `ngOnDestroy`, call `autosave.stop()`.

Manual save calls `autosave.flush()`. Publish flushes first, then publishes the
latest document.

- [x] **Step 5: Preserve recovery behavior**

The local repository already stores `activeProjectId`. Verify:

1. autosave creates or updates the project;
2. a fresh `BuilderStore.initialize()` without a route ID loads that active project;
3. selection falls back to the stored first page and first block;
4. history starts empty after recovery.

Add these as unit tests.

- [x] **Step 6: Surface conflicts**

`ProjectVersionConflictError` sets:

```text
Проект изменён в другой вкладке. Экспортируйте текущую версию или перезагрузите последнюю сохранённую.
```

Autosave stops retrying that document revision. Manual save does not overwrite. The
builder menu keeps Export enabled so the unsaved local document can be preserved.

- [x] **Step 7: Extend the browser test**

After editing, do not click Save. Wait for the visible status `Сохранено`, reload the
page, and assert the edit remains. Keep one manual-save assertion in a separate test
so both paths remain covered.

- [x] **Step 8: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src/app/features/builder tests/e2e
git commit -m "feat: add autosave and project recovery"
```

## Task P0-10: Add CI, documentation and the P0 gate

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `ROADMAP.md`
- Modify: `docs/superpowers/plans/2026-07-25-nexus-roadmap-execution-program.md`

- [x] **Step 1: Add the CI workflow**

Create:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - develop
      - main

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run verify
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: |
            playwright-report
            test-results
          if-no-files-found: ignore
```

- [x] **Step 2: Update README commands**

Document:

```bash
npm run test:contracts
npm run test:unit
npm run e2e:contracts
npm run e2e
npm run verify
```

Explain that:

- `test:contracts` checks structural exhaustiveness;
- `test:unit` executes TypeScript behavior with TestBed/Vitest;
- `e2e` executes Chromium through Playwright;
- `verify` is the mandatory pre-handoff gate.

- [x] **Step 3: Document schema and transfer behavior**

Update README:

- `SiteConfig` schema version 3;
- page SEO location;
- `.nexus.json` export/import;
- autosave delay;
- recovery behavior;
- conflict behavior;
- multipage public URLs.

- [x] **Step 4: Run the complete P0 acceptance gate**

Run:

```bash
npm ci
npx playwright install chromium
npm run verify
```

Expected:

- lint exits `0`;
- all source-contract tests pass;
- all Vitest tests pass;
- source-contract smoke passes;
- all Chromium tests pass;
- production build exits `0` within configured budgets;
- formatting exits `0`.

Fresh Node 24 evidence on 26 July 2026: 20 source-contract tests, 83
TestBed/Vitest tests, one E2E source contract, three Chromium scenarios and the
399.33 kB initial production bundle all passed.

- [x] **Step 5: Perform manual acceptance**

In a clean browser profile:

1. open `/builder`;
2. edit the home page;
3. create `/about`;
4. configure page SEO;
5. wait for autosave;
6. reload and verify recovery;
7. export the project;
8. publish;
9. open home and about public routes;
10. submit a lead;
11. import the project in a second clean profile;
12. verify both pages and content.

Expected: every step completes without console errors, missing content or manual
localStorage editing.

Interactive acceptance confirmed autosave recovery, both public page routes and a
lead submission with no browser console errors. The transfer path was confirmed by
the Playwright scenario in a second isolated browser context because the in-app
browser does not expose its download to another interactive profile.

- [x] **Step 6: Update program status**

In `2026-07-25-nexus-roadmap-execution-program.md`:

- check P0-01 through P0-10;
- check every Gate P0 condition;
- change `P0 implementation` to `Complete`;
- change `P1 detailed plan` to `Ready` only after its file is written.

- [x] **Step 7: Write the Phase 1 plan**

Create `docs/superpowers/plans/<current-date>-nexus-cloud-alpha-phase-1.md` from:

- the final `ProjectRepository` contract;
- schema version 3;
- actual P0 test commands;
- the chosen backend repository location;
- the selected deployment, object-storage and email providers.

Do not begin Phase 1 implementation in this task.

- [x] **Step 8: Final commit**

```bash
git add .github README.md ROADMAP.md docs/superpowers/plans
git commit -m "ci: complete Nexus foundation gate"
```

## Phase 0 completion checklist

- [x] P0-01 testing foundation complete (`e79f7c7`).
- [x] P0-02 persistence codecs complete (`d7c4de2`).
- [x] P0-03 repository boundary complete (`8a0875c`).
- [x] P0-04 state separation complete (`8a0875c`).
- [x] P0-05 project transfer complete (`ee0a434`).
- [x] P0-06 multipage domain complete (`21c1ac7`).
- [x] P0-07 page manager complete (`34eeb59`).
- [x] P0-08 public multipage output complete (`d496178`).
- [x] P0-09 autosave and recovery complete (`0510aca`).
- [x] P0-10 CI and documentation complete (this gate commit).
- [x] Gate P0 in the execution program is fully checked.
