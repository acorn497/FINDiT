import { email, firstError, maxLength, minLength, notFuture, required } from './rules';

describe('rules', () => {
  it('required — 빈 문자열·공백·빈 배열·null 은 실패', () => {
    const rule = required('필수');
    expect(rule('')).toBe('필수');
    expect(rule('   ')).toBe('필수');
    expect(required<string[]>('필수')([])).toBe('필수');
    expect(required<string | null>('필수')(null)).toBe('필수');
    expect(rule('a')).toBeNull();
  });

  it('minLength — 비어 있으면 통과(required 에 맡김), 짧으면 실패', () => {
    const rule = minLength(8, '8자 이상');
    expect(rule('')).toBeNull();
    expect(rule('1234567')).toBe('8자 이상');
    expect(rule('12345678')).toBeNull();
  });

  it('maxLength', () => {
    expect(maxLength(3)('abcd')).toBe('3자 이하로 입력해 주세요');
    expect(maxLength(3)('abc')).toBeNull();
  });

  it('email', () => {
    const rule = email('형식 오류');
    expect(rule('')).toBeNull();
    expect(rule('s2217')).toBe('형식 오류');
    expect(rule('s2217@gbsw')).toBe('형식 오류');
    expect(rule('s2217@gbsw.hs.kr')).toBeNull();
  });

  it('firstError — 규칙 순서대로 첫 오류만 돌려준다', () => {
    const rules = [required('필수'), email('형식'), minLength(30, '길이')];
    expect(firstError('', rules)).toBe('필수');
    expect(firstError('abc', rules)).toBe('형식');
    expect(firstError('a@b.co', rules)).toBe('길이');
    expect(firstError('a@b.co', [])).toBeNull();
  });
});

describe('notFuture', () => {
  const rule = notFuture('미래 불가', () => '2026-09-23');

  it('경계값 — 오늘은 통과, 내일은 실패', () => {
    expect(rule('2026-09-23')).toBeNull();
    expect(rule('2026-09-24')).toBe('미래 불가');
  });

  it('과거·빈 값은 통과 (빈 값은 required 에 맡긴다)', () => {
    expect(rule('2026-01-01')).toBeNull();
    expect(rule('')).toBeNull();
  });

  it('기본 기준일은 기기의 오늘', () => {
    const today = new Date();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const iso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(notFuture()(iso(today))).toBeNull();
    expect(notFuture()(iso(tomorrow))).toBe('오늘 이후의 날짜는 선택할 수 없습니다');
  });
});
