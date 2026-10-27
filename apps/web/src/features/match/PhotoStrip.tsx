import type { Photo } from '@findit/shared';
import { ImageOff } from 'lucide-react';

/** 사진은 자동 비교하지 않고 나란히 놓아 사람이 눈으로 확인한다 */
export function PhotoStrip({ photos, title }: { photos: Photo[]; title: string }) {
  return (
    <section aria-label="습득물 사진" className="px-3 pb-3">
      {photos.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <li key={p.id} className="aspect-square overflow-hidden rounded-field bg-bg-3">
              <img src={p.url} alt={`${title} 사진 ${i + 1}`} className="size-full object-cover" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 rounded-field bg-bg-2 px-3 py-4 text-xs text-tx-3">
          <ImageOff size={16} aria-hidden /> 등록된 사진이 없습니다
        </p>
      )}
      <p className="mt-2 text-xs leading-relaxed text-tx-2">
        자동으로 판단하지 않습니다. 사진과 특징을 나란히 놓고 직접 눈으로 확인해 주세요.
      </p>
    </section>
  );
}
