import { useCallback, useState, type ChangeEvent } from 'react';
import { firstError, type Rule } from './rules';

/**
 * 입력 칸 하나의 값·검사 상태를 관리한다.
 * - 규칙 배열을 순서대로 검사해 첫 오류 하나만 노출한다.
 */
export function useField<T = string>(initial: T, rules: Rule<T>[] = []) {
  const [value, setValueState] = useState<T>(initial);
  const [dirty, setDirty] = useState(false);
  const [touched, setTouched] = useState(false);

  const error = firstError(value, rules);
  const visibleError = dirty || touched ? error : null;

  const setValue = useCallback((next: T) => {
    setValueState(next);
    setDirty(true);
  }, []);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value as T),
    [setValue],
  );
  const onBlur = useCallback(() => setTouched(true), []);

  return {
    value,
    setValue,
    error,
    visibleError,
    touched,
    valid: error === null,
    inputProps: { value: value as unknown as string, onChange, onBlur },
  };
}

export type Field<T = string> = ReturnType<typeof useField<T>>;
