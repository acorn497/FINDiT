import { CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

interface DoneViewProps {
  title: string;
  description?: string;
  actions: ReactNode;
}

/** 작성 완료 안내 */
export function DoneView({ title, description, actions }: DoneViewProps) {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-[390px] flex-col items-center justify-center px-6 text-center">
      <CircleCheck size={56} className="text-st-done" aria-hidden />
      <h1 className="mt-4 text-xl font-bold">{title}</h1>
      {description && <p className="mt-2 text-sm leading-relaxed text-tx-2">{description}</p>}
      <div className="mt-8 flex w-full flex-col gap-2">{actions}</div>
    </section>
  );
}
