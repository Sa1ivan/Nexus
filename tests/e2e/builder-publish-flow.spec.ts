import { expect, test } from '@playwright/test';

test('edit, save, publish and submit a lead', async ({ page }) => {
  await page.goto('/builder');

  await page.getByRole('textbox', { name: 'Заголовок' }).fill('Проверенный E2E лендинг');
  await page.getByRole('tab', { name: 'Слои' }).click();
  await page.getByRole('button', { name: 'Добавить страницу' }).click();
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
  await page.getByRole('button', { name: 'Сохранить проект' }).click();
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
