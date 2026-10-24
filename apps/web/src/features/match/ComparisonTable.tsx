import { CATEGORY_LABEL, type LostReport, type MatchCandidate } from '@findit/shared';
import { Check, Minus } from 'lucide-react';
import { formatDateKo } from '../../shared/lib/date';

interface Row {
  label: string;
  mine: string;
  theirs: string;
  /** undefined 면 비교하지 않는 행 (특징) */
  match?: boolean;
}

/**
 * 좌(내 신고) · 우(습득물) 2열 비교.
 * 같은 행에 종류·장소·날짜·색상을 놓고, 일치하는 행은 --st-done 계열, 어긋나는 행은 흐린 색.
 */
export function ComparisonTable({ report, candidate }: { report: LostReport; candidate: MatchCandidate }) {
  const { item, matches } = candidate;
  const rows: Row[] = [
    { label: '종류', mine: CATEGORY_LABEL[report.category], theirs: CATEGORY_LABEL[item.category], match: matches.category },
    { label: '장소', mine: report.lostPlace, theirs: item.foundPlace ?? item.keptAt, match: matches.place },
    { label: '날짜', mine: formatDateKo(report.lostDate), theirs: formatDateKo(item.foundDate), match: matches.date },
    { label: '색상', mine: report.color, theirs: item.color ?? '—', match: matches.color },
    { label: '특징', mine: report.description || '—', theirs: item.description || '—' },
  ];

  return (
    <table className="w-full table-fixed border-collapse text-[13px]">
      <caption className="sr-only">내 신고와 습득물 비교</caption>
      <thead>
        <tr className="text-xs text-tx-3">
          <th scope="col" className="w-14 py-2 text-left font-semibold">
            항목
          </th>
          <th scope="col" className="py-2 text-left font-semibold">
            내 신고
          </th>
          <th scope="col" className="py-2 text-left font-semibold">
            습득물
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const tone =
            row.match === undefined ? 'text-tx-2' : row.match ? 'bg-st-done/10 text-st-done font-semibold' : 'text-tx-3';
          return (
            <tr key={row.label} className={`border-t border-line ${tone}`} data-match={row.match === undefined ? undefined : String(row.match)}>
              <th scope="row" className="py-2.5 pl-1 text-left font-semibold">
                <span className="inline-flex items-center gap-1">
                  {row.match === true && <Check size={13} aria-label="일치" />}
                  {row.match === false && <Minus size={13} aria-label="다름" />}
                  {row.label}
                </span>
              </th>
              <td className="break-keep py-2.5 pr-2">{row.mine}</td>
              <td className="break-keep py-2.5 pr-1">{row.theirs}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
