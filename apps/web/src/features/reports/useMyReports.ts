import type { MyReportItem, ReportKind } from '@findit/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { reportsApi } from './api';

type Status = 'loading' | 'ready' | 'error';

/** 내 신고 목록의 조건 묶음 — 구분(전체·분실·습득) + 상태 칩 + 커서 더 보기 */
export function useMyReports({ onMoreError }: { onMoreError?: (e: unknown) => void } = {}) {
  const [kind, setKindState] = useState<ReportKind | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [items, setItems] = useState<MyReportItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [state, setState] = useState<Status>('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    const gen = ++generation.current;
    const controller = new AbortController();
    setState('loading');
    reportsApi
      .list({ kind, status }, controller.signal)
      .then((res) => {
        if (gen !== generation.current) return;
        setItems(res.items);
        setNextCursor(res.nextCursor);
        setState('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted && gen === generation.current) setState('error');
      });
    return () => controller.abort();
  }, [kind, status, reloadKey]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    const gen = generation.current;
    setLoadingMore(true);
    try {
      const res = await reportsApi.list({ kind, status, cursor: nextCursor });
      if (gen !== generation.current) return;
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
    } catch (e) {
      if (gen === generation.current) onMoreError?.(e);
    } finally {
      if (gen === generation.current) setLoadingMore(false);
    }
  }, [kind, status, nextCursor, loadingMore, onMoreError]);

  /** 구분을 바꾸면 상태 칩은 '전체'로 돌아간다 */
  const setKind = useCallback((next: ReportKind | null) => {
    setKindState(next);
    setStatus(null);
  }, []);

  /** 목록 안의 한 항목만 바꾸거나(마감) 지운다(삭제) */
  const patchItem = useCallback((id: string, change: Partial<MyReportItem> | null) => {
    setItems((prev) => (change ? prev.map((it) => (it.id === id ? { ...it, ...change } : it)) : prev.filter((it) => it.id !== id)));
  }, []);

  return {
    kind,
    status,
    setKind,
    setStatus,
    items,
    state,
    hasMore: nextCursor !== null,
    loadingMore,
    loadMore,
    retry: () => setReloadKey((k) => k + 1),
    patchItem,
  };
}
