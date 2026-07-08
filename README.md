# Nexus

Nexus — Angular-приложение для сборки лендингов в формате конструктора сайтов. Проект хранит сайт как структурированную конфигурацию, позволяет проходить wizard, редактировать блоки в builder, смотреть desktop/mobile preview, сохранять локальные проекты, делать demo-публикацию и собирать заявки через опубликованный preview.

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
npm.cmd test
npm.cmd run e2e
npm.cmd run format
npm.cmd run format:check
npm.cmd audit
```

Назначение команд:

- `npm.cmd start` — запускает локальный dev server на `localhost:4200`.
- `npm.cmd run build` — собирает production build.
- `npm.cmd run lint` — запускает ESLint.
- `npm.cmd test` — запускает lightweight unit/source-contract тесты.
- `npm.cmd run e2e` — запускает smoke-проверки основных сценариев.
- `npm.cmd run format` — форматирует файлы через Prettier.
- `npm.cmd run format:check` — проверяет форматирование без изменения файлов.
- `npm.cmd audit` — проверяет зависимости на известные уязвимости.

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
- `preview` — будущий слой предпросмотра опубликованной/собранной страницы.

## Builder

Фича `builder` содержит wizard, редактор структуры сайта, inspector, локальное сохранение проектов, demo-публикацию и сбор заявок.

Доменные модели:

- `SiteConfig`
- `PageConfig`
- `BlockConfig`
- `LinkConfig`
- `MediaAsset`
- `SiteHeaderBlockConfig`
- `HeroBlockConfig`
- `OfferListBlockConfig`
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

- Wizard для быстрого создания лендинга по индустрии и стилю.
- Palette блоков: header, hero, offers/products, lead form, footer.
- Inspector с вкладками `Контент`, `Дизайн`, `Поведение`.
- Редактирование ссылок, CTA, изображений, цен, карточек предложений, полей формы, карты и контактов.
- Header variants: centered, split, reservation bar, editorial, burger, stretched nav.
- Desktop/mobile preview внутри builder.
- Container queries для preview-блоков: mobile preview адаптируется по ширине холста, а не только по ширине окна браузера.
- Локальные Material Icons в `public/fonts`, чтобы builder не зависел от Google Fonts при разработке.

## Хранение и публикация

Сейчас проект работает без backend:

- проекты, релизы, ревизии и заявки сохраняются в `localStorage`;
- кнопка публикации создает локальную demo-публикацию;
- публичный preview доступен по локальному route `/p/:projectId`;
- persistence слой нормализует данные из storage и отбрасывает небезопасные ссылки вроде `javascript:` и `data:`.

Для production-публикации нужен отдельный backend-репозиторий/порт `ProjectRepository`.

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
npm.cmd run lint
npm.cmd test
npm.cmd run e2e
npm.cmd run build
npm.cmd run format:check
npm.cmd audit
```
