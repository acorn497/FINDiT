import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import { TOAST_DURATION, ToastProvider, useToast, type ToastApi } from './ToastContext';

function setup() {
  let api!: ToastApi;
  function Grab() {
    api = useToast();
    return null;
  }
  render(
    <ToastProvider>
      <Grab />
    </ToastProvider>,
  );
  return () => api;
}

describe('공용 토스트', () => {
  afterEach(() => vi.useRealTimers());

  it('성공·실패·권한 없음 3종 — 같은 자리, 종류별 색과 역할', () => {
    const toast = setup();
    act(() => {
      toast().success('수령 신청을 보냈습니다');
      toast().error('사진을 올리지 못했습니다');
      toast().forbidden();
    });
    const success = screen.getByText('수령 신청을 보냈습니다').closest('[data-kind]')!;
    const error = screen.getByText('사진을 올리지 못했습니다').closest('[data-kind]')!;
    const forbidden = screen.getByText('권한이 없습니다').closest('[data-kind]')!;
    expect(success).toHaveClass('bg-st-done');
    expect(success).toHaveAttribute('role', 'status');
    expect(error).toHaveClass('bg-err');
    expect(error).toHaveAttribute('role', 'alert');
    expect(forbidden).toHaveClass('bg-err');
    expect(screen.getByLabelText('권한 없음')).toBeInTheDocument();
    for (const el of [success, error, forbidden]) expect(el.parentElement).toHaveAttribute('aria-label', '알림 메시지');
  });

  it('안내는 --accent', () => {
    const toast = setup();
    act(() => toast().info('새 알림이 도착했습니다'));
    expect(screen.getByText('새 알림이 도착했습니다').closest('[data-kind]')).toHaveClass('bg-accent');
  });

  it('잠시 뒤 저절로 사라진다', () => {
    vi.useFakeTimers();
    const toast = setup();
    act(() => toast().success('저장했습니다'));
    act(() => vi.advanceTimersByTime(TOAST_DURATION - 1));
    expect(screen.getByText('저장했습니다')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByText('저장했습니다')).not.toBeInTheDocument();
  });

  it('동시에 여러 개면 뜬 순서대로 쌓이고, 3개를 넘으면 가장 오래된 것부터 닫힌다', () => {
    const toast = setup();
    act(() => ['하나', '둘', '셋', '넷'].forEach((m) => toast().info(m)));
    const texts = screen.getAllByRole('status').map((el) => el.textContent);
    expect(texts).toEqual(['둘', '셋', '넷']);
  });

  it('[닫기]로 바로 닫는다', async () => {
    const toast = setup();
    act(() => toast().error('실패'));
    await userEvent.click(screen.getByRole('button', { name: '닫기' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('fromError — 403 은 권한 없음, 나머지는 서버 문구, 모르는 오류는 기본 문구', () => {
    const toast = setup();
    act(() => {
      toast().fromError(new ApiError(403, 'FORBIDDEN', '교사만 볼 수 있습니다'));
      toast().fromError(new ApiError(409, 'CONFLICT', '이미 수령 신청한 물건입니다'));
      toast().fromError(new Error('boom'), '처리하지 못했습니다');
    });
    expect(screen.getByText('교사만 볼 수 있습니다').closest('[data-kind]')).toHaveAttribute('data-kind', 'forbidden');
    expect(screen.getByText('이미 수령 신청한 물건입니다')).toBeInTheDocument();
    expect(screen.getByText('처리하지 못했습니다')).toBeInTheDocument();
  });

  it('Provider 밖에서 쓰면 오류', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useToast(), { wrapper: ({ children }: { children: ReactNode }) => <>{children}</> })).toThrow(
      'ToastProvider',
    );
    spy.mockRestore();
  });
});
