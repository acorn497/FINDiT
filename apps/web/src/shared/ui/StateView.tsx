import { CircleAlert, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';

interface StateViewProps {
  kind: 'empty' | 'error';
  title: string;
  description?: string;
  action?: ReactNode;
}

/** 빈 결과 / 오류 화면 */
export function StateView({ kind, title, description, action }: StateViewProps) {
  const Icon = kind === 'error' ? CircleAlert : SearchX;
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className="flex flex-col items-center px-6 py-14 text-center">
      <Icon size={40} className={kind === 'error' ? 'text-err' : 'text-tx-3'} aria-hidden />
      <p className="mt-3 text-base font-bold">{title}</p>
      {description && <p className="mt-1 text-sm leading-relaxed text-tx-2">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
