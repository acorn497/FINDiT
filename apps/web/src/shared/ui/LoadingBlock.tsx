import { Spinner } from './Spinner';

/** 목록·묶음 자리의 로딩 표시 (화면 전체가 아니라 그 자리만) */
export function LoadingBlock({ label = '불러오는 중' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex justify-center py-16">
      <Spinner />
      <span className="sr-only">{label}</span>
    </div>
  );
}
