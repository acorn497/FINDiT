import type { Category, CreateFoundItemBody, FoundItem, FoundItemListResponse } from '@findit/shared';
import { api } from '../../shared/api/client';

export interface FoundListParams {
  category?: Category | null;
  keyword?: string;
  cursor?: string | null;
  limit?: number;
}

export const foundApi = {
  list: ({ category, keyword, cursor, limit }: FoundListParams, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    if (category) q.set('category', category);
    if (keyword) q.set('keyword', keyword);
    if (cursor) q.set('cursor', cursor);
    if (limit) q.set('limit', String(limit));
    const qs = q.toString();
    return api<FoundItemListResponse>(`/found-items${qs ? `?${qs}` : ''}`, { signal });
  },
  create: (body: CreateFoundItemBody) => api<FoundItem>('/found-items', { body }),
};
