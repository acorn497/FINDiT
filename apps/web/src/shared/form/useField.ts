import { useCallback, useState, type ChangeEvent } from 'react';
import { firstError, type Rule } from './rules';

export interface UseFieldOptions {
  /** true 면 건드리지 않은 칸도 오류를 보여 준다 ([다음]을 눌렀을 때) */
  showAll?: boolean;
}

/**
 * 입력 칸 하나의 값·검사 상태를 관리한다.
 * - 규칙 배열을 순서대로 검사해 첫 오류 하나만 노출한다.
 * - 입력 중에는 오류를 숨기고, 칸을 벗어난(blur) 뒤부터 보여 준다.
 * - showAll 이면 건드리지 않은 칸까지 한 번에 드러낸다.
 * - 서버가 돌려준 오류(예: 등록되지 않은 계정)는 값을 바꾸면 사라진다.
 */
export function useField<T = string>(
  initial: NoInfer<T>,
  rules: NoInfer<Rule<T>>[] = [],
  { showAll = false }: UseFieldOptions = {},
) {
  const [value, setValueState] = useState<T>(initial);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const error = serverError ?? firstError(value, rules);
  const visibleError = touched || showAll || serverError ? error : null;

  const setValue = useCallback((next: T) => {
    setValueState(next);
    setServerError(null);
  }, []);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value as T),
    [setValue],
  );
  const onBlur = useCallback(() => setTouched(true), []);
  const touch = useCallback(() => setTouched(true), []);
  const reset = useCallback((next: T = initial) => {
    setValueState(next);
    setTouched(false);
    setServerError(null);
  }, []);

  return {
    value,
    setValue,
    error,
    visibleError,
    touched,
    valid: error === null,
    touch,
    reset,
    setServerError,
    inputProps: { value: value as unknown as string, onChange, onBlur },
  };
}

export type Field<T = string> = ReturnType<typeof useField<T>>;

/** 모든 칸을 건드린 것으로 표시하고, 전부 통과했는지 돌려준다. */
export function touchAll(...fields: Pick<Field<never>, 'touch' | 'valid'>[]) {
  fields.forEach((f) => f.touch());
  return fields.every((f) => f.valid);
}
