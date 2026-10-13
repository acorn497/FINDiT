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

const KST_PARTS = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function kstParts(iso: string) {
  const parts = Object.fromEntries(KST_PARTS.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { month: Number(parts.month), day: Number(parts.day), hour: parts.hour === '24' ? '00' : parts.hour, minute: parts.minute };
}

/** 등록 시각(ISO) → '10월 17일' (서울 기준) */
export function formatMonthDay(iso: string): string {
  const { month, day } = kstParts(iso);
  return `${month}월 ${day}일`;
}

/** 등록 시각(ISO) → '10월 17일 16:24' (서울 기준) */
export function formatDateTime(iso: string): string {
  const { month, day, hour, minute } = kstParts(iso);
  return `${month}월 ${day}일 ${hour}:${minute}`;
}
