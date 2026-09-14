import { useId, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  /** 보여 줄 오류 문구 (useField.visibleError) */
  error?: string | null;
  /** 통과 안내 문구 (예: ✓ 등록된 계정입니다) */
  success?: string | null;
  hint?: string;
}

/** 라벨 + 입력 칸 + 오류/통과 안내 */
export function TextField({ label, error, success, hint, className = '', ...rest }: TextFieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const hasError = Boolean(error);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-tx-2">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={hasError || undefined}
        aria-describedby={error || success || hint ? messageId : undefined}
        className={`h-12 w-full rounded-field border px-3.5 text-[15px] outline-none transition-colors placeholder:text-tx-3 focus:border-accent ${
          hasError ? 'border-err bg-err-weak' : 'border-line bg-bg-1'
        }`}
        {...rest}
      />
      {hasError ? (
        <p id={messageId} role="alert" className="mt-1.5 text-[12.5px] font-medium text-err">
          ! {error}
        </p>
      ) : success ? (
        <p id={messageId} className="mt-1.5 text-[12.5px] font-medium text-st-done">
          ✓ {success}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-[12.5px] text-tx-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
