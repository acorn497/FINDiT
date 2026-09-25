import type { CreateFoundItemBody, FoundItem } from '@findit/shared';
import { api } from '../../shared/api/client';

export const foundApi = {
  create: (body: CreateFoundItemBody) => api<FoundItem>('/found-items', { body }),
};
