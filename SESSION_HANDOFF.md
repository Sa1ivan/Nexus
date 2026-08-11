# Nexus — consolidated session handoff

Актуально на 11 августа 2026 года.

Этот документ — единая точка входа для следующей сессии. Он обновляет снимок от
30 июля: P1-00, P1-01 и P1-02 уже завершены, отдельный backend repository создан, а
P1-03 identity/tenancy, P1-04 cloud drafts/concurrency и backend-часть P1-05
release/public reads полностью закрыты production-реализацией, PostgreSQL contracts,
свежими verification gates и review.

## 1. Executive status

- [x] Nexus.UI является рабочим локальным Angular-конструктором, а не статическим
      макетом.
- [x] P0 frontend foundation завершён.
- [x] Все пять follow-up из прежнего P0-review закрыты.
- [x] Frontend прошёл дополнительный аудит correctness, architecture и typing.
- [x] `BuilderStore` и inspector разделены на сфокусированные сервисы и компоненты.
- [x] В production-коде и шаблонах не осталось explicit `any` и `$any`.
- [x] Последний полный frontend gate зелёный.
- [x] P1-00 завершён: Cloud Alpha plan и architecture contracts согласованы.
- [x] P1-01 завершён: отдельный `Nexus.BC` bootstrap и architecture gate созданы.
- [x] `SESSION_HANDOFF.md` отслеживается Git и обновлён после backend closeout P1-05.
- [x] Локальные commits P1-02 и P1-03 production checkpoint созданы в обоих
      repositories.
- [x] Frontend `origin` приведён к canonical
      `git@github.com:Sa1ivan/Nexus.UI.git` перед итоговым push.
- [x] В `Nexus.BC` реализованы bootstrap, typed runtime configuration, exact
      credentialed CORS, safe API errors, health, Prisma lifecycle, transaction kernel
      и foundation audit persistence; добавлены identity/tenancy schema, полный auth
      lifecycle, workspace authorization, immutable releases и anonymous public-read
      API. Frontend public renderer и static hosting ещё отсутствуют.
- [x] P1-02 Step 1 — исходные 23 RED configuration/health/CORS tests добавлены;
      первоначальные ожидаемые failures подтверждены до реализации.
- [x] P1-02 Step 2 — typed configuration boundary и credentialed CORS — реализован,
      проверен и закоммичен как `6f47dc6`.
- [x] P1-02 Step 3 — единый безопасный API error envelope и request ID — реализован,
      проверен и закоммичен как `991e6c3`.
- [x] P1-02 Step 4 — Prisma lifecycle, opaque transactions, health и append-only audit —
      реализован, проверен и закоммичен как `914787e`.
- [x] P1-02 Step 5 — fresh-database migration и полный verification gate — закрыт.
- [x] P1-03 Step 1 — identity/tenancy schema, hash-only token records и rotating
      refresh-session families — реализован, проверен и закоммичен как `735eaf9`.
- [x] P1-03 Step 2 — exact Outbox schema и transaction-aware notifications enqueue
      boundary — реализован, проверен и закоммичен как `b6976b0`.
- [x] P1-03 production auth/workspace checkpoint — use cases, guards, controllers,
      token security и tenant authorization — закоммичен как `40ec4c4`.
- [x] P1-03 verification closeout — auth/workspace E2E, concurrency/unit regressions,
      быстрый architecture analyzer и стабильный combined Jest gate — закоммичен как
      `6ab12d6`; handoff closeout — `1a41297`.
- [x] P1-04 Step 1 — exact bounded SiteConfig v4 JSON Schema, mirrored historical и
      golden fixtures, fail-fast validation, safe links/media и deterministic
      canonicalization — реализован; backend commit `c09118e`.
- [x] P1-04 Step 2 — Project, ProjectRevision и shared IdempotencyRecord persistence —
      реализован в `22cd006`.
- [x] P1-04 Step 3 — in-memory/Prisma repository contracts и HTTP/idempotency RED
      matrix — зафиксирован в `c226033`.
- [x] P1-04 Step 4 — atomic OCC draft save и versioned HMAC/advisory-lock primitives —
      реализован в `fa2be05`.
- [x] P1-04 Step 5 — пять authenticated editor endpoints, replay и pagination —
      реализован в `c76439c`; merge checkpoint — `2a9791e`.
- [x] P1-04 closeout — domain-модели Project/ProjectRevision, business+idempotency
      rollback и save response-loss-after-advance contracts добавлены; полный fresh-DB
      gate зелёный.
- [x] P1-05 Step 1 — exact Release/ActiveRelease composite schema, migration и readonly
      domain models — реализован в `50950b4`.
- [x] P1-05 Step 2 — frozen publish/activate/public HTTP contracts и rollback, race,
      replay и tenant-isolation matrix — зафиксирован в `655171d`.
- [x] P1-05 Step 3 — atomic publish/activation application transactions, immutable
      replay и allowlisted audit — реализован в `17412cf`.
- [x] P1-05 Step 4 — authenticated mutation endpoints, anonymous public reads и
      representation-aware ETag/304 — реализован в `c250a1f`; merge checkpoint —
      `f3906ce`.
- [x] P1-05 closeout — activation валидирует immutable snapshot до pointer move,
      publish replay связан с исходной operation, version bounds соответствуют int4,
      а deterministic race/child-page/exact-public-DTO regressions закреплены тестами.

Активный продуктовый этап остаётся **P1 — Cloud Alpha**, но следующий ход теперь:

> **Начать P1-06 Step 1: определить provider-independent object-storage port и RED
> contracts, не импортируя AWS SDK за пределами R2 adapter.**

P1-03 подтверждён RED→GREEN contracts, миграциями на PostgreSQL, auth/workspace E2E,
конкурентными сценариями и полным Node 24 gate. Combined Jest crash `139` устранён
предзагрузкой Argon2 до Jest VM context, architecture scan завершается примерно за
семь секунд, а финальный независимый review дал Critical `0`, Important `0`, verdict
`Ready`.

P1-04 подтверждён зеркальными SHA-256 manifests, historical codec migration fixtures
v1/v2/v3→v4, exact-v4 schema/runtime contracts, Project/ProjectRevision persistence,
atomic OCC, versioned HMAC idempotency, immutable revisions, tenant isolation и пятью
authenticated editor endpoints. Closeout дополнительно закрепил domain ownership,
полный rollback business write вместе с replay state и исторический save replay после
следующего изменения draft.

