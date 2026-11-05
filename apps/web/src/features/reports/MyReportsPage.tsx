import { FOUND_STATUS_LABEL, LOST_STATUS_LABEL, type FoundItemStatus, type LostReportStatus, type MyReportItem, type ReportKind } from '@findit/shared';
import { Link } from 'react-router';
import { formatDateKo } from '../../shared/lib/date';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { Spinner } from '../../shared/ui/Spinner';
import { StateView } from '../../shared/ui/StateView';
import { FoundStatusBadge, LostStatusBadge } from '../../shared/ui/StatusBadge';
import { useMyReports } from './useMyReports';

const KINDS: { value: ReportKind | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'lost', label: '분실 신고' },
  { value: 'found', label: '습득 등록' },
];

const STATUS_CHIPS: Record<ReportKind, { value: string; label: string }[]> = {
  lost: (Object.keys(LOST_STATUS_LABEL) as LostReportStatus[]).map((s) => ({ value: s, label: LOST_STATUS_LABEL[s] })),
  found: (Object.keys(FOUND_STATUS_LABEL) as FoundItemStatus[]).map((s) => ({ value: s, label: FOUND_STATUS_LABEL[s] })),
};

function Chip({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-chip border px-3.5 text-[13px] font-semibold ${
        selected ? 'border-accent bg-accent text-bg-1' : 'border-line bg-bg-1 text-tx-2'
      }`}
    >
      {label}
    </button>
  );
}

/** ⑦ 내 신고 관리 — 내가 올린 분실 신고와 습득 등록을 한 목록에 */
export function MyReportsPage() {
  const list = useMyReports();

  return (
    <>
      <AppBar title="내 신고 관리" />
      <section className="px-4 pb-6 pt-3">
        <div role="radiogroup" aria-label="구분" className="grid grid-cols-3 gap-1 rounded-field bg-bg-3 p-1">
          {KINDS.map((k) => {
            const selected = k.value === list.kind;
            return (
              <button
                key={k.label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => list.setKind(k.value)}
                className={`h-9 rounded-[8px] text-[13px] font-bold ${selected ? 'bg-bg-1 text-tx-1 shadow-sm' : 'text-tx-2'}`}
              >
                {k.label}
              </button>
            );
          })}
        </div>

        {list.kind && (
          <div role="radiogroup" aria-label="상태" className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            <Chip selected={list.status === null} label="전체" onClick={() => list.setStatus(null)} />
            {STATUS_CHIPS[list.kind].map((c) => (
              <Chip key={c.value} selected={list.status === c.value} label={c.label} onClick={() => list.setStatus(c.value)} />
            ))}
          </div>
        )}

        <div className="mt-4">
          {list.state === 'loading' && (
            <div role="status" className="flex justify-center py-16">
              <Spinner />
              <span className="sr-only">불러오는 중</span>
            </div>
          )}
          {list.state === 'error' && (
            <StateView kind="error" title="목록을 불러오지 못했습니다" action={<Button onClick={list.retry}>다시 시도</Button>} />
          )}
          {list.state === 'ready' && list.items.length === 0 && (
            <StateView
              kind="empty"
              title={list.kind || list.status ? '이 조건의 신고가 없습니다' : '아직 올린 신고가 없습니다'}
              description="분실 신고나 습득물 등록을 해 보세요."
              action={
                <Link to="/register" className="inline-flex h-12 items-center rounded-field bg-accent px-5 font-bold text-bg-1">
                  등록하기
                </Link>
              }
            />
          )}
          {list.state === 'ready' && list.items.length > 0 && (
            <ul className="flex flex-col gap-2.5">
              {list.items.map((item) => (
                <li key={`${item.kind}-${item.id}`}>
                  <ReportCard item={item} />
                </li>
              ))}
            </ul>
          )}
          {list.state === 'ready' && list.hasMore && (
            <Button variant="secondary" block className="mt-3" loading={list.loadingMore} onClick={() => void list.loadMore()}>
              더 보기
            </Button>
          )}
        </div>
      </section>
    </>
  );
}

function ReportCard({ item }: { item: MyReportItem }) {
  const isLost = item.kind === 'lost';
  return (
    <article className="rounded-card border border-line bg-bg-1 p-3.5" aria-label={`${isLost ? '분실 신고' : '습득 등록'} ${item.title}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <span
            className={`inline-block rounded-[6px] px-1.5 py-0.5 text-[11px] font-bold ${
              isLost ? 'bg-accent-weak text-accent-dark' : 'bg-bg-3 text-tx-2'
            }`}
          >
            {isLost ? '분실 신고' : '습득 등록'}
          </span>
          <Link
            to={isLost ? `/matches?lostReportId=${item.id}` : `/found/${item.id}`}
            className="mt-1 block truncate text-[15px] font-bold hover:underline"
          >
            {item.title}
          </Link>
          <p className="truncate text-xs text-tx-2">
            {item.place} · {formatDateKo(item.date)}
          </p>
          {isLost && (item.candidateCount ?? 0) > 0 && (
            <Link
              to={`/matches?lostReportId=${item.id}`}
              aria-label={`새 후보 ${item.candidateCount}개 보기`}
              className="mt-2 inline-flex items-center gap-1 rounded-chip bg-st-check px-2.5 py-1 text-[11.5px] font-bold text-bg-1"
            >
              새 후보 {item.candidateCount}
            </Link>
          )}
        </div>
        {isLost ? (
          <LostStatusBadge status={item.status as LostReportStatus} />
        ) : (
          <FoundStatusBadge status={item.status as FoundItemStatus} />
        )}
      </div>
    </article>
  );
}
