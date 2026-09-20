import { act, renderHook } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('1초마다 1씩 줄고 0에서 멈춘다', () => {
    const { result } = renderHook(() => useCountdown());
    expect(result.current.running).toBe(false);
    act(() => result.current.start(3));
    expect(result.current.remaining).toBe(3);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remaining).toBe(2);
    act(() => vi.advanceTimersByTime(1000));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remaining).toBe(0);
    expect(result.current.running).toBe(false);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remaining).toBe(0);
  });

  it('소수 초는 올림', () => {
    const { result } = renderHook(() => useCountdown());
    act(() => result.current.start(1.2));
    expect(result.current.remaining).toBe(2);
  });
});
