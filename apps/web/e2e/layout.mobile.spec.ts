import { expect, test } from '@playwright/test';
import { login, STUDENT } from './helpers';

test('390×844 에서 습득물 등록의 [등록하기]가 화면 안에 보인다 (100dvh 회귀 방지)', async ({ page }) => {
  await login(page, STUDENT, '/found/new');
  const button = page.getByRole('button', { name: '등록하기' });
  await expect(button).toBeInViewport({ ratio: 1 });
  const box = await button.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);
});

test('좁은 화면은 하단 탭 5개', async ({ page }) => {
  await login(page, STUDENT, '/found');
  const tabs = page.getByRole('navigation', { name: '주요 메뉴' }).filter({ visible: true });
  await expect(tabs.getByRole('link')).toHaveText(['홈', '습득물', '등록', '내 신고', /알림$/]);
  await expect(page.getByRole('complementary')).toBeHidden();
});
