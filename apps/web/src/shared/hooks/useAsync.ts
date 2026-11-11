import { useCallback, useEffect, useState } from 'react';

type State<T> = { status: 'loading'; data: null } | { status: 'ready'; data: T } | { status: 'error'; data: null; error: unknown };

/** 화면 진입 시 한 번 불러오는 조회 — 로딩 / 결과 / 오류 + 다시 시도 */
export function useAsync<T>(load: (signal: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<State<T>>({ status: 'loading', data: null });
  const [key, setKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: null });
    load(controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', data: null, error });
      });
    return () => controller.abort();
  }, [...deps, key]);

  const retry = useCallback(() => setKey((k) => k + 1), []);
  return { ...state, retry };
}
