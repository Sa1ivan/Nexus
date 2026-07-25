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

  await page.getByRole('textbox', { name: 'Имя' }).fill('Тестовый пользователь');
  await page.getByRole('textbox', { name: 'Телефон или email' }).fill('test@example.com');
  await page.getByRole('button', { name: 'Отправить' }).click();

  await expect(page.getByText('Заявка сохранена. Мы скоро свяжемся с вами.')).toBeVisible();
});
