import { AppBar } from '../shared/layout/AppBar';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/** 단계별로 실제 화면이 들어오기 전까지 경로만 확인하는 임시 페이지 */
export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <>
      <AppBar title={title} />
      <section className="px-4 py-6">
        <p className="rounded-card border border-dashed border-line bg-bg-1 px-4 py-10 text-center text-sm text-tx-2">
          {description ?? '준비 중인 화면입니다.'}
        </p>
      </section>
    </>
  );
}
