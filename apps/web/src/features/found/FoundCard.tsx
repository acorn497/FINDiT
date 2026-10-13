import { CATEGORY_LABEL, type FoundItemSummary } from '@findit/shared';
import { ImageOff } from 'lucide-react';
import { Link } from 'react-router';
import { formatMonthDay } from '../../shared/lib/date';
import { FoundStatusBadge } from '../../shared/ui/StatusBadge';

/** 습득물 카드 — 사진 + 좌상단 상태 배지 + 이름 + 보관 장소 + 'N월 N일 등록' */
export function FoundCard({ item }: { item: FoundItemSummary }) {
  return (
    <Link
      to={`/found/${item.id}`}
      state={{ item }}
      className="group block overflow-hidden rounded-card border border-line bg-bg-1 transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/10] bg-bg-3">
        {item.thumbnail ? (
          <img src={item.thumbnail.url} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-tx-3" aria-hidden>
            <ImageOff size={24} />
          </span>
        )}
        <FoundStatusBadge status={item.status} className="absolute left-2 top-2" />
      </div>
      <div className="px-3 pb-3 pt-2.5">
        <p className="truncate text-[15px] font-bold">{item.title}</p>
        <p className="mt-0.5 truncate text-xs text-tx-2">
          <span className="sr-only">{CATEGORY_LABEL[item.category]} · 보관 장소 </span>
          {item.keptAt}
        </p>
        <p className="mt-0.5 text-xs text-tx-3">{formatMonthDay(item.createdAt)} 등록</p>
      </div>
    </Link>
  );
}

export function FoundCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-card border border-line bg-bg-1" aria-hidden>
      <div className="aspect-[16/10] animate-pulse bg-bg-3" />
      <div className="space-y-1.5 px-3 pb-3 pt-2.5">
        <div className="h-4 w-2/3 animate-pulse rounded bg-bg-3" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-bg-3" />
      </div>
    </div>
  );
}
