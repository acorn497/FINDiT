import type { Role } from '@findit/shared';
import { Lock } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { AppBar } from '../../shared/layout/AppBar';
import { useAuth } from './AuthContext';

/** 권한이 없을 때 보여 주는 화면 */
export function ForbiddenPage() {
  return (
    <>
      <AppBar title="권한 없음" back="/" />
      <section role="alert" className="mx-auto flex min-h-[60vh] max-w-[390px] flex-col items-center justify-center px-6 text-center">
        <Lock size={44} className="text-err" aria-hidden />
        <h2 className="mt-4 text-lg font-bold">권한이 없습니다</h2>
        <p className="mt-1 text-sm leading-relaxed text-tx-2">담당 선생님 계정으로만 들어올 수 있는 화면입니다.</p>
        <Link to="/" className="mt-6 inline-flex h-12 items-center rounded-field bg-accent px-5 font-bold text-bg-1">
          홈으로
        </Link>
      </section>
    </>
  );
}

/** 역할 가드 — 주소로 직접 들어와도 역할이 다르면 권한 없음 화면 (API 도 403) */
export function RequireRole({ role }: { role: Role }) {
  const { user } = useAuth();
  if (user?.role !== role) return <ForbiddenPage />;
  return <Outlet />;
}
