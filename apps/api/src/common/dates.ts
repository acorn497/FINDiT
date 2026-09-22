const SEOUL = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' });

/** 서울 기준 오늘 날짜 'YYYY-MM-DD' */
export function todayInSeoul(now = new Date()): string {
  return SEOUL.format(now);
}

/** 서울 기준 날짜 'YYYY-MM-DD' */
export function dateInSeoul(d: Date): string {
  return SEOUL.format(d);
}

/** 두 날짜('YYYY-MM-DD') 사이의 일 수 차이 (절댓값) */
export function daysBetween(a: string, b: string): number {
  const ms = Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`));
  return Math.round(ms / 86_400_000);
}
