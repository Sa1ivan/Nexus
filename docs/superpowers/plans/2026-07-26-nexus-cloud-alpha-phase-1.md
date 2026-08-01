# Nexus Cloud Alpha Phase 1 Implementation Plan

> **For agentic workers:** implement this plan task-by-task with the repository's
> execution and verification skills. Checkbox state is evidence-bearing: only P1-00 is
> complete in this document; later tasks remain open until their implementation gates
> have fresh evidence.

**Goal:** Move Nexus from local demo storage to authenticated cloud projects, immutable
public releases, managed media, and server-side lead capture without weakening the
proven P0 editor contracts.

**Repositories:** The Angular application remains in `Sa1ivan/Nexus.UI`. The backend is
a separate repository, `Sa1ivan/Nexus.BC`, checked out as sibling `../Nexus.BC`. No
backend source is added to the frontend repository.

**Tech stack:** Node.js 24, NestJS 11, strict TypeScript, PostgreSQL, Prisma ORM 7,
Jest/Supertest, Docker, Railway, Cloudflare R2 through the S3 API, Resend, Angular 20
HTTP adapters, and GitHub Actions.

## Task P1-00: Reconcile Cloud Alpha architecture contracts

**Files:**

- Modify only:
  `docs/superpowers/plans/2026-07-26-nexus-cloud-alpha-phase-1.md`
- Do not create `Nexus.BC` or change frontend code in this task.

- [x] **Step 1: Reconcile module and table ownership**

  One `sites` module owns `Project`, `ProjectRevision`, `Release`, `ActiveRelease`,
  atomic save/publish, and anonymous active-release reads. The ownership matrix below
  permits database foreign keys across owned tables but forbids direct writes through
  another module's repositories or infrastructure.

- [x] **Step 2: Reconcile contracts and bounded schemas**

  The plan now freezes the current frontend `SiteConfig` v4 shape, defines one limits
  table, separates typed booking context from configured form fields, defines stable
  public URLs, and makes managed media a synchronized v5 rollout.

- [x] **Step 3: Reconcile consistency and delivery semantics**

  Create, save, publish, and lead idempotency; `ActiveRelease`; transaction
  coordinators; outbox leases; tenant isolation; and concurrency tests are specified
  as executable contracts.

- [x] **Step 4: Reconcile every implementation task**

  P1-01 through P1-10 use the same modules, schema versions, file paths, endpoint
  topology, frontend ports, Prisma relations, gates, and commit scopes.

- [x] **Step 5: Close architecture review findings**

  Preserve shipped bundled-media paths, persist honeypot replay results, preserve closed
  P0 regressions, bind consent and retention/deletion, add minimal append-only audit and
  sample-aware lead/retention alerts, and make PostgreSQL plus complete retained-row R2
  recovery—including standalone media-library assets—measurable against explicit Alpha
  RPO/RTO. Fence publish/delete and outbox delivery races, retain stale-v4 input without
  premature retirement, keep opaque UUID-v4 deleted-submission tombstones, allocate
  audit sequence gap-free in business transactions, count only observed delivery
  failures, pair DB/R2 cutoffs, and ship durable external deletion coverage in P1-07
  before purge/recovery promotion.

### Gate P1-00

- [x] The document has one `sites` lifecycle owner and no separate project, release,
      or public-site module.
- [x] SiteConfig v4 and the synchronized v5 media rollout are explicit and bounded.
- [x] Idempotency, active release, typed form submission, outbox leasing, and hosting
      contracts include failure and concurrency semantics.
- [x] Privacy retention/deletion, no-PII audit, metrics/alert thresholds, and joint
      database/media recovery across every retained reference and non-deleted media row
      are executable contracts with acceptance evidence.
- [x] Media/outbox concurrency, stale-client conversion, deleted-lead replay, fenced
      asynchronous deletion, recovery-pair completeness, and durable deletion
      watermarks have explicit failure and race tests.
- [x] Audit watermark order is commit-safe, final-claim crashes preserve logical failure
      budget, public tombstones cannot contain caller PII, and v4 retirement begins only
      after P1-09 telemetry in a later reviewed change.
- [x] Every later task points to the reconciled contracts; P1-01 remains backend
      bootstrap only and begins only after this gate.
- [x] Node 24 CI and separate frontend/backend repositories remain mandatory.

P1-01 may start only after this gate is committed. P1-00 does not authorize creating
the backend scaffold or changing Angular code.

## Fixed decisions

- Frontend остаётся в `Sa1ivan/Nexus.UI`; backend — только в `Sa1ivan/Nexus.BC`.
- Backend local path: sibling `../Nexus.BC`.
- Backend architecture is a modular monolith: one NestJS process and one PostgreSQL
  database for Alpha. Each business module contains `domain`, `application`,
  `infrastructure`, and `api` layers where applicable.
- `SiteConfig` is a versioned JSON document. The current Angular contract is v4 with
  one shared `SiteConfig.chrome.header`, one shared `SiteConfig.chrome.footer`, and
  page-owned content blocks. The existing codec migrates v1, v2, and v3 to v4.
- P1-04 accepts cloud writes only as bounded v4 documents and rejects data URLs.
  P1-06 synchronously introduces v5 managed-media references. No v4 contract contains
  or implies `assetId`.
- A project owns a mutable draft. `ProjectRevision` and `Release` are immutable
  snapshots. `ActiveRelease` is the only public activation pointer.
- The server generates an immutable, globally unique `publicSlug` at project creation.
  Every authenticated editor response for a project includes that slug and the
  absolute `publicUrl` derived from it.
- The Angular access token lives in memory. The refresh token is stored only in an
  `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- Provider SDKs are allowed only in the owning module's infrastructure adapters.
- Email uses a PostgreSQL outbox. Committing a business operation never depends on
  Resend availability.
- Alpha public hosting is path-based. Wildcard/custom domains and SSR are P2 work.

## Module boundaries and ownership

Allowed dependencies within one module:

```text
api -> application -> domain
infrastructure -> application + domain
domain -> nothing outside its own module and shared/kernel
```

Cross-module calls may import only
`src/modules/<module>/application/public.ts`. That barrel exports ports and DTOs, not
concrete providers. Controllers and application use cases never import Prisma.

### Module/table ownership matrix

| Owner                | Owned tables                                                             | May expose                                                                                     |
| -------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `auth`               | `User`, `RefreshSession`, `EmailVerificationToken`, `PasswordResetToken` | authenticated principal and notification-data read ports                                       |
| `workspaces`         | `Workspace`, `Membership`                                                | membership authorization and workspace read ports                                              |
| `sites`              | `Project`, `ProjectRevision`, `Release`, `ActiveRelease`                 | editor commands/queries, active-release public reads, and transaction-aware submission context |
| `media`              | `MediaAsset`, `MediaImportBatch`                                         | upload/import commands, asset reads, attachment, and publish validation                        |
| `forms`              | `Lead`                                                                   | public submission and authorized inbox commands/queries                                        |
| `notifications`      | `Outbox`                                                                 | transaction-aware enqueue and leased delivery                                                  |
| `shared/idempotency` | `IdempotencyRecord`                                                      | transaction-aware idempotency execution primitive                                              |
| `shared/audit`       | `AuditSequence`, `AuditEvent`                                            | gap-free transaction-aware append-only audit writer/exporter                                   |

Database foreign keys across these tables are allowed and required where they protect
an invariant. For example, `Lead(projectId, releaseId)` references
`Release(projectId, id)`, and `MediaAsset.projectId` references `Project.id`. A foreign
key does not grant write ownership: only the owner repository may insert, update, or
delete its table. Another module must use the owner's exported application port.

Forbidden:

- importing `PrismaService`, `@prisma/client`, or another module's infrastructure from
  a controller or application use case;
- returning Prisma types or domain entities through an API boundary;
- putting business logic in `shared`, `common`, controllers, or transport mappers;
- reading `process.env` outside the typed configuration boundary;
- invoking R2, Resend, or any provider without its application port;
- publishing a mutable draft;
- direct writes through another module's repository, adapter, or Prisma table access;
- assuming that a cross-module foreign key is prohibited;
- accepting caller-supplied workspace ownership, versions, timestamps, object keys,
  final media URLs, or public slugs.

Target backend structure:

```text
Nexus.BC/
  contracts/
    site-config/
      v4.schema.json
      v5.schema.json
      fixtures/
      manifest.sha256
  prisma/
    schema.prisma
    migrations/
    seed.ts
  src/
    app.module.ts
    main.ts
    shared/
      kernel/
      config/
      database/
      http/
      idempotency/
      audit/
    modules/
      auth/
        domain/
        application/
        infrastructure/
        api/
      workspaces/
        domain/
        application/
        infrastructure/
        api/
      sites/
        domain/
        application/
        infrastructure/
        api/
      media/
        domain/
        application/
        infrastructure/
        api/
      forms/
        domain/
        application/
        infrastructure/
        api/
      notifications/
        application/
        infrastructure/
  test/
    architecture/
    contract/
    e2e/
```

### Transaction coordinators

`shared/database` exposes an opaque `TransactionContext` and `TransactionRunner`.
Only database infrastructure can unwrap that context to a Prisma transaction client.
Repositories and exported transactional ports accept the opaque context; business
modules never pass Prisma-generated types.

- `sites` owns `CreateProject`, `SaveDraft`, `PublishProject`, and `ActivateRelease`
  transaction coordination. Save atomically updates the version and appends a
  revision. Publish atomically performs OCC, appends a revision and release, and
  upserts `ActiveRelease`.
- `forms` owns `SubmitLead` coordination. It obtains and locks the immutable active
  release context through the `sites` application port, validates the request, then
  writes `Lead` and calls the notifications transactional enqueue port in the same
  database transaction.
- `notifications` owns `Outbox` rows and their lease/delivery transitions. It never
  owns `Lead`, directly reads or mutates forms tables, or controls the lead transaction.
  It obtains email presentation data through a forms application read port.
- `auth` similarly uses the notifications transactional enqueue port when an auth
  command must queue a verification or reset message.

## Stable URLs and hosting topology

Production origins are fixed for Alpha:

```text
Angular application: https://app.nexus.site
API:                 https://api.nexus.site/v1
Public home page:    https://app.nexus.site/p/:publicSlug
Public child page:   https://app.nexus.site/p/:publicSlug/:pageSlug
```

`publicUrl` is absolute, uses the application origin from typed backend configuration,
and has no trailing slash: `https://app.nexus.site/p/<percent-encoded-publicSlug>`.
The slug is server-generated at create, stable for the life of the project, and not
reassigned after deletion during Alpha.

Railway hosts the API and PostgreSQL. The Angular static host/CDN rewrites every
non-file request under `/p/*` to `index.html`; Angular then resolves the public route
and fetches the active release from the API. Static assets with a file extension are
served normally and a genuinely missing asset remains 404. API paths are never sent
through the SPA fallback. Direct navigation and refresh of both public route shapes
must pass browser tests.

Wildcard customer subdomains, custom-domain verification/TLS/routing, edge rendering,
and SSR are explicitly deferred to P2.

## SiteConfig contracts

### v4 shape and limits

