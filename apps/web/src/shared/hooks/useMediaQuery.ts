import { useEffect, useState } from 'react';

/** CSS 미디어 쿼리 일치 여부 (matchMedia 가 없는 환경에서는 false) */
export function useMediaQuery(query: string) {
  const get = () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/** ≥768px — 하단 탭 대신 사이드 메뉴를 쓰는 넓은 화면 */
export const WIDE = '(min-width: 768px)';
