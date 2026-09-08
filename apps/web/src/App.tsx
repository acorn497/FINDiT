import { BrowserRouter } from 'react-router';

export function App() {
  return (
    <BrowserRouter>
      <main className="p-6">
        <h1 className="text-2xl font-bold">FINDiT</h1>
        <p>교내 분실물 등록·매칭 서비스</p>
      </main>
    </BrowserRouter>
  );
}
