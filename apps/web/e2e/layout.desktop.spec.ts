import { expect, test } from '@playwright/test';
import { login, STUDENT } from './helpers';

test('넓은 화면은 하단 탭 대신 왼쪽 사이드 메뉴, 카드 4열', async ({ page }) => {
  await login(page, STUDENT, '/found');
  await expect(page.getByRole('complementary').getByRole('link', { name: '습득물' })).toBeVisible();
  const cards = page.getByRole('main').getByRole('list').first().getByRole('listitem');
  await expect(cards.nth(3)).toBeVisible();
  const boxes = await Promise.all([0, 1, 2, 3].map((i) => cards.nth(i).boundingBox()));
  expect(new Set(boxes.map((b) => Math.round(b!.y))).size).toBe(1);
});
