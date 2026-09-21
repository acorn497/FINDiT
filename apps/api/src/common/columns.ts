import type { ValueTransformer } from 'typeorm';

/** date 컬럼을 'YYYY-MM-DD' 문자열 그대로 다룬다 (시간대 변환 없이) */
export const dateString: ValueTransformer = {
  to: (v: string | null | undefined) => v,
  from: (v: string | Date | null) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
};
