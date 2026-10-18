import { expect, test } from '@playwright/test';
import { login, STUDENT } from './helpers';

test('분실 신고 작성의 [이전][다음]이 화면 안에 보인다', async ({ page }) => {
  await login(page, STUDENT, '/lost/new');
  await expect(page.getByRole('button', { name: '다음' })).toBeInViewport({ ratio: 1 });
  await expect(page.getByRole('button', { name: '이전' })).toBeInViewport({ ratio: 1 });
});
