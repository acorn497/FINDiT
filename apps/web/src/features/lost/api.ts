import type { CreateLostReportBody, LostReport } from '@findit/shared';
import { api } from '../../shared/api/client';

export const lostApi = {
  create: (body: CreateLostReportBody) => api<LostReport>('/lost-reports', { body }),
};