Backend-часть P1-05 подтверждена exact composite Release/ActiveRelease schema,
атомарными publish/activate transactions, immutable replay, pointer-only rollback,
tenant isolation, anonymous public reads только через ActiveRelease и release-aware
ETag. Frontend route `/p/:publicSlug` и static SPA hosting остаются отдельными gates
P1-08 и P1-09, а не незавершённой backend-работой P1-05.

## 2. Приоритет источников

При расхождении документации использовать следующий порядок:

1. текущий код и исполняемые тесты;
2. этот `SESSION_HANDOFF.md`;
3. `docs/superpowers/plans/2026-07-26-nexus-cloud-alpha-phase-1.md`;
4. `docs/superpowers/plans/2026-07-25-nexus-roadmap-execution-program.md`;
5. `ROADMAP.md`.

Важно: detailed Cloud Alpha plan прошёл P1-00 reconciliation и follow-up review.
Его committed checkbox state закрывает P1-00–P1-02 и P1-04–P1-05; доказательство
закрытия P1-03 остаётся в коде, тестах и этом handoff. Актуальные доказательства P1-04
и P1-05 также записаны в completion evidence плана. Новые design/spec документы в
этой сессии не создавались.

Основные документы:

- `ROADMAP.md` — продуктовая стратегия и путь к Nexus 1.0;
- `docs/superpowers/plans/2026-07-25-nexus-roadmap-execution-program.md` —
  программа P0–P5;
- `docs/superpowers/plans/2026-07-25-nexus-foundation-phase-0.md` — выполненный P0;
- `docs/superpowers/plans/2026-07-26-nexus-cloud-alpha-phase-1.md` — согласованный
  P1 execution plan;
- `README.md` — команды и текущее frontend-поведение;
- `.codex/skills/angular-saas-builder/SKILL.md` — правила Angular-проекта.

## 3. Сводка сегодняшнего анализа

### 3.1 CEO/product view

Сильные стороны:

- уже существует связный путь wizard → builder → save → publish → lead;
- продукт решает понятную SMB-задачу: быстро собрать сайт услуг и получить заявку;
- структурированный секционный редактор ограничивает сложность и обеспечивает
  responsive/accessibility baseline;
- local-first foundation позволяет проверять UX до затрат на cloud infrastructure;
- выбранный modular-monolith backend соответствует масштабу Cloud Alpha.

Слабые стороны:

- пользовательская ценность пока ограничена одним browser profile;
- «публичная» ссылка зависит от `localStorage` и не является публичной;
- нет аккаунтов, совместной работы, доменов, SSR/SEO, настоящих заявок и аналитики;
- roadmap шире текущих ресурсов: нельзя параллельно строить CMS, billing, bookings,
  eCommerce, custom domains и Pro canvas;
- исходный Cloud Alpha plan требовал согласования frontend contracts, backend
  modules и data model; это закрыто P1-00 и теперь контролируется executable
  source-contract tests.

Product recommendation:

1. доказать Cloud Alpha end-to-end;
2. использовать path-based public URL, а не начинать с wildcard domains;
3. получить первые реальные публикации и leads;
4. только по данным выбирать следующую вертикаль;
5. не строить Wix целиком до подтверждения retention и willingness to pay.

### 3.2 Frontend view

Сегодня frontend стал существенно безопаснее:

- закрыты ошибки autosave, route switching, publish URL и media limits;
- проведено полное разделение тяжёлых editor-файлов;
- введён жёсткий lint на TypeScript `any` и Angular template `$any`;
- named contracts вынесены в module-local `*.types.ts`;
- inspector разбит на shell, design, behavior и 11 content editors;
- `BuilderStore` разделён на document facade, `BuilderBlockStore` и stateless
  mutation services;
- восстановление после failed navigation сохраняет document, active page,
  selection и undo/redo history;
- autosave ждёт competing write, не сохраняет snapshot в другой project и
  корректно повторяет transient failure;
- oversized encoded images отклоняются для upload, pasted URL и imported document;
- mobile builder больше не показывает desktop/mobile switcher;
- Hero-кнопка получила `filled`, `outline`, `ghost` и отдельный text color.

### 3.3 System architecture view

Положительные решения:

- `ProjectRepository` изолирует UI от текущего local adapter;
- SiteConfig остаётся versioned document;
- draft, revision и release уже имеют правильную локальную семантику;
- optimistic concurrency и immutable release проверены;
- builder и public renderer разделены;
- единственным владельцем document/history/dirty остаётся `BuilderStore`;
- вынесенные mutation services stateless и не создают второй document owner.

Оставшийся frontend architecture debt:

- `BuilderStore.applyBlockMutation()` публичен ради `BuilderBlockStore`; это
  internal boundary, который теоретически можно обойти произвольным updater;
- для шести mutation services есть integration/E2E coverage, но нет полного
  parameterized behavioral contract suite на CRUD/minimum guards/no-op semantics;
- `BuilderStore` теперь 701 строка — намного лучше исходных 2031, но всё ещё выше
  желательного диапазона 550–650;
- cloud integration потребует разделить слишком широкий repository port, а не
  просто заменить local adapter одним HTTP-классом.

Итог независимого frontend review:

- Critical: `0`;
- Important: `0`;
- Minor: два пункта выше;
- verdict: `APPROVE`.

### 3.4 Backend/cloud view

Оценка текущей готовности:

- frontend foundation: около `7/10`;
- P1 architecture/contracts: review закрыт, plan готов к пошаговому исполнению;
- реализованный backend: P1-01–P1-05 foundation, PostgreSQL/Prisma, identity/tenancy,
  transactional Outbox, auth lifecycle, workspace authorization, cloud drafts,
  immutable releases и anonymous public reads;
- следующий backend-слой Cloud Alpha — managed media P1-06; frontend public renderer
  и static hosting закрываются в P1-08/P1-09.

Главный вывод снимка 30 июля был закрыт P1-00:

> transaction/module ownership, frontend/public API boundaries и idempotency
> contracts согласованы в detailed plan; активное исполнение начинается с P1-02.

## 4. Выполненные изменения

### После исходного handoff, 31 июля — 2 августа

Frontend/product:

