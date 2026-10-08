interface UploadProgressProps {
  current: { index: number; total: number; progress: number } | null;
  total: number;
  failed: number;
}

/** 업로드 진행률 막대 + 좌우 라벨 ("업로드 중... 2장 중 2번째" / "62%") */
export function UploadProgress({ current, total, failed }: UploadProgressProps) {
  if (total === 0) return null;

  let left: string;
  let right: string;
  let percent: number;
  if (current) {
    left = `업로드 중... ${current.total}장 중 ${current.index}번째`;
    right = `${current.progress}%`;
    percent = current.progress;
  } else if (failed > 0) {
    left = `${failed}장을 올리지 못했습니다`;
    right = '다시 시도';
    percent = 100;
  } else {
    left = `업로드 완료 · ${total}장`;
    right = '100%';
    percent = 100;
  }

  return (
    <div className="mt-2.5">
      <div
        role="progressbar"
        aria-label="사진 업로드"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-1.5 overflow-hidden rounded-full bg-bg-3"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-200 ${failed > 0 && !current ? 'bg-err' : 'bg-accent'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-tx-2" aria-live="polite">
        <span>{left}</span>
        <span className="font-semibold">{right}</span>
      </div>
    </div>
  );
}
