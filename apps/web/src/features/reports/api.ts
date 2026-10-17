import type { MyReportsResponse } from '@findit/shared';
import { api } from '../../shared/api/client';

export const reportsApi = {
  list: (params: { cursor?: string | null; limit?: number } = {}, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    if (params.cursor) q.set('cursor', params.cursor);
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api<MyReportsResponse>(`/me/reports${qs ? `?${qs}` : ''}`, { signal });
  },
};
