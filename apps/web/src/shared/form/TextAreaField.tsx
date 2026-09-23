import { useId, type TextareaHTMLAttributes } from 'react';

interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string | null;
  optional?: boolean;
}

export function TextAreaField({ label, error, optional, className = '', ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-tx-2">
        {label}
        {optional && <span className="ml-1 font-normal text-tx-3">(선택)</span>}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={error ? true : undefined}
        className={`w-full resize-none rounded-field border px-3.5 py-3 text-[15px] outline-none placeholder:text-tx-3 focus:border-accent ${
          error ? 'border-err bg-err-weak' : 'border-line bg-bg-1'
        }`}
        {...rest}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-err">
          ! {error}
        </p>
      )}
    </div>
  );
}
