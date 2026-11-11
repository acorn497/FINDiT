import { CircleAlert } from 'lucide-react';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

/** 예상하지 못한 화면 오류 — 흰 화면 대신 안내와 [다시 불러오기]를 보여 준다 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('화면 오류', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main role="alert" className="flex min-h-dvh flex-col items-center justify-center bg-bg-2 px-6 text-center">
        <CircleAlert size={44} className="text-err" aria-hidden />
        <h1 className="mt-4 text-lg font-bold">화면을 그리는 중 문제가 생겼습니다</h1>
        <p className="mt-1 text-sm text-tx-2">잠시 후 다시 시도해 주세요. 계속되면 담당 선생님께 알려 주세요.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 h-12 rounded-field bg-accent px-5 font-bold text-bg-1"
        >
          다시 불러오기
        </button>
      </main>
    );
  }
}
