import { lostReportTitle, TIME_SLOT_LABEL, type LostReport } from '@findit/shared';
import { formatDateKo } from '../../shared/lib/date';
import { LostStatusBadge } from '../../shared/ui/StatusBadge';

/** 선택한 내 분실 신고 — 후보를 넘겨도 위쪽에 고정된다 */
export function PinnedReport({ report }: { report: LostReport }) {
  return (
    <div className="sticky top-14 z-10 -mx-4 border-b border-line bg-bg-2/95 px-4 py-3 backdrop-blur">
      <div className="rounded-card border border-accent/30 bg-bg-1 px-4 py-3" aria-label="내 분실 신고">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-accent">내 분실 신고</p>
          <LostStatusBadge status={report.status} />
        </div>
        <p className="mt-1 text-base font-bold">{lostReportTitle(report)}</p>
        <p className="mt-0.5 text-xs text-tx-2">
          {report.lostPlace} · {formatDateKo(report.lostDate)}
          {report.timeSlot !== 'UNKNOWN' && ` · ${TIME_SLOT_LABEL[report.timeSlot]}`}
        </p>
      </div>
    </div>
  );
}
