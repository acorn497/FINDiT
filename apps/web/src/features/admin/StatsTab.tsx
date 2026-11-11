import { FOUND_STATUS_LABEL, type FoundItemStatus, type StatsPeriod } from '@findit/shared';
import { useState } from 'react';
import { useAsync } from '../../shared/hooks/useAsync';
import { Button } from '../../shared/ui/Button';
import { FilterChips } from '../../shared/ui/FilterChips';
import { LoadingBlock } from '../../shared/ui/LoadingBlock';
import { StateView } from '../../shared/ui/StateView';
import { FOUND_STATUS_CLASS } from '../../shared/ui/StatusBadge';
import { adminApi } from './api';

/** 차트 라이브러리 없이 그리는 단순 막대 */
function Bar({ value, max, className, label }: { value: number; max: number; className: string; label: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div role="img" aria-label={label} className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg-3">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/** ⑩ 요약 — 기간별 등록 건수와 처리 현황을 숫자와 단순 막대로 */
export function StatsTab() {
  const [period, setPeriod] = useState<StatsPeriod>('week');
  const res = useAsync((signal) => adminApi.stats(period, signal), [period]);

  return (
    <section aria-label="요약">
      <FilterChips
        label="기간 단위"
        options={[
          { value: 'week' as StatsPeriod, label: '주별' },
          { value: 'month' as StatsPeriod, label: '월별' },
        ]}
        value={period}
        onChange={setPeriod}
      />

      {res.status === 'loading' && (
        <LoadingBlock label="요약을 불러오는 중" />
      )}
      {res.status === 'error' && <StateView kind="error" title="요약을 불러오지 못했습니다" action={<Button onClick={res.retry}>다시 시도</Button>} />}

      {res.status === 'ready' && (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
            {(Object.keys(FOUND_STATUS_LABEL) as FoundItemStatus[]).map((s) => (
              <div key={s} className="rounded-card border border-line bg-bg-1 px-3 py-2.5">
                <dt className="flex items-center gap-1.5 text-xs text-tx-2">
                  <span className={`size-2 rounded-full ${FOUND_STATUS_CLASS[s]}`} aria-hidden />
                  {FOUND_STATUS_LABEL[s]}
                </dt>
                <dd className="mt-0.5 text-xl font-extrabold">{res.data.current[s]}</dd>
              </div>
            ))}
            <div className="rounded-card border border-accent/30 bg-accent-weak px-3 py-2.5">
              <dt className="text-xs text-accent-dark">승인 대기</dt>
              <dd className="mt-0.5 text-xl font-extrabold text-accent-dark">{res.data.pendingClaims}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center gap-4 text-xs text-tx-2" aria-hidden>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-accent" /> 등록 (분실 신고 + 습득물)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-st-done" /> 처리 (전달 완료 + 기간 만료)
            </span>
          </div>

          {(() => {
            const max = Math.max(1, ...res.data.buckets.flatMap((b) => [b.lostReports + b.foundItems, b.delivered + b.expired]));
            return (
              <ul className="mt-3 flex flex-col gap-3" aria-label="기간별 건수">
                {res.data.buckets.map((b) => {
                  const registered = b.lostReports + b.foundItems;
                  const processed = b.delivered + b.expired;
                  return (
                    <li key={b.from} className="rounded-card border border-line bg-bg-1 px-3 py-2.5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold">{b.label}</span>
                        <span className="text-xs text-tx-2">
                          등록 {registered} · 처리 {processed}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5">
                        <Bar value={registered} max={max} className="bg-accent" label={`${b.label} 등록 ${registered}건 (분실 신고 ${b.lostReports} · 습득물 ${b.foundItems})`} />
                        <Bar value={processed} max={max} className="bg-st-done" label={`${b.label} 처리 ${processed}건 (전달 완료 ${b.delivered} · 기간 만료 ${b.expired})`} />
                      </div>
                      <p className="mt-1.5 text-[11px] text-tx-2">
                        분실 신고 {b.lostReports} · 습득물 {b.foundItems} · 전달 완료 {b.delivered} · 기간 만료 {b.expired}
                      </p>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </>
      )}
    </section>
  );
}
