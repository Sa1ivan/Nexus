# Nexus Cloud Alpha Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перевести Nexus с локального demo-хранилища на аккаунты, облачные проекты, публичные поддомены, S3-compatible медиа и серверный приём заявок, сохранив доказанные P0-контракты редактора.

**Architecture:** Backend создаётся отдельным модульным монолитом в репозитории `Sa1ivan/Nexus.Backend` и локальном sibling-каталоге `../Nexus.Backend`. Каждый бизнес-модуль разделён на `domain`, `application`, `infrastructure` и `api`; контроллеры не обращаются к Prisma напрямую, а модули взаимодействуют только через экспортируемые application ports. Один NestJS process и одна PostgreSQL database достаточны для Cloud Alpha, но границы позволяют позднее вынести Media, Forms или Public rendering без переписывания домена.

**Tech Stack:** Node.js 24, NestJS 11, TypeScript strict, PostgreSQL, Prisma ORM 7, Jest/Supertest, Docker, Railway, Cloudflare R2 through the S3 API, Resend, Angular 20 HTTP adapters, GitHub Actions.

---

## Зафиксированные решения

- Frontend остаётся в `Sa1ivan/Nexus`; backend — только в `Sa1ivan/Nexus.Backend`.
- Backend local path: sibling `../Nexus.Backend`; backend не добавляется внутрь frontend repository.
- Deployment baseline: Railway application service плюс Railway PostgreSQL.
- Object storage baseline: Cloudflare R2 через стандартный S3 client.
- Transactional email baseline: Resend behind the Notifications application port.
- Архитектурный стиль: modular monolith, не microservices и не общий слой `services`.
- `SiteConfig` остаётся versioned JSON document; Cloud Alpha принимает только schema version `3`.
- Backend владеет OpenAPI и JSON Schema transport-контрактами; Angular использует
  сгенерированный API client только внутри HTTP adapter и не подменяет им domain models.
- Изменение `SiteConfig` schema требует синхронных frontend/backend PR и одинаковых
  golden fixtures; неизвестная версия отклоняется до записи в PostgreSQL.
- Текущий draft хранится в `Project.draft`, а revision и release — immutable snapshots.
- Optimistic concurrency сохраняет семантику P0: stale `expectedDraftVersion` возвращает conflict и не перезаписывает данные.
- Access token живёт в памяти Angular application; refresh token хранится только в `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Provider SDK разрешён только в infrastructure adapter соответствующего модуля.
- Email доставляется через PostgreSQL outbox: бизнес-транзакция не зависит от Resend,
  а перезапуск процесса не теряет ожидающее уведомление.

## Обязательные границы

```text
api -> application -> domain
infrastructure -> application + domain
domain -> nothing outside its own module and shared/kernel
```

Запрещено:

- импортировать `PrismaService` в controller или application use case;
- импортировать `*.infrastructure.*` из другого бизнес-модуля;
- передавать Prisma-generated types через application/API boundary;
- складывать бизнес-логику в `shared`, `common`, controller или mapper;
- читать `process.env` за пределами typed configuration module;
- отправлять email, работать с R2 или выполнять HTTP-вызов без port interface;
- делать cross-module table writes из чужого repository adapter;
- публиковать mutable draft как публичную версию.
- добавлять cross-module foreign key или синхронный вызов без владельца инварианта;
- копировать transport DTO в domain model или возвращать domain entity из controller.

Разрешённая структура:

```text
Nexus.Backend/
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    app.module.ts
    main.ts
    shared/
      kernel/
        clock.ts
        domain-error.ts
        ids.ts
      config/
        app-config.module.ts
        app-config.schema.ts
      database/
        prisma.module.ts
        prisma.service.ts
      http/
        api-error.filter.ts
        request-id.middleware.ts
    modules/
      auth/
        domain/
        application/
        infrastructure/
        api/
        auth.module.ts
      workspaces/
        domain/
        application/
        infrastructure/
        api/
        workspaces.module.ts
      projects/
        domain/
        application/
        infrastructure/
        api/
        projects.module.ts
      releases/
        domain/
        application/
        infrastructure/
        api/
        releases.module.ts
      media/
        domain/
        application/
        infrastructure/
        api/
        media.module.ts
      forms/
        domain/
        application/
        infrastructure/
        api/
        forms.module.ts
      notifications/
        application/
        infrastructure/
        notifications.module.ts
      public-sites/
        application/
        api/
        public-sites.module.ts
  test/
    architecture/
    contract/
    e2e/