The backend v4 JSON Schema mirrors the current Angular model: one site id/name, theme,
business metadata, SEO, shared `chrome.header` and `chrome.footer`, and pages containing
only page-owned content blocks. A page cannot contain another header or footer.

All object schemas use `additionalProperties: false`; discriminated block schemas list
their exact fields. Array counts and string lengths are measured after JSON decoding.
Byte limits are measured on the UTF-8 serialization of the parsed JSON value using the
same canonical serializer in both repositories.

One normative limits table applies everywhere:

| Limit                                                 |             Value | Enforcement                                                   |
| ----------------------------------------------------- | ----------------: | ------------------------------------------------------------- |
| Normal cloud `SiteConfig` UTF-8 bytes                 |         1,048,576 | before any transaction on create/save/publish                 |
| Normal JSON HTTP parser envelope                      |   1,310,720 bytes | reject at HTTP parser before DTO/schema validation            |
| Legacy migration import envelope                      |   5,242,880 bytes | migration-only parser; never used by normal cloud endpoints   |
| JSON nesting depth                                    |                32 | streaming preflight plus schema validation                    |
| Pages per site                                        |                50 | v4 and v5 schema                                              |
| Page-owned blocks per page                            |               100 | shared header/footer are not counted as page blocks           |
| Collection items per block                            |               100 | each list/gallery/FAQ/testimonial/offer/navigation collection |
| Form fields per `leadForm`                            |                32 | schema and submission validation                              |
| IDs, anchors, slugs, operation keys                   |    128 characters | non-empty; IDs unique in their documented scope               |
| URL/link target or bundled media path                 |  2,048 characters | only an allowed scheme/shape for its discriminant             |
| Labels, names, titles, alt text, and form prompt text |    256 characters | schema                                                        |
| Long content/body/description/help/SEO text           | 10,000 characters | schema                                                        |

At least one page is required. Page ids and page slugs are unique per site; block ids
are unique across shared chrome and every page. Anchors are unique within a rendered
page including shared chrome. Collection-item ids and form-field ids are unique within
their containing block. Page slugs are lowercase normalized URL segments, contain no
slash, and reject reserved values. `http:`, credentials in URLs, protocol-relative
URLs, script schemes, control characters, and traversal segments are rejected.

The normal validation order is:

1. enforce the 1,310,720-byte parser envelope;
2. parse JSON with a maximum nesting depth of 32;
3. require exactly the endpoint-supported schema version;
4. validate JSON Schema, semantic uniqueness, link safety, and media policy;
5. canonical-serialize and enforce the 1,048,576-byte document limit;
6. compute the idempotency request hash;
7. begin the transaction.

No validation failure in steps 1-5 creates a project, revision, release, lead,
idempotency record, or outbox row.

### v4 media policy and legacy import

The v4 media value remains exactly the current shape:

```ts
interface MediaAssetV4 {
  readonly src: string;
  readonly alt: string;
  readonly focalPoint?: { readonly x: number; readonly y: number };
}
```

There is no `assetId` in v4. Normal P1-04 cloud writes reject every `data:` URL.
Accepted v4 sources are HTTPS URLs without credentials and the shipped bundled forms
`images/<path>` and `./images/<path>`. Validation canonicalizes both bundled forms to
`images/<path>` before size measurement, hashing, and persistence. A bundled path is at
most 2,048 characters, must contain a non-empty path below `images/`, and rejects
absolute paths, `.`/`..` segments, backslashes, query, fragment, percent-encoded
traversal, and control characters. `blob:`, `file:`, protocol-relative, `/assets/`, and
application-route paths are rejected.

The migration UI may read at most 5,242,880 bytes and only source versions 1, 2, 3,
or 4. It runs the existing v1/v2/v3 codec migrations to v4, extracts every data URL,
rejects malformed/unsupported encoded media, and substitutes the deterministic
validation-only source `https://import.invalid/<sha256>` for each extracted value. The
marker is never persisted. That normalized, extracted v4 value must pass the complete
v4 schema and 1,048,576-byte cloud limit before any project-create call.

After that check, the UI uploads extracted bytes to a workspace-owned, expiring media
import batch, completes server verification, and maps the returned asset ids to managed
v5 references. Safe remaining v4 sources map to their v5 discriminants. The v5 create
request includes the batch id. In the `sites` create transaction, the media exported
port verifies that every referenced batch asset is `READY` and belongs to the caller's
workspace, then attaches those rows to the newly inserted project. Failed or expired
batches are never attached and are garbage-collected with their objects. Unknown and
future source versions are rejected without local deletion, staging upload, or cloud
project write.

### Synchronized v5 media rollout

P1-06 introduces `SiteConfig` v5 in coordinated backend and frontend PRs with identical
schemas and fixtures. Its media union is:

```ts
type MediaReferenceV5 =
  | {
      readonly kind: 'managed';
      readonly assetId: string;
      readonly alt: string;
      readonly focalPoint?: { readonly x: number; readonly y: number };
    }
  | {
      readonly kind: 'external';
      readonly src: string;
      readonly alt: string;
      readonly focalPoint?: { readonly x: number; readonly y: number };
    }
  | {
      readonly kind: 'bundled';
      readonly path: string;
      readonly alt: string;
      readonly focalPoint?: { readonly x: number; readonly y: number };
    };
```

`external.src` must be HTTPS, at most 2,048 characters, and contain no credentials or
control characters. The backend never fetches it. `bundled.path` uses the same logical
canonical `images/<path>` shape as v4, never `./images/` or `/assets/`, and applies the
same traversal/query/fragment/control-character checks. The public read DTO explicitly
resolves it against the Angular bundled-assets base before rendering. Managed
references contain no public URL; read DTO mapping resolves a verified asset to its
delivery URL.

Rollout order is fixed:

1. merge identical v5 schema, codec, and golden fixtures in both repositories;
2. deploy backend dual-read support plus bounded v4/v5 input compatibility, while v4
   remains the write version;
3. deploy the Angular client capable of reading both and emitting v5 only after the API
   capability response advertises v5;
4. enable v5 storage while retaining bounded v4/v5 input compatibility throughout P1-06
   and Cloud Alpha. Bounded v4 save/publish input is canonicalized, validated, converted
   server-side to v5 inside the same sites transaction, and persisted only as one v5
   draft/revision/release result. Data URLs remain rejected and there is no dual stored
   representation;
5. keep immutable v4 releases readable forever under their retention policy; never
   rewrite them in place. P1-06 does not remove or disable the v4 input adapter and has
   no dependency on telemetry introduced later.

A stale pre-v5 tab may save and publish during compatibility with normal OCC and
idempotency semantics; its successful response is v5 and reloading reads the single v5
result. After P1-09 metrics exist, P1-10/post-deploy operations may start the retirement
observation: 44 consecutive days with zero accepted v4 writes in
`site_config_write_total{input_version="4"}` and capability telemetry showing only
v5-capable active clients. This exceeds the measured 30-day cache/old-client maximum by
14 days; any v4 write resets the full observation. P1-10 records whether the observation
is in progress or satisfied but does not remove compatibility. Only a later separately
reviewed change may retire the adapter after the satisfied observation; then stale v4
gets `426 CLIENT_UPGRADE_REQUIRED`. Cloud Alpha may ship with compatibility enabled.

Publish traverses every media reference. A managed asset must be `READY`, not deleted,
belong to the authenticated workspace and project, and match the server-verified MIME,
magic bytes, byte size, decoded dimensions, and SHA-256 checksum. `PENDING`, foreign,
missing, corrupt, mismatched, or deleting assets fail publish with a stable 409 error;
none can appear in an active release.

Save, publish, and media deletion use one lock order: acquire the project-scoped
transaction advisory lock, then lock managed `MediaAsset` rows in sorted asset-id order.
Inside the `sites` save/publish transaction, a transaction-aware media application port
accepts the opaque `TransactionContext`, selects every referenced managed asset with a
conflicting row lock, and performs ownership/readiness/integrity validation before the
revision or release write. No sites code imports media infrastructure or Prisma types.

Media deletion uses the same opaque context and lock order, takes the conflicting asset
row lock, then calls a transaction-aware sites application port to recheck every
retained reference: current draft, every retained ProjectRevision, every active or
inactive Release/rollback candidate, and therefore every retained Lead-linked Release.
Any reference returns `409 MEDIA_ASSET_IN_USE`; deletion changes neither row nor object.
The row may enter soft-delete/cleanup only after every such reference has been removed
or expired under its owning retention policy. Publish/save versus delete therefore
serialize: either deletion commits first and validation fails, or validation/release
commits first and deletion sees the new retained reference.

### Golden fixtures

The backend and frontend both keep byte-identical fixture files plus
`manifest.sha256`. Contract tests compare the manifest before testing behavior. The
set includes:

```text
v4-minimal-valid.json
v4-full-valid.json
v4-shared-chrome-valid.json
v4-bundled-images-valid.json
v4-bundled-dot-images-valid.json
v4-bundled-traversal-rejected.json
v4-data-url-rejected.json
v4-envelope-over-limit.json
v4-document-over-limit.json
v4-pages-over-limit.json
v4-blocks-over-limit.json
v4-collection-over-limit.json
v4-form-fields-over-limit.json
v4-depth-over-limit.json
v4-duplicate-identifiers.json
v4-unsafe-link.json
legacy-v1-import.json
legacy-v2-import.json
legacy-v3-import.json
future-version-rejected.json
v5-managed-valid.json
v5-managed-missing-asset-id.json
v5-external-unsafe.json
v5-bundled-traversal.json
```

Boundary fixtures are generated deterministically and assert both the last accepted
value and first rejected value for byte, count, depth, and string limits. The two valid
v4 bundled fixtures must decode to the same canonical `images/...` value; the traversal
fixture proves rejection before transaction.

## Idempotency and concurrency

Create, save, publish, and public lead submission are idempotent operations.
Authenticated mutation endpoints require an `Idempotency-Key` header. The controller
maps it unchanged to application `operationId`; it is 1-128 characters and scoped by
workspace plus operation kind. Lead submission requires `submissionId` in the body and
an `Idempotency-Key` with exactly the same value, scoped by project plus `SUBMIT_LEAD`.
For public submissions both values must be the same canonical lowercase UUID v4
(`xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx`) generated client-side with
`crypto.randomUUID()`. Arbitrary text—including email, phone, or name—uppercase/non-v4
UUIDs, missing, and mismatched values return `400 INVALID_SUBMISSION_ID` before a
transaction or idempotency record.

After transport/schema validation, the server builds a canonical request from the
operation kind, normalized route ids, authenticated scope, and all semantic body
fields. It excludes the idempotency header itself, uses RFC 8785 JSON canonicalization,
encodes UTF-8, and stores a lowercase SHA-256 request hash. Content strings are not
trimmed or otherwise altered merely for hashing.

`shared/idempotency` owns:

```prisma
model IdempotencyRecord {
  scope        String
  operation    String
  key          String
  requestHash  String
  httpStatus   Int
  responseBody Json
  resourceId   String?
  createdAt    DateTime @default(now())
  completedAt  DateTime @default(now())
  @@id([scope, operation, key])
  @@index([resourceId])
}
```

