import type { AdminClaimGroup, AdminStats, FoundItemListResponse, StatsPeriod } from '@findit/shared';
import { api } from '../../shared/api/client';

export const adminApi = {
  claims: (signal?: AbortSignal) => api<AdminClaimGroup[]>('/admin/claims', { signal }),
  approve: (claimId: string) => api<{ approved: string; rejected: string[] }>(`/admin/claims/${claimId}/approve`, { method: 'POST' }),
  reject: (claimId: string, reason: string) => api<{ rejected: string }>(`/admin/claims/${claimId}/reject`, { body: { reason } }),
  /** 보관 중 물건 — overdue 면 30일 경과분만 */
  keeping: (params: { overdue: boolean; cursor?: string | null }, signal?: AbortSignal) => {
    const q = new URLSearchParams({ status: 'KEEPING', limit: '30' });
    if (params.overdue) q.set('overdue', 'true');
    if (params.cursor) q.set('cursor', params.cursor);
    return api<FoundItemListResponse>(`/found-items?${q.toString()}`, { signal });
  },
  expire: (ids?: string[]) => api<{ expired: number; ids: string[] }>('/admin/found-items/expire', { body: ids ? { ids } : {} }),
  stats: (period: StatsPeriod, signal?: AbortSignal) => api<AdminStats>(`/admin/stats?period=${period}`, { signal }),
};