```

## Общий verification gate

Backend:

```bash
npm run lint
npm run architecture
npm run test
npm run test:e2e
npm run build
npm run format:check
npm audit --omit=dev --audit-level=moderate
```

Frontend после появления HTTP adapter:

```bash
npm run verify
```

Cloud Alpha acceptance:

```text
register -> verify email -> create workspace -> create project -> autosave
-> upload image -> publish -> open public URL in isolated browser
-> submit lead -> open owner inbox -> edit on second session
-> prove stale save returns 409 without data loss
```

## Task P1-01: Bootstrap the separate backend repository

**Files:**

- Create in `../Nexus.Backend`: NestJS application scaffold
- Create: `../Nexus.Backend/.nvmrc`
- Create: `../Nexus.Backend/.env.example`
- Create: `../Nexus.Backend/.github/workflows/ci.yml`
- Create: `../Nexus.Backend/test/architecture/module-boundaries.spec.ts`
- Modify: `../Nexus.Backend/package.json`
- Modify: `../Nexus.Backend/tsconfig.json`

- [ ] **Step 1: Create and connect the separate repository**

Run outside the frontend repository:

```bash
cd ..
git clone git@github.com:Sa1ivan/Nexus.Backend.git
cd Nexus.Backend
npx @nestjs/cli@11 new . --package-manager npm --strict --skip-git
```

Expected: `Nexus.Backend` is a separate Git worktree whose `origin` is
`git@github.com:Sa1ivan/Nexus.Backend.git`.

- [ ] **Step 2: Pin the runtime and commands**

Create `.nvmrc`:

```text
24
```

Set scripts in `package.json`:

```json
{
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "lint": "eslint \"{src,test}/**/*.ts\" --max-warnings=0",
    "architecture": "jest --runInBand test/architecture",
    "test": "jest --runInBand --testPathIgnorePatterns=/test/e2e/",
    "test:e2e": "jest --runInBand --config test/jest-e2e.json",
    "format": "prettier --write \"{src,test,prisma}/**/*.{ts,prisma}\"",
    "format:check": "prettier --check \"{src,test,prisma}/**/*.{ts,prisma}\"",
    "verify": "npm run lint && npm run architecture && npm run test && npm run test:e2e && npm run build && npm run format:check"
  },
  "engines": {
    "node": ">=24"
  }
}
```

- [ ] **Step 3: Write the RED architecture test**

Create `test/architecture/module-boundaries.spec.ts`. Parse every import under
`src/modules` with the TypeScript compiler API, resolve it to a source file and
classify both files by module and layer. Enforce this dependency matrix:

```ts
const allowedSameModuleTargets = {
  api: new Set(['application', 'domain']),
  application: new Set(['domain']),
  infrastructure: new Set(['application', 'domain']),
  domain: new Set<string>(),
} as const;
```

Cross-module imports may target only
`src/modules/<target>/application/public.ts`; that barrel exports ports and DTOs,
never concrete providers. Also assert that only files under `infrastructure` or
`shared/database` contain `from '@prisma/client'` or `PrismaService`, and that
controllers contain neither symbol.

Run:

```bash
npm run architecture
```

Expected: RED until the feature-module directories and import rules exist.

- [ ] **Step 4: Add the root modules and CI**

Create empty Nest modules for the eight business/support modules shown in the target
tree.
`AppModule` imports them but contains no business providers.

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [develop, main]

jobs:
  verify:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: nexus
          POSTGRES_PASSWORD: nexus
          POSTGRES_DB: nexus_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U nexus -d nexus_test"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 10
    env:
      DATABASE_URL: postgresql://nexus:nexus@localhost:5432/nexus_test
      NODE_ENV: test
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run verify
      - run: npm audit --omit=dev --audit-level=moderate
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run verify
```

Expected: architecture, lint, unit, E2E, build and formatting pass.

Commit:

```bash
git add .
git commit -m "chore: bootstrap Nexus backend architecture"
```

## Task P1-02: Typed configuration, errors, health and database

**Files:**