- `c78294e feat(builder): customize block action buttons`;
- `6e3c4a8 feat(builder): add reactive custom settings controls`;
- `ae93397 feat(builder): share site chrome across pages`.

P1-00:

- `f99187e docs: reconcile Cloud Alpha architecture contracts`;
- `5a86855 docs: close Cloud Alpha architecture review`;
- в `tests/unit.test.mjs` добавлены executable source-contract проверки plan;
- Gate P1-00 закрыт, все его checklist items отмечены evidence-bearing `[x]`.

P1-01 в отдельном `/Users/dkhadzhiev/Projects/Nexus.BC`:

- `d9fd37a chore: bootstrap Nexus.BC architecture`;
- `64285c7 test: harden backend architecture boundaries`;
- NestJS 11/strict TypeScript, Node 24 contract, root modules, CI и adversarial
  architecture tests;
- до начала P1-02 backend `develop` был чистым и синхронизированным с
  `origin/develop`.

P1-02 Step 1, 4 августа:

- frontend commit `7753ca3 docs: advance Cloud Alpha runtime foundation`;
- backend commit `a24deac test: define runtime foundation contracts`;
- добавлен `test/e2e/health.e2e-spec.ts` с 23 focused RED cases;
- покрыты обязательные non-test env groups, independent liveness, unavailable-DB
  readiness и exact credentialed CORS allow/deny/preflight contract;
- Node 24 run подтвердил `23/23` ожидаемых failures: missing configuration пока
  принимается, health routes возвращают 404, CORS отсутствует;
- follow-up review усилен: AppModule загружается после изолированной env setup,
  missing-key failures обязаны назвать ключ, preflight проходит через rejecting
  guard, unsupported method/header не могут отражаться;
- новый test file проходит ESLint и Prettier;
- detailed Cloud Alpha plan отмечает Step 1 `[x]` и содержит RED evidence.

P1-02 Step 2, 4 августа:

- backend commit `6f47dc6 feat: add typed runtime configuration`;
- `APP_CONFIG` валидирует полный runtime contract; только `loadAppConfig()` читает
  `process.env`, а architecture gate ловит bracket, `globalThis` и `node:process`
  bypass-формы;
- production принимает только `https://app.nexus.site`, HTTPS privacy URL,
  32-character JWT secrets, exact 32-byte outbox key и canonical versioned HMAC keys;
- credentialed CORS использует exact allowlist, fixed methods/headers, выполняет
  preflight до guards, возвращает `CORS_ORIGIN_DENIED` и всегда ставит `Vary: Origin`;
- review после исправлений: Critical `0`, Important `0`, Minor `0`, verdict `Ready`;
- runtime suite расширен до 37 тестов: `34/37` проходят, а три ожидаемых RED относятся
  только к ещё отсутствующим liveness/readiness routes.

P1-02 Step 3, 4 августа:

- backend commit `991e6c3 feat: standardize API error responses`;
- server-owned UUID возвращается в `X-Request-ID` и каждом error envelope;
- validation/authentication/authorization/not-found/conflict/rate-limit/500 сведены к
  одному `{ error: { code, message, requestId, details? } }` contract;
- standard Nest/provider/validator payloads, stacks и все 5xx details не выходят наружу;
- explicit domain code/details разрешены только через trusted 4xx factory с runtime
  validation и flat primitive public details;
- CORS denial получает тот же envelope до Nest exception filter;
- focused E2E: `13/13`, включая malformed JSON, cyclic/untrusted exceptions,
  non-string JavaScript calls и попытки утечки explicit 500;
- review после трёх security hardening cycles: Critical `0`, Important `0`, Minor `0`,
  verdict `Ready`.

P1-02 Steps 4–5, 4 августа:

- backend commit `914787e feat: add backend runtime foundation`;
- Prisma 7.9.1 PostgreSQL adapter, owned lifecycle и bounded readiness probe добавлены;
- opaque `TransactionContext` выдаётся и раскрывается только restricted database
  capability внутри активной транзакции;
- foundation migration создаёт singleton `AuditSequence` и append-only `AuditEvent`;
  database triggers запрещают обычные direct writes, mutations и truncation;
- transaction-aware audit writer проверяет exact metadata/resource UUID, блокирует
  allocator row и сохраняет gap-free commit order с reuse номера после rollback;
- focused audit E2E `12/12`, readiness unit `3/3`, health/config/CORS `37/37`;
- fresh PostgreSQL database принимает migration from empty, а повторный
  `prisma migrate dev --name foundation` подтверждает отсутствие drift;
- полный backend gate: architecture `8/8`, unit `3/3`, четыре E2E suites `63/63`,
  lint/build/format зелёные, production audit — `0 vulnerabilities`;
- независимый follow-up review: Critical `0`, Important `0`, Minor `0`, verdict
  `Ready`;
- application trust boundary зафиксирован явно: обычные same-role Prisma operations
  защищены triggers/capability, но защита от malicious raw SQL под скомпрометированным
  DB role требует будущего разделения migration/runtime roles.

P1-03 Step 1, 5 августа:

- backend commit `735eaf9 feat: add identity tenancy schema`;
- migration `20260805151020_identity_tenancy` добавляет `User`, `Workspace`,
  `Membership`, `RefreshSession`, `EmailVerificationToken` и `PasswordResetToken`;
- `WorkspaceRole` содержит только `OWNER` и `EDITOR`, membership имеет composite key;
- email хранится canonical lowercase и защищён unique/check constraints;
- refresh session поддерживает family rotation/revocation state, verification/reset
  records — только `tokenHash`, expiry и single-use `consumedAt`; raw secret columns
  отсутствуют;
- `Membership -> User` использует `RESTRICT`: auth-owned delete не может каскадно
  обойти workspace port, future last-owner invariant и audit;
- исходный schema-contract был RED `3/3` на отсутствующих таблицах; review test отдельно
  воспроизвёл cascade bypass до исправления FK;
- исправленная migration применена from empty, focused contract `3/3`, полный gate:
  architecture `8/8`, unit `3/3`, E2E `66/66` в `5/5` suites, build/format зелёные,
  drift отсутствует, production audit — `0 vulnerabilities`;
- независимый follow-up review: Critical `0`, Important `0`, Minor `0`, verdict
  `Ready`.

P1-03 Step 2, 5 августа:

