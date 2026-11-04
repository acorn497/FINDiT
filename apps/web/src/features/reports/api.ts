import type { LostReport, MyReportsResponse, ReportKind } from '@findit/shared';
import { api } from '../../shared/api/client';

export interface MyReportsParams {
  kind?: ReportKind | null;
  status?: string | null;
  cursor?: string | null;
  limit?: number;
}

export const reportsApi = {
  list: (params: MyReportsParams = {}, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    if (params.kind) q.set('kind', params.kind);
    if (params.status) q.set('status', params.status);
    if (params.cursor) q.set('cursor', params.cursor);
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api<MyReportsResponse>(`/me/reports${qs ? `?${qs}` : ''}`, { signal });
  },
  close: (id: string) => api<LostReport>(`/lost-reports/${id}/close`, { method: 'POST' }),
  remove: (id: string) => api<{ deleted: true }>(`/lost-reports/${id}`, { method: 'DELETE' }),
};
