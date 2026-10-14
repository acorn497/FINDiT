import type { Category, FoundItemSummary } from '@findit/shared';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS } from '../../shared/form/options';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { StateView } from '../../shared/ui/StateView';
import { foundApi } from './api';
import { FoundCard, FoundCardSkeleton } from './FoundCard';

/** ④ 습득물 목록 — 검색창 → 필터 칩 → 건수 → 2열 카드 격자 → [더 보기] */
export function FoundListPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebouncedValue(keyword.trim(), 300);
  const [items, setItems] = useState<FoundItemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    foundApi
      .list({ category, keyword: debouncedKeyword }, controller.signal)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setNextCursor(res.nextCursor);
        setLoading(false);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        console.warn(e);
        setError(true);
        setLoading(false);
      });
    return () => controller.abort();
  }, [category, debouncedKeyword, reloadKey]);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await foundApi.list({ category, keyword: debouncedKeyword, cursor: nextCursor });
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
      setTotal(res.total);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setCategory(null);
    setKeyword('');
  };

  const chips: { value: Category | null; label: string }[] = [{ value: null, label: '전체' }, ...CATEGORY_OPTIONS];

  return (
    <>
      <AppBar title="습득물 목록" />
      <section className="px-4 pb-6 pt-3">
        <label className="flex h-11 items-center gap-2 rounded-field border border-line bg-bg-1 px-3 focus-within:border-accent">
          <Search size={18} className="text-tx-3" aria-hidden />
          <input
            type="search"
            aria-label="검색"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="물건 이름이나 특징으로 검색"
            className="h-full flex-1 bg-transparent text-[15px] outline-none placeholder:text-tx-3"
          />
        </label>

        <div role="radiogroup" aria-label="물건 종류 필터" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {chips.map((chip) => {
            const selected = chip.value === category;
            return (
              <button
                key={chip.label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCategory(chip.value)}
                className={`h-9 shrink-0 rounded-chip border px-3.5 text-[13px] font-semibold ${
                  selected ? 'border-accent bg-accent text-bg-1' : 'border-line bg-bg-1 text-tx-2'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {error ? (
          <StateView
            kind="error"
            title="목록을 불러오지 못했습니다"
            description="잠시 후 다시 시도해 주세요."
            action={<Button onClick={() => setReloadKey((k) => k + 1)}>다시 시도</Button>}
          />
        ) : !loading && items.length === 0 ? (
          <StateView
            kind="empty"
            title="조건에 맞는 습득물이 없습니다"
            description="검색어나 종류를 바꿔 보세요."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                필터 지우기
              </Button>
            }
          />
        ) : (
          <>
            <p className="mt-3 text-[13px] text-tx-2" aria-live="polite">
              보관 중인 물건 <strong className="text-accent">{total}</strong>건
            </p>
            <ul className="mt-2.5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {loading
                ? Array.from({ length: 6 }, (_, i) => (
                    <li key={i}>
                      <FoundCardSkeleton />
                    </li>
                  ))
                : items.map((item) => (
                    <li key={item.id}>
                      <FoundCard item={item} />
                    </li>
                  ))}
            </ul>
            {!loading && nextCursor && (
              <Button variant="secondary" block className="mt-4" loading={loadingMore} onClick={() => void loadMore()}>
                더 보기 ({total}건 중 {items.length}건)
              </Button>
            )}
          </>
        )}
      </section>
    </>
  );
}
