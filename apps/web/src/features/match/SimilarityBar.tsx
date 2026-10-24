/** 유사한 정도 막대 — score(0~1)를 백분율로, --accent 로 채우고 숫자도 함께 */
export function SimilarityBar({ score }: { score: number }) {
  const percent = Math.max(0, Math.min(100, Math.round(score * 100)));
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-tx-2">유사한 정도</span>
        <span className="text-base font-extrabold text-accent">{percent}%</span>
      </div>
      <div
        role="meter"
        aria-label="유사한 정도"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-bg-3"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
