import { Spinner } from './Spinner';

export function LoadingScreen({ message = '불러오는 중이에요' }: { message?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg-2">
      <Spinner />
      <p className="text-sm text-tx-2">{message}</p>
    </div>
  );
}