- Create: `src/shared/config/app-config.schema.ts`
- Create: `src/shared/config/app-config.module.ts`
- Create: `src/shared/http/api-error.filter.ts`
- Create: `src/shared/http/request-id.middleware.ts`
- Create: `src/shared/database/prisma.module.ts`
- Create: `src/shared/database/prisma.service.ts`
- Create: `src/shared/health/health.controller.ts`
- Create: `prisma/schema.prisma`
- Create: `prisma.config.ts`
- Create: `.env.example`
- Test: `test/e2e/health.e2e-spec.ts`

- [ ] **Step 1: Write RED configuration and health tests**

Test that application bootstrap fails when `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`REFRESH_TOKEN_SECRET`, `R2_*` or `RESEND_API_KEY` is absent outside test mode.
Test:

```http
GET /v1/health/live  -> 200 {"status":"ok"}
GET /v1/health/ready -> 200 {"status":"ok","database":"up"}
```

When the Prisma connection is unavailable, readiness must return `503` while
liveness remains `200`.

- [ ] **Step 2: Implement one typed configuration boundary**

Define `AppConfig` with:

```ts
export interface AppConfig {
  readonly nodeEnv: 'development' | 'test' | 'production';
  readonly port: number;
  readonly databaseUrl: string;
  readonly webOrigin: string;
  readonly accessTokenSecret: string;
  readonly refreshTokenSecret: string;
  readonly r2: {
    readonly endpoint: string;
    readonly bucket: string;
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
    readonly publicBaseUrl: string;
  };
  readonly resendApiKey: string;
  readonly emailFrom: string;
}
```

The validation factory is the only code allowed to read `process.env`.

- [ ] **Step 3: Standardize API errors**

All non-2xx responses use:

```ts
export interface ApiErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly requestId: string;
    readonly details?: Readonly<Record<string, unknown>>;
  };
}
```

Map validation to `400`, unauthenticated to `401`, forbidden to `403`, missing
aggregate to `404`, version conflict to `409`, rate limit to `429`, and unexpected
errors to `500` without leaking stack traces.

- [ ] **Step 4: Add Prisma lifecycle and the first migration**

`PrismaService` owns connect/disconnect and the Prisma 7 PostgreSQL driver adapter.
No module may instantiate `PrismaClient` directly. Keep CLI configuration in
`prisma.config.ts`; application code never imports that file.

Create the initial PostgreSQL datasource and generator, then run:

```bash
npx prisma format
npx prisma migrate dev --name foundation
```

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src test prisma .env.example
git commit -m "feat: add backend runtime foundation"
```

## Task P1-03: Identity and workspace tenancy

**Files:**

- Create under `src/modules/auth/`: user/session domain, auth ports and use cases,
  Prisma adapters, JWT/cookie adapters and auth controllers
- Create under `src/modules/workspaces/`: workspace/membership domain, repositories,
  authorization guard and controllers
- Modify: `prisma/schema.prisma`
- Test: `test/e2e/auth-workspaces.e2e-spec.ts`

- [ ] **Step 1: Add the identity schema**

Use these tables and constraints:

```prisma
enum WorkspaceRole {
  OWNER
  EDITOR
}

model User {
  id                String           @id @default(uuid()) @db.Uuid
  email             String           @unique
  passwordHash      String
  emailVerifiedAt   DateTime?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  memberships       Membership[]
  sessions          RefreshSession[]
}

model Workspace {
  id          String       @id @default(uuid()) @db.Uuid
  name        String
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  memberships Membership[]
  projects    Project[]
}

model Membership {
  userId      String        @db.Uuid
  workspaceId String        @db.Uuid
  role        WorkspaceRole
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  @@id([userId, workspaceId])
}

model RefreshSession {
  id         String    @id @default(uuid()) @db.Uuid
  userId     String    @db.Uuid
  tokenHash  String    @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime  @default(now())
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, expiresAt])
}
```

Add hashed, single-use email verification and password reset token tables with
expiry indexes. Raw tokens must never be stored.

- [ ] **Step 2: Write RED auth and tenancy E2E**

Cover:

```text
register -> 201 and verification message queued
duplicate email -> 409
login before verification -> 403
verify -> login -> access token + refresh cookie
refresh rotation invalidates the prior refresh token
logout revokes the session
owner reads workspace -> 200
non-member reads workspace -> 404
editor cannot change membership -> 403
```

- [ ] **Step 3: Implement application use cases**

Create one class per command/query:

```text
RegisterUser
VerifyEmail
LoginUser
RefreshSession
LogoutSession
RequestPasswordReset
ResetPassword
GetCurrentUser
CreateWorkspace
ListMyWorkspaces
ChangeMembershipRole
```

