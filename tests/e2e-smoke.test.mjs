import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('create-edit-save-publish-public-lead flow is wired through routes and pages', async () => {
  const [
    routes,
    builderTemplate,
    inspectorTemplate,
    inspectorComponent,
    contentInspectors,
    behaviorInspector,
    mediaTemplate,
    settingsTemplate,
    wizardTemplate,
    publicPreview,
    repository,
  ] = await Promise.all([
    source('src/app/app.routes.ts'),
    source('src/app/features/builder/pages/builder-page/builder-page.component.html'),
    source('src/app/features/builder/ui/block-inspector/block-inspector.component.html'),
    source('src/app/features/builder/ui/block-inspector/block-inspector.component.ts'),
    Promise.all(
      ['hero', 'offer-list', 'lead-form'].map((name) =>
        source(
          `src/app/features/builder/ui/block-inspector/${name}-content-inspector.component.ts`,
        ),
      ),
    ).then((sources) => sources.join('\n')),
    source('src/app/features/builder/ui/block-inspector/block-behavior-inspector.component.ts'),
    source('src/app/features/builder/ui/media-input/media-input.component.html'),
    source('src/app/features/builder/ui/site-settings-editor/site-settings-editor.component.html'),
    source('src/app/features/builder/pages/create-landing-page/create-landing-page.component.html'),
    source('src/app/features/preview/pages/public-preview-page/public-preview-page.component.ts'),
    source('src/app/features/builder/data-access/local-project.repository.ts'),
  ]);
  const editorSources = `${inspectorTemplate}\n${inspectorComponent}\n${contentInspectors}\n${mediaTemplate}`;

  assert.match(routes, /path: 'p\/:projectId'/);
  assert.match(routes, /builder-page\.component/);
  assert.match(builderTemplate, /saveProject\(\)/);
  assert.match(builderTemplate, /publishProject\(\)/);
  assert.match(builderTemplate, /publishedUrl\(\)/);
  assert.match(builderTemplate, /Демо-публикация/);
  assert.match(builderTemplate, /Локальная ссылка/);
  assert.match(inspectorTemplate, /Контент/);
  assert.match(inspectorTemplate, /Дизайн/);
  assert.match(inspectorTemplate, /Поведение/);
  assert.match(builderTemplate, /app-block-inspector/);
  assert.match(builderTemplate, /app-site-settings-editor/);
  assert.match(builderTemplate, /Добавить/);
  assert.match(builderTemplate, /Слои/);
  assert.match(builderTemplate, /Тема/);
  assert.match(behaviorInspector, /toggleBlockVisibility/);
  assert.match(behaviorInspector, /updateBlockAnchor/);
  assert.match(builderTemplate, /undo\(\)/);
  assert.match(builderTemplate, /redo\(\)/);
  assert.match(editorSources, /updateHeroMedia/);
  assert.match(editorSources, /updateOfferItemText/);
  assert.match(editorSources, /addLeadField/);
  assert.match(mediaTemplate, /type="file"/);
  assert.match(settingsTemplate, /Бизнес/);
  assert.match(settingsTemplate, /SEO/);
  assert.match(wizardTemplate, /updateBusinessDetails\('brandName'/);
  assert.match(wizardTemplate, /updateBusinessDetails\('heroTitle'/);
  assert.match(publicPreview, /getPublishedRelease/);
  assert.match(publicPreview, /submitLead/);
  assert.match(repository, /publishProject/);
  assert.match(repository, /submitLead/);
});
