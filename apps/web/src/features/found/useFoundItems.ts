import type { Category, FoundItemSummary } from '@findit/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { foundApi } from './api';

export const SEARCH_DEBOUNCE_MS = 300;

type Status = 'loading' | 'ready' | 'error';

/**
 * 습득물 목록의 조건 묶음 — 필터·검색·더 보기를 한곳에서 관리한다.
 * 조건(종류, 300ms 디바운스된 검색어)이 바뀌면 첫 페이지부터 다시 받고,
 * 늦게 도착한 이전 조건의 응답은 버린다.
 */
export function useFoundItems({ onMoreError }: { onMoreError?: (e: unknown) => void } = {}) {
  const [category, setCategory] = useState<Category | null>(null);
  const [keyword, setKeyword] = useState('');
  const query = useDebouncedValue(keyword.trim(), SEARCH_DEBOUNCE_MS);

  const [items, setItems] = useState<FoundItemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  /** 조건이 바뀔 때마다 1씩 늘려, 이전 조건의 응답을 구분한다 */
  const generation = useRef(0);

  useEffect(() => {
    const gen = ++generation.current;
    const controller = new AbortController();
    setStatus('loading');
    setLoadingMore(false);
    foundApi
      .list({ category, keyword: query }, controller.signal)
      .then((res) => {
        if (gen !== generation.current) return;
        setItems(res.items);
        setTotal(res.total);
        setNextCursor(res.nextCursor);
        setStatus('ready');
      })
      .catch(() => {
        if (controller.signal.aborted || gen !== generation.current) return;
        setStatus('error');
      });
    return () => controller.abort();
  }, [category, query, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore || status !== 'ready') return;
    const gen = generation.current;
    setLoadingMore(true);
    try {
      const res = await foundApi.list({ category, keyword: query, cursor: nextCursor });
      if (gen !== generation.current) return;
      setItems((prev) => [...prev, ...res.items]);
      setTotal(res.total);
      setNextCursor(res.nextCursor);
    } catch (e) {
      // 이미 받은 목록은 그대로 두고 알리기만 한다
      if (gen === generation.current) onMoreError?.(e);
    } finally {
      if (gen === generation.current) setLoadingMore(false);
    }
  }, [category, query, nextCursor, loadingMore, status, onMoreError]);

  const clear = useCallback(() => {
    setCategory(null);
    setKeyword('');
  }, []);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    /** 조건 */
    category,
    keyword,
    setCategory,
    setKeyword,
    clear,
    hasFilter: category !== null || keyword.trim() !== '',
    /** 결과 */
    items,
    total,
    status,
    hasMore: nextCursor !== null,
    loadingMore,
    loadMore,
    retry,
  };
}