Controllers only validate DTO, call a use case and map its result.

Hash passwords with Argon2id using parameters pinned in one authentication adapter.
Access JWT lifetime is 10 minutes. Refresh sessions rotate on every use; reuse of a
rotated token revokes that session family. Login, registration, reset and refresh
have endpoint-specific rate limits.

- [ ] **Step 4: Add authorization**

Global authentication guard is opt-out only through explicit `@Public()` metadata.
Workspace authorization resolves membership in application code; a caller-supplied
`workspaceId` is never trusted without membership lookup.

CORS allows only the typed `webOrigin`. Every endpoint that consumes the refresh
cookie validates the `Origin` header and accepts only `POST`; this protects the
cookie flow in addition to `SameSite=Lax`.

- [ ] **Step 5: Verify migration, tests and commit**

Run:

```bash
npx prisma migrate dev --name identity_and_tenancy
npm run verify
```

Commit:

```bash
git add src/modules/auth src/modules/workspaces prisma test
git commit -m "feat: add identity and workspace tenancy"
```

## Task P1-04: Cloud projects, revisions and optimistic concurrency

**Files:**

- Create: `src/modules/projects/domain/project.ts`
- Create: `src/modules/projects/application/ports/project.repository.ts`
- Create one application use case per project operation
- Create: `src/modules/projects/infrastructure/prisma-project.repository.ts`
- Create: `src/modules/projects/api/projects.controller.ts`
- Create: `contracts/site-config/v3.schema.json`
- Create: `contracts/site-config/fixtures/*.json`
- Modify: `prisma/schema.prisma`
- Test: `test/contract/project-repository.contract.ts`
- Test: `test/e2e/projects.e2e-spec.ts`

- [ ] **Step 1: Freeze the application contract from P0**

Use schema version `3` and preserve these operations:

```ts
export interface ProjectRepository {
  listProjects(workspaceId: string): Promise<readonly Project[]>;
  getProject(workspaceId: string, projectId: string): Promise<Project | null>;
  createProject(workspaceId: string, siteConfig: SiteConfigV3): Promise<Project>;
  saveDraft(request: {
    readonly workspaceId: string;
    readonly projectId: string;
    readonly expectedDraftVersion: number;
    readonly siteConfig: SiteConfigV3;
  }): Promise<Project>;
  publishProject(request: {
    readonly workspaceId: string;
    readonly projectId: string;
    readonly expectedDraftVersion: number;
    readonly siteConfig: SiteConfigV3;
  }): Promise<Project>;
}
```

Keep frontend-only active-project preference outside this aggregate; its HTTP
adapter may store the active id locally until a user-preferences endpoint is needed.

The HTTP boundary treats `siteConfig` as `unknown` and validates it against
`contracts/site-config/v3.schema.json` before constructing application input. Add
valid, legacy, unsafe, oversized and future-version fixtures mirrored by the
frontend codec tests. Generate the OpenAPI client from the backend schema; do not
hand-maintain duplicate request/response interfaces in Angular.

- [ ] **Step 2: Add the project schema**

```prisma
model Project {
  id                   String            @id @default(uuid()) @db.Uuid
  workspaceId          String            @db.Uuid
  name                 String
  publicSlug           String            @unique
  draft                Json
  draftSchemaVersion   Int
  draftVersion         Int               @default(1)
  publishedReleaseId   String?           @unique @db.Uuid
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt
  workspace            Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  revisions            ProjectRevision[]
  releases             Release[]         @relation("ProjectReleases")
  publishedRelease     Release?          @relation("ActiveProjectRelease", fields: [publishedReleaseId], references: [id])
  media                 MediaAsset[]
  leads                 Lead[]
  @@index([workspaceId, updatedAt])
}

model ProjectRevision {
  id            String   @id @default(uuid()) @db.Uuid
  projectId     String   @db.Uuid
  version       Int
  siteConfig    Json
  schemaVersion Int
  createdAt     DateTime @default(now())
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([projectId, version])
}
```

- [ ] **Step 3: Write RED repository contract tests**

Run the same contract against an in-memory fake and Prisma adapter. Prove:

```text
create starts at draftVersion 1 and revision 1
save atomically increments version and appends immutable revision
stale save throws ProjectVersionConflictError
failed stale save does not create a revision
workspace A cannot read or mutate workspace B project
schema version other than 3 is rejected without a write
```

