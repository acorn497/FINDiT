import type { MatchCandidate } from '@findit/shared';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useAsync } from '../../shared/hooks/useAsync';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { Spinner } from '../../shared/ui/Spinner';
import { StateView } from '../../shared/ui/StateView';
import { matchApi } from './api';
import { ComparisonTable } from './ComparisonTable';
import { PinnedReport } from './PinnedReport';
import { SimilarityBar } from './SimilarityBar';

/** ⑥ 매칭 후보 — 내 분실 신고를 위에 고정하고 후보를 하나씩 넘겨 본다 */
export function MatchesPage() {
  const [params] = useSearchParams();
  const lostReportId = params.get('lostReportId');

  if (!lostReportId) {
    return (
      <>
        <AppBar title="매칭 후보" back />
        <StateView
          kind="empty"
          title="확인할 분실 신고를 골라 주세요"
          description="내 신고 관리에서 분실 신고를 누르면 후보를 볼 수 있어요."
          action={
            <Link to="/me/reports" className="inline-flex h-12 items-center rounded-field bg-accent px-5 font-bold text-bg-1">
              내 신고 관리로
            </Link>
          }
        />
      </>
    );
  }
  return <MatchBrowser lostReportId={lostReportId} />;
}

function MatchBrowser({ lostReportId }: { lostReportId: string }) {
  const res = useAsync((signal) => matchApi.list(lostReportId, signal), [lostReportId]);
  const [index, setIndex] = useState(0);
  const candidates: MatchCandidate[] = res.status === 'ready' ? res.data.candidates : [];

  useEffect(() => setIndex(0), [lostReportId]);
  const current = candidates[Math.min(index, candidates.length - 1)];

  return (
    <>
      <AppBar title="매칭 후보" back />
      <section className="px-4 pb-6">
        {res.status === 'loading' && (
          <div role="status" className="flex justify-center py-16">
            <Spinner />
            <span className="sr-only">후보를 찾는 중</span>
          </div>
        )}
        {res.status === 'error' && (
          <StateView kind="error" title="후보를 불러오지 못했습니다" action={<Button onClick={res.retry}>다시 시도</Button>} />
        )}
        {res.status === 'ready' && (
          <>
            <PinnedReport report={res.data.lostReport} />
            {candidates.length === 0 ? (
              <StateView kind="empty" title="아직 비슷한 습득물이 없습니다" description="새로 등록되면 알려 드릴게요." />
            ) : (
              <>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    aria-label="이전 후보"
                    disabled={index === 0}
                    onClick={() => setIndex((i) => i - 1)}
                    className="flex size-9 items-center justify-center rounded-field border border-line bg-bg-1 disabled:opacity-40"
                  >
                    <ChevronLeft size={18} aria-hidden />
                  </button>
                  <p className="text-sm font-semibold text-tx-2" aria-live="polite">
                    후보 <strong className="text-tx-1">{index + 1}</strong> / {candidates.length}
                  </p>
                  <button
                    type="button"
                    aria-label="다음 후보"
                    disabled={index >= candidates.length - 1}
                    onClick={() => setIndex((i) => i + 1)}
                    className="flex size-9 items-center justify-center rounded-field border border-line bg-bg-1 disabled:opacity-40"
                  >
                    <ChevronRight size={18} aria-hidden />
                  </button>
                </div>

                <article className="mt-3 overflow-hidden rounded-card border border-line bg-bg-1" aria-label={`후보 ${current.item.title}`}>
                  <div className="flex items-center gap-3 p-3">
                    <span className="size-16 shrink-0 overflow-hidden rounded-field bg-bg-3">
                      {current.item.thumbnail ? (
                        <img src={current.item.thumbnail.url} alt="" className="size-full object-cover" />
                      ) : (
                        <ImageOff className="m-5 text-tx-3" size={22} aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-bold">{current.item.title}</span>
                      <span className="block truncate text-xs text-tx-2">{current.item.keptAt}에 보관 중</span>
                    </span>
                  </div>
                  <div className="px-3 pb-3">
                    <SimilarityBar score={current.score} />
                  </div>
                  <div className="border-t border-line px-3 pb-2">
                    <ComparisonTable report={res.data.lostReport} candidate={current} />
                  </div>
                </article>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
