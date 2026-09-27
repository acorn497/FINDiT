import { act, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useLocation } from 'react-router';
import { api } from '../../shared/api/client';
import { renderApp } from '../../test/render';
import { useAuth } from './AuthContext';
import { GuestOnly, RequireAuth } from './RequireAuth';

function LoginProbe() {
  const location = useLocation();
  return <p>로그인 화면 (from: {(location.state as { from?: string } | null)?.from})</p>;
}

function Me() {
  const { user, logout } = useAuth();
  return (
    <div>
      <p>보호된 화면 — {user?.name}</p>
      <button type="button" onClick={() => void logout()}>
        로그아웃
      </button>
    </div>
  );
}

const tree = (
  <Routes>
    <Route element={<GuestOnly />}>
      <Route path="/login" element={<LoginProbe />} />
    </Route>
    <Route element={<RequireAuth />}>
      <Route path="/" element={<p>홈</p>} />
      <Route path="/me/reports" element={<Me />} />
    </Route>
  </Routes>
);

afterEach(() => vi.unstubAllGlobals());

describe('경로 보호', () => {
  it('확인 중에는 로딩 화면', () => {
    renderApp(tree, { route: '/me/reports', api: { 'GET /auth/me': new Promise(() => undefined) } });
    expect(screen.getByRole('status')).toHaveTextContent('로그인 정보를 확인하고 있어요');
  });

  it('비로그인이면 가려던 주소를 들고 로그인으로', async () => {
    renderApp(tree, { route: '/me/reports?kind=lost', user: null });
    expect(await screen.findByText('로그인 화면 (from: /me/reports?kind=lost)')).toBeInTheDocument();
  });

  it('로그인 상태면 보호 화면을 그리고, 로그인 화면은 홈으로 돌린다', async () => {
    renderApp(tree, { route: '/me/reports' });
    expect(await screen.findByText('보호된 화면 — 이지우')).toBeInTheDocument();
  });

  it('이미 로그인했으면 /login 은 홈으로', async () => {
    renderApp(tree, { route: '/login' });
    expect(await screen.findByText('홈')).toBeInTheDocument();
  });

  it('로그아웃하면 로그인 화면으로', async () => {
    const { api: mocked } = renderApp(tree, { route: '/me/reports', api: { 'POST /auth/logout': [200, { ok: true }] } });
    await userEvent.click(await screen.findByRole('button', { name: '로그아웃' }));
    expect(await screen.findByText(/로그인 화면/)).toBeInTheDocument();
    expect(mocked.calls.some((c) => c.path === '/auth/logout')).toBe(true);
  });

  it('사용 중 다른 API 가 401 이면 세션 만료로 보고 로그인으로', async () => {
    renderApp(tree, { route: '/me/reports', api: { 'GET /found-items': [401, { code: 'SESSION_EXPIRED', message: '만료' }] } });
    await screen.findByText('보호된 화면 — 이지우');
    await act(async () => {
      await api('/found-items').catch(() => undefined);
    });
    expect(await screen.findByText(/로그인 화면/)).toBeInTheDocument();
  });

  it('useAuth 는 Provider 밖에서 쓰면 오류', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHookOutside()).toThrow('AuthProvider');
    spy.mockRestore();
  });
});

function renderHookOutside() {
  return renderHook(() => useAuth());
}
