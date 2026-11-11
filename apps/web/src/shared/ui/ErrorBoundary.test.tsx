import { act, render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';
import { OfflineBanner } from './OfflineBanner';

function Boom(): never {
  throw new Error('렌더 실패');
}

describe('ErrorBoundary · OfflineBanner', () => {
  it('화면 오류는 흰 화면 대신 안내와 [다시 불러오기]', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('화면을 그리는 중 문제가 생겼습니다');
    expect(screen.getByRole('button', { name: '다시 불러오기' })).toBeInTheDocument();
    spy.mockRestore();
  });

  it('오류가 없으면 그대로 그린다', () => {
    render(
      <ErrorBoundary>
        <p>정상</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('정상')).toBeInTheDocument();
  });

  it('연결이 끊기면 안내, 다시 연결되면 사라진다', () => {
    render(<OfflineBanner />);
    expect(screen.queryByText(/인터넷 연결이 끊겼습니다/)).not.toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByRole('status')).toHaveTextContent('인터넷 연결이 끊겼습니다');
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.queryByText(/인터넷 연결이 끊겼습니다/)).not.toBeInTheDocument();
  });
});
