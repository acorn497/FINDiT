import { expect, type Page } from '@playwright/test';

export const PASSWORD = 'findit1234';
export const STUDENT = 's2217@gbsw.hs.kr';
export const FINDER = 's2103@gbsw.hs.kr';
export const TEACHER = 'teacher@gbsw.hs.kr';

/** 로그인 화면 3단계 중 1·2단계를 거쳐 로그인한다 */
export async function login(page: Page, email: string, path = '/') {
  await page.context().clearCookies();
  await page.goto(path);
  await expect(page.getByText('1 / 3 단계 · 계정 확인')).toBeVisible();
  await page.getByLabel('학교 계정').fill(email);
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByText('✓ 등록된 계정입니다')).toBeVisible();
  await page.getByLabel('비밀번호').fill(PASSWORD);
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** 1×1 PNG — 화면에서 캔버스로 다시 그려 JPEG 로 올라간다 */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** 테스트마다 겹치지 않는 이름 */
export const unique = (prefix: string) => `${prefix} ${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
