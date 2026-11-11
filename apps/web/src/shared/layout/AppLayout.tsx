import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import { SideNav } from './SideNav';
import { TabBar } from './TabBar';

/**
 * 공용 레이아웃.
 * 좁은 화면: 위 콘텐츠 + 하단 탭 / 넓은 화면(≥768px): 왼쪽 사이드 메뉴 + 콘텐츠
 */
export function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const first = useRef(true);

  // 화면이 바뀌면 스크린 리더가 새 화면을 처음부터 읽도록 본문으로 초점을 옮긴다 (처음 들어올 때는 그대로)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo?.(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh bg-bg-2">
      <a
        href="#main"
        className="sr-only z-50 rounded-field bg-accent px-4 py-2 font-bold text-bg-1 focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        본문으로 건너뛰기
      </a>
      <SideNav />
      <div className="pb-20 md:pb-0 md:pl-60">
        <main id="main" ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-[1100px] outline-none">
          <Outlet />
        </main>
      </div>
      <TabBar />
    </div>
  );
}
