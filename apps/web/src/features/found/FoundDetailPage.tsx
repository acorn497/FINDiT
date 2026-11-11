import { CATEGORY_LABEL, type FoundItemDetail, type FoundItemSummary } from '@findit/shared';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../shared/api/client';
import { useMediaQuery, WIDE } from '../../shared/hooks/useMediaQuery';
import { formatDateKo, formatDateTime } from '../../shared/lib/date';
import { AppBar } from '../../shared/layout/AppBar';
import { Button } from '../../shared/ui/Button';
import { StateView } from '../../shared/ui/StateView';
import { useToast } from '../../shared/toast/ToastContext';
import { foundApi } from './api';
import { PhotoCarousel } from './PhotoCarousel';

/**
 * ⑤ 습득물 상세 — 히어로 이미지 → 이름 → 분류·습득 위치 → 정보 목록 → 안내 → 하단 고정 버튼.
 * 목록에서 넘어오면 이미 받은 이름·사진으로 먼저 그리고, 상세 응답이 오면 나머지를 채운다.
 */
export function FoundDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const wide = useMediaQuery(WIDE);
  const preview = (useLocation().state as { item?: FoundItemSummary } | null)?.item;
  const initial = preview?.id === id ? preview : undefined;

  const [detail, setDetail] = useState<FoundItemDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    foundApi
      .detail(id, controller.signal)
      .then(setDetail)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', '불러오지 못했습니다'));
      });
    return () => controller.abort();
  }, [id]);

  const run = async (action: () => Promise<FoundItemDetail>, done: string) => {
    if (pending) return;
    setPending(true);
    try {
      setDetail(await action());
      toast.success(done);
    } catch (e) {
      toast.fromError(e);
    } finally {
      setPending(false);
    }
  };

  if (error && !detail) {
    return (
      <>
        <AppBar title="습득물 상세" back="/found" />
        <StateView
          kind="error"
          title={error.status === 404 ? '습득물을 찾을 수 없습니다' : '상세 정보를 불러오지 못했습니다'}
          description={error.status === 404 ? '삭제되었거나 주소가 잘못되었습니다.' : '잠시 후 다시 시도해 주세요.'}
          action={<Button onClick={() => navigate('/found')}>목록으로</Button>}
        />
      </>
    );
  }

  const head = detail ?? initial;
  const photos = detail ? detail.photos : initial?.thumbnail ? [initial.thumbnail] : [];
  const pendingClaim = detail?.myClaim?.status === 'PENDING';

  const actions = (
    detail && detail.claimBlockedReason && !pendingClaim ? (
      <div className="flex items-center gap-3">
        <p className="flex-1 text-[13px] font-medium text-tx-2">{detail.claimBlockedReason}</p>
        <Button disabled className="shrink-0">
          내 물건인 것 같아요
        </Button>
      </div>
    ) : pendingClaim ? (
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => navigate('/found')}>
          목록으로
        </Button>
        <Button className="col-span-2" variant="secondary" loading={pending} onClick={() => void run(() => foundApi.cancelClaim(id), '수령 신청을 취소했습니다')}>
          신청 취소
        </Button>
      </div>
    ) : (
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          내 것 아님
        </Button>
        <Button
          className="col-span-2"
          loading={pending}
          disabled={!detail}
          onClick={() => void run(() => foundApi.claim(id), '수령 신청을 보냈습니다. 담당 선생님 확인을 기다려 주세요')}
        >
          내 물건인 것 같아요
        </Button>
      </div>
    )
  );


  return (
    <>
      <AppBar title="습득물 상세" back="/found" />
      <article className="pb-40 md:pb-8 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:items-start md:gap-6 md:px-4 md:pt-4" aria-busy={!detail}>
        <PhotoCarousel photos={photos} status={detail?.status ?? initial?.status ?? 'KEEPING'} title={head?.title ?? '습득물'} />

        <div className="px-4 pt-4 md:px-0 md:pt-0">
          {head ? (
            <>
              <h2 className="text-xl font-bold">{head.title}</h2>
              <p className="mt-1 text-[13px] text-tx-2">
                {CATEGORY_LABEL[head.category]} · {head.foundPlace ? `${head.foundPlace}에서 습득` : `${head.keptAt}에 보관`}
              </p>
            </>
          ) : (
            <div className="h-12 w-2/3 animate-pulse rounded bg-bg-3" aria-hidden />
          )}

          <dl className="mt-4 divide-y divide-line rounded-card border border-line bg-bg-1 px-4">
            {[
              ['보관 장소', head?.keptAt],
              ['주운 날짜', head ? formatDateKo(head.foundDate) : undefined],
              ['등록 시각', head ? formatDateTime(head.createdAt) : undefined],
              ['특징', detail ? detail.description || '—' : undefined],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
                <dt className="shrink-0 text-tx-2">{label}</dt>
                <dd className="text-right font-semibold">
                  {value ?? <span className="inline-block h-4 w-24 animate-pulse rounded bg-bg-3" aria-hidden />}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 rounded-card bg-accent-weak px-4 py-3 text-[13px] leading-relaxed text-accent-dark">
            본인 확인을 위해 내부에 든 물건이나 특징을 추가로 여쭤볼 수 있습니다. 신청하면 담당 선생님께 알림이 전달됩니다.
          </p>

          {wide && <div className="mt-4">{actions}</div>}

          {detail?.myClaim?.status === 'REJECTED' && (
            <p className="mt-3 text-[13px] text-tx-2">
              지난 신청이 거절되었습니다{detail.myClaim.rejectReason ? ` — ${detail.myClaim.rejectReason}` : ''}
            </p>
          )}
        </div>
      </article>

      {wide ? null : (
        /* 좁은 화면 — 하단 탭 위에 고정 */
        <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-bg-1 px-4 py-3">{actions}</div>
      )}
    </>
  );
}
