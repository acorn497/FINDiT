import type { FoundItemStatus, LostReportStatus, MyReportItem } from '@findit/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAsync } from '../../shared/hooks/useAsync';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { Spinner } from '../../shared/ui/Spinner';
import { StateView } from '../../shared/ui/StateView';
import { FoundStatusBadge, LostStatusBadge } from '../../shared/ui/StatusBadge';
import { reportsApi } from './api';

/** ⑦ 내 신고 관리 — 지금은 내가 올린 신고·등록을 한 목록으로만 보여 준다 */
export function MyReportsPage() {
  const res = useAsync((signal) => reportsApi.list({}, signal), []);
  const [more, setMore] = useState<{ items: MyReportItem[]; cursor: string | null } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const items = res.status === 'ready' ? [...res.data.items, ...(more?.items ?? [])] : [];
  const cursor = more ? more.cursor : res.status === 'ready' ? res.data.nextCursor : null;

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const page = await reportsApi.list({ cursor });
      setMore((m) => ({ items: [...(m?.items ?? []), ...page.items], cursor: page.nextCursor }));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <>
      <AppBar title="내 신고 관리" />
      <section className="px-4 py-4">
        {res.status === 'loading' && (
          <div role="status" className="flex justify-center py-16">
            <Spinner />
            <span className="sr-only">불러오는 중</span>
          </div>
        )}
        {res.status === 'error' && (
          <StateView kind="error" title="목록을 불러오지 못했습니다" action={<Button onClick={res.retry}>다시 시도</Button>} />
        )}
        {res.status === 'ready' && items.length === 0 && (
          <StateView kind="empty" title="아직 올린 신고가 없습니다" description="분실 신고나 습득물 등록을 해 보세요." />
        )}
        {items.length > 0 && (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <Link
                  to={item.kind === 'lost' ? `/matches?lostReportId=${item.id}` : `/found/${item.id}`}
                  className="flex items-center gap-3 rounded-card border border-line bg-bg-1 p-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-tx-3">{item.kind === 'lost' ? '분실 신고' : '습득 등록'}</span>
                    <span className="block truncate font-bold">{item.title}</span>
                    <span className="block truncate text-xs text-tx-2">
                      {item.place} · {item.date}
                    </span>
                  </span>
                  {item.kind === 'lost' ? (
                    <LostStatusBadge status={item.status as LostReportStatus} />
                  ) : (
                    <FoundStatusBadge status={item.status as FoundItemStatus} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {cursor && (
          <Button variant="secondary" block className="mt-3" loading={loadingMore} onClick={() => void loadMore()}>
            더 보기
          </Button>
        )}
        <p className="mt-6 rounded-card bg-bg-3 px-4 py-3 text-center text-[13px] text-tx-2">상세 관리 기능은 준비 중입니다</p>
      </section>
    </>
  );
}
