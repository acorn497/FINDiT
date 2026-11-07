import { expect, test } from '@playwright/test';
import { login, STUDENT, unique } from './helpers';

test('내 신고 관리 — 분실 신고를 쓰고, 후보 배지로 ⑥ 이동, 찾음 처리(마감)는 재확인 후 반영', async ({ page }) => {
  const color = unique('하늘').replace(/\s/g, '');

  // 후보가 생길 만한 분실 신고 하나 (갈색 반지갑과 같은 종류·장소)
  await login(page, STUDENT, '/lost/new');
  await page.getByRole('radio', { name: '지갑·카드' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('잃어버린 장소').fill('본관 3층 복도');
  await page.getByLabel('잃어버린 날짜').fill('2026-10-17');
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('색상').fill(color);
  await page.getByRole('button', { name: '신고하기' }).click();
  await expect(page).toHaveURL(/\/matches\?lostReportId=/);

  await page.goto('/me/reports');
  await page.getByRole('radio', { name: '분실 신고' }).click();
  await page.getByRole('radio', { name: '후보 있음' }).click();
  const card = page.getByRole('article', { name: new RegExp(`분실 신고 ${color}`) });
  await expect(card).toBeVisible();
  await expect(card.getByText('후보 있음')).toBeVisible();

  // 새 후보 배지 → 매칭 후보
  await card.getByRole('link', { name: /새 후보 \d+개 보기/ }).click();
  await expect(page).toHaveURL(/\/matches\?lostReportId=/);
  await expect(page.getByLabel('내 분실 신고')).toContainText(color);
  await page.goBack();

  // 찾음 처리 — 재확인 모달
  await page.getByRole('radio', { name: '분실 신고' }).click();
  const again = page.getByRole('article', { name: new RegExp(`분실 신고 ${color}`) });
  await again.getByRole('button', { name: '찾음 처리' }).click();
  const dialog = page.getByRole('dialog', { name: '찾음 처리할까요?' });
  await expect(dialog).toContainText('되돌릴 수 없습니다');
  await dialog.getByRole('button', { name: '찾음 처리' }).click();
  await expect(again.getByText('마감')).toBeVisible();
  await expect(again.getByRole('button', { name: '찾음 처리' })).toHaveCount(0);

  // 상태 칩 '마감'으로 거르면 보인다
  await page.getByRole('radio', { name: '마감' }).click();
  await expect(page.getByRole('article', { name: new RegExp(`분실 신고 ${color}`) })).toBeVisible();
});