- [ ] **Step 4: Implement OCC atomically**

Inside one Prisma transaction:

```ts
const updated = await tx.project.updateMany({
  where: {
    id: request.projectId,
    workspaceId: request.workspaceId,
    draftVersion: request.expectedDraftVersion,
  },
  data: {
    draft: request.siteConfig,
    draftSchemaVersion: 3,
    draftVersion: { increment: 1 },
    name: request.siteConfig.name,
  },
});
```

When `updated.count === 0`, read the current version inside the same transaction and
return `409 PROJECT_VERSION_CONFLICT`; do not append a revision.

- [ ] **Step 5: Add authenticated project endpoints**

```http
GET    /v1/workspaces/:workspaceId/projects
POST   /v1/workspaces/:workspaceId/projects
GET    /v1/workspaces/:workspaceId/projects/:projectId
PUT    /v1/workspaces/:workspaceId/projects/:projectId/draft
POST   /v1/workspaces/:workspaceId/projects/:projectId/publish
GET    /v1/workspaces/:workspaceId/projects/:projectId/revisions
```

Save/publish bodies contain `expectedDraftVersion` and `siteConfig`. Never accept
`workspaceId`, `ownerId`, version or timestamps from `siteConfig`.

- [ ] **Step 6: Verify and commit**

Run:

```bash
npx prisma migrate dev --name cloud_projects
npm run verify
```

Commit:

```bash
git add src/modules/projects prisma test
git commit -m "feat: add versioned cloud projects"
```

## Task P1-05: Immutable releases and public-site reads

**Files:**

- Create under `src/modules/releases/`: release domain, publish/rollback ports and
  Prisma adapters
- Create under `src/modules/public-sites/`: public queries and controller
- Modify: `prisma/schema.prisma`
- Test: `test/e2e/public-release.e2e-spec.ts`

- [ ] **Step 1: Add the release model**

```prisma
model Release {
  id            String    @id @default(uuid()) @db.Uuid
  projectId     String    @db.Uuid
  version       Int
  siteConfig    Json
  schemaVersion Int
  publishedAt   DateTime  @default(now())
  project       Project   @relation("ProjectReleases", fields: [projectId], references: [id], onDelete: Cascade)
  activeFor     Project?  @relation("ActiveProjectRelease")
  leads         Lead[]
  @@unique([projectId, version])
}
```

- [ ] **Step 2: Write RED release tests**

Prove:

```text
publish performs OCC against draftVersion
publish creates a new immutable release and revision in one transaction
active release points to the new release only after transaction commit
editing draft after publish does not change public output
rollback only changes active release pointer
unknown publicSlug and missing pageSlug return 404
```

- [ ] **Step 3: Implement publish as one transaction**

The use case validates `SiteConfigV3`, performs the version-guarded draft update,
creates revision and release snapshots, and updates `publishedReleaseId`. A public
query reads only the active release; it never reads `Project.draft`.

- [ ] **Step 4: Add public endpoints**

```http
GET /v1/public/sites/:publicSlug
GET /v1/public/sites/:publicSlug/pages/:pageSlug
```

