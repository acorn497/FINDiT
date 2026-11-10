import { statsRanges } from './admin-items.service';

describe('statsRanges', () => {
  // 2026-11-10(화) 18:00 KST
  const now = new Date('2026-11-10T09:00:00Z');

  it('주 — 월요일 0시(서울) 시작, 최근 6주, 오래된 것부터', () => {
    const r = statsRanges('week', now);
    expect(r).toHaveLength(6);
    expect(r[5].from.toISOString()).toBe('2026-11-08T15:00:00.000Z'); // 11-09(월) 00:00 KST
    expect(r[5].to.toISOString()).toBe('2026-11-15T15:00:00.000Z');
    expect(r[5].label).toBe('11월 2주');
    expect(r[0].from.toISOString()).toBe('2026-10-04T15:00:00.000Z'); // 10-05(월)
    expect(r[0].label).toBe('10월 1주');
  });

  it('월 — 1일 0시(서울) 시작, 해를 넘겨도 맞다', () => {
    const r = statsRanges('month', now);
    expect(r.map((b) => b.label)).toEqual(['2026년 6월', '2026년 7월', '2026년 8월', '2026년 9월', '2026년 10월', '2026년 11월']);
    expect(r[5].from.toISOString()).toBe('2026-10-31T15:00:00.000Z');
    expect(r[5].to.toISOString()).toBe('2026-11-30T15:00:00.000Z');
    const jan = statsRanges('month', new Date('2027-01-05T00:00:00Z'), 2);
    expect(jan.map((b) => b.label)).toEqual(['2026년 12월', '2027년 1월']);
  });
});
