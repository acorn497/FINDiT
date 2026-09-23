import { formatDateKo, todayISO } from './date';

describe('date', () => {
  it('todayISO 는 기기 시간 기준 YYYY-MM-DD', () => {
    expect(todayISO(new Date(2026, 8, 5, 23, 59))).toBe('2026-09-05');
  });

  it('formatDateKo', () => {
    expect(formatDateKo('2026-10-17')).toBe('2026년 10월 17일');
    expect(formatDateKo('2026-10-17T07:24:00.000Z')).toBe('2026년 10월 17일');
  });
});
