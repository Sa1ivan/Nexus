# Nexus.UI

Nexus.UI — Angular-приложение платформы Nexus для сборки лендингов в формате конструктора сайтов. Проект хранит сайт как структурированную конфигурацию, позволяет проходить wizard, редактировать блоки в builder, смотреть desktop/mobile preview, сохранять локальные проекты, делать demo-публикацию и собирать заявки через опубликованный preview.

Пошаговый путь от локального конструктора до production-платформы описан в
[ROADMAP.md](ROADMAP.md). Детализация работ находится в
[программе выполнения](docs/superpowers/plans/2026-07-25-nexus-roadmap-execution-program.md)
и планах
[этапа P0](docs/superpowers/plans/2026-07-25-nexus-foundation-phase-0.md) и
[Cloud Alpha P1](docs/superpowers/plans/2026-07-26-nexus-cloud-alpha-phase-1.md).

## Технологический стек

- Angular 20
- Standalone Components
- Angular Signals
- Angular Material
- Angular CDK
- SCSS
- TypeScript в строгом режиме
- ESLint
- Prettier

Публичные блоки рендерятся без Angular Material, чтобы пользовательская страница оставалась независимой от UI-shell конструктора.

Планируемый backend-стек:

- NestJS
- PostgreSQL
- Prisma

## Требования

- Node.js 24+
- npm

В PowerShell на Windows может быть заблокирован запуск `npm.ps1`. В таком случае используй команды через `npm.cmd`.

## Установка

```bash
npm.cmd install
```

## Запуск

Требуется Node.js 24; версия закреплена в `.nvmrc` и проверяется обоими CI workflow.

```bash
npm.cmd start
```

После запуска приложение доступно по адресу:

```text
http://localhost:4200
```

Для запуска на другом порту:

```bash
npm.cmd start -- --port 3000
```

Если страница в браузере выглядит пустой, сначала проверь, что dev server действительно запущен, а вкладка открыта именно на `http://localhost:4200`. Также стоит полностью обновить вкладку браузера после перезапуска dev server.

## Команды

```bash
npm.cmd start
npm.cmd run build
npm.cmd run lint
npm.cmd run test:contracts
npm.cmd run test:unit
npm.cmd test
npm.cmd run e2e:contracts
npm.cmd run e2e
npm.cmd run verify
npm.cmd run format
npm.cmd run format:check
npm.cmd audit
```

Назначение команд:

- `npm.cmd start` — запускает локальный dev server на `localhost:4200`.
- `npm.cmd run build` — собирает production build.
- `npm.cmd run lint` — запускает ESLint.
- `npm.cmd run test:contracts` — проверяет структурную полноту моделей, registry,
  rendering и CI-контрактов.
- `npm.cmd run test:unit` — выполняет TypeScript behavior-тесты через
  TestBed/Vitest.
- `npm.cmd test` — последовательно запускает source-contract и unit-тесты.
- `npm.cmd run e2e:contracts` — проверяет wiring основного пользовательского
  сценария на уровне исходного кода.
- `npm.cmd run e2e` — выполняет браузерные сценарии в Chromium через Playwright.
- `npm.cmd run verify` — обязательный pre-handoff gate: lint, contracts, unit,
  E2E, production build и проверка форматирования.
- `npm.cmd run format` — форматирует файлы через Prettier.
- `npm.cmd run format:check` — проверяет форматирование без изменения файлов.
- `npm.cmd audit` — проверяет зависимости на известные уязвимости.

Перед первым E2E-запуском установи Chromium:

```bash
npx playwright install chromium
```

## Архитектура

Проект использует feature-based архитектуру. Код разделяется по назначению: инфраструктура приложения, переиспользуемые элементы и независимые бизнес-фичи.

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

## Слой `core`

`core` предназначен для инфраструктурного кода уровня приложения:

- singleton-сервисы;
- guards;
- interceptors;
- глобальные провайдеры и интеграции.

Код из `core` не должен зависеть от конкретных feature-слоев.

## Слой `shared`

`shared` содержит переиспользуемые элементы, которые не принадлежат одной конкретной фиче:

- UI-компоненты;
- общие типы;
- утилиты.

В `shared` не должно быть бизнес-логики конкретного конструктора.

## Слой `features`

`features` содержит самостоятельные области приложения. Сейчас заложены две области:

- `builder` — интерфейс конструктора и редактирования конфигурации сайта;
- `preview` — рендер предпросмотра и локально опубликованных страниц.

## Builder

Фича `builder` содержит wizard, редактор структуры сайта, inspector, локальное сохранение проектов, demo-публикацию и сбор заявок.

Основные доменные модели:

- `SiteConfig`
- `PageConfig`
- `BlockConfig`
- `LinkConfig`
- `MediaAsset`
- `SiteThemeConfig`
- `SiteBusinessConfig`
- `SiteSeoConfig`
- `SiteHeaderBlockConfig`
- `HeroBlockConfig`
- `ContentMediaBlockConfig`
- `FeatureGridBlockConfig`
- `OfferListBlockConfig`
- `GalleryBlockConfig`
- `TestimonialsBlockConfig`
- `FaqBlockConfig`
- `CallToActionBlockConfig`
- `LeadFormBlockConfig`
- `SiteFooterBlockConfig`

Ключевые элементы:

- `BlockRegistry` — metadata, варианты, default factory и clone для блоков.
- `BuilderPageComponent`
- `BlockRendererComponent`
- preview-компоненты публичных блоков.

State management:

