const pad = (n: number) => String(n).padStart(2, '0');

/** 기기 시간 기준 오늘 'YYYY-MM-DD' */
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** 'YYYY-MM-DD' → '2026년 10월 17일' */
export function formatDateKo(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
