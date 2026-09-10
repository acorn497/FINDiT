import { NavLink } from 'react-router';
import { NAV_ITEMS } from './navItems';

/** 좁은 화면의 하단 탭 (≥768px 에서는 숨기고 SideNav 를 쓴다) */
export function TabBar() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg-1 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid h-16 max-w-[640px] grid-cols-5">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  isActive ? 'text-accent' : 'text-tx-3'
                }`
              }
            >
              <Icon size={22} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
