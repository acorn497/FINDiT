import { registerDecorator, type ValidationOptions } from 'class-validator';
import { todayInSeoul } from './dates';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** 'YYYY-MM-DD' 형식이고 실제 있는 날짜인지 */
export function isValidDate(v: unknown): v is string {
  if (typeof v !== 'string' || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** notFuture — 서울 기준 오늘 이후 날짜를 거부한다 (오늘은 통과) */
export function IsNotFutureDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName,
      options: { message: '오늘 이후의 날짜는 선택할 수 없습니다', ...options },
      validator: {
        validate: (v: unknown) => isValidDate(v) && v <= todayInSeoul(),
      },
    });
}

/** 'YYYY-MM-DD' 형식 */
export function IsDateString(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isDateOnlyString',
      target: object.constructor,
      propertyName,
      options: { message: '날짜 형식이 아닙니다 (YYYY-MM-DD)', ...options },
      validator: { validate: (v: unknown) => isValidDate(v) },
    });
}
