import { useCallback, useEffect, useState } from 'react';

/** 남은 초를 1초마다 줄인다. start(n) 으로 다시 시작한다. */
export function useCountdown() {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const start = useCallback((seconds: number) => setRemaining(Math.max(0, Math.ceil(seconds))), []);

  return { remaining, running: remaining > 0, start };
}
