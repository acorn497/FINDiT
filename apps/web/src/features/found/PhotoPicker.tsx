import { Plus, RotateCw, X } from 'lucide-react';
import { useId, type ChangeEvent } from 'react';
import { MAX_PHOTOS, type UploadItem } from './usePhotoUploads';

interface PhotoPickerProps {
  photos: UploadItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

/** 사진 최대 3장 — 정사각형 썸네일 + 우상단 × + 마지막 칸 점선 [+ 추가] */
export function PhotoPicker({ photos, onAdd, onRemove, onRetry }: PhotoPickerProps) {
  const inputId = useId();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith('image/'));
    if (files.length) onAdd(files.slice(0, MAX_PHOTOS - photos.length));
    e.target.value = '';
  };

  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-tx-2">
        사진 <span className="font-normal text-tx-3">(최대 {MAX_PHOTOS}장)</span>
      </p>
      <ul className="grid grid-cols-3 gap-2">
        {photos.map((p, i) => (
          <li key={p.id} className="relative aspect-square overflow-hidden rounded-card bg-bg-3" data-status={p.status}>
            <img
              src={p.previewUrl}
              alt={`선택한 사진 ${i + 1}`}
              className={`size-full object-cover ${p.status === 'queued' || p.status === 'uploading' ? 'opacity-60' : ''}`}
            />
            {p.status === 'uploading' && (
              <span className="absolute inset-x-0 bottom-0 bg-tx-1/50 py-0.5 text-center text-[11px] font-semibold text-bg-1">
                {p.progress}%
              </span>
            )}
            {p.status === 'error' && (
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-err/75 px-1 text-center text-[11px] font-semibold text-bg-1">
                업로드 실패
                <button
                  type="button"
                  aria-label={`사진 ${i + 1} 다시 올리기`}
                  title={p.error}
                  onClick={() => onRetry(p.id)}
                  className="flex items-center gap-1 rounded-chip bg-bg-1 px-2.5 py-1 text-[11px] font-bold text-err"
                >
                  <RotateCw size={12} aria-hidden />
                  재시도
                </button>
              </span>
            )}
            <button
              type="button"
              aria-label={`사진 ${i + 1} 삭제`}
              onClick={() => onRemove(p.id)}
              className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-tx-1/60 text-bg-1"
            >
              <X size={14} aria-hidden />
            </button>
          </li>
        ))}
        {photos.length < MAX_PHOTOS && (
          <li className="aspect-square">
            <label
              htmlFor={inputId}
              className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 rounded-card border-2 border-dashed border-line bg-bg-1 text-tx-3 hover:bg-bg-2"
            >
              <Plus size={22} aria-hidden />
              <span className="text-xs font-semibold">추가</span>
            </label>
            <input
              id={inputId}
              type="file"
              accept="image/*"
              multiple
              aria-label="사진 추가"
              className="sr-only"
              onChange={handleChange}
            />
          </li>
        )}
      </ul>
    </div>
  );
}
