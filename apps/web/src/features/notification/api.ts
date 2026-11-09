import type { NotificationListResponse } from '@findit/shared';
import { api } from '../../shared/api/client';

export const notificationApi = {
  list: (params: { cursor?: string | null; limit?: number } = {}, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    if (params.cursor) q.set('cursor', params.cursor);
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api<NotificationListResponse>(`/notifications${qs ? `?${qs}` : ''}`, { signal });
  },
  /** ids 가 없으면 전체 읽음 */
  read: (ids?: string[]) => api<{ unreadCount: number }>('/notifications/read', { body: ids ? { ids } : {} }),
};
