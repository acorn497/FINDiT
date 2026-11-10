import { expect, request as apiRequest, test } from '@playwright/test';
import { FINDER, login, PASSWORD, STUDENT, unique } from './helpers';

test('알림 — 시드 배지 2, 알림 화면에 들어가면 읽음 처리, 다른 화면에서도 실시간으로 배지·토스트', async ({ page, baseURL }) => {
  await login(page, STUDENT, '/');
  await expect(page.getByRole('heading', { name: '홈' })).toBeVisible();

  // 알림 화면 → 전부 읽음 → 배지 사라짐
  await page.goto('/notifications');
  await expect(page.getByRole('list', { name: '알림 목록' })).toBeVisible();
  await expect(page.getByLabel(/읽지 않은 알림/).first()).toBeHidden();

  // 다른 화면(습득물 목록)에 있는 동안 주운 사람이 비슷한 지갑을 등록한다
  await page.goto('/found');
  await expect(page.getByText('보관 중인 물건')).toBeVisible();
  await page.waitForTimeout(500); // 소켓 연결

  const finder = await apiRequest.newContext({ baseURL });
  await finder.post('/api/auth/login', { data: { email: FINDER, password: PASSWORD } });
  const title = unique('갈색 장지갑');
  const created = await finder.post('/api/found-items', {
    data: { category: 'WALLET_CARD', keptAt: '본관 1층 행정실', foundPlace: '본관 3층 복도', foundDate: '2026-10-17', title, color: '갈색' },
  });
  expect(created.status()).toBe(201);
  await finder.dispose();

  // 새로 고치지 않아도 배지와 토스트가 뜬다
  await expect(page.getByRole('status').filter({ hasText: '새 후보 도착' }).first()).toBeVisible();
  await expect(page.getByLabel(/읽지 않은 알림 \d+개/).first()).toBeAttached();

  await page.goto('/notifications');
  const item = page.getByRole('button', { name: new RegExp(`새 후보 도착 — .*${title}`) }).first();
  await expect(item).toBeVisible();
  await item.click();
  await expect(page).toHaveURL(/\/matches\?lostReportId=/);
});
