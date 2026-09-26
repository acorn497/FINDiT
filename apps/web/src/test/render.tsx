import type { AuthUser } from '@findit/shared';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '../features/auth/AuthContext';
import { STUDENT } from './fixtures';
import { mockApi } from './mockApi';

type Routes = Parameters<typeof mockApi>[0];

/** 라우터 안에서 렌더한다. */
export function renderWithRouter(ui: ReactElement, { route = '/' }: { route?: string | string[] } = {}) {
  const entries = Array.isArray(route) ? route : [route];
  return render(<MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>);
}

/**
 * 라우터 + AuthProvider 로 렌더한다.
 * user 를 주면 /auth/me 가 그 사용자로, null 이면 401 로 응답한다.
 */
export function renderApp(
  ui: ReactElement,
  { route = '/', user = STUDENT, api = {} }: { route?: string; user?: AuthUser | null; api?: Routes } = {},
) {
  const mocked = mockApi({
    'GET /auth/me': user ? [200, user] : [401, { code: 'UNAUTHENTICATED', message: '로그인이 필요합니다' }],
    ...api,
  });
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
  return { ...utils, api: mocked };
}