Alpha retains authenticated site-operation records for the project lifetime. Public
lead/honeypot records are scoped to and retained for the project lifetime even after the
Lead is owner-deleted or retention-purged. Their stored public response is always the
generic `{ accepted: true, submissionId }`, contains no lead id/content/deletion state,
and remains replayable. Lead deletion clears nullable `resourceId` through the
transactional idempotency port but never removes `scope`, `key`, `requestHash`, status,
or response identity. The coordinator obtains a PostgreSQL transaction advisory lock derived from
`scope + operation + key`, reads the record, and applies these rules:

- same key and same request hash returns the stored status and semantic response,
  including the original ids and versions, even after commit succeeded but the HTTP
  response was lost; the envelope may contain the current request id;
- same key and a different request hash returns
  `409 IDEMPOTENCY_KEY_REUSED` and performs no business write;
- no record runs the command and persists its non-5xx result in the same transaction as
  all business writes;
- validation failures before the transaction and every 5xx result are not persisted;
  a thrown/unexpected error rolls back both business state and the idempotency record;
- a new key with a stale expected version returns and records
  `409 PROJECT_VERSION_CONFLICT`, with no revision or release;
- two simultaneous requests with the same key serialize on the advisory lock; only one
  executes. Different keys race through OCC, so at most one request for a given
  expected draft version succeeds.

Business-operation uniqueness complements the retained idempotency record:

- `Project` has `@@unique([workspaceId, createOperationId])`;
- `ProjectRevision` has `@@unique([projectId, operationId])` in addition to version
  uniqueness;
- `Release` has `@@unique([projectId, operationId])` in addition to version uniqueness;
- `Lead` has `@@unique([projectId, submissionId])` while the Lead exists; after deletion,
  the project-lifetime IdempotencyRecord remains the authoritative submission tombstone.

The idempotency contract matrix is mandatory:

| Case                                            | Expected result                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| same create key and payload after response loss | original 201 project, one project and one initial revision       |
| same save key and payload concurrently          | same 200 project/version, one appended revision                  |
| same publish key and payload concurrently       | same 200 release, one revision/release and one activation change |
| same lead key/submission id and payload         | same 202 receipt, one lead and one outbox event                  |
| same honeypot key and payload                   | same generic 202, one idempotency record and no lead/outbox      |
| honeypot key with changed semantic payload      | 409 `IDEMPOTENCY_KEY_REUSED`, no lead/outbox                     |
| same lead key/payload after delete or purge     | same generic 202, no new lead/outbox or deletion disclosure      |
| deleted/purged lead key with changed payload    | 409 `IDEMPOTENCY_KEY_REUSED`, no lead/outbox                     |
| same key with any semantic payload change       | 409 `IDEMPOTENCY_KEY_REUSED`, no write                           |
| new save/publish key with stale version         | 409 `PROJECT_VERSION_CONFLICT`, no revision/release              |
| failure before commit                           | no business write and no idempotency record                      |
| commit succeeds and response is lost            | retry returns the committed stored result                        |

## Active release and public isolation

There is no activation column on `Project`. The lifecycle tables use a composite
relationship that makes cross-project activation impossible. This is the final P1
relation view; each task adds its owned relation fields when the referenced model is
introduced, so an intermediate migration never references a not-yet-created model:

```prisma
model Project {
  id                 String            @id @default(uuid()) @db.Uuid
  workspaceId        String            @db.Uuid
  createOperationId  String
  name               String
  publicSlug         String            @unique
  draft              Json
  draftSchemaVersion Int
  draftVersion       Int               @default(1)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  workspace          Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  revisions          ProjectRevision[]
  releases           Release[]
  activeRelease      ActiveRelease?    @relation("ProjectActivation")
  mediaAssets        MediaAsset[]
  @@unique([workspaceId, createOperationId])
  @@index([workspaceId, updatedAt])
}

model ProjectRevision {
  id            String   @id @default(uuid()) @db.Uuid
  projectId     String   @db.Uuid
  operationId   String
  version       Int
  siteConfig    Json
  schemaVersion Int
  createdAt     DateTime @default(now())
  project       Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  @@unique([projectId, version])
  @@unique([projectId, operationId])
}

model Release {
  id            String          @id @default(uuid()) @db.Uuid
  projectId     String          @db.Uuid
  operationId   String
  version       Int
  siteConfig    Json
  schemaVersion Int
  publishedAt   DateTime        @default(now())
  project       Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  activations   ActiveRelease[] @relation("ReleaseActivation")
  leads         Lead[]
  @@unique([projectId, id])
  @@unique([projectId, version])
  @@unique([projectId, operationId])
}

model ActiveRelease {
  projectId   String   @id @db.Uuid
  releaseId   String   @db.Uuid
  activatedAt DateTime @default(now())
  project     Project  @relation("ProjectActivation", fields: [projectId], references: [id], onDelete: Cascade)
  release     Release  @relation("ReleaseActivation", fields: [projectId, releaseId], references: [projectId, id], onDelete: Cascade)
  @@index([releaseId])
}
```

The anonymous query starts from `Project.publicSlug`, joins `ActiveRelease` on
`projectId`, then joins `Release` on both `projectId` and `releaseId`. It never accepts
a workspace id from the caller and never reads `Project.draft`. A release belonging to
another project or workspace cannot satisfy the composite join. Unknown slug, no
active release, hidden/missing page, and a page slug belonging to another project all
return the same 404 shape without exposing tenant existence.

## Public form submission contract

`POST /v1/public/sites/:publicSlug/leads` accepts exactly:

```ts
interface PublicLeadSubmissionV1 {
  readonly submissionId: string;
  readonly blockId: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly bookingContext?: {
    readonly kind: 'booking';
    readonly date: string;
    readonly partySize: number;
  };
  readonly consent: {
    readonly accepted: true;
    readonly noticeVersion: string;
  };
  readonly honeypot: string;
}
```

Unknown top-level, consent, or booking properties are rejected. The request parser
limit is 65,536 UTF-8 bytes. `submissionId` is the exact canonical 36-character UUID v4
defined by the idempotency contract; `blockId` and `consent.noticeVersion` use the
128-character ID limit. The public response supplies the configured Alpha privacy
notice URL and immutable version; submission requires `accepted: true` and that exact
version. A stale or unknown version is rejected before a lead write. `fields` has at
most 32 entries and must contain exactly configured field ids
for which a value is submitted; an unknown id is rejected, required configured fields
must be non-empty, and omitted optional fields are stored as empty/absent according to
one mapper. Values for `text`, `email`, and `tel` are at most 256 characters;
`textarea` is at most 10,000. Email/tel format and all configured field types are
validated from the immutable release. `honeypot` is at most 256 characters. A non-empty
honeypot enters the normal idempotency transaction and persists the generic 202 result,
but creates no Lead or Outbox row. Repeating the same key and canonical honeypot payload
replays that result; changing any semantic payload under the key returns
`409 IDEMPOTENCY_KEY_REUSED`.

`bookingContext` is not merged into `fields`. Its date is strict ISO `YYYY-MM-DD`, a
real calendar date from today through 365 days ahead in the Alpha `bookingTimeZone`
from typed backend configuration, and `partySize` is an integer from 1 through 20. It
is allowed only when the
active release's shared `chrome.header.booking.action` has kind `anchor`, its target is
exactly `#<anchor>`, and that anchor resolves to exactly one visible `leadForm` across
the site whose id equals submitted `blockId`. Publish rejects an ambiguous booking
target. A missing declaration, another target form, hidden target, or malformed
context returns `400 BOOKING_CONTEXT_NOT_CONFIGURED` without a lead.

`SubmitLead` obtains the active release using a transaction-aware `sites` port that
locks its `ActiveRelease` row for the validation/read window. Publish/activation waits
for that lock, giving submissions a defined before-or-after order. The lead stores the
exact immutable `releaseId` used for validation:

```prisma
model Lead {
  id             String     @id @default(uuid()) @db.Uuid
  projectId      String     @db.Uuid
  releaseId      String     @db.Uuid
  submissionId   String
  blockId        String
  fields         Json
  bookingContext Json?
  consent        Json
  status         LeadStatus @default(NEW)
  createdAt      DateTime   @default(now())
  retentionUntil DateTime
  release        Release    @relation(fields: [projectId, releaseId], references: [projectId, id], onDelete: Cascade)
  @@unique([projectId, submissionId])
  @@index([projectId, createdAt])
}
```

The body never accepts `projectId`, `releaseId`, workspace id, status, retention, or
timestamps. `consent` stores only `{ accepted: true, noticeVersion }`; lead contents,
booking values, and contact PII never enter audit metadata, metrics labels, or logs.

Alpha lead retention is a typed setting `leadRetentionDays`, default 90 and bounded
from 1 through 365. Submission computes `retentionUntil = createdAt + configured days`
inside the transaction. An `OWNER` may request deletion; editors may only change status.
Deletion is consistently asynchronous: the endpoint returns 202 and sets
`Lead.status = DELETION_PENDING`, appends one PII-free deletion AuditEvent, and keeps the
project-lifetime idempotency tombstone. The lead is not reported deleted and is not
hard-deleted until that AuditEvent is durably exported outside the primary backup
domain and the notifications delivery fence is terminal.

Owner deletion and the hourly expiry job use the same forms coordinator. Through the
notifications transactional port they acquire/check the Outbox delivery fence. A READY
event is claimed with a fresh cancellation `claimToken` and cancelled before send. An
unexpired SENDING event cannot be cancelled underneath the provider call; deletion
remains pending until that fenced attempt reaches DELIVERED, READY, DEAD_LETTER, or
CANCELLED, then cancels if needed and purges. An expired SENDING lease may be fenced and
cancelled because provider timeout is shorter than the lease. The purge claims at most
100 expired leads per transaction with `SKIP LOCKED` and continues in bounded batches.
Polling/repeated DELETE returns 202 while pending and 204 only after durable tombstone
export, terminal delivery handling, Lead hard-delete, and idempotency `resourceId`
clearing. No second audit tombstone is appended. Backup copies are encrypted,
inaccessible to product reads, and age out within 30 days; restore applies durable
post-snapshot tombstones before traffic.

## Outbox schema and delivery semantics

`notifications` owns this technical delivery table:

```prisma
enum OutboxDeliveryState {
  READY
  SENDING
  DELIVERED
  DEAD_LETTER
  CANCELLED
}

model Outbox {
  id                     String    @id @default(uuid()) @db.Uuid
  eventId                String    @unique @db.Uuid
  businessIdempotencyKey String    @unique @db.VarChar(256)
  kind                   String
  aggregateType          String
  aggregateId            String
  payload                Json
  secretCiphertext       Bytes?
  secretExpiresAt        DateTime?
  secretRedactedAt       DateTime?
  availableAt            DateTime  @default(now())
  state                  OutboxDeliveryState @default(READY)
  lockedUntil            DateTime?
  lockedBy               String?
  claimToken             String?   @db.Uuid
  attemptOrdinal         Int?
  attempts               Int       @default(0)
  maxAttempts            Int       @default(10)
  deliveredAt            DateTime?
  deadLetterAt           DateTime?
  cancelledAt            DateTime?
  lastErrorCode          String?
  createdAt              DateTime  @default(now())
  @@index([deliveredAt, deadLetterAt, availableAt, lockedUntil])
}
```

