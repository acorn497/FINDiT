import { expect, request as apiRequest, test } from '@playwright/test';
import { FINDER, login, PASSWORD, STUDENT, TEACHER, unique } from './helpers';

test('학생 수령 신청 → 교사 로그인·관리자에서 승인 → 학생 계정으로 돌아와 알림 수신과 전달 완료 확인', async ({ page, baseURL }) => {
  // 주운 학생이 물건을 등록해 둔다 (API)
  const title = unique('E2E 은색 텀블러');
  const finder = await apiRequest.newContext({ baseURL });
  await finder.post('/api/auth/login', { data: { email: FINDER, password: PASSWORD } });
  const created = await finder.post('/api/found-items', {
    data: { category: 'ETC', keptAt: '본관 1층 행정실', foundDate: '2026-11-09', title, color: '은색' },
  });
  const item = await created.json();
  await finder.dispose();

  // 1) 학생 — 상세에서 수령 신청 → 확인 중
  await login(page, STUDENT, `/found/${item.id}`);
  await page.getByRole('button', { name: '내 물건인 것 같아요' }).click();
  await expect(page.getByText('확인 중').first()).toBeVisible();

  // 2) 교사 — 관리자 화면에서 승인
  await login(page, TEACHER, '/admin');
  const group = page.getByRole('article', { name: `${title} 신청 1건` });
  await expect(group).toBeVisible();
  await group.getByRole('button', { name: '이지우 신청 승인' }).click();
  await page.getByRole('dialog', { name: '수령 신청을 승인할까요?' }).getByRole('button', { name: '승인' }).click();
  await expect(page.getByText(/승인했습니다/)).toBeVisible();
  await expect(group).toHaveCount(0);

  // 3) 학생 — 알림 수신과 전달 완료
  await login(page, STUDENT, '/');
  await expect(page.getByLabel(/읽지 않은 알림 \d+개/).first()).toBeAttached();
  await page.goto('/notifications');
  const note = page.getByRole('button', { name: new RegExp(`신청 승인 — ${title}`) });
  await expect(note).toBeVisible();
  await note.click();
  await expect(page).toHaveURL(new RegExp(`/found/${item.id}$`));
  await expect(page.getByText('전달 완료').first()).toBeVisible();
  await expect(page.getByText('이미 주인에게 전달된 물건입니다')).toBeVisible();
});

test('학생이 관리자 주소로 직접 들어오면 권한 없음 화면, 메뉴에도 보이지 않는다', async ({ page }) => {
  await login(page, STUDENT, '/admin');
  await expect(page.getByRole('heading', { name: '권한이 없습니다' })).toBeVisible();
  await expect(page.getByRole('link', { name: '관리자', exact: true })).toHaveCount(0);
});
