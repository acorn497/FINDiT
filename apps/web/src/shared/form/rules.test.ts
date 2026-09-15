import { email, firstError, maxLength, minLength, required } from './rules';

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
