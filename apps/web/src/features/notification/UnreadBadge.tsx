import { useNotifications } from './NotificationsContext';

/** 알림 탭의 읽지 않음 개수 배지 */
export function UnreadBadge({ className = '' }: { className?: string }) {
  const { unreadCount } = useNotifications();
  if (unreadCount <= 0) return null;
  return (
    <span
      aria-label={`읽지 않은 알림 ${unreadCount}개`}
      className={`inline-flex min-w-[18px] items-center justify-center rounded-full bg-err px-1 text-[10.5px] font-bold leading-[18px] text-bg-1 ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}
