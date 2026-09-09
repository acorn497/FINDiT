import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-[390px] flex-col items-center justify-center px-4 text-center">
      <p className="text-4xl font-extrabold text-tx-3">404</p>
      <h1 className="mt-3 text-lg font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="mt-1 text-sm text-tx-2">주소가 바뀌었거나 삭제된 화면입니다.</p>
      <Link to="/" className="mt-6 rounded-field bg-accent px-5 py-3 text-sm font-bold text-bg-1">
        홈으로
      </Link>
    </section>
  );
}
