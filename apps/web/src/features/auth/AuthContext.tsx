import type { AuthUser } from '@findit/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, onUnauthorized } from '../../shared/api/client';
import { authApi } from './api';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** 로그인 상태 — 처음 뜰 때 /auth/me 로 세션을 확인한다. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let alive = true;
    authApi
      .me()
      .then((me) => {
        if (!alive) return;
        setUser(me);
        setStatus('authed');
      })
      .catch((e) => {
        if (!alive) return;
        if (!(e instanceof ApiError) || e.status !== 401) console.warn('세션 확인 실패', e);
        setUser(null);
        setStatus('guest');
      });
    return () => {
      alive = false;
    };
  }, []);

  // 사용 중 세션이 만료되면(어느 API 든 401) 로그인 화면으로 보낸다.
  useEffect(
    () =>
      onUnauthorized(() => {
        setUser(null);
        setStatus('guest');
      }),
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    const me = await authApi.login(email, password);
    setUser(me);
    setStatus('authed');
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo(() => ({ status, user, login, logout }), [status, user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 는 AuthProvider 안에서만 쓸 수 있습니다');
  return ctx;
}
