import { Navigate, Outlet, useLocation } from 'react-router';
import { LoadingScreen } from '../../shared/ui/LoadingScreen';
import { useAuth } from './AuthContext';

/**
 * 보호 경로 가드.
 * 확인 중이면 로딩 화면, 비로그인이면 가려던 주소를 들고 로그인으로 보낸다.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <LoadingScreen message="로그인 정보를 확인하고 있어요" />;
  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  return <Outlet />;
}

/** 로그인 화면 — 이미 로그인했다면 홈으로 */
export function GuestOnly() {
  const { status } = useAuth();
  if (status === 'loading') return <LoadingScreen message="로그인 정보를 확인하고 있어요" />;
  if (status === 'authed') return <Navigate to="/" replace />;
  return <Outlet />;
}
