import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function selectSettingOption(page: Page, label: string, option: string): Promise<void> {
  await page.getByLabel(label, { exact: true }).click();
  await page.getByRole('menuitemradio', { name: option, exact: true }).click();
}

test('edit, autosave, publish and submit a lead', async ({ page }) => {
  await page.goto('/builder');

  await page.getByRole('textbox', { name: 'Заголовок' }).fill('Проверенный E2E лендинг');
  await page.getByRole('tab', { name: 'Слои' }).click();
  await page.getByRole('button', { name: 'Добавить страницу' }).click();
  await expect(page.locator('#page-title')).toHaveValue('Новая страница');
  await page.locator('#page-title').fill('О компании');
  await page.locator('#page-title').press('Tab');
  await page.locator('#page-slug').fill('about');
  await page.locator('#page-slug').press('Tab');
  await page.locator('#page-seo-title').fill('О компании — E2E');
  await page.locator('#page-seo-title').press('Tab');
  await page.locator('#page-seo-noindex').check();
  await page.getByRole('button', { name: /Hero Новая страница/u }).click();
  await page.getByRole('textbox', { name: 'Заголовок' }).fill('О компании');
  await page.getByRole('button', { name: 'Открыть страницу Главная' }).click();
  await expect(page.locator('.builder-page__status')).toHaveText('Сохранено');
  await page.reload();
  await page.getByRole('tab', { name: 'Слои' }).click();
  await expect(page.getByRole('button', { name: 'Открыть страницу Главная' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Открыть страницу О компании' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Проверенный E2E лендинг' })).toBeVisible();

  await page.getByRole('button', { name: 'Опубликовать локальное демо' }).click();
  await page.getByRole('button', { name: 'Еще действия' }).click();
  await page.getByRole('menuitem', { name: 'Локальная ссылка' }).click();

  await expect(page).toHaveURL(/\/p\/project-/u);
  await expect(page.getByRole('heading', { name: 'Проверенный E2E лендинг' })).toBeVisible();
  const publishedHomeUrl = page.url();
  const publishedHomePath = new URL(publishedHomeUrl).pathname;

  await page.goto(`${publishedHomeUrl}/about`);
  await expect(page.getByRole('heading', { name: 'О компании' })).toBeVisible();
  await expect(page).toHaveTitle('О компании — E2E');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');

  await page.goto(`${publishedHomeUrl}/missing`);
  await expect(page.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
  await expect(
    page.getByText('В опубликованной версии сайта нет страницы с таким адресом.'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Вернуться на главную страницу' })).toHaveAttribute(
    'href',
    publishedHomePath,
  );

  await page.goto(publishedHomeUrl);
  await page.getByRole('textbox', { name: 'Имя' }).fill('Тестовый пользователь');
  await page.getByRole('textbox', { name: 'Телефон или email' }).fill('test@example.com');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByText('Заявка сохранена. Мы скоро свяжемся с вами.')).toBeVisible();
});

test('exports and imports a project in a fresh browser context', async ({
  baseURL,
  browser,
  page,
}) => {
  const transferredTitle = 'Лендинг для переноса';

  await page.goto('/builder');
  await page.getByRole('textbox', { name: 'Заголовок' }).fill(transferredTitle);
  await page.getByRole('button', { name: 'Сохранить проект' }).click();
  await expect(page.locator('.builder-page__status')).toHaveText('Сохранено');
  await page.reload();
  await expect(page.getByRole('heading', { name: transferredTitle })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Еще действия' }).click();
  await page.getByRole('menuitem', { name: 'Экспортировать проект' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();

  expect(download.suggestedFilename()).toMatch(/\.nexus\.json$/u);
  expect(downloadPath).not.toBeNull();

  const importContext = await browser.newContext({ baseURL });

  try {
    const importPage = await importContext.newPage();
    await importPage.goto('/builder');
    await importPage.getByRole('button', { name: 'Еще действия' }).click();

    const fileChooserPromise = importPage.waitForEvent('filechooser');
    await importPage.getByRole('menuitem', { name: 'Импортировать проект' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(downloadPath!);

    await expect(importPage.getByRole('heading', { name: transferredTitle })).toBeVisible();
    await expect(importPage).toHaveURL(/\/builder\/project-/u);
    await importPage.reload();
    await expect(importPage.getByRole('heading', { name: transferredTitle })).toBeVisible();
  } finally {
    await importContext.close();
  }
});

test('saves and publishes a project recovered from schema version 2', async ({ page }) => {
  await page.goto('/builder');
  await page.getByRole('textbox', { name: 'Заголовок' }).fill('Проект до миграции');
  await page.getByRole('button', { name: 'Сохранить проект' }).click();
  await expect(page.locator('.builder-page__status')).toHaveText('Сохранено');

  await page.evaluate(() => {
    const storageKey = 'nexus.builder.projects.v1';
    const serializedState = localStorage.getItem(storageKey);

    if (serializedState === null) {
      throw new Error('Project storage fixture is missing.');
    }

    const state = JSON.parse(serializedState) as {
      projects: {
        draft: { schemaVersion: number };
        releases: { siteConfig: { schemaVersion: number } }[];
        revisions: { siteConfig: { schemaVersion: number } }[];
      }[];
    };

    for (const project of state.projects) {
      project.draft.schemaVersion = 2;

      for (const release of project.releases) {
        release.siteConfig.schemaVersion = 2;
      }

      for (const revision of project.revisions) {
        revision.siteConfig.schemaVersion = 2;
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(state));
  });

  await page.reload();
  await page.getByRole('tab', { name: 'Слои' }).click();
  await page.getByRole('button', { name: /Hero Проект до миграции/u }).click();
  await page.getByRole('textbox', { name: 'Заголовок' }).fill('Проект после миграции');
  await page.getByRole('button', { name: 'Сохранить проект' }).click();
  await expect(page.locator('.builder-page__status')).toHaveText('Сохранено');

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Проект после миграции' })).toBeVisible();

  await page.getByRole('button', { name: 'Опубликовать локальное демо' }).click();
  await page.getByRole('button', { name: 'Еще действия' }).click();
  await expect(page.getByRole('menuitem', { name: 'Локальная ссылка' })).toBeVisible();
});

test('wizard and theme editor stay compact inside their own containers', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/create');

  await page.getByRole('button', { name: /Отель/u }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await page.getByRole('button', { name: /Премиально/u }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await page.getByRole('button', { name: /Бургер-меню/u }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await page.getByRole('button', { name: /Карточки номеров/u }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();
  await page.getByRole('button', { name: /Контакты \+ карта/u }).click();
  await page.getByRole('button', { name: 'Дальше' }).click();

  const summaryItems = page.locator('.wizard__summary-item');
  await expect(summaryItems).toHaveCount(6);

  for (const item of await summaryItems.all()) {
    const labelBox = await item.locator('small').boundingBox();
    const valueBox = await item.locator('strong').boundingBox();
    const cardBox = await item.boundingBox();

    expect(labelBox).not.toBeNull();
    expect(valueBox).not.toBeNull();
    expect(cardBox).not.toBeNull();
    expect(valueBox!.y).toBeGreaterThanOrEqual(labelBox!.y + labelBox!.height);
    expect(cardBox!.height).toBeLessThan(120);
  }

  const previewBody = page.locator('.wizard-preview__body');
  const previewGeometry = await previewBody.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(previewGeometry.scrollWidth).toBeLessThanOrEqual(previewGeometry.clientWidth);

  const heroTitleSize = await page
    .locator('.wizard__preview .hero-block__title')
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  expect(heroTitleSize).toBeLessThanOrEqual(38);

  await page.goto('/builder');
  await page.getByRole('tab', { name: 'Тема' }).click();

  const themeFields = page.locator('.site-editor__grid .site-editor__field');
  const firstField = await themeFields.nth(0).boundingBox();
  const secondField = await themeFields.nth(1).boundingBox();

  expect(firstField).not.toBeNull();
  expect(secondField).not.toBeNull();
  expect(secondField!.y).toBeGreaterThanOrEqual(firstField!.y + firstField!.height);

  await page.getByLabel('Акцент: значение RGB').fill('rgb(12, 34, 56)');
  await expect(page.getByLabel('Акцент: палитра')).toHaveValue('#0c2238');
});

test('mobile builder always uses the mobile canvas without a viewport switcher', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/builder');

  await expect(page.locator('.builder-page__segments--icons')).toBeHidden();

  const canvas = page.locator('.builder-page__canvas');
  const canvasBox = await canvas.boundingBox();

  expect(canvasBox).not.toBeNull();
  expect(canvasBox!.width).toBeLessThanOrEqual(390);
});

test('design editor customizes hero buttons independently', async ({ page }) => {
  await page.goto('/builder');
  await page.getByRole('tab', { name: 'Дизайн' }).click();

  await selectSettingOption(page, 'Главная кнопка: тип', 'Контурная');
  await page.getByLabel('Главная кнопка: текст').fill('#123456');
  await selectSettingOption(page, 'Дополнительная кнопка: тип', 'Прозрачная');
  await page.getByLabel('Дополнительная кнопка: текст').fill('#654321');

  const primaryButton = page.locator('.hero-block__button').first();
  const secondaryButton = page.locator('.hero-block__button').nth(1);

  await expect(primaryButton).toHaveCSS('color', 'rgb(18, 52, 86)');
  await expect(primaryButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(primaryButton).toHaveCSS('border-color', 'rgb(37, 99, 235)');
  await primaryButton.focus();
  await expect(primaryButton).not.toHaveCSS('box-shadow', 'none');
  await expect(secondaryButton).toHaveCSS('color', 'rgb(101, 67, 33)');
  await expect(secondaryButton).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(secondaryButton).toHaveCSS('border-color', 'rgba(0, 0, 0, 0)');
});

test('design editor restores the selected button type after switching tabs', async ({ page }) => {
  await page.goto('/builder');
  await page.getByRole('tab', { name: 'Дизайн' }).click();

  await selectSettingOption(page, 'Главная кнопка: тип', 'Контурная');
  await page.getByRole('tab', { name: 'Контент' }).click();
  await page.getByRole('tab', { name: 'Дизайн' }).click();

  await expect(page.getByLabel('Главная кнопка: тип')).toContainText('Контурная');
});

test('first secondary button patch preserves its contextual block colors', async ({ page }) => {
  await page.goto('/builder');
  await page.getByRole('tab', { name: 'Дизайн' }).click();
  await page.getByRole('button', { name: 'Изумрудный' }).click();

  await selectSettingOption(page, 'Дополнительная кнопка: тип', 'Обычная');

  const secondaryButton = page.locator('.hero-block__button').nth(1);
  await expect(secondaryButton).toHaveCSS('background-color', 'rgb(5, 150, 105)');
  await expect(secondaryButton).toHaveCSS('color', 'rgb(17, 24, 39)');
  await expect(secondaryButton).toHaveCSS('border-color', 'rgb(5, 150, 105)');
});

test('design editor customizes CTA buttons outside hero', async ({ page }) => {
  await page.goto('/builder');
  await page.getByRole('button', { name: /Хедер/u }).click();
  await page.getByRole('tab', { name: 'Дизайн' }).click();

  await selectSettingOption(page, 'CTA в хедере: тип', 'Обычная');
  await page.getByLabel('CTA в хедере: фон').fill('#123456');
  await page.getByLabel('CTA в хедере: текст').fill('#fedcba');

  const headerCta = page.locator('.site-header__cta');

  await expect(headerCta).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await expect(headerCta).toHaveCSS('color', 'rgb(254, 220, 186)');
});