Responses include immutable `releaseId`, `releaseVersion`, global theme/business/SEO
and the selected page. Do not expose workspace ids, user ids, revisions or draft.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src/modules/releases src/modules/public-sites prisma test
git commit -m "feat: add immutable public releases"
```

## Task P1-06: Cloud media through an infrastructure port

**Files:**

- Create under `src/modules/media/domain/`: media metadata and validation rules
- Create: `src/modules/media/application/ports/object-storage.ts`
- Create: `src/modules/media/application/create-upload.ts`
- Create: `src/modules/media/application/complete-upload.ts`
- Create: `src/modules/media/infrastructure/r2-object-storage.ts`
- Create: `src/modules/media/api/media.controller.ts`
- Modify: `prisma/schema.prisma`
- Test: `test/contract/object-storage.contract.ts`
- Test: `test/e2e/media.e2e-spec.ts`

- [ ] **Step 1: Define the provider-independent port**

```ts
export interface ObjectStorage {
  createPresignedPut(request: {
    readonly objectKey: string;
    readonly contentType: string;
    readonly contentLength: number;
    readonly expiresInSeconds: number;
  }): Promise<{ readonly uploadUrl: string; readonly headers: Readonly<Record<string, string>> }>;
  head(objectKey: string): Promise<{
    readonly contentType: string;
    readonly contentLength: number;
    readonly etag: string;
  } | null>;
  delete(objectKey: string): Promise<void>;
}
```

- [ ] **Step 2: Add metadata and validation**

Allow JPEG, PNG and WebP; limit one Cloud Alpha image to 10 MiB. Generate object
keys server-side:

```text
workspaces/<workspaceId>/projects/<projectId>/<mediaId>/<safe-file-name>
```

Store `PENDING`, `READY`, `DELETING` status. Never trust client MIME, size, bucket,
key or final URL.

- [ ] **Step 3: Write RED media tests**

Cover ownership, extension/MIME mismatch, oversized file, expired pending upload,
successful head verification, idempotent completion and deletion of unattached
objects.

- [ ] **Step 4: Implement the R2 adapter**

Only `r2-object-storage.ts` imports `@aws-sdk/client-s3` and
`@aws-sdk/s3-request-presigner`. Credentials come from typed configuration. Use
bucket-scoped credentials and five-minute PUT URLs.

- [ ] **Step 5: Add endpoints**

```http
POST   /v1/workspaces/:workspaceId/projects/:projectId/media/uploads
POST   /v1/workspaces/:workspaceId/projects/:projectId/media/:mediaId/complete
GET    /v1/workspaces/:workspaceId/projects/:projectId/media
DELETE /v1/workspaces/:workspaceId/projects/:projectId/media/:mediaId
```

- [ ] **Step 6: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src/modules/media prisma test
git commit -m "feat: add cloud media uploads"
```

## Task P1-07: Server-side forms, lead inbox and email

**Files:**

- Create under `src/modules/forms/domain/`: lead and validation rules
- Create: `src/modules/notifications/application/public.ts`
- Create: `src/modules/notifications/infrastructure/prisma-notification-outbox.ts`
- Create: `src/modules/notifications/infrastructure/resend-email-sender.ts`
- Create: `src/modules/notifications/infrastructure/notification-worker.ts`
- Create public submit and authenticated inbox use cases/controllers
- Modify: `prisma/schema.prisma`
- Test: `test/e2e/forms.e2e-spec.ts`

- [ ] **Step 1: Add the lead model**

```prisma
enum LeadStatus {
  NEW
  READ
  ARCHIVED
}

model Lead {
  id         String      @id @default(uuid()) @db.Uuid
  projectId  String      @db.Uuid
  releaseId  String      @db.Uuid
  blockId    String
  fields     Json
  status     LeadStatus  @default(NEW)
  createdAt  DateTime    @default(now())
  project    Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  release    Release     @relation(fields: [releaseId], references: [id])
  @@index([projectId, createdAt])
}

model NotificationOutbox {
  id            String    @id @default(uuid()) @db.Uuid
  kind          String
  aggregateId   String
  payload       Json
  attempts      Int       @default(0)
  availableAt   DateTime  @default(now())
  claimedAt     DateTime?
  deliveredAt   DateTime?
  lastErrorCode String?
  createdAt     DateTime  @default(now())
  @@unique([kind, aggregateId])
  @@index([deliveredAt, availableAt])
}
```

- [ ] **Step 2: Define notifications as a cross-module application port**

```ts
export interface NotificationPublisher {
  enqueue(
    request:
      | { readonly kind: 'VERIFY_EMAIL'; readonly userId: string; readonly token: string }
      | { readonly kind: 'RESET_PASSWORD'; readonly userId: string; readonly token: string }
      | { readonly kind: 'LEAD_RECEIVED'; readonly leadId: string },
  ): Promise<void>;
}
```

`auth` and `forms` import only
`src/modules/notifications/application/public.ts`. Only the Resend adapter imports
the provider SDK. The worker resolves recipients and presentation data after
claiming a row; sensitive addresses and lead contents are not copied into the
outbox payload. Use outbox id as the provider idempotency key.

- [ ] **Step 3: Write RED form abuse and integrity tests**

Prove:

```text
fields are validated against the leadForm block in the active release
unknown and oversized fields are rejected
hidden honeypot returns a generic success without creating a lead
rate limit applies by publicSlug plus client address
lead stores releaseId so future edits do not alter its validation context
lead and notification outbox row commit atomically
email failure does not roll back an already stored lead
worker retries a failed row and does not resend a delivered row
two workers cannot deliver the same claimed row concurrently
non-member cannot list leads
```

