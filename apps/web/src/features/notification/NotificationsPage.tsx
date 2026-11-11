import { NOTIFICATION_TYPE_LABEL, type AppNotification, type NotificationType } from '@findit/shared';
import { Bell, CircleCheck, CircleX, Clock, HandHelping, PackageSearch, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { formatDateTime } from '../../shared/lib/date';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { LoadingBlock } from '../../shared/ui/LoadingBlock';
import { StateView } from '../../shared/ui/StateView';
import { useToast } from '../../shared/toast/ToastContext';
import { notificationApi } from './api';
import { useNotifications } from './NotificationsContext';

export const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  NEW_MATCH: PackageSearch,
  CLAIM_RECEIVED: HandHelping,
  CLAIM_APPROVED: CircleCheck,
  CLAIM_REJECTED: CircleX,
  PICKUP_GUIDE: Bell,
  EXPIRING: Clock,
};

/**
 * ⑧ 알림 — 시간순 목록. 읽지 않은 항목은 왼쪽 점 + --accent-weak 배경.
 * 화면에 들어오면 전부 읽음 처리하고(이번 방문 동안은 읽지 않음 표시를 그대로 둔다), 누르면 관련 화면으로 이동한다.
 */
export function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const notifications = useNotifications();
  const { setUnreadCount, subscribe } = notifications;
  const [items, setItems] = useState<AppNotification[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    notificationApi
      .list({}, controller.signal)
      .then(async (res) => {
        setItems(res.items);
        setCursor(res.nextCursor);
        setState('ready');
        if (res.unreadCount > 0) {
          const read = await notificationApi.read().catch(() => null);
          if (read) setUnreadCount(read.unreadCount);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setState('error');
      });
    return () => controller.abort();
  }, [reloadKey, setUnreadCount]);

  // 이 화면을 보고 있는 동안 도착한 알림은 맨 위에 붙이고 바로 읽음 처리한다.
  // 연결이 끊겼다 다시 붙으면 목록을 다시 받는다.
  useEffect(
    () =>
      subscribe(
        (n) => {
          setItems((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev]));
          void notificationApi
            .read([n.id])
            .then((r) => setUnreadCount(r.unreadCount))
            .catch(() => undefined);
        },
        () => setReloadKey((k) => k + 1),
      ),
    [subscribe, setUnreadCount],
  );

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await notificationApi.list({ cursor });
      setItems((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor);
    } catch (e) {
      toast.fromError(e, '알림을 더 불러오지 못했습니다');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <AppBar title="알림" />
      <section className="mx-auto max-w-[720px] px-4 py-4">
        {state === 'loading' && (
          <LoadingBlock label="알림을 불러오는 중" />
        )}
        {state === 'error' && (
          <StateView kind="error" title="알림을 불러오지 못했습니다" action={<Button onClick={() => setReloadKey((k) => k + 1)}>다시 시도</Button>} />
        )}
        {state === 'ready' && items.length === 0 && (
          <StateView kind="empty" title="아직 알림이 없습니다" description="새 후보가 도착하거나 수령 신청이 처리되면 알려 드릴게요." />
        )}
        {state === 'ready' && items.length > 0 && (
          <ul className="flex flex-col gap-2" aria-label="알림 목록">
            {items.map((n) => {
              const Icon = TYPE_ICON[n.type];
              const unread = n.readAt === null;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => n.link && navigate(n.link)}
                    aria-label={`${unread ? '읽지 않음 · ' : ''}${n.title} — ${n.body}`}
                    data-unread={unread}
                    className={`relative flex w-full items-start gap-3 rounded-card border px-4 py-3 text-left ${
                      unread ? 'border-accent/20 bg-accent-weak' : 'border-line bg-bg-1'
                    }`}
                  >
                    {unread && <span aria-hidden className="absolute left-1.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-accent" />}
                    <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${unread ? 'bg-bg-1 text-accent' : 'bg-bg-2 text-tx-3'}`}>
                      <Icon size={17} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold">{n.title}</span>
                        <span className="shrink-0 text-[11px] text-tx-3">{formatDateTime(n.createdAt)}</span>
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-tx-2">{n.body}</span>
                      <span className="sr-only">{NOTIFICATION_TYPE_LABEL[n.type]}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {state === 'ready' && cursor && (
          <Button variant="secondary" block className="mt-3" loading={loadingMore} onClick={() => void loadMore()}>
            더 보기
          </Button>
        )}
      </section>
    </>
  );
}
