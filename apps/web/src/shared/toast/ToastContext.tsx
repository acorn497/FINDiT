import { CircleAlert, CircleCheck, Info, Lock, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';

export type ToastKind = 'success' | 'error' | 'info' | 'forbidden';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  /** 권한 없음 — 실패와 같은 색, 자물쇠 아이콘 */
  forbidden: (message?: string) => void;
  /** API 오류를 알맞은 종류로 (403 → 권한 없음) */
  fromError: (e: unknown, fallback?: string) => void;
  dismiss: (id: number) => void;
}

/** 자동으로 사라지기까지 (ms) */
export const TOAST_DURATION = 3500;
/** 동시에 보이는 최대 개수 — 넘치면 가장 오래된 것부터 닫는다 */
export const TOAST_MAX = 3;

const ToastContext = createContext<ToastApi | null>(null);

/**
 * P8 공용 알림(토스트) — 성공·실패·안내·권한 없음을 모든 화면에서 같은 모양·같은 위치로.
 * 색은 토큰만 쓴다: 성공 --st-done, 실패 #dc2626(--err), 안내 --accent.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = ++seq.current;
      setToasts((prev) => [...prev, { id, kind, message }].slice(-TOAST_MAX));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_DURATION),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
      forbidden: (m = '권한이 없습니다') => push('forbidden', m),
      fromError: (e, fallback = '요청을 처리하지 못했습니다') => {
        if (e instanceof ApiError && e.status === 403) push('forbidden', e.message || '권한이 없습니다');
        else push('error', e instanceof ApiError ? e.message : fallback);
      },
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast 는 ToastProvider 안에서만 쓸 수 있습니다');
  return ctx;
}

const STYLE: Record<ToastKind, { className: string; Icon: typeof Info; label: string }> = {
  success: { className: 'bg-st-done', Icon: CircleCheck, label: '성공' },
  error: { className: 'bg-err', Icon: CircleAlert, label: '실패' },
  forbidden: { className: 'bg-err', Icon: Lock, label: '권한 없음' },
  info: { className: 'bg-accent', Icon: Info, label: '안내' },
};

/** 화면 위쪽 가운데에 쌓인다 (먼저 뜬 것이 위) */
function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-label="알림 메시지"
      className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4 pt-[env(safe-area-inset-top)]"
    >
      {toasts.map((t) => {
        const { className, Icon, label } = STYLE[t.kind];
        const assertive = t.kind === 'error' || t.kind === 'forbidden';
        return (
          <div
            key={t.id}
            role={assertive ? 'alert' : 'status'}
            data-kind={t.kind}
            className={`pointer-events-auto flex w-full max-w-[390px] items-center gap-2.5 rounded-card px-4 py-3 text-sm font-semibold text-bg-1 shadow-lg ${className}`}
          >
            <Icon size={18} aria-label={label} className="shrink-0" />
            <span className="flex-1">{t.message}</span>
            <button type="button" aria-label="닫기" onClick={() => onDismiss(t.id)} className="shrink-0 opacity-80 hover:opacity-100">
              <X size={16} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
