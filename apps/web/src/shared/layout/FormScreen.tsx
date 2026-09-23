import type { ReactNode } from 'react';

interface FormScreenProps {
  appBar: ReactNode;
  /** 화면 하단에 고정되는 버튼 영역 */
  actions: ReactNode;
  children: ReactNode;
}

/**
 * 입력 흐름 화면 — 상단 앱바 + 스크롤되는 본문 + 하단 고정 버튼.
 * 하단 탭은 보이지 않는다.
 */
export function FormScreen({ appBar, actions, children }: FormScreenProps) {
  return (
    <div className="flex h-screen flex-col bg-bg-2">
      {appBar}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[560px] px-4 pb-6 pt-4">{children}</div>
      </main>
      <div className="border-t border-line bg-bg-1 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-[560px]">{actions}</div>
      </div>
    </div>
  );
}
