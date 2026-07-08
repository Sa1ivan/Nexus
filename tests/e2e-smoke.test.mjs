import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('create-edit-save-publish-public-lead flow is wired through routes and pages', async () => {
  const [routes, builderTemplate, wizardTemplate, publicPreview, persistence] = await Promise.all([
    source('src/app/app.routes.ts'),
    source('src/app/features/builder/pages/builder-page/builder-page.component.html'),
    source('src/app/features/builder/pages/create-landing-page/create-landing-page.component.html'),
    source('src/app/features/preview/pages/public-preview-page/public-preview-page.component.ts'),
    source('src/app/features/builder/data-access/project-persistence.service.ts'),
  ]);

  assert.match(routes, /path: 'p\/:projectId'/);
  assert.match(routes, /builder-page\.component/);
  assert.match(builderTemplate, /saveProject\(\)/);
  assert.match(builderTemplate, /publishProject\(\)/);
  assert.match(builderTemplate, /publishedUrl\(\)/);
  assert.match(builderTemplate, /Демо-публикация/);
  assert.match(builderTemplate, /Локальная ссылка/);
  assert.match(builderTemplate, /Контент/);
  assert.match(builderTemplate, /Дизайн/);
  assert.match(builderTemplate, /Поведение/);
  assert.match(builderTemplate, /updateHeroMedia/);
  assert.match(builderTemplate, /updateOfferItemText/);
  assert.match(builderTemplate, /addLeadField/);
  assert.match(wizardTemplate, /updateBusinessDetails\('brandName'/);
  assert.match(wizardTemplate, /updateBusinessDetails\('heroTitle'/);
  assert.match(publicPreview, /getPublishedRelease/);
  assert.match(publicPreview, /submitLead/);
  assert.match(persistence, /publishProject/);
  assert.match(persistence, /submitLead/);
});
