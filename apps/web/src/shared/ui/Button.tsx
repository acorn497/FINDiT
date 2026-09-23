import type { ButtonHTMLAttributes, Ref } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** 요청 중 표시 — 버튼을 비활성화하지는 않고 aria-busy 만 켠다 */
  loading?: boolean;
  block?: boolean;
  ref?: Ref<HTMLButtonElement>;
}

const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-bg-1 hover:bg-accent-dark',
  secondary: 'border border-line bg-bg-1 text-tx-2 hover:bg-bg-2',
  ghost: 'bg-transparent text-tx-2 hover:bg-bg-3',
  danger: 'bg-err text-bg-1',
};

export function Button({
  variant = 'primary',
  loading = false,
  block = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={`inline-flex h-12 items-center justify-center gap-1.5 rounded-field px-4 text-[15px] font-bold transition-colors disabled:opacity-50 ${
        VARIANT[variant]
      } ${block ? 'w-full' : ''} ${loading ? 'opacity-80' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
