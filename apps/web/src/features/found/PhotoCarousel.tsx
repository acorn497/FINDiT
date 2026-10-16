import type { FoundItemStatus, Photo } from '@findit/shared';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useState } from 'react';
import { FoundStatusBadge } from '../../shared/ui/StatusBadge';

interface PhotoCarouselProps {
  photos: Pick<Photo, 'id' | 'url'>[];
  status: FoundItemStatus;
  title: string;
}

/** 상세 히어로 — 좌상단 상태 배지, 우하단 '1 / 2' */
export function PhotoCarousel({ photos, status, title }: PhotoCarouselProps) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const current = photos[Math.min(index, Math.max(0, count - 1))];

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg-3 md:rounded-card">
      {current ? (
        <img src={current.url} alt={`${title} 사진 ${index + 1}`} className="size-full object-cover" />
      ) : (
        <span className="flex size-full items-center justify-center text-tx-3">
          <ImageOff size={32} aria-hidden />
          <span className="sr-only">사진 없음</span>
        </span>
      )}
      <FoundStatusBadge status={status} className="absolute left-3 top-3" />
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="이전 사진"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-tx-1/40 text-bg-1 disabled:opacity-0"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            aria-label="다음 사진"
            disabled={index === count - 1}
            onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-tx-1/40 text-bg-1 disabled:opacity-0"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </>
      )}
      {count > 0 && (
        <span className="absolute bottom-3 right-3 rounded-chip bg-tx-1/60 px-2.5 py-1 text-xs font-semibold text-bg-1">
          {index + 1} / {count}
        </span>
      )}
    </div>
  );
}
