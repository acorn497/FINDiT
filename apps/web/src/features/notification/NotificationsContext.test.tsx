import { act, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { AppLayout } from '../../shared/layout/AppLayout';
import { createFakeSocket, type FakeSocket } from '../../test/fakeSocket';
import { renderApp } from '../../test/render';
import { NotificationsPage } from './NotificationsPage';
import { connectSocket } from './socket';

const NEW = {
  notification: {
    id: 'live1',
    type: 'CLAIM_APPROVED',
    title: '신청 승인',
    body: '무선 이어폰 수령 신청이 승인되었습니다.',
    link: '/found/f2',
    readAt: null,
    createdAt: '2026-11-10T09:00:00.000Z',
    payload: null,
  },
  unreadCount: 3,
};

let socket: FakeSocket;
beforeEach(() => {
  socket = createFakeSocket();
  vi.mocked(connectSocket).mockClear();
  vi.mocked(connectSocket).mockImplementation(() => socket as never);
});
afterEach(() => vi.unstubAllGlobals());

const tree = (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/found" element={<p>습득물 목록 화면</p>} />
      <Route path="/notifications" element={<NotificationsPage />} />
    </Route>
  </Routes>
);

describe('실시간 알림 · 읽지 않음 배지', () => {
  it('처음에는 조회한 읽지 않은 수를 탭 배지에 보여 준다', async () => {
    renderApp(tree, { route: '/found', api: { 'GET /notifications': [200, { items: [], nextCursor: null, unreadCount: 2 }] } });
    expect((await screen.findAllByLabelText('읽지 않은 알림 2개')).length).toBeGreaterThan(0);
  });

  it('다른 화면에 있어도 소켓 이벤트가 오면 배지 숫자가 즉시 늘고 토스트가 뜬다', async () => {
    renderApp(tree, { route: '/found', api: { 'GET /notifications': [200, { items: [], nextCursor: null, unreadCount: 2 }] } });
    await screen.findAllByLabelText('읽지 않은 알림 2개');
    act(() => socket.serverEmit('connect'));
    act(() => socket.serverEmit('notification:new', NEW));
    expect(screen.getAllByLabelText('읽지 않은 알림 3개').length).toBeGreaterThan(0);
    expect(screen.getByText('신청 승인 · 무선 이어폰 수령 신청이 승인되었습니다.')).toBeInTheDocument();
  });

  it('끊겼다 다시 연결되면 놓친 알림을 다시 조회해 채운다', async () => {
    let unread = 1;
    renderApp(tree, { route: '/found', api: { 'GET /notifications': () => [200, { items: [], nextCursor: null, unreadCount: unread }] } });
    await screen.findAllByLabelText('읽지 않은 알림 1개');
    act(() => socket.serverEmit('connect'));
    act(() => socket.serverEmit('disconnect'));
    unread = 4;
    await act(async () => socket.serverEmit('connect'));
    await waitFor(() => expect(screen.getAllByLabelText('읽지 않은 알림 4개').length).toBeGreaterThan(0));
  });

  it('알림 화면을 보고 있을 때 온 알림은 맨 위에 붙고 바로 읽음 처리된다', async () => {
    const { api } = renderApp(tree, {
      route: '/notifications',
      api: {
        'GET /notifications': [200, { items: [], nextCursor: null, unreadCount: 0 }],
        'POST /notifications/read': [200, { unreadCount: 0 }],
      },
    });
    await screen.findByText('아직 알림이 없습니다');
    act(() => socket.serverEmit('notification:new', NEW));
    expect(await screen.findByRole('button', { name: /신청 승인 — 무선 이어폰/ })).toBeInTheDocument();
    await waitFor(() => expect(api.calls.find((c) => c.path === '/notifications/read')?.body).toEqual({ ids: ['live1'] }));
    await waitFor(() => expect(screen.queryByLabelText(/읽지 않은 알림/)).not.toBeInTheDocument());
  });

  it('소켓이 아예 연결되지 않는 환경에서도 화면은 조회만으로 채워진다', async () => {
    vi.mocked(connectSocket).mockImplementation(() => {
      throw new Error('WebSocket 사용 불가');
    });
    renderApp(tree, {
      route: '/notifications',
      api: {
        'GET /notifications': [200, { items: [NEW.notification], nextCursor: null, unreadCount: 1 }],
        'POST /notifications/read': [200, { unreadCount: 0 }],
      },
    });
    expect(await screen.findByRole('button', { name: /신청 승인/ })).toBeInTheDocument();
  });

  it('로그아웃 상태에서는 연결하지 않는다', async () => {
    renderApp(<p>로그인 화면</p>, { user: null });
    await screen.findByText('로그인 화면');
    await waitFor(() => expect(connectSocket).not.toHaveBeenCalled());
  });
});
