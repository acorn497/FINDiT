import { expect, test } from '@playwright/test';
import { FINDER, login, STUDENT, TINY_PNG, unique } from './helpers';

test('주운 사람이 사진과 함께 등록 → 잃어버린 학생이 목록에서 찾아 수령 신청 → 배지 "확인 중"', async ({ page }) => {
  const title = unique('E2E 남색 필통');

  // 1) 습득물 등록 (파일 업로드)
  await login(page, FINDER, '/found/new');
  await expect(page.getByRole('heading', { name: '습득물 등록' })).toBeVisible();
  await page.getByLabel('사진 추가').setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: TINY_PNG });
  await expect(page.getByText('업로드 완료 · 1장')).toBeVisible();
  await page.getByRole('radio', { name: '문구' }).click();
  await page.getByLabel('맡긴 장소').fill('본관 1층 행정실');
  await page.getByRole('button', { name: /물건 정보 더 적기/ }).click();
  await page.getByLabel('물건 이름').fill(title);
  await page.getByLabel('색상').fill('남색');
  await page.getByRole('button', { name: '등록하기' }).click();
  await expect(page.getByText('습득물이 등록되었습니다')).toBeVisible();

  // 2) 다른 학생이 목록에서 검색해 확인
  await login(page, STUDENT, '/found');
  await expect(page.getByText('보관 중인 물건')).toBeVisible();
  await page.getByRole('searchbox', { name: '검색' }).fill(title);
  const card = page.getByRole('link', { name: new RegExp(title) });
  await expect(card).toBeVisible();
  await expect(card.getByText('보관 중')).toBeVisible();
  await expect(card.locator('img')).toHaveAttribute('src', /^\/api\/uploads\/.+\.jpg$/);

  // 3) 상세에서 수령 신청 → 확인 중
  await card.click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await expect(page.getByText('1 / 1')).toBeVisible();
  await page.getByRole('button', { name: '내 물건인 것 같아요' }).click();
  await expect(page.getByText('확인 중').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '신청 취소' })).toBeVisible();

  // 목록으로 돌아가도 배지가 바뀌어 있다
  await page.goto('/found');
  await page.getByRole('searchbox', { name: '검색' }).fill(title);
  await expect(page.getByRole('link', { name: new RegExp(title) }).getByText('확인 중')).toBeVisible();
});

test('목록 — 상태 배지, 필터 칩, 6건씩 [더 보기]', async ({ page }) => {
  await login(page, STUDENT, '/found');
  await page.getByRole('searchbox', { name: '검색' }).fill('텀블러');
  await expect(page.getByRole('link', { name: /분홍 텀블러/ }).getByText('기간 만료')).toBeVisible();
  await page.getByRole('searchbox', { name: '검색' }).fill('');

  await page.getByRole('radio', { name: '지갑·카드' }).click();
  await expect(page.getByRole('link', { name: /갈색 반지갑/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /분홍 텀블러/ })).toHaveCount(0);
  await page.getByRole('radio', { name: '전체' }).click();

  const more = page.getByRole('button', { name: /^더 보기 \(\d+건 중 6건\)$/ });
  await expect(more).toBeVisible();
  await more.click();
  await expect(page.getByRole('button', { name: /^더 보기 \(\d+건 중 12건\)$/ })).toBeVisible();
});

test('비로그인으로 보호 경로에 가면 로그인 후 가려던 주소로 돌아온다', async ({ page }) => {
  await login(page, STUDENT, '/me/reports');
  await expect(page).toHaveURL(/\/me\/reports$/);
  await expect(page.getByRole('heading', { name: '내 신고 관리' })).toBeVisible();
});
