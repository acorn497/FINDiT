import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router';
import { useAuth } from '../../features/auth/AuthContext';
import { UnreadBadge } from '../../features/notification/UnreadBadge';
import { Logo } from './Logo';
import { NAV_ITEMS } from './navItems';

/** 넓은 화면(≥768px)의 왼쪽 사이드 메뉴 */
export function SideNav() {
  const { user, logout } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-bg-1 px-4 py-6 md:flex">
      <Logo className="px-3 text-2xl" />
      <p className="mt-1 px-3 text-xs text-tx-3">교내 분실물 등록·매칭 서비스</p>
      <nav aria-label="주요 메뉴" className="mt-8">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold ${
                    isActive ? 'bg-accent-weak text-accent' : 'text-tx-2 hover:bg-bg-2'
                  }`
                }
              >
                <Icon size={20} aria-hidden />
                <span className="flex-1">{label}</span>
                {to === '/notifications' && <UnreadBadge />}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {user && (
        <div className="mt-auto border-t border-line px-3 pt-4">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-tx-3">{user.email}</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-tx-2 hover:text-tx-1"
          >
            <LogOut size={16} aria-hidden />
            로그아웃
          </button>
        </div>
      )}
    </aside>
  );
}
