import { expect, test } from '@playwright/test';
import { login, STUDENT, TEACHER } from './helpers';

test('넓은 화면은 하단 탭 대신 왼쪽 사이드 메뉴, 카드 4열', async ({ page }) => {
  await login(page, STUDENT, '/found');
  await expect(page.getByRole('complementary').getByRole('link', { name: '습득물' })).toBeVisible();
  const cards = page.getByRole('main').getByRole('list').first().getByRole('listitem');
  await expect(cards.nth(3)).toBeVisible();
  const boxes = await Promise.all([0, 1, 2, 3].map((i) => cards.nth(i).boundingBox()));
  expect(new Set(boxes.map((b) => Math.round(b!.y))).size).toBe(1);
});

test('넓은 화면의 습득물 상세는 사진 | 정보 2열이고 신청 버튼이 정보 열 아래에 있다', async ({ page }) => {
  await login(page, STUDENT, '/found');
  await page.getByRole('link', { name: /갈색 반지갑/ }).first().click();
  const photo = page.getByRole('img', { name: '갈색 반지갑 사진 1' });
  const heading = page.getByRole('heading', { name: '갈색 반지갑' });
  await expect(heading).toBeVisible();
  const [p, h] = [await photo.boundingBox(), await heading.boundingBox()];
  expect(h!.x).toBeGreaterThan(p!.x + p!.width - 1);
  const claim = page.getByRole('button', { name: '내 물건인 것 같아요' });
  await expect(claim).toBeInViewport();
  expect((await claim.boundingBox())!.x).toBeGreaterThan(p!.x + p!.width - 1);
});

test('교사에게는 사이드 메뉴에 교사 메뉴(관리자)가 따로 보인다', async ({ page }) => {
  await login(page, TEACHER, '/');
  const side = page.getByRole('complementary');
  await expect(side.getByText('교사 메뉴')).toBeVisible();
  await side.getByRole('link', { name: '관리자' }).click();
  await expect(page.getByRole('tab', { name: '승인 대기' })).toHaveAttribute('aria-selected', 'true');
});
