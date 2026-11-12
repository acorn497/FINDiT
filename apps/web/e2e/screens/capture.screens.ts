import { expect, test, type Page } from '@playwright/test';
import { join } from 'node:path';
import { login, STUDENT, TEACHER, TINY_PNG } from '../helpers';

/** docs/screens/ 에 화면 10개를 저장한다 (390×844, 2배율) */
const OUT = process.env.SCREENS_DIR ?? join(__dirname, '../../../../docs/screens');
const WALLET_REPORT = '00000000-0000-4000-8003-000000000001';

const shot = async (page: Page, name: string) => {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
};

test.describe.configure({ mode: 'serial' });

test('① 로그인 — 2 / 3 단계, 통과한 칸과 오류 칸', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('학교 계정').fill(STUDENT);
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('✓ 등록된 계정입니다')).toBeVisible();
  await page.getByLabel('비밀번호').fill('findit');
  await page.getByLabel('비밀번호').blur();
  await shot(page, '01-login');
});

test('② 분실 신고 작성 — 2 / 3 단계, notFuture 오류와 시간대 칩', async ({ page }) => {
  await login(page, STUDENT, '/lost/new');
  await page.getByRole('radio', { name: '지갑·카드' }).click();
  await page.getByRole('button', { name: '다음' }).click();
  await page.getByLabel('잃어버린 장소').fill('본관 3층 복도');
  await page.getByLabel('잃어버린 날짜').fill('2026-12-25');
  await page.getByLabel('잃어버린 날짜').blur();
  await page.getByRole('radio', { name: '점심시간' }).click();
  await shot(page, '02-lost-report');
});

test('③ 습득물 등록 — 사진 2장, 종류·장소·날짜', async ({ page }) => {
  await login(page, STUDENT, '/found/new');
  await page.getByLabel('사진 추가').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: TINY_PNG },
    { name: 'b.png', mimeType: 'image/png', buffer: TINY_PNG },
  ]);
  await expect(page.getByText('업로드 완료 · 2장')).toBeVisible();
  await page.getByRole('radio', { name: '지갑·카드' }).click();
  await page.getByLabel('맡긴 장소').fill('본관 1층 행정실');
  await shot(page, '03-found-new');
});

test('④ 습득물 목록', async ({ page }) => {
  await login(page, STUDENT, '/found');
  await expect(page.getByRole('link', { name: /갈색 반지갑/ })).toBeVisible();
  await shot(page, '04-found-list');
});

test('⑤ 습득물 상세', async ({ page }) => {
  await login(page, STUDENT, '/found');
  await page.getByRole('link', { name: /갈색 반지갑/ }).first().click();
  await expect(page.getByText('모서리 긁힘, 단추 잠금')).toBeVisible();
  await shot(page, '05-found-detail');
});

test('⑥ 매칭 후보 — 좌우 비교와 유사도 막대', async ({ page }) => {
  await login(page, STUDENT, `/matches?lostReportId=${WALLET_REPORT}`);
  await expect(page.getByRole('meter', { name: '유사한 정도' })).toBeVisible();
  await shot(page, '06-matches');
});

test('⑦ 내 신고 관리 — 분실 신고 상태 칩', async ({ page }) => {
  await login(page, STUDENT, '/me/reports');
  await page.getByRole('radio', { name: '분실 신고' }).click();
  await expect(page.getByRole('article').first()).toBeVisible();
  await shot(page, '07-my-reports');
});

test('⑨ 홈 요약', async ({ page }) => {
  await login(page, STUDENT, '/');
  await expect(page.getByRole('region', { name: '최근 등록된 습득물' })).toBeVisible();
  await shot(page, '09-home');
});

test('⑧ 알림 — 읽지 않음 표시', async ({ page }) => {
  await login(page, STUDENT, '/notifications');
  await expect(page.getByRole('list', { name: '알림 목록' })).toBeVisible();
  await shot(page, '08-notifications');
});

test('⑩ 관리자 — 승인 대기', async ({ page }) => {
  await login(page, TEACHER, '/admin');
  await expect(page.getByRole('button', { name: /신청 승인/ }).first()).toBeVisible();
  await shot(page, '10-admin');
});