- `BuilderStore`
- Angular Signals
- computed-селекторы для конфигурации сайта, страниц, активной страницы и блоков.

## Возможности конструктора

- Wizard для создания полного отраслевого лендинга по индустрии, тону и визуальному стилю.
- 11 типов секций: header, hero, content + media, features, offers/products, gallery, testimonials, FAQ, CTA, lead form и footer.
- Панели `Добавить`, `Слои` и `Тема`, а также inspector с вкладками `Контент`, `Дизайн`, `Поведение`.
- Глобальная тема сайта: палитра, типографика, ширина контента, плотность секций, форма кнопок и радиусы.
- Локальные настройки секции поверх темы: фон, текст, акцент, ширина, отступы и радиус.
- Редактирование отдельных ссылок, CTA, изображений и focal point, цен, карточек, полей формы, FAQ, отзывов, карты, соцсетей и контактов.
- Функциональные варианты компоновки, включая раскрываемое меню, разные hero-композиции, каталог, прайс, галерею и FAQ.
- Настройки бренда, общих контактов и SEO-метаданных.
- Многостраничная структура с уникальными slug, page-level SEO, дублированием,
  сортировкой и удалением страниц.
- Управление видимостью и якорем секции, дублирование, сортировка и удаление элементов.
- Ограниченная история undo/redo для изменений конфигурации сайта.
- Автосохранение через 800 мс после последнего изменения и восстановление
  последнего активного проекта после reload.
- Экспорт и импорт переносимого `.nexus.json` между чистыми browser-профилями.
- Desktop/mobile preview внутри builder.
- Container queries для preview-блоков: mobile preview адаптируется по ширине холста, а не только по ширине окна браузера.
- Локальные Material Icons в `public/fonts`, чтобы builder не зависел от Google Fonts при разработке.

## Хранение и публикация

Сейчас проект работает без backend:

- `SiteConfig` использует schema version `3`;
- SEO страницы хранится в `SiteConfig.pages[].seo` и содержит title,
  description, social image и `noIndex`;
- проекты, релизы, ревизии, активный проект и заявки сохраняются через
  `ProjectRepository`; текущая реализация репозитория использует `localStorage`;
- codec принимает legacy-схемы `1` и `2`, нормализует их в schema version `3` и
  отклоняет неподдерживаемые версии;
- изменения автоматически сохраняются через 800 мс; новый browser-сеанс
  восстанавливает последний активный проект, первую доступную страницу и блок;
- конфликт `draftVersion` не перезаписывает сохранённый проект и предлагает
  экспортировать текущую локальную версию либо перезагрузить последнюю
  сохранённую;
- меню конструктора экспортирует документ в `.nexus.json` и импортирует его как
  новый локальный проект;
- кнопка публикации создает локальную demo-публикацию;
- главная опубликованная страница доступна по `/p/:projectId`, а конкретная
  страница — по `/p/:projectId/:pageSlug`;
- persistence слой нормализует данные из storage и отбрасывает небезопасные ссылки вроде `javascript:` и `data:`.

Это локальный demo-режим: ссылка публикации работает только в том же браузере и профиле, где сохранен `localStorage`. Для публичного хостинга, совместного редактирования, загрузки медиа в облако и надежного приема заявок нужен backend.

Production-backend будет отдельным проектом и реализует существующий порт
`ProjectRepository`; frontend-редактор не должен зависеть от конкретной
persistence-реализации.

## Правила разработки

- Не использовать NgModules.
- Использовать только standalone components.
- Для локального состояния использовать Angular Signals.
- Не использовать NgRx Store.
- Не использовать `any`.
- Данные описывать через строгие интерфейсы, модели и discriminated unions.
- Компоненты держать сфокусированными и использовать `ChangeDetectionStrategy.OnPush`.
- Angular Material использовать для интерфейса конструктора и системных UI-контролов.
- Рендер пользовательских блоков держать отдельно от shell/UI приложения.
- Не выносить код в `shared`, пока он реально не стал переиспользуемым.

## Добавление нового блока

1. Добавить новый тип блока в `features/builder/domain/models/block-type.model.ts`.
2. Создать отдельный интерфейс конфигурации блока, расширяющий `BlockConfig<'block-type'>`.
3. Добавить новую конфигурацию в union `PageBlockConfig`.
4. Добавить metadata, variants, default factory и clone в `features/builder/domain/registry/block-registry.ts`.
5. Создать preview-компонент блока в `features/preview/ui`.
6. Добавить отображение блока в `BlockRendererComponent`.
7. Добавить inspector/store-методы, если блоку нужны изменения состояния.
8. Добавить validation и smoke/source-contract тесты.

## Конфигурация генерации

Spec-файлы отключены по умолчанию через Angular schematics в `angular.json`:

```json
"skipTests": true
```

По умолчанию компоненты генерируются как:

- standalone;
- SCSS;
- без spec-файлов;
- с `OnPush`.

## Конфигурация качества кода

- ESLint: `eslint.config.js`
- Prettier: `.prettierrc`
- EditorConfig: `.editorconfig`
- Git ignore: `.gitignore`
- TypeScript: `tsconfig.json`, `tsconfig.app.json`

## Project Skill

Локальная инструкция для дальнейшей работы Codex над проектом находится здесь:

```text
.codex/skills/angular-saas-builder/SKILL.md
```

Она описывает архитектурные правила проекта и должна использоваться при добавлении новых фич или исправлении багов.

## Проверка перед передачей изменений

Перед завершением задачи запускай:

```bash
npm.cmd run verify
```