- [ ] **Step 4: Add endpoints**

```http
POST  /v1/public/sites/:publicSlug/leads
GET   /v1/workspaces/:workspaceId/projects/:projectId/leads
PATCH /v1/workspaces/:workspaceId/projects/:projectId/leads/:leadId
```

Return `202` for accepted public submissions. Write the lead and outbox row in one
database transaction. A bounded background worker claims rows with PostgreSQL
`FOR UPDATE SKIP LOCKED`, applies exponential backoff and marks delivery. Controller
latency never depends on Resend.

- [ ] **Step 5: Verify and commit**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src/modules/forms prisma test
git commit -m "feat: add server-side lead capture"
```

## Task P1-08: Angular auth, HTTP repository and local migration

**Files in frontend `Sa1ivan/Nexus`:**

- Create: `src/app/core/auth/auth-session.store.ts`
- Create: `src/app/core/http/api-client.ts`
- Create: `src/app/core/http/api-error.ts`
- Create: `src/app/features/builder/data-access/http-project.repository.ts`
- Create: `src/app/features/builder/data-access/project-repository.facade.ts`
- Create: `src/app/features/builder/data-access/cloud-media.service.ts`
- Create: `src/app/features/workspace/pages/local-project-migration-page/*`
- Modify: `src/app/app.config.ts`
- Modify: `src/app/app.routes.ts`
- Test: repository contract, auth refresh and migration component specs
- Test: `tests/e2e/cloud-alpha-flow.spec.ts`

- [ ] **Step 1: Close the P0 review follow-ups**

Before adding network behavior, add failing tests and fix:

```text
manual save retries the same revision after a failed repository write
builder destruction flushes a pending debounced edit
landing creation shows repository/validation errors
failed project route initialization cannot retain another project's document
page metadata commits on input rather than only on blur
```

- [ ] **Step 2: Extract one frontend repository contract suite**

Run identical behavioral tests against `LocalProjectRepository` and
`HttpProjectRepository`:

```text
list/create/get/save/publish
version conflict
published release
lead submit/list
stored data remains unchanged after rejected stale save
```

- [ ] **Step 3: Implement secure auth session handling**

Keep the access token in a Signal store, never in localStorage. The refresh endpoint
uses `credentials: 'include'`; one failed `401` may trigger exactly one serialized
refresh and retry. Logout clears memory even if network revocation fails.

- [ ] **Step 4: Implement the HTTP adapter**

Map API DTOs to existing frontend domain types. Backend error
`PROJECT_VERSION_CONFLICT` maps to the existing `ProjectVersionConflictError`.
Components continue to inject `PROJECT_REPOSITORY`; they do not know which adapter
is active.

- [ ] **Step 5: Add local-to-cloud migration**

The migration screen:

1. lists local projects;
2. validates schema version 3;
3. imports each selected project through the HTTP repository;
4. records local id to cloud id only after server success;
5. never deletes local data automatically;
6. offers `.nexus.json` export before migration.

- [ ] **Step 6: Switch media inputs to the media port**

Local adapter keeps data URL behavior. Cloud adapter requests a presigned URL,
uploads bytes directly to R2, completes metadata verification, then stores the
returned public media reference in `SiteConfig`.

- [ ] **Step 7: Write the cloud browser scenario**

Use isolated owner and visitor contexts:

```text
owner registers and logs in
owner migrates or creates a project
autosave is recovered in a second owner context
owner uploads an image and publishes
visitor opens public route and submits a lead
owner sees the lead
first owner context receives 409 after second context saves a newer version
```

- [ ] **Step 8: Verify and commit frontend**

Run:

```bash
npm run verify
```

Commit:

```bash
git add src tests package.json package-lock.json
git commit -m "feat: connect Nexus to cloud backend"
```

## Task P1-09: Railway deployment, observability and recovery

**Files in backend:**

- Create: `Dockerfile`
- Create: `railway.json`
- Create: `scripts/verify-backup-restore.ts`
- Create: `src/shared/observability/*`
- Modify: `.env.example`
- Modify: `README.md`
- Test: `test/e2e/runtime-safety.e2e-spec.ts`

- [ ] **Step 1: Add a deterministic production image**

Use a multi-stage Node 24 image. Build with `npm ci`, run as a non-root user, execute
`prisma migrate deploy` as a Railway pre-deploy command, and start only compiled
JavaScript.

- [ ] **Step 2: Configure Railway environments**

Create separate `staging` and `production` environments. Bind one PostgreSQL service
per environment. Store JWT, R2 and Resend secrets in Railway variables. Production
must reject non-HTTPS web origins.

- [ ] **Step 3: Add structured observability**

Every log line contains `requestId`, level, route template, status and duration.
Never log passwords, tokens, cookies, full lead fields or R2 credentials. Add error
tracking through an adapter and expose liveness/readiness probes to Railway.

- [ ] **Step 4: Prove backup restore**

Create a staging project, revision, release and lead; take a PostgreSQL backup;
restore into a disposable database; run a verification script that asserts all ids,
versions and active release pointers. Record date and backup identifier in the
release handoff.

- [ ] **Step 5: Verify and commit**

Run:

```bash
docker build -t nexus-backend:phase-1 .
npm run verify
```

Commit:

```bash
git add Dockerfile railway.json scripts src README.md test
git commit -m "ops: deploy and observe Nexus cloud alpha"
```

## Task P1-10: Cloud Alpha gate and handoff

**Files:**

- Modify backend and frontend README files
- Modify frontend `ROADMAP.md`
- Modify `docs/superpowers/plans/2026-07-25-nexus-roadmap-execution-program.md`
- Create next Phase 2 plan only after deployed findings exist

- [ ] **Step 1: Run both repository gates from clean installs**

Backend:

```bash
npm ci
npx prisma migrate deploy
npm run verify
npm audit --omit=dev --audit-level=moderate
```

Frontend:

```bash
npm ci
npx playwright install chromium
npm run verify
npm audit --omit=dev --audit-level=moderate
```

- [ ] **Step 2: Perform deployed acceptance**

Use staging and two clean browser profiles. Complete the full Cloud Alpha acceptance
sequence from the top of this plan. Inspect browser console, API logs and error
tracking; no unhandled errors or secret-bearing logs are acceptable.

- [ ] **Step 3: Prove failure behavior**

Manually verify:

```text
API restart preserves active public release
expired access token refreshes once
revoked refresh session cannot be reused
stale save returns 409 and preserves both browser documents
R2 upload with wrong MIME is rejected
Resend outage leaves lead stored and visible
database restore reproduces active release and lead
```

- [ ] **Step 4: Update the execution program**

Mark P1 complete only when every Gate P1 checkbox has command or deployed evidence.
Write the Phase 2 plan from actual public API contracts, operational incidents,
bundle metrics and first-user feedback; do not pre-plan custom domains or billing
against assumptions.

## Gate P1

- [ ] Separate backend repository has a green Node 24 CI gate.
- [ ] Architecture test prevents controller-to-Prisma and cross-module infrastructure imports.
- [ ] New user can register, verify email and publish from a clean browser.
- [ ] Same draft opens on a second authenticated device/session.
- [ ] Stale save returns `409 PROJECT_VERSION_CONFLICT` without overwriting either document.
- [ ] Published output reads an immutable release, not the draft.
- [ ] Visitor can submit a validated form and owner sees the stored lead.
- [ ] Media upload uses a short-lived presigned R2 URL and verified metadata.
- [ ] Restarting API does not affect an active public release.
- [ ] Backup restore is tested in a non-production environment.
- [ ] Both production dependency trees pass `npm audit --omit=dev`.

## Architecture review checklist

- [ ] Every controller delegates to one application use case.
- [ ] Every provider SDK is behind a port and isolated in infrastructure.
- [ ] No business module imports another module's infrastructure.
- [ ] Cross-module calls use only `application/public.ts` ports.
- [ ] No Prisma type crosses an application or API boundary.
- [ ] Transactions protect each multi-record invariant.
- [ ] Contract version and golden fixtures match in both repositories.
- [ ] Workspace membership is checked before every private aggregate read/write.
- [ ] Public queries expose only active release data.
- [ ] Email side effects are persisted in the outbox with idempotent delivery.
- [ ] Error codes are stable and mapped once in the frontend.
- [ ] Unit tests cover domain/application behavior without Nest TestBed or PostgreSQL.
- [ ] Repository contract tests cover fake and Prisma adapters.
- [ ] E2E tests cover HTTP/auth/database integration.
- [ ] Architecture, security audit, build and browser gates are mandatory in CI.