The uniqueness is per immutable `eventId` and producer-defined business idempotency
key such as `forms:lead-received:<leadId>` or `auth:verify:<tokenRecordId>`. There is no
unique constraint on kind plus aggregate id; a business aggregate may legitimately
produce multiple event kinds and later events.

The forms transaction writes only `{ leadId }` in `payload`; lead field contents,
email addresses, and booking data remain in forms-owned storage. The worker calls an
exported forms read port after claiming the event and never mutates forms tables.

The worker protocol is fixed:

1. `attempts` counts completed, explicitly observed failed delivery outcomes, not
   claims or raw network calls. In a short transaction, select READY due rows or SENDING
   rows whose lease expired using `FOR UPDATE SKIP LOCKED`; rows with
   `attempts = maxAttempts` are terminal and not claimable;
2. generate a fresh cryptographically random `claimToken` for this claim (never the
   reusable process `lockedBy`), set state SENDING, `lockedUntil = now + 60 seconds`, and
   set `attemptOrdinal = attempts + 1` without incrementing `attempts`;
3. call the provider with a hard 45-second timeout, shorter than the lease, and use
   `eventId` as provider idempotency key. A timeout/crash is an unknown outcome, not a
   recorded failure;
4. every success, retry, dead-letter, or cancellation transition performs a conditional
   update by `eventId + claimToken + state=SENDING` and must affect exactly one row. Zero
   rows means a stale worker/fence and is a no-op; it may not clear or requeue state;
5. success sets DELIVERED/`deliveredAt`. An explicit failed outcome conditionally sets
   `attempts = attemptOrdinal`; if that is below maxAttempts it sets READY and schedules
   `now + min(30 seconds * 2^(attempts - 1), 1 hour) + 0-10% jitter`. Recording the
   maxAttempts-th explicit failure sets DEAD_LETTER/`deadLetterAt`, redacts secret
   material, and alerts. A claim, timeout, or crash alone never consumes failure budget
   or dead-letters;
6. reclaiming an expired/unknown SENDING outcome installs a new claimToken but repeats
   the same logical `attemptOrdinal = attempts + 1`. A late prior worker cannot mutate
   the row. Stable provider idempotency reconciles an accepted prior call; otherwise the
   logical ordinal is retried. Raw network calls may exceed maxAttempts after unknown
   outcomes, but no ordinal exceeds maxAttempts and at most maxAttempts explicit failed
   outcomes can be recorded.

Lead cancellation uses the same fence. To cancel READY or expired SENDING work, the
notifications port installs a fresh cancellation claimToken and conditionally moves it
to CANCELLED. For an unexpired SENDING call it returns `IN_FLIGHT`; forms remains
DELETION_PENDING and retries after the terminal transition/lease. A call cannot outlive
its lease because of the 45-second provider timeout. A crash after the final logical
claim is reclaimed at the same max ordinal: provider idempotency resolves accepted send
to success, while an explicit max-th failure dead-letters. DELIVERED, DEAD_LETTER, and
CANCELLED rows are never claimed.

Verification/reset raw secrets are normally generated inside auth and queued only as
AES-256-GCM ciphertext using a dedicated typed encryption key. Their outbox row has a
short expiry no later than the underlying single-use token. The raw value is never put
in `payload`, database logs, application logs, error events, or API responses other
than the intentional local-test capture. The worker decrypts only immediately before
delivery and clears `secretCiphertext` on delivery, expiry, or dead-lettering. If the
secret is expired, the row is redacted and dead-lettered without sending.

## Append-only audit contract

`shared/audit` owns a minimal append-only table and a transaction-aware `AuditWriter`
port. No application adapter exposes update/delete operations:

```prisma
model AuditEvent {
  id           String   @id @default(uuid()) @db.Uuid
  eventId      String   @unique @db.Uuid
  sequence     BigInt   @unique
  workspaceId  String?  @db.Uuid
  actorUserId  String?  @db.Uuid
  action       String   @db.VarChar(128)
  resourceType String   @db.VarChar(64)
  resourceId   String   @db.VarChar(128)
  metadata     Json
  requestId    String   @db.VarChar(128)
  occurredAt   DateTime @default(now())
  @@index([workspaceId, occurredAt])
  @@index([resourceType, resourceId, occurredAt])
}

model AuditSequence {
  id        Int    @id
  nextValue BigInt
}
```

The foundation migration bootstraps exactly one `AuditSequence` row
`{ id: 1, nextValue: 1 }`; application roles cannot insert another row or update it
except through `AuditWriter`. Before inserting an AuditEvent, the writer selects that
row `FOR UPDATE` inside the caller's same business transaction, assigns
`sequence = nextValue`, and increments `nextValue`. PostgreSQL holds the singleton lock
until commit, so sequence N commits before another transaction can allocate N+1. A
rollback rolls back both increment and event insert, leaving no gap. Sequence uniqueness
plus the singleton primary key are database constraints, not in-memory assumptions.

Callers append in the same transaction for membership-role changes, project publish or
activation, media verification/deletion, lead status change, owner deletion, and
retention purge. `metadata` is action-specific and allowlisted to non-PII values such
as prior/next status, release id, outcome, and deletion reason. It must never contain
lead fields, email, phone, booking context, consent contents, tokens, object URLs, or
secret material. Tests reject non-allowlisted keys, prove business rollback removes the
audit append and reuses its uncommitted number, prove concurrent allocators commit in
gap-free order, prove successful writes append once, and prove no application code can
mutate an event or bypass/duplicate the singleton allocator.

The audit exporter is deliberately not a generic event platform. It scans by monotonic
`sequence`, writes each AuditEvent idempotently as immutable
`audit/events/<eventId>.json` in a separately credentialed, versioned recovery bucket,
and advances an external versioned checkpoint only across the highest contiguous
exported sequence. Each object contains eventId, sequence, action, resource id,
occurredAt, and allowlisted non-PII metadata; it never contains lead fields, contact
data, booking, consent contents, or secrets. Retrying the same eventId must verify the
same checksum and create no semantic duplicate.

For privacy/retention deletion, the external event object is the durable deletion
tombstone. Forms may finalize hard deletion only after the audit port verifies that
eventId is present and the external checkpoint covers its sequence. Export retries with
the outbox backoff policy. Warn when checkpoint lag exceeds 10 minutes or one export
attempt fails; page after three consecutive failures or lag above 30 minutes. Restore
requires continuous checkpoint coverage through its explicit recovery cutoff, applies
every deletion tombstone newer than the selected database cutoff before promotion, and
fails promotion on a gap, checksum mismatch, lost export, or insufficient watermark.

## Frontend ports and consumers

The current local repository is intentionally broad. P1-08 replaces it with four
cloud-facing ports and one local preference; it must not introduce one broad network
repository.

