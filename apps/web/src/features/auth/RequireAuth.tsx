import { Outlet } from 'react-router';

/**
 * 보호 경로 가드.
 * 지금은 일단 통과시키고, 로그인·세션이 준비되면 실제 확인을 연결한다.
 */
export function RequireAuth() {
  return <Outlet />;
}
