import type { Category, FoundItemSummary } from '@findit/shared';
import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS } from '../../shared/form/options';
import { AppBar } from '../../shared/layout/AppBar';
import { foundApi } from './api';
import { FoundCard, FoundCardSkeleton } from './FoundCard';

/** ④ 습득물 목록 — 필터 칩 → 건수 → 2열 카드 격자 */
export function FoundListPage() {
  const [category, setCategory] = useState<Category | null>(null);
  const [items, setItems] = useState<FoundItemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    foundApi
      .list({ category }, controller.signal)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setLoading(false);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [category]);

  const chips: { value: Category | null; label: string }[] = [{ value: null, label: '전체' }, ...CATEGORY_OPTIONS];

  return (
    <>
      <AppBar title="습득물 목록" />
      <section className="px-4 pb-6 pt-3">
        <div role="radiogroup" aria-label="물건 종류 필터" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
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

        <p className="mt-3 text-[13px] text-tx-2">
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
      </section>
    </>
  );
}
