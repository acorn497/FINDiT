import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { AppLayout } from '../../shared/layout/AppLayout';
import { STUDENT, TEACHER } from '../../test/fixtures';
import { renderApp } from '../../test/render';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

const tree = (
  <Routes>
    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<p>홈</p>} />
        <Route element={<RequireRole role="TEACHER" />}>
          <Route path="/admin" element={<p>관리자 화면</p>} />
        </Route>
      </Route>
    </Route>
  </Routes>
);

afterEach(() => vi.unstubAllGlobals());

describe('권한에 따른 화면 분기', () => {
  it('학생이 주소로 직접 들어오면 "권한이 없습니다" 화면', async () => {
    renderApp(tree, { route: '/admin', user: STUDENT });
    expect(await screen.findByRole('heading', { name: '권한이 없습니다' })).toBeInTheDocument();
    expect(screen.queryByText('관리자 화면')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/');
  });

  it('학생 메뉴에는 관리자가 없다', async () => {
    renderApp(tree, { route: '/', user: STUDENT });
    await screen.findByText('홈', { selector: 'p' });
    expect(screen.queryByRole('link', { name: '관리자' })).not.toBeInTheDocument();
  });

  it('교사는 관리자 화면에 들어가고 사이드 메뉴에 관리자가 보인다', async () => {
    renderApp(tree, { route: '/admin', user: TEACHER });
    expect(await screen.findByText('관리자 화면')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '관리자' })).toHaveAttribute('href', '/admin');
  });
});