- backend commit `b6976b0 feat: add transactional notification outbox`;
- migration `20260805152835_notification_outbox` добавляет exact `Outbox` schema с
  delivery states, lease/claim, attempt, provider-outcome, dead-letter и encrypted
  short-lived secret fields;
- unique `eventId` и `businessIdempotencyKey` поддерживают повторные verification/reset
  события без ошибочного `unique(kind, aggregateId)`;
- `NOTIFICATION_ENQUEUE` экспортирует только application token/DTO/port, а
  `PrismaOutbox` пишет `{ tokenRecordId }` и encrypted expiring material внутри caller
  `TransactionContext`;
- RED→GREEN E2E покрывает exact PostgreSQL schema, forged/expired contexts, rollback,
  duplicate-token fence, verification/reset keys, validation и exact identifier-only
  payload;
- architecture gate разрешает только точную private unique-symbol branded структуру
  `TransactionContext` и отклоняет leaky same-name/path substitute;
- все три migrations применены from empty, drift отсутствует, полный gate:
  architecture `10/10`, unit `3/3`, E2E `74/74` в `6/6` suites, lint/build/format
  зелёные, production audit — `0 vulnerabilities`;
- независимый follow-up review: Critical `0`, Important `0`, Minor `0`, verdict
  `Ready`.

P1-03 production auth/workspace checkpoint, 5 августа:

- backend commit `40ec4c4 feat: add identity and workspace tenancy`;
- реализованы register, email verification, login, refresh rotation, logout,
  password-reset request/confirm и access JWT с 10-минутным lifetime;
- пароли используют Argon2id с закреплёнными параметрами, verification/reset/refresh
  secrets хешируются через HMAC, а short-lived Outbox material шифруется AES-256-GCM;
- глобальный authentication guard использует explicit `@Public`; POST auth endpoints
  проверяют Origin, refresh cookie имеет `HttpOnly`, `Secure`, `SameSite=Lax` и
  ограниченный path;
- rate limiter ограничен по памяти и TTL, login/reset races закрыты row locks и
  повторной проверкой password hash, refresh/logout revoke всю token family;
- workspace create/get/change-role реализуют owner/editor matrix, non-member `404`,
  last-owner invariant и атомарную запись membership change вместе с audit event;
- class-level interceptors переводят application errors в стабильный HTTP envelope;
  route handlers сохраняют правило одного application use case;
- focused/manual verification: lint, unit `3/3`, build, production format и audit
  зелёные; шесть E2E suites отдельно дают суммарно `74/74`; auth lifecycle,
  workspace authorization, atomic audit rollback и race-сценарии прошли smoke;
- независимый review после исправлений: Critical `0`, Important `0`, verdict `Ready`;
- gate пока не закрыт: новые auth/tenant E2E отложены на следующую сессию, общий
  `npm run test:e2e` завершается с exit `139`, а официальный architecture scan после
  расширения import graph был остановлен через 32 минуты без результата.

### Изменения 30 июля

### `3dd44d5 fix: resolve builder follow-ups and bundle landing images`

- [x] повтор той же autosave revision после transient failure;
- [x] flush pending edit при teardown builder;
- [x] видимые wizard repository/validation errors;
- [x] очистка stale document при failed explicit route load;
- [x] page metadata commit по input/change;
- [x] bundled landing images вместо hotlinks.

### `fd1e763 fix: streamline projects empty-state actions`

- [x] убраны дублирующиеся create actions;
- [x] empty state стал контекстным;
- [x] добавлены workspace component tests.

### `e63a842 fix: refine landing wizard design controls`

- [x] расширены design presets и typed custom colors;
- [x] улучшены wizard/theme editor responsive controls;
- [x] design settings применяются к реальному renderer;
- [x] добавлены unit/component/E2E tests.

### `191bf0b refactor(builder): split typed editor responsibilities`

- [x] `BuilderStore`: примерно `2031 → 701` строка;
- [x] добавлен `BuilderBlockStore`: `444` строки;
- [x] inspector shell: `65` строк TypeScript и `94` строки HTML;
- [x] 11 typed content inspector components;
- [x] design и behavior editors отделены;
- [x] шесть stateless typed mutation services;
- [x] все `$any` и explicit `any` удалены;
- [x] добавлены adjacent module type files;
- [x] исправлены autosave/project identity/route/history/media edge cases.

Mutation services:

| Service       | Lines |
| ------------- | ----: |
| hero/content  |    88 |
| gallery       |   140 |
| lead form     |   163 |
| social proof  |   265 |
| feature/offer |   311 |
| site chrome   |   351 |

### `99d168f fix(builder): refine mobile canvas and hero buttons`

- [x] mobile viewport switcher скрыт при `max-width: 900px`;
- [x] mobile canvas ограничен шириной `390px`;
- [x] `HeroButtonVariant = filled | outline | ghost`;
- [x] отдельный control для button text color;
- [x] codec сохраняет variant и мигрирует старый document в `filled`;
- [x] renderer применяет реальные variant styles;
- [x] добавлены contract, codec и Chromium regression tests.

## 5. Фактические возможности Nexus.UI

- Angular 20, standalone, Signals, OnPush, strict TypeScript;
- Angular Material/CDK для application shell;
- SCSS и container/media queries;
- wizard создания лендинга;
- 11 типов секций;
- registry с metadata, default factory, variants и clone;
- content/design/behavior inspectors;
- desktop/mobile preview на desktop;
- forced mobile canvas в mobile application layout;
- hide/duplicate/move/remove blocks;
- undo/redo до 50 состояний;
- multipage project model;
- page title/slug/SEO/social image/noIndex;
- local Project/Revision/Release storage;
- async repository boundary;
- optimistic concurrency;
- autosave/recovery/manual save;
- versioned `.nexus.json` import/export;
- local publish и page-level public routes;
- local lead submissions и workspace insights;
- accessibility baseline для navigation, menus, FAQ, lightbox и forms;
- полный CI gate.

Ограничения:

- public route работает только с данными того же `localStorage`;
- нет HTTP adapter, accounts, tenancy и RBAC;
- нет PostgreSQL, object storage и server-side forms;
- нет SSR/SSG, sitemap, canonical или custom domains;
- project counters не являются web analytics;
- local publish нельзя считать production hosting.

## 6. Frontend architecture contract

Сохранять:

