import { validate } from 'class-validator';
import { daysBetween, todayInSeoul } from './dates';
import { IsDateString, IsNotFutureDate, isValidDate } from './validators';

class Probe {
  @IsDateString()
  @IsNotFutureDate()
  d: string;
}

const probe = (d: string) => Object.assign(new Probe(), { d });

describe('날짜 검사', () => {
  it('todayInSeoul 은 서울 기준 — UTC 15시는 다음 날', () => {
    expect(todayInSeoul(new Date('2026-09-22T14:59:00Z'))).toBe('2026-09-22');
    expect(todayInSeoul(new Date('2026-09-22T15:00:00Z'))).toBe('2026-09-23');
  });

  it('isValidDate — 형식과 실제 날짜', () => {
    expect(isValidDate('2026-09-22')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026/09/22')).toBe(false);
    expect(isValidDate(20260922)).toBe(false);
  });

  it('notFuture — 오늘은 통과, 내일은 실패', async () => {
    const today = todayInSeoul();
    const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    expect(await validate(probe(today))).toHaveLength(0);
    const errors = await validate(probe(tomorrow));
    expect(errors[0].constraints).toEqual({ isNotFutureDate: '오늘 이후의 날짜는 선택할 수 없습니다' });
  });

  it('daysBetween', () => {
    expect(daysBetween('2026-10-17', '2026-10-17')).toBe(0);
    expect(daysBetween('2026-10-10', '2026-10-17')).toBe(7);
    expect(daysBetween('2026-10-31', '2026-11-01')).toBe(1);
  });
});
