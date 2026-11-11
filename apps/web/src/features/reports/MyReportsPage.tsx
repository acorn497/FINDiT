import { FOUND_STATUS_LABEL, LOST_STATUS_LABEL, type FoundItemStatus, type LostReportStatus, type MyReportItem, type ReportKind } from '@findit/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { formatDateKo } from '../../shared/lib/date';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { FilterChips, Segmented } from '../../shared/ui/FilterChips';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { LoadingBlock } from '../../shared/ui/LoadingBlock';
import { StateView } from '../../shared/ui/StateView';
import { useToast } from '../../shared/toast/ToastContext';
import { FoundStatusBadge, LostStatusBadge } from '../../shared/ui/StatusBadge';
import { reportsApi } from './api';
import { useMyReports } from './useMyReports';

const KINDS: { value: ReportKind | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'lost', label: '분실 신고' },
  { value: 'found', label: '습득 등록' },
];

const STATUS_CHIPS: Record<ReportKind, { value: string | null; label: string }[]> = {
  lost: (Object.keys(LOST_STATUS_LABEL) as LostReportStatus[]).map((s) => ({ value: s, label: LOST_STATUS_LABEL[s] })),
  found: (Object.keys(FOUND_STATUS_LABEL) as FoundItemStatus[]).map((s) => ({ value: s, label: FOUND_STATUS_LABEL[s] })),
};

/** ⑦ 내 신고 관리 — 내가 올린 분실 신고와 습득 등록을 한 목록에 */
type Confirm = { type: 'close' | 'delete'; item: MyReportItem } | null;

const CONFIRM_TEXT = {
  close: {
    title: '찾음 처리할까요?',
    message: '마감하면 더 이상 후보를 찾지 않으며 되돌릴 수 없습니다.',
    confirmLabel: '찾음 처리',
  },
  delete: {
    title: '이 분실 신고를 삭제할까요?',
    message: '삭제한 신고는 되돌릴 수 없습니다.',
    confirmLabel: '삭제',
  },
};

export function MyReportsPage() {
  const list = useMyReports();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const toast = useToast();

  /** 삭제와 마감은 되돌릴 수 없으므로 재확인한 뒤에 보낸다 */
  const runConfirmed = async () => {
    if (!confirm) return;
    const { type, item } = confirm;
    setConfirm(null);
    try {
      if (type === 'close') {
        await reportsApi.close(item.id);
        list.patchItem(item.id, { status: 'CLOSED', candidateCount: 0 });
        toast.success('찾음 처리했습니다');
      } else {
        await reportsApi.remove(item.id);
        list.patchItem(item.id, null);
        toast.success('분실 신고를 삭제했습니다');
      }
    } catch (e) {
      toast.fromError(e, '처리하지 못했습니다');
    }
  };

  return (
    <>
      <AppBar title="내 신고 관리" />
      <section className="mx-auto max-w-[720px] px-4 pb-6 pt-3">
        <Segmented label="구분" options={KINDS} value={list.kind} onChange={list.setKind} />

        {list.kind && (
          <FilterChips
            label="상태"
            options={[{ value: null, label: '전체' }, ...STATUS_CHIPS[list.kind]]}
            value={list.status}
            onChange={list.setStatus}
            scroll
            className="mt-3"
          />
        )}

        <div className="mt-4">
          {list.state === 'loading' && (
            <LoadingBlock label="불러오는 중" />
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
                  <ReportCard
                    item={item}
                    onClose={() => setConfirm({ type: 'close', item })}
                    onDelete={() => setConfirm({ type: 'delete', item })}
                  />
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

      <ConfirmDialog
        open={confirm !== null}
        title={confirm ? CONFIRM_TEXT[confirm.type].title : ''}
        message={confirm ? `${confirm.item.title} — ${CONFIRM_TEXT[confirm.type].message}` : ''}
        confirmLabel={confirm ? CONFIRM_TEXT[confirm.type].confirmLabel : ''}
        danger={confirm?.type === 'delete'}
        onConfirm={() => void runConfirmed()}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

interface ReportCardProps {
  item: MyReportItem;
  onClose: () => void;
  onDelete: () => void;
}

function ReportCard({ item, onClose, onDelete }: ReportCardProps) {
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
      {isLost && (
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          {item.status !== 'CLOSED' && (
            <Link
              to={`/lost/${item.id}/edit`}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-field border border-line bg-bg-1 text-[13px] font-bold text-tx-2"
            >
              수정
            </Link>
          )}
          <Button variant="secondary" className="h-9 flex-1 text-[13px]" onClick={onDelete}>
            삭제
          </Button>
          {item.status !== 'CLOSED' && (
            <Button variant="secondary" className="h-9 flex-1 text-[13px]" onClick={onClose}>
              찾음 처리
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