- standalone components, без NgModules;
- Signals-based local state, без NgRx;
- strict typing, без `any`, `$any` и casts через `unknown` ради обхода типов;
- named contracts в domain models или adjacent module `*.types.ts`;
- public renderer отдельно от builder UI;
- immutable document updates;
- `BuilderStore` — единственный owner SiteConfig/history/dirty/transient selection;
- block mutation services — stateless;
- persistence и transport скрыты за ports;
- generated HTTP DTO не заменяют frontend domain model;
- старые schema versions проходят codec normalization.

Текущий editor flow:

```text
Builder UI
  -> BuilderStore (document/history/dirty)
    -> BuilderBlockStore (typed block facade)
      -> stateless mutation services
  -> BuilderProjectStore
    -> ProjectRepository
      -> LocalProjectRepository
```

Cloud target должен стать:

```text
Authenticated editor
  -> ProjectRepository
Public preview/form
  -> PublicSiteRepository
Lead workspace
  -> LeadInboxRepository
Workspace dashboard
  -> WorkspaceReadRepository
```

Не создавать один чрезмерно широкий `HttpProjectRepository`, имитирующий все
local capabilities.

## 7. Последний verification snapshot

Итоговый correction gate P1-00–P1-04 Step 1 выполнен 6 августа 2026 на Node
`v24.19.0` и PostgreSQL database `nexus_p103_step5_gate_0806`:

```bash
npm run verify
npx prisma migrate status
npm audit --omit=dev --audit-level=moderate
```

- lint: passed;
- architecture: `17/17` в `2/2` suites;
- SiteConfig contract: `77/77`;
- unit: `7/7` в `4/4` suites;
- all E2E: `96/96` в `8/8` suites;
- auth/workspace E2E дополнительно доказывает invalidation всех reset-токенов,
  concurrent reset serialization и refresh/reset race без живой replacement session;
- HTTP parser E2E доказывает exact 1,310,720-byte envelope, первый rejected byte,
  depth 32/33, raw-body retention, safe error envelope и CORS на раннем `413`;
- все три migrations applied; `prisma migrate status` подтверждает schema up to date;
- production build: passed;
- format check: passed;
- production audit: `0 vulnerabilities`;
- повторное review полного correction diff: Critical `0`, Important `0`, verdict
  `Ready`;
- residual Minor: same-environment Railway private-network peer теоретически может
  синтезировать ingress headers и `X-Real-IP`; публичный edge contract проверяется по
  документированным Railway headers, а этот trust boundary должен быть подтверждён
  staging/deployment проверкой.

Итоговый frontend gate:

```bash
CI=1 npm run verify
```

- lint: passed;
- source contracts: `42/42`;
- mirrored SiteConfig contract: `61/61`;
- Angular/Vitest: `143/143` в `24/24` test files;
- E2E source contract: `1/1`;
- Playwright Chromium: `9/9`;
- production build: passed;
- format check: passed;
- production audit: `0 vulnerabilities`;
- initial bundle: около `407.00 kB`;
- estimated initial transfer: около `107.77 kB`;
- builder lazy chunk: около `303.03 kB`;
- output: `dist/nexus.ui`.

SiteConfig artifacts повторно сгенерированы из checked-in generator; оба repository
остаются byte-identical, manifest SHA-256:
`5555fca3001240dbc982f1608f8c365985e4052752fffffcffae9bfc0a167477`.

## 8. Git state

Состояние до correction commit:

```text
frontend: /Users/dkhadzhiev/Projects/Nexus, develop, base 7167171
backend: /Users/dkhadzhiev/Projects/Nexus.BC, develop, base c09118e
оба base совпадали со своими origin/develop после fetch
```

Итоговый handoff contract:

```text
frontend origin: git@github.com:Sa1ivan/Nexus.UI.git
backend origin: git@github.com:Sa1ivan/Nexus.BC.git
branch: develop в обоих repositories
correction commits должны быть pushed без force/rebase
точные итоговые SHA читать через git rev-parse HEAD
```

Без отдельной просьбы не:

- удалять или перезаписывать `SESSION_HANDOFF.md`;
- выполнять reset/rebase/force-push;
- создавать backend внутри frontend repository.

## 9. P1 blockers: обязательный risk register

Статус 4 августа: R2–R10 согласованы на contract/plan level в P1-00, но должны
быть доказаны реализацией и тестами соответствующих P1-03–P1-10. R1 закрыт на
уровне P1-02 runtime/database foundation; business capabilities, deployment image и
staging остаются последующими gates.

P1-01 follow-up review 4 августа: `Critical: 0`; generated Prisma tracing и health
delegation закрыты в P1-02. До соответствующих следующих implementation gates закрыть:

- [x] прямой `api -> domain` import запрещён и доказан negative fixture;
- ограничить recovery AWS adapter recovery-only surface;
- [x] `test/contract/**` включён в обязательный verification topology.

### P0 — блокирует безопасный Cloud Alpha

#### R1. Backend runtime реализован частично

NestJS application scaffold, CI, typed runtime configuration, CORS, stable API errors,
health, Prisma lifecycle, transaction kernel и foundation audit persistence существуют.
Identity/tenancy и transactional notification Outbox schema/boundary существуют;
полный auth behavior и workspace authorization реализованы и проверены. Cloud drafts,
другие business capabilities, deployment image и staging environment ещё не
реализованы.

#### R2. Module rules противоречат транзакциям

Старый план одновременно:

- запрещает cross-module writes и foreign keys;
- требует atomic publish через Project, Revision и Release;
- требует atomic Lead + Outbox.

Решение:

- объединить projects/revisions/releases/public read в один модуль `sites`;
- разрешить database foreign keys;
- запрещать чужие repository writes/imports, а не referential integrity;
- оформить outbox как transaction-aware platform primitive.

#### R3. Frontend port несовместим с planned public API

Local port использует project ID для public release/lead. Planned API использует
slug и исключает public/lead methods из backend ProjectRepository.

Решение: разделить frontend ports, вернуть `publicSlug` и абсолютный `publicUrl`.

#### R4. Нет command idempotency

Одного `expectedDraftVersion` недостаточно: после успешного DB commit и потерянного
HTTP response retry получит ложный conflict или создаст duplicate.

Требуется:

- `operationId`/`Idempotency-Key`;
- request hash;
- unique project revision operation;
- unique publish operation;
- unique lead `submissionId`;
- same key + same payload возвращает прежний result;
- same key + different payload возвращает `409 IDEMPOTENCY_KEY_REUSED`.

#### R5. Active release invariant не защищён БД

Нельзя позволять Project ссылаться на Release другого project/workspace.

Решение: `ActiveRelease(projectId, releaseId)` с composite FK к
`Release(projectId, id)`.

#### R6. Не определён реальный Alpha hosting flow

Для Alpha использовать:

```text
https://app.nexus.site/p/:publicSlug
```

SPA размещается на managed static hosting/CDN, API — `api.nexus.site`.
Wildcard subdomains, SSR и custom domains оставить P2.

#### R7. Нет bounded SiteConfig contract

Нужны versioned JSON Schema limits:

- serialized document size;
- max pages/blocks/items;
- max string length;
- HTTP parser limit;
- rejection до transaction.

Начальный cloud draft target: около `1 MiB` после media extraction. Legacy import
до `5 MiB` должен сначала вынести data URLs в object storage.

#### R8. Media contract недостаточен

Managed media должно ссылаться на `assetId`, а не только URL.

Publish проверяет:

- asset `READY`;
- workspace/project ownership;
- MIME и magic bytes;
- size/dimensions/checksum;
- asset не deleted;
- pending/foreign asset не публикуется.

#### R9. Booking payload конфликтует со strict form validation

Frontend добавляет booking context, которого нет в `LeadFormFieldConfig`, а backend
plan отклоняет unknown fields.

До forms implementation зафиксировать единый submission JSON Schema. Booking
context разрешать только release, который его объявляет.

#### R10. Outbox model ломает повторные verification/reset

`unique(kind, aggregateId)` допускает только одно событие вида на пользователя.
Нужны:

- unique event ID;
- отдельный business idempotency key;
- lease/`lockedUntil`;
- max attempts;
- reclaim после worker crash;
- dead-letter state и alert;
- encrypted/short-lived secret payload.

### P1 — до внешних alpha users

- canonical email (`trim + NFC + lowercase`) и DB uniqueness;
- explicit RBAC matrix и last-owner invariant;
- `ProjectSummary` pagination без draft/release JSON в list;
- revision metadata pagination и retention;
- expand/contract migration policy и previous-schema upgrade CI;
- metrics/alerts для API, DB, OCC, publish, leads, outbox и R2;
- minimal append-only audit events без lead contents;
- privacy notice, consent, retention and owner delete;
- configurable lead retention;
- DB + object storage restore drill;
- explicit Alpha RPO/RTO;
- rate limit/honeypot/CAPTCHA adapter для public forms.

### P2 — до public beta/monetization

- SSR/public renderer и release-aware CDN caching;
- custom domain state machine, DNS ownership и TLS lifecycle;
- domain takeover protection;
- billing module, entitlements и usage counters;
- immutable webhook inbox с signature/idempotency/reconciliation;
- image variants и responsive delivery;
- full privacy deletion/export;
- analytics funnel.

## 10. Revised target backend architecture

Один repository и один deployable modular monolith:

```text
Nexus.UI
  ├─ authenticated editor/workspace
  └─ /p/:publicSlug public Alpha renderer
             │
             ▼
Nexus.BC NestJS modular monolith
  ├─ identity       User, RefreshSession, EmailVerificationToken, PasswordResetToken
  ├─ workspaces     Workspace, Membership, authorization
  ├─ sites          Project, Revision, Release, ActiveRelease, public query
  ├─ media          MediaAsset, R2 adapter, cleanup
  ├─ forms          Lead, release validation, abuse protection
  ├─ notifications  Outbox worker, Resend adapter
  └─ platform       config, errors, DB, idempotency, health, audit
             │
      PostgreSQL + private R2 + Resend
```

Не использовать в Alpha:

- microservices;
- Kafka;
- Kubernetes;
- отдельный Redis без измеренной необходимости;
- publish queue;
- wildcard/custom domains;
- собственный email/CDN/image-processing provider.

## 11. Minimum cloud data model

- `User`, `RefreshSession`, `EmailVerificationToken`, `PasswordResetToken`;
- `Workspace`, `Membership`;
- `Project(workspaceId, publicSlug, draft, schemaVersion, draftVersion)`;
- `ProjectRevision(projectId, draftVersion, operationId, siteConfig, createdAt)`;
- `Release(projectId, version, publishOperationId, siteConfig)`;
- `ActiveRelease(projectId, releaseId)` с composite FK;
- `IdempotencyRecord(scope, operation, key, requestFingerprint, responseRef, expiresAt)`;
- `MediaAsset(workspaceId, projectId, objectKey, status, mime, size, checksum,
width, height)`;
- `Lead(projectId, releaseId, blockId, submissionId, fields, consent,
retentionUntil)`;
- `Outbox(eventId, businessIdempotencyKey, kind, payload, availableAt, lockedUntil,
attempts, deliveredAt, deadLetterAt)`;
- `AuditEvent` без PII payload.

Later:

- `Domain`;
- `Subscription`;
- `WebhookInbox`;
- `UsageCounter`.

## 12. Updated execution plan

### P1-00 — reconcile plan and contracts

- [x] Обновить detailed Cloud Alpha plan: `projects + releases + public-sites`
      заменить единым `sites` ownership.
- [x] Зафиксировать module/table ownership matrix.
- [x] Разрешить DB foreign keys и запретить direct foreign repository writes.
- [x] Описать transaction coordinators для publish и Lead + Outbox.
- [x] Разделить frontend ports:
  - `ProjectRepository`;
  - `PublicSiteRepository`;
  - `LeadInboxRepository`;
  - `WorkspaceReadRepository`.
- [x] Добавить `publicSlug` и absolute `publicUrl` в cloud editor contract.
- [x] Зафиксировать idempotency contract и error codes.
- [x] Зафиксировать `ActiveRelease` composite invariant.
- [x] Зафиксировать bounded SiteConfig JSON Schema.
- [x] Зафиксировать managed media reference и READY ownership rules.
- [x] Зафиксировать form/booking submission schema.
- [x] Исправить Outbox schema/lease/retry semantics.
- [x] Зафиксировать Alpha URL и static hosting topology.
- [x] Обновить golden fixtures и acceptance matrix.

Gate P1-00:

- architecture rules не противоречат Prisma schema;
- publish и lead transaction имеют одного явного coordinator;
- local/cloud/public frontend ports имеют однозначные consumers;
- commit-succeeded/response-lost retry описан тестом;
- public read не может вернуть release другого tenant;
- ни одного placeholder/TBD в contract-critical sections.

Completion evidence: frontend commits `f99187e` и `5a86855`.

### P1-01 — bootstrap Nexus.BC

- [x] Клонировать `Sa1ivan/Nexus.BC` как sibling `../Nexus.BC`.
- [x] NestJS 11, Node 24, strict TypeScript.
- [x] `.nvmrc`, `.env.example`, scripts и lockfile.
- [x] Root modules по обновлённой ownership matrix.
- [x] Сначала RED architecture tests.
- [x] Node 24 CI: lint, architecture, unit, E2E, build, format.
- [x] Clean `npm ci` и первые reviewable commits.

Completion evidence: backend commits `d9fd37a` и `64285c7`; свежий baseline
review 4 августа подтвердил `npm run verify` и production audit.

### P1-02 — platform and database foundation

- [x] RED configuration/health/CORS tests: `23/23` ожидаемо RED.
- [x] Typed environment validation и exact credentialed CORS (`6f47dc6`).
- [x] Stable API error envelope и request IDs (`991e6c3`).
- [x] Safe structured 5xx error logs без exception payload/PII/secrets.
- [x] Liveness/readiness.
- [x] Prisma lifecycle, opaque transactions и audit (`914787e`).
- [x] PostgreSQL foundation schema и deployable migration.
- [ ] Expand/contract migration policy.
- [ ] Idempotency storage primitive.
- [x] Detailed P1-02 task и полный verification gate завершены.

Три оставшихся широких program checklist пункта реализуются в назначенных detailed
tasks: structured operational logs/deployment в P1-09, expand/contract rollout в
schema-changing tasks, idempotency storage в P1-04. Они не блокируют переход к
P1-03 согласно detailed Cloud Alpha plan.

### P1-03 — identity and tenancy

- [x] Canonical unique email schema (`735eaf9`).
- [x] User/session/hash-only token schema.
- [x] Transaction-aware notifications enqueue boundary и exact Outbox (`b6976b0`).
- [x] Register/verify/login/refresh/logout/reset (`40ec4c4`).
- [x] Workspace/membership schema с user-delete restriction.
- [x] Owner/editor matrix.
- [x] Last-owner invariant.
- [x] Cross-tenant/IDOR E2E.
- [x] Auth lifecycle/race/ciphertext/expiry E2E contracts.
- [x] Полный architecture и combined E2E gate.
- [x] Independent review: Critical `0`, Important `0`, verdict `Ready`.

### P1-04 — cloud drafts and concurrency

- [x] Bounded SiteConfig v4 validation и mirrored frontend contract.
- [x] Project, ProjectRevision и IdempotencyRecord schema/migration.
- [x] Create/get/save project draft.
- [x] Atomic OCC.
- [x] Idempotent save/create operations.
- [x] Immutable revisions.
- [x] ProjectSummary и revision pagination.
- [x] Commit-succeeded/response-lost и failure-before-commit E2E.
- [x] Domain ownership и полный Node 24 fresh-database verification gate.

### P1-05 — release and public Alpha

- [x] Release + ActiveRelease schema.
- [x] Atomic idempotent publish.
- [x] Pointer-only rollback through `activateRelease`; literal unpublish is not part of
      the detailed P1-05 contract.
- [x] Public query only through ActiveRelease.
- [ ] Static SPA hosting with deep-link support — P1-09 deployment ownership.
- [ ] `/p/:publicSlug` from incognito without auth/localStorage — P1-08 browser flow;
      deployed fallback remains P1-09.
- [x] Release-aware ETag.

### P1-06 — managed media

- [ ] Private R2 bucket.
- [ ] Presign/complete flow.
- [ ] Magic bytes, MIME, dimensions and checksum.
- [ ] READY/ownership validation on publish.
- [ ] Legacy data URL extraction during cloud migration.
- [ ] Orphan cleanup with grace period.

### P1-07 — forms, leads and notifications

- [ ] Release-owned submission schema.
- [ ] Booking context contract.
- [ ] Server-side unknown/size validation.
- [ ] Rate limit + honeypot/CAPTCHA adapter.
- [ ] Idempotent lead submission.
- [ ] Lead + Outbox atomic transaction.
- [ ] Lease-based worker and dead-letter alerts.
- [ ] Authorized lead inbox.
- [ ] Consent/retention/delete baseline.

### P1-08 — Angular cloud integration

- [x] Все прежние P0 frontend follow-up закрыты.
- [ ] Добавить новые frontend ports и local implementations.
- [ ] Secure in-memory access token + refresh cookie session.
- [ ] HTTP adapters скрыть за ports.
- [ ] Mapping stable API errors.
- [ ] Local-to-cloud migration с предварительным export.
- [ ] Не удалять local copy автоматически.
- [ ] Переключать конкретный project после server commit.
- [ ] Не использовать dual-write.
- [ ] Two-owner-session + visitor browser E2E.

### P1-09 — operations

- [ ] Deterministic production image.
- [ ] Railway staging/production.
- [ ] PostgreSQL backup.
- [ ] R2 inventory/soft-delete policy.
- [ ] Metrics, alerts и error tracking.
- [ ] Audit events.
- [ ] DB + referenced media restore drill.
- [ ] RPO/RTO runbook.

### P1-10 — Cloud Alpha gate

- [ ] Clean install обоих repositories.
- [ ] Full CI обоих repositories.
- [ ] Register → second device draft → media → publish.
- [ ] Incognito visitor → lead → owner inbox.
- [ ] Stale save без data loss.
- [ ] Commit-then-retry без duplicate/conflict.
- [ ] API restart не меняет active release.
- [ ] Backup restores release, lead и referenced media.
- [ ] Production dependency audit.
- [ ] Execution program обновлён по deployed facts.

## 13. Local-to-cloud migration

1. Зафиксировать bounded SiteConfig v4 schema и mirrored golden fixtures.
2. Добавить новые frontend ports, сохранив local adapters.
3. Создать user/workspace.
4. Предложить `.nexus.json` export перед миграцией.
5. Принять только bounded v1-v4 source и нормализовать v1-v3 в v4.
6. В `V4_COMPAT` выполнять только dry-run/preview без cloud writes.
7. После `V5_ACTIVE` повторить validation, вынести data URLs в managed assets и
   преобразовать document в v5 asset references.
