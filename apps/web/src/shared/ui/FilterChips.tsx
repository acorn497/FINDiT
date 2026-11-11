export interface FilterOption<V> {
  value: V;
  label: string;
}

interface FilterChipsProps<V> {
  /** 스크린 리더용 묶음 이름 */
  label: string;
  options: FilterOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** 좁은 화면에서 가로로 넘쳐 스크롤 */
  scroll?: boolean;
  className?: string;
}

/** 목록 위의 걸러 보기 칩 줄 — 고른 칩은 --accent 로 채운다 (④ 습득물·⑦ 내 신고·⑩ 관리자 공용) */
export function FilterChips<V extends string | number | boolean | null>({
  label,
  options,
  value,
  onChange,
  scroll = false,
  className = '',
}: FilterChipsProps<V>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex gap-2 ${scroll ? '-mx-4 overflow-x-auto px-4 pb-1' : 'flex-wrap'} ${className}`}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value) + opt.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`h-9 shrink-0 rounded-chip border px-3.5 text-[13px] font-semibold transition-colors ${
              selected ? 'border-accent bg-accent text-bg-1' : 'border-line bg-bg-1 text-tx-2 hover:bg-bg-2'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** 두세 개 중 하나를 고르는 분할 버튼 (⑦ 구분, ⑩ 탭과 같은 모양) */
export function Segmented<V extends string | null>({ label, options, value, onChange }: Omit<FilterChipsProps<V>, 'scroll' | 'className'>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-field bg-bg-3 p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={String(opt.value) + opt.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`h-9 rounded-[8px] text-[13px] font-bold ${selected ? 'bg-bg-1 text-tx-1 shadow-sm' : 'text-tx-2'}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
