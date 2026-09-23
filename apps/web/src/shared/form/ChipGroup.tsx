import { useId } from 'react';

export interface ChipOption<V extends string> {
  value: V;
  label: string;
}

interface ChipGroupProps<V extends string> {
  label: string;
  options: ChipOption<V>[];
  value: V | null;
  onChange: (value: V) => void;
  /** 선택을 다시 누르면 해제 */
  allowDeselect?: boolean;
  onDeselect?: () => void;
  error?: string | null;
  optional?: boolean;
}

/** 칩 하나를 고르는 입력 (라디오 그룹). 선택된 칩은 --accent 로 채운다. */
export function ChipGroup<V extends string>({
  label,
  options,
  value,
  onChange,
  allowDeselect,
  onDeselect,
  error,
  optional,
}: ChipGroupProps<V>) {
  const id = useId();
  return (
    <div>
      <p id={id} className="mb-2 text-[13px] font-semibold text-tx-2">
        {label}
        {optional && <span className="ml-1 font-normal text-tx-3">(선택)</span>}
      </p>
      <div role="radiogroup" aria-labelledby={id} aria-invalid={error ? true : undefined} className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => (selected && allowDeselect ? onDeselect?.() : onChange(opt.value))}
              className={`h-9 rounded-chip border px-3.5 text-[13px] font-semibold transition-colors ${
                selected
                  ? 'border-accent bg-accent text-bg-1'
                  : error
                    ? 'border-err bg-bg-1 text-tx-2'
                    : 'border-line bg-bg-1 text-tx-2 hover:bg-bg-2'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-err">
          ! {error}
        </p>
      )}
    </div>
  );
}
