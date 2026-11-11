import type { FoundItemSummary } from '@findit/shared';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { formatMonthDay } from '../../shared/lib/date';
import { useToast } from '../../shared/toast/ToastContext';
import { Button } from '../../shared/ui/Button';
import { FilterChips } from '../../shared/ui/FilterChips';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { LoadingBlock } from '../../shared/ui/LoadingBlock';
import { StateView } from '../../shared/ui/StateView';
import { adminApi } from './api';

const DAY = 86_400_000;

/** 만료일까지 남은 날 / 지난 날 */
export function expiryLabel(expiresAt: string, now = Date.now()) {
  const diff = Date.parse(expiresAt) - now;
  if (diff < 0) return { overdue: true, text: `만료 ${Math.max(1, Math.floor(-diff / DAY))}일 지남` };
  return { overdue: false, text: `만료까지 ${Math.ceil(diff / DAY)}일` };
}

/** ⑩ 보관 중 — 보관 기간이 지난 물건을 일괄 만료 처리. 30일 경과분을 기본으로 걸러 보여 준다. */
export function KeepingTab() {
  const toast = useToast();
  const [overdue, setOverdue] = useState(true);
  const [items, setItems] = useState<FoundItemSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<'selected' | 'all' | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    setSelected(new Set());
    adminApi
      .keeping({ overdue }, controller.signal)
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
        setState('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setState('error');
      });
    return () => controller.abort();
  }, [overdue, reloadKey]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expire = async () => {
    const mode = confirm;
    setConfirm(null);
    try {
      const res = await adminApi.expire(mode === 'selected' ? [...selected] : undefined);
      toast.success(`${res.expired}건을 기간 만료로 처리했습니다`);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast.fromError(e, '만료 처리하지 못했습니다');
    }
  };

  return (
    <section aria-label="보관 중 물품">
      <FilterChips
        label="보관 중 범위"
        options={[
          { value: true, label: '30일 경과' },
          { value: false, label: '전체 보관 중' },
        ]}
        value={overdue}
        onChange={setOverdue}
      />

      {state === 'loading' && (
        <LoadingBlock label="보관 중 물품을 불러오는 중" />
      )}
      {state === 'error' && (
        <StateView kind="error" title="보관 중 물품을 불러오지 못했습니다" action={<Button onClick={() => setReloadKey((k) => k + 1)}>다시 시도</Button>} />
      )}
      {state === 'ready' && items.length === 0 && (
        <StateView kind="empty" title={overdue ? '보관 기간이 지난 물건이 없습니다' : '보관 중인 물건이 없습니다'} />
      )}
      {state === 'ready' && items.length > 0 && (
        <>
          <p className="mt-3 text-[13px] text-tx-2">
            {overdue ? '보관 기간 30일이 지난 물건' : '보관 중인 물건'} <strong className="text-accent">{total}</strong>건
          </p>
          <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-bg-1" aria-label="보관 중 물품 목록">
            {items.map((item) => {
              const exp = expiryLabel(item.expiresAt);
              return (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`${item.title} 선택`}
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="size-4 accent-[var(--accent)]"
                  />
                  <Link to={`/found/${item.id}`} state={{ item }} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{item.title}</span>
                    <span className="block truncate text-xs text-tx-2">
                      {item.keptAt} · {formatMonthDay(item.createdAt)} 등록
                    </span>
                  </Link>
                  <span className={`shrink-0 text-xs font-semibold ${exp.overdue ? 'text-err' : 'text-tx-3'}`}>{exp.text}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={selected.size === 0} onClick={() => setConfirm('selected')}>
              선택 만료 처리 ({selected.size})
            </Button>
            {overdue && <Button onClick={() => setConfirm('all')}>경과분 모두 만료</Button>}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm !== null}
        title="기간 만료로 처리할까요?"
        message={
          confirm === 'all'
            ? `보관 기간 30일이 지난 물건 ${total}건을 모두 기간 만료로 바꿉니다.`
            : `선택한 ${selected.size}건을 기간 만료로 바꿉니다.`
        }
        confirmLabel="만료 처리"
        danger
        onConfirm={() => void expire()}
        onCancel={() => setConfirm(null)}
      />
    </section>
  );
}
