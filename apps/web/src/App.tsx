import { BrowserRouter } from 'react-router';

export function App() {
  return (
    <BrowserRouter>
      <main className="mx-auto max-w-[390px] p-6">
        <h1 className="text-2xl font-extrabold">
          FIND<span className="text-accent">iT</span>
        </h1>
        <p className="mt-2 text-tx-2">교내 분실물 등록·매칭 서비스</p>
        <div className="mt-6 flex gap-2">
          <span className="rounded-chip bg-st-keep px-2.5 py-1 text-xs font-bold text-bg-1">보관 중</span>
          <span className="rounded-chip bg-st-check px-2.5 py-1 text-xs font-bold text-bg-1">확인 중</span>
          <span className="rounded-chip bg-st-done px-2.5 py-1 text-xs font-bold text-bg-1">전달 완료</span>
          <span className="rounded-chip bg-st-expire px-2.5 py-1 text-xs font-bold text-bg-1">기간 만료</span>
        </div>
      </main>
    </BrowserRouter>
  );
}
