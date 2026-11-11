import type { ButtonHTMLAttributes, Ref } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** 요청 중 표시 — 버튼을 비활성화하지는 않고 aria-busy 만 켠다 */
  loading?: boolean;
  block?: boolean;
  /** sm — 목록 항목 안의 작은 버튼 (높이 36px) */
  size?: 'md' | 'sm';
  ref?: Ref<HTMLButtonElement>;
}

const SIZE = {
  md: 'h-12 px-4 text-[15px]',
  sm: 'h-9 px-3 text-[13px]',
};

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
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-field font-bold transition-colors disabled:opacity-50 ${
        SIZE[size]
      } ${VARIANT[variant]} ${block ? 'w-full' : ''} ${loading ? 'opacity-80' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
