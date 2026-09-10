import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';

interface AppBarProps {
  title: string;
  /** 뒤로 가기 버튼 표시. 문자열이면 그 경로로, true면 브라우저 뒤로 */
  back?: boolean | string;
  onBack?: () => void;
  /** 오른쪽 보조 버튼 자리 */
  actions?: ReactNode;
}

/** 상단 앱바 — 뒤로 가기 + 제목 + 보조 버튼 */
export function AppBar({ title, back, onBack, actions }: AppBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) return onBack();
    if (typeof back === 'string') return navigate(back);
    navigate(-1);
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-bg-1/95 px-3 backdrop-blur">
      {back || onBack ? (
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로 가기"
          className="flex size-9 items-center justify-center rounded-field bg-bg-2 text-tx-1"
        >
          <ArrowLeft size={20} aria-hidden />
        </button>
      ) : (
        <span className="w-1" aria-hidden />
      )}
      <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold">{title}</h1>
      {actions && <div className="flex items-center gap-1.5">{actions}</div>}
    </header>
  );
}
