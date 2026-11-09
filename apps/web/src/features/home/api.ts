import type { HomeSummary } from '@findit/shared';
import { api } from '../../shared/api/client';

export const homeApi = {
  summary: (signal?: AbortSignal) => api<HomeSummary>('/home/summary', { signal }),
};
