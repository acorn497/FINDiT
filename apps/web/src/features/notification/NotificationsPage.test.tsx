import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderApp } from '../../test/render';
import { NotificationsPage } from './NotificationsPage';

const N = (over: Record<string, unknown>) => ({
  id: 'n1',
  type: 'NEW_MATCH',
  title: '새 후보 도착',
  body: "'갈색 지갑·카드' 신고와 비슷한 갈색 반지갑이(가) 등록되었습니다.",
  link: '/matches?lostReportId=lr1',
  readAt: null,
  createdAt: '2026-10-17T10:12:00.000Z',
  payload: null,
  ...over,
});

const tree = (
  <Routes>
    <Route path="/notifications" element={<NotificationsPage />} />
    <Route path="/matches" element={<p>매칭 후보 화면</p>} />
  </Routes>
);

afterEach(() => vi.unstubAllGlobals());

describe('NotificationsPage', () => {
  it('시간순 목록 — 읽지 않은 항목은 점과 --accent-weak 배경, 들어오면 전체 읽음 처리', async () => {
    const { api } = renderApp(tree, {
      route: '/notifications',
      api: {
        'GET /notifications': [
          200,
          {
            items: [
              N({}),
              N({ id: 'n2', type: 'CLAIM_RECEIVED', title: '수령 신청 접수', body: '무선 이어폰 수령 신청이 접수되었습니다.', link: '/found/f2' }),
              N({ id: 'n3', type: 'PICKUP_GUIDE', title: '수령 안내', body: '행정실에서 받아 가세요.', readAt: '2026-10-10T12:00:00.000Z' }),
            ],
            nextCursor: null,
            unreadCount: 2,
          },
        ],
        'POST /notifications/read': [200, { unreadCount: 0 }],
      },
    });
    const list = await screen.findByRole('list', { name: '알림 목록' });
    const rows = Array.from(list.querySelectorAll('button'));
    expect(rows.map((r) => r.getAttribute('data-unread'))).toEqual(['true', 'true', 'false']);
    expect(rows[0]).toHaveClass('bg-accent-weak');
    expect(rows[2]).toHaveClass('bg-bg-1');
    expect(screen.getByRole('button', { name: /^읽지 않음 · 새 후보 도착/ })).toBeInTheDocument();
    expect(screen.getAllByText('10월 17일 19:12').length).toBeGreaterThan(0);
    await waitFor(() => expect(api.calls.some((c) => c.path === '/notifications/read')).toBe(true));
    expect(api.calls.find((c) => c.path === '/notifications/read')?.body).toEqual({});
  });

  it('누르면 관련 화면으로 이동', async () => {
    renderApp(tree, {
      route: '/notifications',
      api: { 'GET /notifications': [200, { items: [N({ readAt: '2026-10-17T11:00:00.000Z' })], nextCursor: null, unreadCount: 0 }] },
    });
    await userEvent.click(await screen.findByRole('button', { name: /새 후보 도착/ }));
    expect(screen.getByText('매칭 후보 화면')).toBeInTheDocument();
  });

  it('읽지 않은 알림이 없으면 읽음 요청을 보내지 않는다 · 더 보기', async () => {
    const { api } = renderApp(tree, {
      route: '/notifications',
      api: {
        'GET /notifications': (_b, url) =>
          url.searchParams.get('cursor')
            ? [200, { items: [N({ id: 'old', title: '오래된 알림', readAt: '2026-09-01T00:00:00.000Z' })], nextCursor: null, unreadCount: 0 }]
            : [200, { items: [N({ readAt: '2026-10-17T11:00:00.000Z' })], nextCursor: 'c1', unreadCount: 0 }],
      },
    });
    await userEvent.click(await screen.findByRole('button', { name: '더 보기' }));
    expect(await screen.findByText('오래된 알림')).toBeInTheDocument();
    expect(api.calls.some((c) => c.path === '/notifications/read')).toBe(false);
  });

  it('빈 화면·오류 화면', async () => {
    const { unmount } = renderApp(tree, { route: '/notifications', api: { 'GET /notifications': [200, { items: [], nextCursor: null, unreadCount: 0 }] } });
    expect(await screen.findByText('아직 알림이 없습니다')).toBeInTheDocument();
    unmount();
    renderApp(tree, { route: '/notifications', api: { 'GET /notifications': [500, {}] } });
    expect(await screen.findByText('알림을 불러오지 못했습니다')).toBeInTheDocument();
  });
});
