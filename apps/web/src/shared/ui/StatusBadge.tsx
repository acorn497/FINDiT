import { FOUND_STATUS_LABEL, LOST_STATUS_LABEL, type FoundItemStatus, type LostReportStatus } from '@findit/shared';

/** 습득물 상태 → 배지 색 (토큰 이름만 쓴다) */
export const FOUND_STATUS_CLASS: Record<FoundItemStatus, string> = {
  KEEPING: 'bg-st-keep',
  CHECKING: 'bg-st-check',
  DONE: 'bg-st-done',
  EXPIRED: 'bg-st-expire',
};

export const LOST_STATUS_CLASS: Record<LostReportStatus, string> = {
  OPEN: 'bg-accent',
  MATCHED: 'bg-st-check',
  CLOSED: 'bg-st-expire',
};

const BASE = 'inline-flex items-center rounded-chip px-2.5 py-1 text-[11.5px] font-bold leading-none text-bg-1';

export function FoundStatusBadge({ status, className = '' }: { status: FoundItemStatus; className?: string }) {
  return <span className={`${BASE} ${FOUND_STATUS_CLASS[status]} ${className}`}>{FOUND_STATUS_LABEL[status]}</span>;
}

export function LostStatusBadge({ status, className = '' }: { status: LostReportStatus; className?: string }) {
  return <span className={`${BASE} ${LOST_STATUS_CLASS[status]} ${className}`}>{LOST_STATUS_LABEL[status]}</span>;
}
