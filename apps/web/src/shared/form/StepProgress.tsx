interface StepProgressProps {
  step: number;
  total: number;
  label: string;
}

/** 상단 진행 막대 + "2 / 3 단계 · ..." 문구 */
export function StepProgress({ step, total, label }: StepProgressProps) {
  return (
    <div>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label="진행 단계"
        className="flex gap-2"
      >
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-accent' : 'bg-bg-3'}`} />
        ))}
      </div>
      <p className="mt-3 text-[13px] font-bold text-accent">
        {step} / {total} 단계 · {label}
      </p>
    </div>
  );
}
