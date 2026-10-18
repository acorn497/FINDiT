import { Outlet } from 'react-router';
import { SideNav } from './SideNav';
import { TabBar } from './TabBar';

/**
 * 공용 레이아웃.
 * 좁은 화면: 위 콘텐츠 + 하단 탭 / 넓은 화면(≥768px): 왼쪽 사이드 메뉴 + 콘텐츠
 */
export function AppLayout() {
  return (
    <div className="min-h-dvh bg-bg-2">
      <SideNav />
      <div className="pb-20 md:pb-0 md:pl-60">
        <main className="mx-auto w-full max-w-[1100px]">
          <Outlet />
        </main>
      </div>
      <TabBar />
    </div>
  );
}
