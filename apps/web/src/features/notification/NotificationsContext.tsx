import { SOCKET_EVENT, type AppNotification, type NotificationNewEvent } from '@findit/shared';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useToast } from '../../shared/toast/ToastContext';
import { useAuth } from '../auth/AuthContext';
import { notificationApi } from './api';
import { connectSocket } from './socket';

type Listener = (n: AppNotification) => void;

interface NotificationsContextValue {
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  /** 서버에서 읽지 않은 수를 다시 받는다 */
  refresh: () => Promise<void>;
  /** 새 알림(실시간)·재연결 후 다시 맞추기 신호를 받는다 */
  subscribe: (onNew: Listener, onResync?: () => void) => () => void;
  connected: boolean;
}

const Ctx = createContext<NotificationsContextValue | null>(null);

/**
 * 읽지 않은 알림 수 + Socket.IO 실시간 수신.
 * 어느 화면에 있든 새 알림이 오면 배지 숫자가 바로 늘고 토스트가 뜬다.
 * 연결이 끊겼다 다시 붙으면 놓친 알림을 다시 조회해 채운다.
 * 소켓이 아예 연결되지 않아도 화면은 조회만으로 동작한다.
 */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const toast = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const listeners = useRef(new Set<{ onNew: Listener; onResync?: () => void }>());

  const refresh = useCallback(async () => {
    try {
      const res = await notificationApi.list({ limit: 1 });
      setUnreadCount(res.unreadCount);
    } catch {
      // 조회 실패는 배지만 그대로 둔다
    }
  }, []);

  useEffect(() => {
    if (status !== 'authed') {
      setUnreadCount(0);
      return;
    }
    void refresh();

    let socket: ReturnType<typeof connectSocket> | null = null;
    try {
      socket = connectSocket();
    } catch {
      return;
    }
    let everConnected = false;
    socket.on('connect', () => {
      setConnected(true);
      if (everConnected) {
        // 다시 연결됨 — 끊긴 사이의 알림을 다시 조회해 채운다
        void refresh();
        listeners.current.forEach((l) => l.onResync?.());
      }
      everConnected = true;
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on(SOCKET_EVENT.NOTIFICATION_NEW, (e: NotificationNewEvent) => {
      setUnreadCount(e.unreadCount);
      toast.info(`${e.notification.title} · ${e.notification.body}`);
      listeners.current.forEach((l) => l.onNew(e.notification));
    });
    return () => {
      socket?.removeAllListeners();
      socket?.close();
      setConnected(false);
    };
  }, [status, refresh, toast]);

  const subscribe = useCallback((onNew: Listener, onResync?: () => void) => {
    const entry = { onNew, onResync };
    listeners.current.add(entry);
    return () => {
      listeners.current.delete(entry);
    };
  }, []);

  const value = useMemo(
    () => ({ unreadCount, setUnreadCount, refresh, subscribe, connected }),
    [unreadCount, refresh, subscribe, connected],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useNotifications 는 NotificationsProvider 안에서만 쓸 수 있습니다');
  return ctx;
}
