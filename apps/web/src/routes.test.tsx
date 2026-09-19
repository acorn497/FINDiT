import { screen } from '@testing-library/react';
import { AppRoutes } from './routes';
import { renderWithRouter } from './test/render';

const navs = () => screen.queryAllByRole('navigation', { name: '주요 메뉴' });

describe('AppRoutes', () => {
  it('습득물 경로는 레이아웃(탭·사이드 메뉴) 안에서 보이고 해당 탭이 활성이다', () => {
    renderWithRouter(<AppRoutes />, { route: '/found' });
    expect(screen.getByRole('heading', { name: '습득물 목록' })).toBeInTheDocument();
    expect(navs()).toHaveLength(2);
    for (const link of screen.getAllByRole('link', { name: '습득물' })) {
      expect(link).toHaveAttribute('aria-current', 'page');
    }
    for (const link of screen.getAllByRole('link', { name: '홈' })) {
      expect(link).not.toHaveAttribute('aria-current');
    }
  });

  it.each([
    ['/found/new', '습득물 등록'],
    ['/lost/new', '분실 신고 작성'],
  ])('%s 는 입력 흐름이라 하단 탭을 숨긴다', (route, title) => {
    renderWithRouter(<AppRoutes />, { route });
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(navs()).toHaveLength(0);
  });

  it('/login 은 로그인 화면이고 하단 탭이 없다', () => {
    renderWithRouter(<AppRoutes />, { route: '/login' });
    expect(screen.getByText(/1 \/ 3 단계 · 계정 확인/)).toBeInTheDocument();
    expect(navs()).toHaveLength(0);
  });

  it('없는 경로는 404 화면', () => {
    renderWithRouter(<AppRoutes />, { route: '/nope' });
    expect(screen.getByText('페이지를 찾을 수 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/');
  });

  it('하단 탭은 홈·습득물·등록·내 신고·알림 5개다', () => {
    renderWithRouter(<AppRoutes />, { route: '/' });
    const [tabBar] = navs().filter((n) => n.tagName === 'NAV' && n.className.includes('bottom-0'));
    const labels = Array.from(tabBar.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual(['홈', '습득물', '등록', '내 신고', '알림']);
  });
});
