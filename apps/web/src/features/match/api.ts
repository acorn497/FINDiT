import type { MatchesResponse } from '@findit/shared';
import { api } from '../../shared/api/client';

export const matchApi = {
  list: (lostReportId: string, signal?: AbortSignal) =>
    api<MatchesResponse>(`/matches?lostReportId=${encodeURIComponent(lostReportId)}`, { signal }),
};
