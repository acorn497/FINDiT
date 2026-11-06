import type { CreateLostReportBody, LostReport } from '@findit/shared';
import { api } from '../../shared/api/client';

export const lostApi = {
  create: (body: CreateLostReportBody) => api<LostReport>('/lost-reports', { body }),
  get: (id: string, signal?: AbortSignal) => api<LostReport>(`/lost-reports/${id}`, { signal }),
  update: (id: string, body: Partial<CreateLostReportBody>) => api<LostReport>(`/lost-reports/${id}`, { method: 'PATCH', body }),
};
