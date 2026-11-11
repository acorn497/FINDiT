import type { MatchCandidate } from '@findit/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { foundApi } from '../found/api';
import { useAsync } from '../../shared/hooks/useAsync';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { LoadingBlock } from '../../shared/ui/LoadingBlock';
import { StateView } from '../../shared/ui/StateView';
import { useToast } from '../../shared/toast/ToastContext';
import { matchApi } from './api';
import { ComparisonTable } from './ComparisonTable';
import { PhotoStrip } from './PhotoStrip';
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
  const navigate = useNavigate();
  const toast = useToast();
  const res = useAsync((signal) => matchApi.list(lostReportId, signal), [lostReportId]);
  const [index, setIndex] = useState(0);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<'exclude' | 'claim' | null>(null);
  const candidates: MatchCandidate[] = res.status === 'ready' ? res.data.candidates.filter((c) => !excluded.has(c.item.id)) : [];

  useEffect(() => {
    setIndex(0);
    setExcluded(new Set());
  }, [lostReportId]);
  const current = candidates[Math.min(index, candidates.length - 1)];

  /** [이 후보 아님] — 서버에 제외를 기록하고 목록에서 뺀다 (다시 뜨지 않는다) */
  const exclude = async () => {
    if (!current || pending) return;
    setPending('exclude');
    try {
      await matchApi.exclude(lostReportId, current.item.id);
      setExcluded((prev) => new Set(prev).add(current.item.id));
      setIndex((i) => Math.max(0, Math.min(i, candidates.length - 2)));
      toast.info(`${current.item.title}을(를) 후보에서 뺐습니다`);
    } catch (e) {
      toast.fromError(e, '제외하지 못했습니다');
    } finally {
      setPending(null);
    }
  };

  /** [내 물건인 것 같아요] — ⑤ 상세와 같은 수령 신청 */
  const claim = async () => {
    if (!current || pending) return;
    setPending('claim');
    try {
      await foundApi.claim(current.item.id);
      toast.success('수령 신청을 보냈습니다. 담당 선생님 확인을 기다려 주세요');
      navigate(`/found/${current.item.id}`);
    } catch (e) {
      toast.fromError(e, '수령 신청을 보내지 못했습니다');
      setPending(null);
    }
  };

  return (
    <>
      <AppBar title="매칭 후보" back />
      <section className="px-4 pb-6">
        {res.status === 'loading' && (
          <LoadingBlock label="후보를 찾는 중" />
        )}
        {res.status === 'error' && (
          <StateView kind="error" title="후보를 불러오지 못했습니다" action={<Button onClick={res.retry}>다시 시도</Button>} />
        )}
        {res.status === 'ready' && (
          <>
            <PinnedReport report={res.data.lostReport} />
            {candidates.length === 0 ? (
              <StateView
                kind="empty"
                title="아직 비슷한 습득물이 없습니다"
                description="새로 등록되면 알려 드릴게요."
                action={
                  <Link to="/found" className="inline-flex h-12 items-center rounded-field bg-accent px-5 font-bold text-bg-1">
                    습득물 목록 보기
                  </Link>
                }
              />
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
                  <div className="p-3">
                    <p className="truncate text-base font-bold">{current.item.title}</p>
                    <p className="truncate text-xs text-tx-2">{current.item.keptAt}에 보관 중</p>
                  </div>
                  <div className="px-3 pb-3">
                    <SimilarityBar score={current.score} />
                  </div>
                  <div className="border-t border-line px-3 pb-2">
                    <ComparisonTable report={res.data.lostReport} candidate={current} />
                  </div>
                  <PhotoStrip photos={current.item.photos} title={current.item.title} />
                </article>

                <Link to={`/found/${current.item.id}`} state={{ item: current.item }} className="mt-3 block text-center text-[13px] font-semibold text-accent">
                  습득물 상세 보기
                </Link>
                <div className="h-20" aria-hidden />

                <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg-1 px-4 py-3 md:bottom-0 md:left-60">
                  <div className="mx-auto grid max-w-[1100px] grid-cols-3 gap-2">
                    <Button variant="secondary" loading={pending === 'exclude'} onClick={() => void exclude()}>
                      이 후보 아님
                    </Button>
                    <Button className="col-span-2" loading={pending === 'claim'} onClick={() => void claim()}>
                      내 물건인 것 같아요
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
