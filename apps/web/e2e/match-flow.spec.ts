import { expect, test } from '@playwright/test';
import { login, STUDENT } from './helpers';

test('분실 신고 작성 → 매칭 후보 화면에서 후보와 유사도 막대가 보인다', async ({ page }) => {
  await login(page, STUDENT, '/lost/new');

  await page.getByRole('radio', { name: '지갑·카드' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('잃어버린 장소').fill('본관 3층 복도');
  await page.getByLabel('잃어버린 날짜').fill('2026-10-17');
  await page.getByRole('radio', { name: '점심시간' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('색상').fill('갈색');
  await page.getByLabel(/특징/).fill('모서리 긁힘');
  await page.getByRole('button', { name: '신고하기' }).click();

  await expect(page).toHaveURL(/\/matches\?lostReportId=/);
  await expect(page.getByLabel('내 분실 신고')).toContainText('갈색 지갑·카드');
  await expect(page.getByRole('article', { name: '후보 갈색 반지갑' })).toBeVisible();

  const meter = page.getByRole('meter', { name: '유사한 정도' });
  await expect(meter).toBeVisible();
  const percent = Number(await meter.getAttribute('aria-valuenow'));
  expect(percent).toBeGreaterThanOrEqual(35);
  await expect(page.getByText(`${percent}%`, { exact: true })).toBeVisible();

  // 좌(내 신고)·우(습득물) 같은 행 — 모두 일치
  await expect(page.getByRole('row', { name: /장소 본관 3층 복도 본관 3층 복도/ })).toHaveAttribute('data-match', 'true');
  await expect(page.getByText(/자동으로 판단하지 않습니다/)).toBeVisible();
  await expect(page.getByRole('button', { name: '이 후보 아님' })).toBeInViewport();
});
