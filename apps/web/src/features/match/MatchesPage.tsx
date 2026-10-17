import { ImageOff } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { useAsync } from '../../shared/hooks/useAsync';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { Spinner } from '../../shared/ui/Spinner';
import { StateView } from '../../shared/ui/StateView';
import { matchApi } from './api';

/** ⑥ 매칭 후보 — 지금은 후보를 단순 세로 목록으로 보여 준다 (좌우 비교는 다음 단계) */
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
  return <MatchList lostReportId={lostReportId} />;
}

function MatchList({ lostReportId }: { lostReportId: string }) {
  const res = useAsync((signal) => matchApi.list(lostReportId, signal), [lostReportId]);

  return (
    <>
      <AppBar title="매칭 후보" back />
      <section className="px-4 py-4">
        {res.status === 'loading' && (
          <div role="status" className="flex justify-center py-16">
            <Spinner />
            <span className="sr-only">후보를 찾는 중</span>
          </div>
        )}
        {res.status === 'error' && (
          <StateView kind="error" title="후보를 불러오지 못했습니다" action={<Button onClick={res.retry}>다시 시도</Button>} />
        )}
        {res.status === 'ready' && res.data.candidates.length === 0 && (
          <StateView kind="empty" title="아직 비슷한 습득물이 없습니다" description="새로 등록되면 알려 드릴게요." />
        )}
        {res.status === 'ready' && res.data.candidates.length > 0 && (
          <ul className="flex flex-col gap-2">
            {res.data.candidates.map(({ item, score }) => (
              <li key={item.id}>
                <Link
                  to={`/found/${item.id}`}
                  state={{ item }}
                  className="flex items-center gap-3 rounded-card border border-line bg-bg-1 p-3"
                >
                  <span className="size-14 shrink-0 overflow-hidden rounded-field bg-bg-3">
                    {item.thumbnail ? (
                      <img src={item.thumbnail.url} alt="" className="size-full object-cover" />
                    ) : (
                      <ImageOff className="m-4 text-tx-3" size={22} aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{item.title}</span>
                    <span className="block truncate text-xs text-tx-2">{item.keptAt}</span>
                  </span>
                  <span className="text-sm font-bold text-accent">{Math.round(score * 100)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 rounded-card bg-bg-3 px-4 py-3 text-center text-[13px] text-tx-2">상세 비교 화면은 준비 중입니다</p>
      </section>
    </>
  );
}
