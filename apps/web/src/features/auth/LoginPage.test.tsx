import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockApi } from '../../test/mockApi';
import { AuthProvider } from './AuthContext';
import { LoginPage } from './LoginPage';

const USER = { id: 'u1', email: 's2217@gbsw.hs.kr', name: '이지우', role: 'STUDENT', grade: 2, classNo: 2 };

function setup(routes: Parameters<typeof mockApi>[0] = {}) {
  const api = mockApi({
    'POST /auth/check-email': (body) =>
      (body as { email: string }).email === 's2217@gbsw.hs.kr'
        ? [200, { exists: true, name: '이지우' }]
        : [404, { code: 'USER_NOT_FOUND', message: '등록되지 않은 계정입니다' }],
    'POST /auth/login': (body) =>
      (body as { password: string }).password === 'findit1234'
        ? [200, USER]
        : [401, { code: 'WRONG_PASSWORD', message: '비밀번호가 올바르지 않습니다' }],
    'POST /auth/password-reset': [200, { sent: true, retryAfter: 60 }],
    'GET /auth/me': [401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다' }],
    ...routes,
  });
  render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/found' } }]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/found" element={<p>습득물 목록 화면</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
  return api;
}

const emailInput = () => screen.getByLabelText('학교 계정');
const next = () => screen.getByRole('button', { name: '다음' });

afterEach(() => vi.unstubAllGlobals());

describe('LoginPage', () => {
  it('타이핑 중에는 오류를 숨기고, blur 후에 보여 준다', async () => {
    setup();
    await userEvent.type(emailInput(), 's2217');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('이메일 형식이 아닙니다');
    expect(emailInput()).toHaveAttribute('aria-invalid', 'true');
  });

  it('[다음]은 비활성화하지 않고, 누르면 건드리지 않은 칸의 오류를 드러낸다', async () => {
    const api = setup();
    expect(next()).toBeEnabled();
    await userEvent.click(next());
    expect(screen.getByRole('alert')).toHaveTextContent('학교 계정을 입력해 주세요');
    expect(api.calls.filter((c) => c.path === '/auth/check-email')).toHaveLength(0);
  });

  it('미등록 계정이면 서버 오류를 칸 아래에 보여 준다', async () => {
    setup();
    await userEvent.type(emailInput(), 'nobody@gbsw.hs.kr');
    await userEvent.click(next());
    expect(await screen.findByRole('alert')).toHaveTextContent('등록되지 않은 계정입니다');
    expect(screen.getByText(/1 \/ 3 단계/)).toBeInTheDocument();
  });

  it('계정 확인 → 2단계(초록 안내) → 로그인 성공 시 가려던 주소로', async () => {
    setup();
    await userEvent.type(emailInput(), 's2217@gbsw.hs.kr');
    await userEvent.click(next());
    expect(await screen.findByText(/2 \/ 3 단계 · 비밀번호 입력/)).toBeInTheDocument();
    expect(screen.getByText('✓ 등록된 계정입니다')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2');

    await userEvent.click(next());
    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호를 입력해 주세요');

    await userEvent.type(screen.getByLabelText('비밀번호'), 'short');
    await userEvent.tab();
    expect(screen.getByRole('alert')).toHaveTextContent('비밀번호는 8자 이상이어야 합니다');

    await userEvent.clear(screen.getByLabelText('비밀번호'));
    await userEvent.type(screen.getByLabelText('비밀번호'), 'findit1234');
    await userEvent.click(next());
    expect(await screen.findByText('습득물 목록 화면')).toBeInTheDocument();
  });

  it('비밀번호가 틀리면 401 사유를 보여 준다', async () => {
    setup();
    await userEvent.type(emailInput(), 's2217@gbsw.hs.kr');
    await userEvent.click(next());
    await userEvent.type(await screen.findByLabelText('비밀번호'), 'wrongpass1');
    await userEvent.click(next());
    expect(await screen.findByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않습니다');
  });

  it('이전 단계로 돌아가도 입력값이 남아 있다', async () => {
    setup();
    await userEvent.type(emailInput(), 's2217@gbsw.hs.kr');
    await userEvent.click(next());
    await screen.findByLabelText('비밀번호');
    await userEvent.click(screen.getByRole('button', { name: '이전 단계로' }));
    expect(screen.getByText(/1 \/ 3 단계/)).toBeInTheDocument();
    expect(emailInput()).toHaveValue('s2217@gbsw.hs.kr');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  describe('3단계 — 재설정', () => {
    async function toResetStep() {
      await userEvent.type(emailInput(), 's2217@gbsw.hs.kr');
      await userEvent.click(next());
      await userEvent.click(await screen.findByRole('button', { name: '재설정' }));
    }

    it('계정 확인 단계의 메일을 다시 묻지 않는다', async () => {
      const api = setup();
      await toResetStep();
      expect(screen.getByText(/3 \/ 3 단계 · 비밀번호 재설정/)).toBeInTheDocument();
      expect(emailInput()).toHaveAttribute('readonly');
      expect(emailInput()).toHaveValue('s2217@gbsw.hs.kr');
      await userEvent.click(screen.getByRole('button', { name: '재설정 안내 보내기' }));
      expect(await screen.findByText(/재설정 안내를 보냈습니다/)).toBeInTheDocument();
      expect(api.calls.at(-1)).toMatchObject({ path: '/auth/password-reset', body: { email: 's2217@gbsw.hs.kr' } });
    });

    it('보낸 뒤 60초 타이머가 1초마다 줄고 그동안 버튼이 막힌다', async () => {
      setup();
      await toResetStep();
      vi.useFakeTimers();
      try {
        fireEvent.click(screen.getByRole('button', { name: '재설정 안내 보내기' }));
        await act(() => vi.advanceTimersByTimeAsync(0));
        expect(screen.getByRole('button', { name: '다시 보내기 (60초)' })).toBeDisabled();
        await act(() => vi.advanceTimersByTimeAsync(1000));
        expect(screen.getByRole('button', { name: '다시 보내기 (59초)' })).toBeDisabled();
        for (let i = 0; i < 59; i++) await act(() => vi.advanceTimersByTimeAsync(1000));
        expect(screen.getByRole('button', { name: '다시 보내기' })).toBeEnabled();
      } finally {
        vi.useRealTimers();
      }
    });

    it('서버가 429 + retryAfter 를 주면 그 값으로 타이머를 맞춘다', async () => {
      setup({
        'POST /auth/password-reset': [429, { code: 'RESEND_TOO_SOON', message: '잠시 후', retryAfter: 37 }],
      });
      await toResetStep();
      await userEvent.click(screen.getByRole('button', { name: '재설정 안내 보내기' }));
      expect(await screen.findByRole('button', { name: '다시 보내기 (37초)' })).toBeDisabled();
    });

    it('그 밖의 오류는 문구로 알린다', async () => {
      setup({ 'POST /auth/password-reset': [500, { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' }] });
      await toResetStep();
      await userEvent.click(screen.getByRole('button', { name: '재설정 안내 보내기' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다');
    });
  });
});
