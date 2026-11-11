import type { AdminClaim, AdminClaimGroup } from '@findit/shared';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAsync } from '../../shared/hooks/useAsync';
import { formatDateTime } from '../../shared/lib/date';
import { useToast } from '../../shared/toast/ToastContext';
import { Button } from '../../shared/ui/Button';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { LoadingBlock } from '../../shared/ui/LoadingBlock';
import { StateView } from '../../shared/ui/StateView';
import { FoundStatusBadge } from '../../shared/ui/StatusBadge';
import { adminApi } from './api';
import { RejectDialog } from './RejectDialog';

type Pending = { type: 'approve' | 'reject'; group: AdminClaimGroup; claim: AdminClaim } | null;

const who = (c: AdminClaim) =>
  `${c.claimant.name}${c.claimant.grade ? ` (${c.claimant.grade}학년 ${c.claimant.classNo}반)` : ''}`;

/** ⑩ 승인 대기 — 한 물건에 신청이 여러 건이면 함께 보여 주고, 하나를 승인하면 나머지는 자동 거절된다 */
export function PendingClaimsTab() {
  const toast = useToast();
  const res = useAsync((signal) => adminApi.claims(signal), []);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const approve = async () => {
    if (!pending || busy) return;
    const { claim } = pending;
    setPending(null);
    setBusy(true);
    try {
      const r = await adminApi.approve(claim.id);
      toast.success(
        r.rejected.length
          ? `승인했습니다. 나머지 신청 ${r.rejected.length}건은 자동 거절되었습니다`
          : '승인했습니다. 학생에게 수령 안내를 보냈습니다',
      );
      res.retry();
    } catch (e) {
      toast.fromError(e, '승인하지 못했습니다');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (reason: string) => {
    if (!pending || busy) return;
    const { claim } = pending;
    setPending(null);
    setBusy(true);
    try {
      await adminApi.reject(claim.id, reason);
      toast.success('거절했습니다. 학생에게 사유를 알렸습니다');
      res.retry();
    } catch (e) {
      toast.fromError(e, '거절하지 못했습니다');
    } finally {
      setBusy(false);
    }
  };

  if (res.status === 'loading') {
    return (
      <LoadingBlock label="승인 대기 목록을 불러오는 중" />
    );
  }
  if (res.status === 'error') {
    return <StateView kind="error" title="승인 대기 목록을 불러오지 못했습니다" action={<Button onClick={res.retry}>다시 시도</Button>} />;
  }
  if (res.data.length === 0) {
    return <StateView kind="empty" title="승인 대기 중인 수령 신청이 없습니다" />;
  }

  return (
    <>
      <ul className="flex flex-col gap-3" aria-label="승인 대기 목록">
        {res.data.map((group) => (
          <li key={group.item.id}>
            <article className="rounded-card border border-line bg-bg-1" aria-label={`${group.item.title} 신청 ${group.claims.length}건`}>
              <Link to={`/found/${group.item.id}`} state={{ item: group.item }} className="flex items-center gap-3 p-3">
                <span className="size-14 shrink-0 overflow-hidden rounded-field bg-bg-3">
                  {group.item.thumbnail ? (
                    <img src={group.item.thumbnail.url} alt="" className="size-full object-cover" />
                  ) : (
                    <ImageOff className="m-4 text-tx-3" size={22} aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{group.item.title}</span>
                  <span className="block truncate text-xs text-tx-2">{group.item.keptAt}에 보관</span>
                </span>
                <FoundStatusBadge status={group.item.status} />
              </Link>
              {group.claims.length > 1 && (
                <p className="mx-3 mb-2 rounded-field bg-accent-weak px-3 py-2 text-xs font-semibold text-accent-dark">
                  신청 {group.claims.length}건 — 하나를 승인하면 나머지 {group.claims.length - 1}건은 자동 거절됩니다
                </p>
              )}
              <ul className="divide-y divide-line border-t border-line">
                {group.claims.map((claim) => (
                  <li key={claim.id} className="flex items-center gap-2 px-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{who(claim)}</span>
                      <span className="block text-xs text-tx-2">{formatDateTime(claim.createdAt)} 신청</span>
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`${claim.claimant.name} 신청 거절`}
                      onClick={() => setPending({ type: 'reject', group, claim })}
                    >
                      거절
                    </Button>
                    <Button
                      size="sm"
                      aria-label={`${claim.claimant.name} 신청 승인`}
                      loading={busy}
                      onClick={() => setPending({ type: 'approve', group, claim })}
                    >
                      승인
                    </Button>
                  </li>
                ))}
              </ul>
            </article>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pending?.type === 'approve'}
        title="수령 신청을 승인할까요?"
        message={
          pending
            ? `${who(pending.claim)} 학생에게 ${pending.group.item.title}을(를) 전달 완료로 처리합니다.${
                pending.group.claims.length > 1 ? ` 나머지 ${pending.group.claims.length - 1}건은 자동 거절됩니다.` : ''
              }`
            : ''
        }
        confirmLabel="승인"
        onConfirm={() => void approve()}
        onCancel={() => setPending(null)}
      />
      <RejectDialog
        open={pending?.type === 'reject'}
        claimantName={pending?.claim.claimant.name ?? ''}
        itemTitle={pending?.group.item.title ?? ''}
        onSubmit={(reason) => void reject(reason)}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