| Port                      | Exact operations                                                                                                                                   | Consumers                                                                                    |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ProjectRepository`       | `getProject`, `createProject`, `saveDraft`, `publishProject`, `listRevisions`                                                                      | create flow, builder project store, autosave/manual save, publish controls, revision history |
| `PublicSiteRepository`    | `getActiveSite(publicSlug, pageSlug?)`, `submitLead(publicSlug, request)`                                                                          | public route resolver/renderer and public lead form                                          |
| `LeadInboxRepository`     | `listLeads(workspaceId, projectId, cursor)`, `setLeadStatus(workspaceId, projectId, leadId, status)`, `deleteLead(workspaceId, projectId, leadId)` | authorized lead inbox; delete is owner-only                                                  |
| `WorkspaceReadRepository` | `listProjectSummaries(workspaceId)`, `getWorkspaceMetrics(workspaceId)`                                                                            | workspace dashboard/project picker and insights cards                                        |
| `ActiveProjectPreference` | `get`, `set`, `clear` in local browser storage                                                                                                     | navigation convenience only; never synchronized as a cloud aggregate                         |

Concrete network adapters are named `HttpEditorProjectRepository`,
`HttpPublicSiteRepository`, `HttpLeadInboxRepository`, and
`HttpWorkspaceReadRepository`. Local behavior may share a storage engine internally,
but its adapters implement the same narrow ports. Generated OpenAPI DTOs stay inside
the HTTP adapters and are mapped to frontend domain models.

Authenticated editor project DTOs always include:

```ts
interface EditorProjectIdentityDto {
  readonly id: string;
  readonly workspaceId: string;
  readonly publicSlug: string;
  readonly publicUrl: string;
}
```

The backend is authoritative for `publicUrl`; the frontend does not construct a
subdomain or substitute a project id.

## Alpha metrics, alerts, and recovery objectives

`shared/observability` exposes a provider-neutral metrics port. Metrics use route
templates, operation names, result classes, and provider error classes only; workspace,
project, lead, user, email, URL, free text, and other high-cardinality/PII values are
forbidden as labels. Alpha records:

- API request count, latency histogram, 4xx/5xx count, and rate-limit count;
- database readiness failures, query latency, active/idle connections, waiters, and
  configured-pool utilization;
- OCC conflict count, publish success/failure and duration;
- `site_config_write_total` with bounded `input_version` (`4`, `5`), operation, and
  result labels plus v5-capability active-client count for the later retirement gate;
- `nexus_lead_submission_total` with bounded `kind` (`genuine`, `abuse`) and `outcome`
  (`persisted`, `genuine_5xx`, `rejected`, `honeypot`, `rate_limited`) labels;
  `nexus_lead_retention_run_total{outcome="success"|"failed"}` and the
  `nexus_lead_retention_overdue` gauge, without lead contents;
- outbox ready count, oldest-ready age, delivery/retry/lease-reclaim/dead-letter counts;
- R2 upload initiation/completion latency, provider failures, and verification failure
  classes without keys or URLs.

Alert rules are concrete and deliberately small for Alpha:

- page when API 5xx exceeds 5% for 5 minutes with at least 50 requests, or route p95
  exceeds 2 seconds for 10 minutes with at least 100 requests;
- page after two consecutive database readiness failures or pool utilization above 90%
  for 5 minutes;
- notify when OCC conflicts exceed 30% of save/publish attempts for 15 minutes with at
  least 20 attempts, or publish failures exceed 20% for 15 minutes with at least 10;
- page when oldest ready outbox age exceeds 10 minutes, ready rows exceed 100, or any
  event reaches dead letter;
- notify when R2 provider failures exceed 10% of upload/complete calls for 10 minutes
  with at least 10 calls; content verification mismatches are measured but page only if
  they exceed 20% for 15 minutes with at least 20 completions;
- page when the 5-minute increase of
  `nexus_lead_submission_total{outcome="genuine_5xx"}` divided by the 5-minute increase
  of `nexus_lead_submission_total{kind="genuine"}` exceeds 5%, with at least 20 genuine
  submissions. A window with zero or fewer than 20 genuine samples never pages;
- warn, but do not page, when the combined 5-minute increase for outcomes `honeypot` and
  `rate_limited` reaches 200, or exceeds 80% of all public submission attempts with at
  least 100 attempts;
- page on one `nexus_lead_retention_run_total{outcome="failed"}` scheduled run. Warn when
  `nexus_lead_retention_overdue` is greater than zero for 15 minutes, where overdue means
  `retentionUntil < now - 24 hours`; page if that backlog remains nonzero for 60 minutes.

Alpha recovery targets are **RPO <= 24 hours** and **RTO <= 4 hours** for PostgreSQL and
managed media together. PostgreSQL encrypted backups run at least daily and retain 30
days. The R2 bucket has object versioning enabled; application deletion first marks a
media row/object soft-deleted, while object versions and delete markers are retained 30
days before lifecycle removal. A daily immutable inventory records object key,
version id, size, ETag, and Nexus SHA-256 checksum in a separately access-controlled
recovery prefix. Backup access is limited to the recovery role and is tested, not used
by product reads.

Every database backup records `dbBackupId` and `dbCutoffUtc`. Its recovery inventory
records `r2InventoryId`, `inventoryGeneratedAtUtc`, verification status, and the exact
retained MediaAsset row/version set from that database snapshot. A valid
`recoveryPairId` exists only when the inventory was generated and checksum-verified
after `dbCutoffUtc` and contains every retained MediaAsset object version required by
that snapshot. Recovery selects the latest complete pair whose database cutoff is no
older than 24 hours. A missing row/version, an inventory generated before the DB cutoff,
or an unverified/incomplete manifest fails promotion rather than mixing independent
backup times. Incident response also freezes an explicit `recoveryCutoffUtc`; the
external audit checkpoint must continuously cover through that cutoff.

`docs/runbooks/cloud-alpha-recovery.md` is the executable recovery runbook. It restores
PostgreSQL into an isolated environment, runs migrations, purges leads already beyond
`retentionUntil`, and reapplies post-snapshot lead-deletion AuditEvents from the
operations audit export whose sequence is after the database snapshot checkpoint and
whose occurrence is at or before `recoveryCutoffUtc`. Missing continuous external
watermark coverage fails promotion. Alpha does not prune ProjectRevision or Release
rows. The
required media set therefore traverses managed references from every current
`Project.draft`, every retained `ProjectRevision.siteConfig`, every retained immutable
`Release.siteConfig` (active or inactive rollback candidate), every `ActiveRelease`, and
every immutable Release referenced by a retained Lead, then includes every referenced
`MediaAsset` row/object. It also includes every other retained, non-deleted `MediaAsset`
row and its retained object version, including READY media-library assets not referenced
by any SiteConfig. If cleanup/retention removes such an asset, the media owner must
coordinate row and object deletion before the restore snapshot; a retained row is never
silently excluded. If a later retention policy prunes revisions or releases, only rows
retained at the recovery point are included, but no retained database reference may
point to an unrestored object.

The runbook restores the exact R2 object versions, streams each object, and verifies
bytes, size, magic/MIME, dimensions, and SHA-256 before traffic. Acceptance opens the
editor's current draft, revision/history and rollback candidate, active public pages,
retained lead context, and a standalone unreferenced READY asset through media-library
listing/object access. Promotion requires both targets and the invariant that every
retained non-deleted MediaAsset row resolves to an object version whose bytes, checksum,
MIME, size, and dimensions match; no retained row or reference may dangle. Run the full
drill before Alpha launch, monthly, and after backup/storage-policy changes. Evidence
records the recoveryPairId, both source ids, all UTC cutoffs/checkpoints, manifest
verification, and measured RPO/RTO.

## Cross-repository acceptance matrix

| Contract             | Required evidence                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Site lifecycle owner | architecture test finds only `sites` lifecycle repositories and no forbidden infrastructure imports                                        |
| Tenant isolation     | authenticated workspace A cannot read/write B; public slug/page lookup cannot escape its project or release                                |
| Schema bounds        | mirrored golden fixtures agree on every byte/count/depth/string boundary and reject unknown versions before a transaction                  |
| Response-loss retry  | create/save/publish/lead commit, simulated connection loss, retry, and row counts prove one result                                         |
| OCC race             | different keys at one expected version produce one success and one version conflict                                                        |
| Active release       | composite FK and public join cannot activate or expose another project's release                                                           |
| v4 media policy      | both shipped bundled forms canonicalize to `images/...`; data URL/traversal/query/fragment fail before transaction                         |
| v5 media safety      | readiness checks plus publish/delete race and draft/history/active/inactive/rollback reference deletion tests pass                         |
| v5 compatibility     | P1-06 retains v4 adapter and stores one v5 result; post-P1 retirement requires P1-09 telemetry plus 44 zero-v4 days                        |
| Typed booking        | booking is stored separately only for the active release's declared target form                                                            |
| Lead atomicity       | canonical UUID-v4 stores atomically; text/PII key rejects; deleted/purged PII-free tombstone replays without new Lead/Outbox               |
| Privacy/retention    | notice version binds consent; retention bound, owner delete, expiry purge, and backup erasure behavior pass without PII logs               |
| Append-only audit    | transaction-locked allocator is gap-free; eventId export/checkpoint is durable; lost export blocks deletion/resurrection/promotion         |
| Outbox fencing       | claims do not spend failure budget; late/final-claim crash repeats one ordinal; max-th recorded failure dead-letters safely                |
| Secret hygiene       | queued auth secrets are encrypted, expire, redact, and never appear in logs/payload snapshots                                              |
| Metrics and alerts   | lead error zero/min-sample rules, abuse warning, failed purge page, overdue backlog warn/page, and other thresholds pass                   |
| DB and R2 recovery   | explicit DB/inventory UTC pair is complete and post-cutoff; all assets/tombstones restore with no dangling/resurrected data within RPO/RTO |
| Public deep link     | fresh browser navigation and refresh work for `/p/:publicSlug` and its optional page slug                                                  |

## Common verification gate

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

Frontend after HTTP adapters exist:

```bash
npm run verify
```

Cloud Alpha deployed sequence:

```text
register -> verify email -> create workspace -> create project -> autosave
-> upload image -> publish -> open path-based public URL in isolated browser
-> submit lead -> open owner inbox -> edit on second session
-> prove stale save returns 409 without data loss
```

## Task P1-01: Bootstrap the separate backend repository

**Prerequisite:** Gate P1-00 is committed. This task is bootstrap only; it does not
implement business tables, endpoints, or Angular changes.

**Files in `../Nexus.BC`:**

- Create NestJS application scaffold
- Create: `.nvmrc`, `.env.example`, `.github/workflows/ci.yml`
- Create: `test/architecture/module-boundaries.spec.ts`
- Modify: `package.json`, `tsconfig.json`, `src/app.module.ts`

- [ ] **Step 1: Create and connect the separate repository**

```bash
git clone git@github.com:Sa1ivan/Nexus.BC.git
```

Run the exact clone command from the parent directory so it creates sibling
`../Nexus.BC`, then scaffold a strict NestJS 11 application there. Verify its `.git`
and `origin`; do not nest it in Nexus.UI.

- [ ] **Step 2: Pin Node 24 and verification commands**

  `.nvmrc` contains `24`; `engines.node` is `>=24`. Add `lint`, `architecture`, `test`,
  `test:e2e`, `build`, `format`, `format:check`, and composite `verify` scripts.

- [ ] **Step 3: Write the RED architecture test**

  Parse imports under `src/modules` with the TypeScript compiler API. Enforce the
  same-module layer graph and allow cross-module imports only through
  `application/public.ts`. Assert only module infrastructure, `shared/database`, and
  named Prisma adapters under `shared/idempotency` or `shared/audit` import Prisma
  symbols; controllers contain neither Prisma nor provider SDK symbols.

- [ ] **Step 4: Add root modules and Node 24 CI**

  Create empty root modules for `auth`, `workspaces`, `sites`, `media`, `forms`, and
  `notifications`. `AppModule` imports them without business providers. GitHub Actions
  uses `actions/setup-node` with Node 24, PostgreSQL 17, `npm ci`, migrations, `verify`,
  and the production dependency audit.

- [ ] **Step 5: Verify and commit**

```bash
npm run verify
git add .nvmrc .env.example .github package.json package-lock.json tsconfig.json src test
git commit -m "chore: bootstrap Nexus.BC architecture"
```

## Task P1-02: Typed configuration, errors, health, database, and transaction kernel

**Files in `../Nexus.BC`:**

- Create: `src/shared/config/app-config.schema.ts`
- Create: `src/shared/http/api-error.filter.ts`
- Create: `src/shared/http/request-id.middleware.ts`
- Create: `src/shared/database/prisma.module.ts`
- Create: `src/shared/database/transaction-runner.ts`
- Create: `src/shared/audit/audit-writer.ts`, `prisma-audit-writer.ts`
- Create: `src/shared/health/health.controller.ts`
- Create: `prisma/schema.prisma`, `prisma.config.ts`
- Test: `test/e2e/health.e2e-spec.ts`
- Test: `test/e2e/audit-sequence.e2e-spec.ts`

- [ ] **Step 1: Write RED configuration and health tests**

  Outside test mode bootstrap fails if database, JWT/refresh, web origin, R2, Resend,
  email-from, or outbox encryption configuration is missing. `/v1/health/live` returns
  200 independently; `/v1/health/ready` returns 503 when PostgreSQL is unavailable.

- [ ] **Step 2: Implement one typed configuration boundary**

  Only its validation factory reads `process.env`. Include `nodeEnv`, `port`,
  `databaseUrl`, `webOrigin`, `bookingTimeZone` (an IANA zone; Alpha defaults to
  `Europe/Moscow`), `privacyNoticeUrl`, `privacyNoticeVersion`, `leadRetentionDays`
  (1-365, default 90), access/refresh secrets, R2 settings, Resend settings, `emailFrom`,
  and a 32-byte outbox secret-encryption key. Production rejects non-HTTPS origins and
  privacy notice URLs.

- [ ] **Step 3: Standardize API errors**

  All non-2xx responses use `{ error: { code, message, requestId, details? } }`. Map
  validation 400, authentication 401, authorization 403, missing resource 404,
  idempotency/version conflicts 409, rate limits 429, and unexpected errors 500 without
  stack traces or secret-bearing details.

- [ ] **Step 4: Add Prisma lifecycle, opaque transactions, and append-only audit**

  `PrismaService` owns connect/disconnect and the Prisma 7 PostgreSQL driver adapter.
  `TransactionRunner` is the only creator/unwrapper of `TransactionContext`. Apply the
  foundation migration with singleton `AuditSequence` bootstrap and `AuditEvent`, expose
  only the transaction-aware allocator/append port, and test row locking, uniqueness,
  rollback number reuse, concurrent gap-free commit order, and metadata allowlisting.

- [ ] **Step 5: Verify and commit**

```bash
npx prisma format
npx prisma migrate dev --name foundation
npm run verify
git add .env.example prisma prisma.config.ts src/shared test/e2e
git commit -m "feat: add backend runtime foundation"
```

## Task P1-03: Identity, workspace tenancy, and transactional auth messages

**Files in `../Nexus.BC`:**

- Create under `src/modules/auth/`: domain, use cases, ports, Prisma/JWT/cookie adapters,
  and controllers
- Create under `src/modules/workspaces/`: domain, authorization, repositories, and
  controllers
- Create: `src/modules/notifications/application/public.ts`
- Create: `src/modules/notifications/infrastructure/prisma-outbox.ts`
- Modify: `prisma/schema.prisma`
- Test: `test/e2e/auth-workspaces.e2e-spec.ts`

- [ ] **Step 1: Add identity and tenancy schema**

  Add `User`, `Workspace`, `Membership`, and rotating `RefreshSession` tables. Add
  hashed, single-use, expiring verification/reset token records. Do not store raw
  authentication secrets. `WorkspaceRole` contains `OWNER` and `EDITOR`.

- [ ] **Step 2: Add the notifications enqueue boundary and Outbox table**

  Implement the exact Outbox schema above. Export only a transaction-aware enqueue
  port. Auth supplies identifier-only payload plus encrypted, expiring secret material;
  the notifications adapter writes it inside the auth coordinator's transaction.

- [ ] **Step 3: Write RED auth and tenant tests**

  Cover register/duplicate/login-before-verification/verify/login/refresh rotation,
  reuse-family revocation, logout, password reset, owner access, non-member 404, editor
  membership denial, and atomic auth-token plus outbox creation. Assert ciphertext and
  log redaction.

- [ ] **Step 4: Implement use cases and authorization**

  Implement one use case per command/query. Passwords use pinned Argon2id parameters.
  Access JWT lifetime is 10 minutes. The global authentication guard is opt-out only
  via `@Public()`. Workspace membership is resolved server-side. Cookie endpoints are
  POST-only, validate `Origin`, and use endpoint-specific rate limits. Membership-role
  changes append their allowlisted AuditEvent in the membership transaction.

- [ ] **Step 5: Verify and commit**

```bash
npx prisma migrate dev --name identity_tenancy_outbox
npm run verify
git add prisma src/modules/auth src/modules/workspaces src/modules/notifications test
git commit -m "feat: add identity and workspace tenancy"
```

## Task P1-04: Sites, v4 drafts, revisions, and optimistic concurrency

**Files in `../Nexus.BC`:**

- Create under `src/modules/sites/domain/`: project and revision models
- Create: `src/modules/sites/application/public.ts`
- Create one application use case per create/read/save/revision operation
- Create: `src/modules/sites/infrastructure/prisma-site.repository.ts`
- Create: `src/modules/sites/api/sites.controller.ts`
- Create: `src/shared/idempotency/*`
- Create: `contracts/site-config/v4.schema.json`
- Create: `contracts/site-config/fixtures/*`, `contracts/site-config/manifest.sha256`
- Modify: `prisma/schema.prisma`
- Test: `test/contract/site-repository.contract.ts`
- Test: `test/contract/site-config-v4.contract.ts`
- Test: `test/e2e/sites.e2e-spec.ts`

**Coordinated contract files in Nexus.UI:**

- Create: `contracts/site-config/v4.schema.json`
- Create: `contracts/site-config/fixtures/*`, `contracts/site-config/manifest.sha256`
- Test the mirrored fixtures through the existing v1/v2/v3-to-v4 codec

- [ ] **Step 1: Freeze bounded SiteConfig v4**

  Implement the normative v4 shape, limits, validation order, safe media-source policy,
  and byte-identical golden fixtures in both repositories. Normal cloud endpoints accept
  exactly v4, canonicalize both shipped `images/...` and `./images/...` bundled sources
  to `images/...`, and reject data URLs, unsafe bundled paths, legacy versions, and
  future versions before a transaction.

- [ ] **Step 2: Add Project, ProjectRevision, and IdempotencyRecord**

  Use the reconciled Prisma fields and uniqueness constraints above. Creation generates
  stable `publicSlug`/`publicUrl`, version 1, and revision 1 in one `sites` transaction.
  Add `Workspace.projects` and the matching Project workspace relation in this
  migration. Add the shared idempotency adapter without putting business rules in
  `shared`.

- [ ] **Step 3: Write RED repository and HTTP contract tests**

  Run the site repository contract against an in-memory fake and Prisma. Prove create,
  save version increment, immutable revisions, tenant isolation, bounds, validation
  before writes, public identity stability, operation uniqueness, all idempotency matrix
  create/save cases, bundled-source compatibility/canonicalization, and an OCC race with
  different keys.

- [ ] **Step 4: Implement atomic save**

  Under the coordinator/idempotency transaction, update with `id`, `workspaceId`, and
  `draftVersion = expectedDraftVersion`; increment the draft version and append exactly
  one revision with `operationId`. A zero-row update returns
  `PROJECT_VERSION_CONFLICT` without a revision. The schema version written here is 4.

- [ ] **Step 5: Add authenticated editor endpoints**

```http
GET  /v1/workspaces/:workspaceId/projects/:projectId
GET  /v1/workspaces/:workspaceId/projects
POST /v1/workspaces/:workspaceId/projects
PUT  /v1/workspaces/:workspaceId/projects/:projectId/draft
GET  /v1/workspaces/:workspaceId/projects/:projectId/revisions
```

POST/PUT require `Idempotency-Key`; save includes `expectedDraftVersion` and
`siteConfig`. Responses include stable `publicSlug` and absolute `publicUrl`. The
collection endpoint returns summaries for `WorkspaceReadRepository`; it is not an
editor-aggregate operation.

- [ ] **Step 6: Verify and commit**

```bash
# Nexus.BC
npx prisma migrate dev --name sites_v4_drafts
npm run verify
git add contracts prisma src/modules/sites src/shared/idempotency test
git commit -m "feat: add versioned cloud sites"

# Nexus.UI contract mirror
npm run verify
git add contracts src/app/features/builder/data-access
git commit -m "test: mirror cloud SiteConfig v4 contract"
```

## Task P1-05: Immutable releases, ActiveRelease, and public reads

**Files in `../Nexus.BC`:**

- Create under `src/modules/sites/domain/`: release and activation models
- Create under `src/modules/sites/application/`: publish, activate, and public queries
- Extend: `src/modules/sites/infrastructure/prisma-site.repository.ts`
- Create: `src/modules/sites/api/public-sites.controller.ts`
- Modify: `prisma/schema.prisma`
- Test: `test/e2e/public-release.e2e-spec.ts`

- [ ] **Step 1: Add Release and ActiveRelease**

  Apply the exact composite schema above. There is no project activation column.
  Rollback means activating an existing immutable release through the same composite
  constraint and membership authorization.

- [ ] **Step 2: Write RED publish and public-read tests**

  Cover atomic OCC/revision/release/activation, immutable public output after later
  draft edits, rollback pointer-only behavior, operation uniqueness, response-loss
  retry, different-key OCC race, tenant-isolated composite joins, unknown slug/page
  404, and no draft/workspace/user leakage.

- [ ] **Step 3: Implement publish as one sites transaction**

  Validate v4 before the transaction; inside it perform the version-guarded draft
  update, append one revision and one release with the operation id, and upsert
  `ActiveRelease`, then append an allowlisted publish/activation AuditEvent. The
  activation becomes visible only at commit. The same-key stored result returns the
  original release after response loss.

- [ ] **Step 4: Add publish and public endpoints**

```http
POST /v1/workspaces/:workspaceId/projects/:projectId/publish
POST /v1/workspaces/:workspaceId/projects/:projectId/releases/:releaseId/activate
GET  /v1/public/sites/:publicSlug
GET  /v1/public/sites/:publicSlug/pages/:pageSlug
```

Publish/activate require `Idempotency-Key`. Public responses include immutable
`releaseId`, release version, resolved shared chrome/theme/business/SEO, and selected
page plus the configured privacy notice URL/version, but no workspace, user, revision,
or draft data.

- [ ] **Step 5: Verify and commit**

```bash
npx prisma migrate dev --name site_releases_activation
npm run verify
git add prisma src/modules/sites test/e2e/public-release.e2e-spec.ts
git commit -m "feat: add immutable active releases"
```

## Task P1-06: Managed media and synchronized SiteConfig v5

**Files in `../Nexus.BC`:**

- Create under `src/modules/media/domain/`: metadata and verification rules
- Create: `src/modules/media/application/public.ts`
- Create: `src/modules/media/application/ports/object-storage.ts`
- Create upload/complete/delete use cases and media controller
- Create: `src/modules/media/infrastructure/r2-object-storage.ts`
- Create: `contracts/site-config/v5.schema.json` and v5 fixtures
- Modify: `src/modules/sites/application/*`, `prisma/schema.prisma`
- Test: `test/contract/object-storage.contract.ts`
- Test: `test/contract/site-config-v5.contract.ts`
- Test: `test/e2e/media.e2e-spec.ts`
- Test: `test/e2e/media-publish-delete-race.e2e-spec.ts`
- Modify mirrored v5 schema/codecs/fixtures in Nexus.UI in the coordinated frontend PR

- [ ] **Step 1: Define the provider-independent storage port**

  Support presigned PUT, metadata head, bounded streaming read for checksum/magic/image
  inspection, and delete. Return provider-neutral values. Only the R2 adapter imports
  AWS SDK packages. URLs expire in five minutes. Normal object keys are generated as
  `workspaces/<workspaceId>/projects/<projectId>/<assetId>/<safeName>`; unattached
  migration keys use `workspaces/<workspaceId>/imports/<batchId>/<assetId>/<safeName>`.

- [ ] **Step 2: Add MediaAsset and completion verification**

  Allow JPEG, PNG, and WebP up to 10 MiB, at most 12,000 pixels on either axis and at
  most 40,000,000 decoded pixels. Store `PENDING`, `READY`, and `DELETING`, declared
  metadata, verified MIME, size, width, height, SHA-256 checksum, object key, timestamps,
  and nullable deletion marker. Completion streams the object and verifies magic bytes,
  decoded dimensions, exact size/checksum, extension policy, and ownership; it never
  trusts client MIME, size, key, bucket, URL, ETag, checksum, or dimensions.

  `MediaImportBatch` belongs to one workspace, expires after 24 hours, and can be
  attached once. Its assets have nullable `projectId` until the media transactional
  attachment port is called by `sites` during create. The port rejects unready,
  expired, already-attached, unreferenced-extra, or foreign assets; successful create
  sets every referenced asset's project id in the same database transaction.
  Successful media verification and deletion append allowlisted AuditEvents in their
  owning transactions without object key, URL, filename, or user content.

- [ ] **Step 3: Write RED media and publish tests**

  Cover foreign ownership, mismatch/corruption, oversize, expired pending upload,
  idempotent completion, unattached cleanup, and every v5 publish readiness failure from
  the acceptance matrix. Add deterministic publish-vs-delete and save-vs-delete races
  and deletion rejection for references in current draft, retained revision, active
  release, inactive release/rollback candidate, and retained lead-linked release. Prove
  both sides use the transactional media/sites ports with opaque TransactionContext and
  no cross-module Prisma import. A pending/foreign/deleted asset must not activate a
  release.

- [ ] **Step 4: Execute the synchronized v5 rollout**

  Follow the P1-06 compatibility rollout steps in this plan. The discriminated v5 union
  is the only place `assetId` enters SiteConfig. Convert safe v4 external media and
  canonicalized `images/...` bundled media without rewriting old releases. Backend
  capability discovery gates frontend v5 writes. Test a stale pre-v5 tab saving and
  publishing bounded v4, atomic conversion to one v5 result, OCC/idempotency, and
  immutable v4-release reads. Keep v4 input compatibility enabled in the P1-06 commit;
  telemetry, observation, and any later retirement are P1-09/P1-10/post-P1 work.

- [ ] **Step 5: Add media endpoints**

```http
POST   /v1/workspaces/:workspaceId/projects/:projectId/media/uploads
POST   /v1/workspaces/:workspaceId/projects/:projectId/media/:assetId/complete
GET    /v1/workspaces/:workspaceId/projects/:projectId/media
DELETE /v1/workspaces/:workspaceId/projects/:projectId/media/:assetId
POST   /v1/workspaces/:workspaceId/media/import-batches
POST   /v1/workspaces/:workspaceId/media/import-batches/:batchId/uploads
POST   /v1/workspaces/:workspaceId/media/import-batches/:batchId/media/:assetId/complete
```

- [ ] **Step 6: Verify both coordinated PRs and commit separately**

```bash
# Nexus.BC
npx prisma migrate dev --name managed_media_site_config_v5
npm run verify
git add contracts prisma src/modules/media src/modules/sites test
git commit -m "feat: add managed media and SiteConfig v5"

# Nexus.UI coordinated PR
npm run verify
git add contracts src package.json package-lock.json
git commit -m "feat: support managed media SiteConfig v5"
```

## Task P1-07: Server-side forms, lead inbox, and leased notifications

**Files in `../Nexus.BC`:**

- Create under `src/modules/forms/`: lead domain, ports, submit/inbox use cases, Prisma
  adapter, retention worker, and public/authenticated controllers
- Extend: `src/modules/sites/application/public.ts`
- Extend: `src/modules/workspaces/application/*` and workspace API composition query
- Create: `src/modules/notifications/infrastructure/resend-email-sender.ts`
- Create: `src/modules/notifications/infrastructure/outbox-worker.ts`
- Modify: `src/modules/notifications/infrastructure/prisma-outbox.ts`
- Create: `src/shared/audit/audit-exporter.ts`
- Create: `src/shared/audit/versioned-recovery-audit-storage.ts`
- Modify: `src/shared/config/app-config.schema.ts`, `.env.example`
- Modify: `prisma/schema.prisma`
- Test: `test/e2e/forms.e2e-spec.ts`
- Test: `test/e2e/outbox-worker.e2e-spec.ts`
- Test: `test/contract/audit-exporter.contract.ts`

- [ ] **Step 1: Add Lead and submission DTO schema**

  Apply the exact Lead schema, request body, 64-KiB parser bound, field limits,
  notice-version consent, honeypot behavior, typed booking rules, `retentionUntil`,
  immutable release reference, and composite FK defined above. Public input never
  chooses project/release/workspace identity or retention.

- [ ] **Step 2: Write RED form integrity and idempotency tests**

  Cover configured/unknown/oversized fields, required values, notice-version consent,
  same/changed-payload honeypot idempotency,
  rate-limit scope by public slug plus client address, active-release lock ordering,
  typed booking accepted only for the declared form, separate storage, tenant inbox
  authorization, same-key retry, changed-payload conflict, response-loss recovery,
  retention-bound computation, owner-only async deletion, and bounded scheduled expiry
  purge. After owner deletion and retention purge, prove same submission key/payload
  returns the same generic 202 with no new Lead/Outbox while changed payload returns 409;
  the project-lifetime idempotency tombstone contains no PII/deletion disclosure. Test
  canonical client UUID-v4 acceptance and pre-transaction rejection of text/email/phone,
  uppercase, malformed, or non-v4 submission ids. Assert no lead content/PII appears in
  audit, metrics, or logs.

- [ ] **Step 3: Implement the forms transaction coordinator**

  Through exported ports, lock/read active release, validate its immutable form/privacy
  notice, write Lead with `retentionUntil`, enqueue `{ leadId }`, append the allowlisted
  audit event, and persist the 202 idempotency result in one transaction. Any failure
  commits none. The honeypot branch persists only its idempotency result in that same
  coordinator and creates no Lead, Outbox, or audit event. Resend failure after commit
  never removes or hides a genuine lead. Implement owner deletion and hourly bounded
  purge with the durable-tombstone, delivery-fence, cancel/redact/delete, 202-pending,
  and final-204 semantics above.

- [ ] **Step 4: Implement lease/retry/dead-letter delivery**

  Implement the exact 60-second lease, `SKIP LOCKED`, reclaim, attempts, capped
  exponential backoff/jitter, fresh claimToken fencing, 45-second provider timeout,
  provider idempotency, delivery marking, and secret redaction semantics. Test a late
  worker after reclaim, zero-row stale transitions, crash after the final logical claim,
  repeated ordinal/provider de-duplication, maxAttempts recorded failed outcomes, and
  dead-letter only after the max-th observed failure. Also test deletion before send,
  deletion during SENDING, provider completion versus deletion, and lease-expiry
  reclaim/cancel. A lead
  is never purged underneath an in-flight call. Notifications reads lead content through
  a forms application port and never accesses forms infrastructure/tables.

  In this task, ship the production audit exporter/checkpoint storage adapter and typed
  recovery-bucket credentials required by final deletion. Run exporter contract tests
  for immutable eventId writes, checksum-idempotent retry, contiguous checkpoint,
  rollback/concurrent allocator order, lost-export retry, and deletion remaining pending
  until durable coverage. P1-07 deletion must not depend on code deferred to P1-09.

- [ ] **Step 5: Add endpoints**

```http
POST  /v1/public/sites/:publicSlug/leads
GET   /v1/workspaces/:workspaceId/projects/:projectId/leads
PATCH /v1/workspaces/:workspaceId/projects/:projectId/leads/:leadId
DELETE /v1/workspaces/:workspaceId/projects/:projectId/leads/:leadId
GET   /v1/workspaces/:workspaceId/metrics
```

Accepted genuine and honeypot submissions both return a generic 202 envelope. Inbox
endpoints require membership; status changes accept only `READ` or `ARCHIVED` from
the owner/editor policy, while delete requires `OWNER`, returns 202 while
DELETION_PENDING, and returns repeat-safe 204 only after final purge. The metrics query
authorizes through workspaces, then composes project-summary counts from the sites read
port and lead counts from the forms read port; it does not import either module's
infrastructure.

- [ ] **Step 6: Verify and commit**

```bash
npx prisma migrate dev --name forms_and_leased_outbox
npm run verify
git add .env.example prisma src/modules/forms src/modules/notifications src/modules/sites src/modules/workspaces src/shared/audit src/shared/config test
git commit -m "feat: add transactional lead capture"
```

## Task P1-08: Angular auth, split cloud ports, and bounded local migration

**Files in Nexus.UI:**

- Create: `src/app/core/auth/auth-session.store.ts`
- Create: `src/app/core/http/api-client.ts`, `api-error.ts`
- Create narrow HTTP adapters under each owning frontend feature data-access folder
- Create: `src/app/core/preferences/active-project-preference.ts`
- Create: `src/app/features/workspace/pages/local-project-migration-page/*`
- Verify and extend the already mirrored `contracts/site-config/*` fixtures/manifest
- Modify: `src/app/app.config.ts`, `src/app/app.routes.ts`
- Modify current builder/public/workspace/lead consumers to inject the narrow ports
- Test: four port contracts, auth refresh, migration, and cloud browser flow

- [ ] **Step 1: Preserve the closed P0 editor baseline**

  Run the existing regressions for manual-save retry identity, pending debounce flush,
  create-error display, failed-route document clearing, and page-metadata input commits
  before cloud integration and again after adapter switching. Do not reimplement these
  closed follow-ups. Change them only if the cloud integration makes an existing
  regression fail, and keep any fix limited to that demonstrated regression.

- [ ] **Step 2: Split ports and consumer injection**

  Introduce exactly `ProjectRepository`, `PublicSiteRepository`,
  `LeadInboxRepository`, `WorkspaceReadRepository`, and local
  `ActiveProjectPreference` with the operations/consumers table above. Use the four
  named HTTP adapters. Remove cloud use of the current broad repository; do not create
  a broad network facade.

- [ ] **Step 3: Add focused contract suites**

  Run editor behavior against local/cloud editor adapters, public read/submit behavior
  against local/cloud public adapters, inbox behavior against local/cloud inbox
  adapters, and dashboard summaries against local/cloud workspace adapters. Assert
  DTO/domain mapping, stable public identity, version conflicts, typed booking, and
  unchanged stored data after rejected saves.

- [ ] **Step 4: Implement secure auth session handling**

  Keep access tokens in a Signal store, never localStorage. Refresh uses credentials,
  one failed 401 triggers exactly one serialized refresh/retry, and logout clears memory
  even if revocation fails.

- [ ] **Step 5: Implement bounded local-to-cloud migration**

  Offer export first; read at most 5,242,880 bytes; accept only v1-v4 source; normalize
  v1-v3 to v4; extract data URLs; reject unsupported data; validate the deterministic
  extracted v4 representation against all limits including 1,048,576 bytes; stage and
  verify the extracted media in one workspace import batch; convert media to v5; then
  create through the editor port with that batch id. Record local-to-cloud ids only
  after success and never delete local data automatically.

- [ ] **Step 6: Use media/public contracts**

  Local media retains data URL behavior. Cloud media requests a presigned URL, uploads
  to R2, completes server verification, and stores returned `assetId` only in a v5
  managed reference. Public routing uses `publicSlug`/optional `pageSlug` and public lead
  submission displays the configured privacy notice and sends separate booking context,
  accepted notice version, honeypot, a fresh lowercase UUID-v4 submission id generated
  with `crypto.randomUUID()`, and the exactly matching idempotency header.
  The authorized inbox exposes owner-only delete through `LeadInboxRepository` and
  displays `retentionUntil` without putting lead values into telemetry.

- [ ] **Step 7: Write the cloud browser scenario**

  Use isolated owner/visitor contexts to cover create/migrate, second-session autosave,
  media upload, publish, direct public deep-link refresh, typed booking submission,
  inbox display, response-loss retry, stale first-session save, and a retained pre-v5
  tab whose v4 save/publish returns and reloads the single converted v5 result.

- [ ] **Step 8: Verify and commit frontend**

```bash
npm run verify
git add contracts src tests package.json package-lock.json
git commit -m "feat: connect Nexus to split cloud repositories"
```

## Task P1-09: Railway deployment, static hosting, observability, and recovery

**Files in `../Nexus.BC`:**

- Create: `Dockerfile`, `railway.json`, `scripts/verify-backup-restore.ts`
- Create: `scripts/verify-r2-recovery.ts`, `docs/runbooks/cloud-alpha-recovery.md`
- Create: `src/shared/observability/*`
- Harden/monitor the P1-07 audit exporter and external checkpoint adapter
- Modify: `.env.example`, `README.md`
- Test: `test/e2e/runtime-safety.e2e-spec.ts`

**Files in Nexus.UI hosting configuration:**

- Configure SPA fallback for `/p/*` and document application/API origins
- Test direct navigation and refresh in deployed browser acceptance

- [ ] **Step 1: Add a deterministic Node 24 production image**

  Multi-stage build uses `npm ci`, runs non-root, executes `prisma migrate deploy` as a
  Railway pre-deploy command, and starts only compiled JavaScript.

- [ ] **Step 2: Configure staging and production topology**

  Use one API service and PostgreSQL service per Railway environment, R2 for objects,
  Resend for mail, and the static Angular origin/fallback specified above. Secrets live
  in environment variables; production origins require HTTPS. No wildcard/custom
  domain or SSR setup is included. Configure daily encrypted PostgreSQL backups, R2
  versioning, 30-day database backup/object-version retention, application media soft
  delete, daily immutable R2 inventory, and recovery-role access to meet RPO <= 24 hours
  and RTO <= 4 hours.

- [ ] **Step 3: Add append-only audit, metrics, and concrete alerts**

  Logs contain request id, level, route template, status, and duration. Never log
  passwords, tokens, cookies, raw/encrypted auth secrets, lead contents, or R2
  credentials. Error tracking and metrics are behind ports. Implement every API, DB,
  OCC, publish, SiteConfig input-version/capability, lead, outbox, and R2 signal plus every threshold above with
  low-cardinality labels. Operationalize the already-shipped P1-07 audit exporter with
  recovery-bucket monitoring and 10/30-minute lag alerts; retest lost export, retry
  without duplicates, checkpoint gaps, and restore resurrection prevention. Tests use
  fake metric/alert/audit receivers to trigger each threshold and prove tombstone,
  payload, and label PII rejection. Lead tests
  explicitly cover the genuine-submission minimum/zero-sample rule, abuse warning
  without paging, one failed retention-run page, 24-hour overdue-backlog warning, and
  60-minute overdue-backlog page; health probes remain safe.

- [ ] **Step 4: Prove PostgreSQL plus R2 recovery and lease reclaim**

  Back up staging data containing a project, revision, release, ActiveRelease, media,
  retained and expired/deleted leads, AuditEvents, idempotency record, and leased outbox
  row. Fixtures put distinct managed assets in the current draft, a retained revision,
  an inactive rollback Release, the active Release, and a retained Lead's Release, plus
  one standalone unreferenced READY MediaAsset visible in the media library.
  Record a DB backup id/cutoff, generate and verify its R2 inventory strictly after that
  cutoff, and persist the recovery pair manifest. Execute the runbook into an isolated
  environment, select the latest complete <=24-hour pair, freeze recoveryCutoffUtc,
  require continuous external deletion checkpoint coverage, reapply every newer
  tombstone through that cutoff, and prove incomplete/pre-cutoff inventory or missing
  audit coverage blocks promotion. Then reapply deletion events/retention
  purge, traverse every retained reference class and every retained non-deleted
  MediaAsset row, restore exact R2 versions from inventory, and reject any dangling row
  or reference. Verify bytes/checksum/MIME/dimensions, editor current-draft rendering,
  revision/history access, rollback then rendering, original active public rendering,
  retained lead context, and media-library listing/object access for the standalone
  asset. Also test that cleanup coordinates row/object deletion before its snapshot.
  Prove an expired restored lease is reclaimed without duplicating the provider event
  and record pair/source ids, UTC cutoffs/checkpoints, completeness evidence, measured
  RPO <= 24 hours, and RTO <= 4 hours.

- [ ] **Step 5: Verify and commit per repository**

```bash
# Nexus.BC
docker build -t nexus-bc:phase-1 .
npm run verify
git add Dockerfile railway.json scripts src/shared docs/runbooks .env.example README.md test
git commit -m "ops: deploy and observe Nexus cloud alpha"

# Nexus.UI hosting configuration
npm run verify
git add README.md tests
git commit -m "ops: configure path-based public hosting"
```

## Task P1-10: Cloud Alpha gate and handoff

**Files:**

- Modify backend and frontend README files
- Modify frontend `ROADMAP.md`
- Modify: `docs/superpowers/plans/2026-07-25-nexus-roadmap-execution-program.md`
- Create a Phase 2 plan only after deployed findings exist

- [ ] **Step 1: Run clean-install gates in both repositories**

```bash
# Nexus.BC
npm ci
npx prisma migrate deploy
npm run verify
npm audit --omit=dev --audit-level=moderate

# Nexus.UI
npm ci
npx playwright install chromium
npm run verify
npm audit --omit=dev --audit-level=moderate
```

- [ ] **Step 2: Execute the complete acceptance matrix**

  Run every cross-repository matrix row plus the deployed sequence using staging and
  clean owner/visitor browser profiles. Record command output, row counts, response
  codes, screenshots where useful, and relevant sanitized logs.

- [ ] **Step 3: Prove failure and recovery behavior**

  Verify API restart, single refresh, revoked-session denial, response-loss replay,
  stale OCC, tenant-isolated public reads, schema bounds, media readiness failures,
  publish/delete serialization, stale-v4 tab conversion/retirement observation without
  adapter removal, bundled-media
  compatibility, honeypot and deleted-submission replay, privacy notice mismatch,
  async owner delete/retention purge versus SENDING delivery, late-worker claim fencing,
  max-attempt delivery, durable deletion-export loss/retry/watermark gaps, audit PII
  rejection, every metrics alert threshold, Resend outage with stored lead, and complete
  cutoff-paired PostgreSQL/versioned-R2 recovery within RPO/RTO.

- [ ] **Step 4: Update handoff and execution program**

  Mark P1 complete only with evidence for every Gate P1 checkbox. Build the P2 plan
  from deployed contracts, incidents, measurements, and user feedback. P2 may then
  address wildcard/custom domains and SSR. Once P1-09 write-version/capability telemetry
  is live, record the UTC start and progress of the 44-consecutive-day zero-v4
  observation. A v4 write resets it. Cloud Alpha may complete with the adapter enabled;
  a satisfied observation only authorizes a later reviewed retirement change and P1-10
  never disables v4 input itself.

## Gate P1

- [ ] Separate backend repository has a green Node 24 CI gate.
- [ ] Architecture tests enforce the module/table matrix and forbid cross-module
      infrastructure imports while allowing declared database foreign keys.
- [ ] A new user can register, verify email, create a workspace/project, and receive a
      stable path-based public URL.
- [ ] Mirrored v4/v5 schemas and golden-fixture manifests match across repositories.
- [ ] Create/save/publish/lead pass same-key, changed-payload, OCC-race, and
      commit-succeeded/response-lost tests.
- [ ] Public queries read only the tenant-isolated immutable `ActiveRelease` join.
- [ ] Managed media publish checks ownership, readiness, MIME/magic, bytes, dimensions,
      checksum, and deletion state.
- [ ] Save/publish lock every managed asset through the transactional media port;
      deletion rejects every retained draft/revision/active/inactive/rollback reference,
      and publish/delete race tests prove a serial outcome.
- [ ] P1-06 retains bounded v4 input compatibility and stale tabs save/publish to one
      stored v5 result; immutable v4 releases remain readable. After P1-09 metrics, P1-10
      may start/record 44 consecutive zero-v4 days, but retirement requires a later
      reviewed change and is not a Cloud Alpha prerequisite.
- [ ] Typed booking context is separate and accepted only for the active release's
      declared form target.
- [ ] Lead, idempotency result, and identifier-only outbox event commit atomically.
- [ ] Deleted/purged lead submission idempotency remains PII-free for the project
      lifetime: only canonical client-generated UUID v4 is accepted; text/email/phone is
      rejected before transaction; same payload replays generic 202 and changed payload
      returns 409 without recreating Lead/Outbox.
- [ ] Honeypot submission persists a replayable generic 202 idempotency result while
      creating no Lead or Outbox.
- [ ] Consent binds to the configured privacy notice version; bounded retention,
      owner-only deletion, scheduled expiry purge, and no-PII logging/audit are proven.
- [ ] Singleton AuditSequence allocation is locked in the business transaction and
      proves rollback reuse plus gap-free concurrent commit order; AuditEvent mutation
      and PII metadata are rejected.
- [ ] Fresh per-claim outbox fencing prevents late-worker mutation; claims/crashes do not
      spend failure budget; final-claim crash repeats the same logical ordinal;
      maxAttempts recorded failures dead-letter; deletion-vs-SENDING and lease-expiry
      races reach a safe terminal state without purging in flight.
- [ ] Privacy/retention deletion returns 202 pending and finalizes only after its PII-free
      eventId tombstone is idempotently exported with continuous external checkpoint
      coverage by the P1-07 production adapter; lost export retries/alerts and cannot
      resurrect data on restore.
- [ ] API/DB/OCC/publish/lead/outbox/R2 metrics emit with low-cardinality labels and all
      Alpha alert thresholds are tested, including lead zero/minimum-sample behavior,
      abuse warning-only behavior, failed retention-run paging, and 24-hour/60-minute
      overdue-backlog warning/page transitions.
- [ ] Direct navigation/refresh works at both Alpha public route shapes; wildcard/custom
      domains and SSR remain absent.
- [ ] API restart preserves active public output; the recovery drill restores PostgreSQL
      plus every R2 object version referenced by retained current drafts, revisions, all
      active/inactive releases, ActiveRelease, and retained-lead release contexts, plus
      every retained non-deleted MediaAsset including unreferenced READY library assets;
      verifies bytes/checksums and editor/history/rollback/public/lead/library access
      with no dangling retained row/reference; and meets RPO <= 24 hours and
      RTO <= 4 hours.
- [ ] Recovery records UTC DB/inventory/recovery cutoffs and source/pair ids; inventory is
      verified after the DB cutoff and complete for that snapshot, deletion watermark
      covers recovery cutoff, and any incomplete pair/gap blocks promotion.
- [ ] Both production dependency trees pass `npm audit --omit=dev`.

## Architecture review checklist

- [ ] Every controller delegates to one application use case.
- [ ] Every provider SDK is behind a port in owning infrastructure.
- [ ] No business module imports another module's infrastructure.
- [ ] Cross-module calls use only `application/public.ts` ports.
- [ ] No Prisma type crosses an application or API boundary.
- [ ] The ownership matrix has one writer for each table.
- [ ] `sites` coordinates atomic save/publish; `forms` coordinates atomic lead/outbox.
- [ ] Honeypot replay, notice-bound consent, retention, owner deletion, and expiry purge
      follow their transactional contracts.
- [ ] AuditSequence is gap-free/transaction-locked; AuditEvent is append-only and rejects
      PII metadata; the P1-07 exporter provides durable contiguous coverage.
- [ ] Contract limits and golden fixtures match in both repositories.
- [ ] Workspace membership protects every private aggregate read/write.
- [ ] Anonymous reads use the composite active-release join and never the draft.
- [ ] Frontend consumers inject narrow ports; active-project preference stays local.
- [ ] Error codes are stable and mapped once in each HTTP adapter.
- [ ] Unit tests cover domain/application behavior without Nest TestBed or PostgreSQL.
- [ ] Repository contracts cover fake and Prisma adapters where both exist.
- [ ] E2E tests cover HTTP, auth, database, concurrency, and recovery behavior.
- [ ] Metrics/alerts and the joint PostgreSQL/R2 recovery runbook meet their explicit
      Alpha thresholds and objectives.
- [ ] Architecture, audit, build, format, and browser gates are mandatory in CI.
