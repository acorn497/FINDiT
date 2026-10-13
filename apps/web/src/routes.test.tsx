import { screen } from '@testing-library/react';
import { AppRoutes } from './routes';
import { renderApp } from './test/render';

const navs = () => screen.queryAllByRole('navigation', { name: '주요 메뉴' });

afterEach(() => vi.unstubAllGlobals());

describe('AppRoutes', () => {
  it('습득물 경로는 레이아웃(탭·사이드 메뉴) 안에서 보이고 해당 탭이 활성이다', async () => {
    renderApp(<AppRoutes />, { route: '/found', api: { 'GET /found-items': [200, { items: [], nextCursor: null, total: 0 }] } });
    expect(await screen.findByRole('heading', { name: '습득물 목록' })).toBeInTheDocument();
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
  ])('%s 는 입력 흐름이라 하단 탭을 숨긴다', async (route, title) => {
    renderApp(<AppRoutes />, { route });
    expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
    expect(navs()).toHaveLength(0);
  });

  it('비로그인으로 /login 은 로그인 화면이고 하단 탭이 없다', async () => {
    renderApp(<AppRoutes />, { route: '/login', user: null });
    expect(await screen.findByText(/1 \/ 3 단계 · 계정 확인/)).toBeInTheDocument();
    expect(navs()).toHaveLength(0);
  });

  it('[등록] 탭은 분실 신고·습득물 등록 두 갈래를 보여 준다', async () => {
    renderApp(<AppRoutes />, { route: '/register' });
    expect(await screen.findByRole('link', { name: /분실 신고 작성/ })).toHaveAttribute('href', '/lost/new');
    expect(screen.getByRole('link', { name: /습득물 등록/ })).toHaveAttribute('href', '/found/new');
  });

  it('없는 경로는 404 화면', async () => {
    renderApp(<AppRoutes />, { route: '/nope' });
    expect(await screen.findByText('페이지를 찾을 수 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '홈으로' })).toHaveAttribute('href', '/');
  });

  it('하단 탭은 홈·습득물·등록·내 신고·알림 5개다', async () => {
    renderApp(<AppRoutes />, { route: '/' });
    await screen.findByRole('heading', { name: '홈' });
    const [tabBar] = navs().filter((n) => n.className.includes('bottom-0'));
    const labels = Array.from(tabBar.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual(['홈', '습득물', '등록', '내 신고', '알림']);
  });
});