8. Создать cloud project с import batch и idempotency key.
9. Сохранить local ID → cloud ID только после server commit.
10. Не удалять local copy автоматически.
11. Не использовать dual-write.
12. Publish разрешать только после READY-check media.
13. Проверить owner session 2, visitor и stale OCC.

## 14. 2/6/12-week outcome map

### Через 2 недели

- P1-00 завершён;
- Nexus.BC scaffold/CI/architecture gate;
- PostgreSQL/Prisma foundation;
- canonical auth и workspace membership;
- bounded SiteConfig;
- idempotent create/get/save draft;
- staging deploy.

Gate: два workspace не видят данные друг друга; commit-then-retry возвращает
предыдущий result; stale operation с другим key получает `409`.

### Через 6 недель

- Angular authenticated cloud editor;
- safe local-to-cloud migration;
- release/ActiveRelease;
- path-based public URL;
- managed R2 media;
- server forms и lead inbox;
- reliable outbox;
- privacy/retention baseline;
- metrics/alerts/audit;
- DB + media restore test.

Gate: register → second device draft → media → publish → incognito lead → owner
inbox без ручного доступа к БД.

### Через 12 недель

- ограниченная Public Beta;
- SSR/public renderer и CDN;
- sitemap/robots/canonical/redirects;
- responsive image variants;
- custom-domain state machine и TLS;
- analytics funnel;
- lead workflow/export;
- billing entitlements и idempotent webhooks;
- load/cost budgets и full DR drill.

Gate: внешний пользователь самостоятельно публикует SEO-readable сайт, подключает
домен, получает lead и проходит billing/limits flow.

## 15. Что не делать

- не возвращаться к старому pre-P1-00 module map;
- не размещать backend внутри Nexus.UI;
- не создавать второго владельца SiteConfig во frontend;
- не возвращать business mutations в огромный `BuilderStore`;
- не добавлять `any`, `$any` или generic `misc types`;
- не строить microservices/Kafka/Kubernetes для Alpha;
- не добавлять Redis без измеренного bottleneck;
- не начинать wildcard/custom domains до path-based public Alpha;
- не строить одновременно CMS, eCommerce, booking и blog;
- не использовать frontend success redirect как billing authority;
- не хранить lead contents в logs/audit;
- не считать local counters web analytics;
- не удалять local project после cloud migration;
- не откладывать минимальную privacy/retention до платной beta.

## 16. Команды проверки

Frontend:

```bash
npm ci
npx playwright install chromium
CI=1 npm run verify
```

Backend:

```bash
npm run test:contract
npm run verify
npm audit --omit=dev --audit-level=moderate
```

## 17. Первый ход следующей сессии

1. Прочитать этот handoff.
2. Проверить `git status`, branch/upstream и remote URL в обоих repositories.
3. Не затрагивать пользовательские untracked/dirty files.
4. Убедиться, что четыре P1-05 commits и closeout присутствуют в backend, а detailed
   plan и этот handoff остаются актуальными.
5. Открыть P1-06 Step 1 и определить provider-independent ObjectStorage port contracts.
6. Сначала добавить RED object-storage contracts, затем R2/AWS adapter; AWS SDK не
   должен выходить за infrastructure adapter.
7. Сохранить P1-05 public contracts и не подмешивать frontend renderer/static hosting
   в P1-06.
8. Не переписывать закрытые auth/workspace use cases P1-03 без нового доказанного
   defect.
9. Для staging отдельно подтвердить, что Railway edge перезаписывает trust headers;
   residual same-environment private-peer risk не скрывать.

Короткий prompt для продолжения:

> Прочитай `SESSION_HANDOFF.md` и P1-06 detailed plan. Backend P1-05 полностью закрыт;
> начни P1-06 Step 1 с RED contracts для provider-neutral ObjectStorage port, не
> импортируя AWS SDK за пределами R2 adapter.

## 18. Review honesty

- Факты о frontend подтверждены кодом, Git и полным `npm run verify`.
- `Nexus.UI HEAD` проверен через `git ls-remote`.
- Branch/upstream обоих repositories сверены после `git fetch` 11 августа.
- P1-03 подтверждён RED→GREEN contracts, тремя migrations, auth/workspace E2E и
  полным Node 24 gate: architecture `13/13`, unit `4/4`, E2E `85/85`.
- Combined Jest exit `139` локализован до загрузки native Argon2 внутри Jest VM и
  устранён предзагрузкой addon в основном Node context; Prisma VM mode сохранён.
- Architecture analyzer больше не проецирует use-case dependencies, не обходит
  external/cyclic facade origins и завершает полный scan примерно за семь секунд.
- Финальный independent review: Critical `0`, Important `0`, один Railway
  private-peer trust Minor, verdict `Ready`.
- P1-04 closeout backend gate на пустой PostgreSQL schema: architecture `18/18`,
  contract `96/96`, unit `7/7`, E2E `135/135`, build/lint/format green.
- P1-05 closeout backend gate на новой пустой PostgreSQL database под Node 24:
  architecture `18/18`, contract `98/98`, unit `14/14`, E2E `182/182`,
  build/lint/format green; production `npm audit` — `0 vulnerabilities`.
- P1-05 closeout independent re-review: Critical `0`, Important `0`, Minor `0`,
  verdict `READY`.
- P1-04 closeout frontend gate: source contracts `42/42`, SiteConfig contract `61/61`,
  unit `143/143`, E2E contract `1/1`, Playwright `9/9`, lint/build/format green.
- Compiled SiteConfig validator загружает schema только из trusted module-relative
  artifact; shadow из `process.cwd()` игнорируется.
- Provider-specific цены/лимиты Railway, R2 и Resend сегодня не проверялись.
- Юридические требования к privacy/retention зависят от рынка и требуют отдельной
  product/legal проверки.
- Backend risk register основан на review plan/contracts; P1-03 identity/tenancy,
  P1-04 drafts/concurrency и backend P1-05 releases/public reads закрыты полным gate.
  Frontend renderer/static hosting остаются P1-08/P1-09, следующий backend task —
  managed media P1-06.
