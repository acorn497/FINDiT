/**
 * 입력 검사 규칙. 규칙은 값을 받아 오류 문구(실패) 또는 null(통과)을 돌려준다.
 * useField 는 규칙 배열을 순서대로 검사해 첫 오류 하나만 보여 준다.
 */
export type Rule<T> = (value: T) => string | null;

const isBlank = (v: unknown) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);

export const required =
  <T>(message = '필수 항목입니다'): Rule<T> =>
  (v) =>
    isBlank(v) ? message : null;

export const minLength =
  (min: number, message = `${min}자 이상 입력해 주세요`): Rule<string> =>
  (v) =>
    v.length > 0 && v.length < min ? message : null;

export const maxLength =
  (max: number, message = `${max}자 이하로 입력해 주세요`): Rule<string> =>
  (v) =>
    v.length > max ? message : null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const email =
  (message = '이메일 형식이 아닙니다'): Rule<string> =>
  (v) =>
    v.trim() !== '' && !EMAIL_RE.test(v.trim()) ? message : null;

/** 규칙 배열을 순서대로 검사해 첫 오류만 돌려준다. */
export function firstError<T>(value: T, rules: Rule<T>[]): string | null {
  for (const rule of rules) {
    const message = rule(value);
    if (message) return message;
  }
  return null;
}
