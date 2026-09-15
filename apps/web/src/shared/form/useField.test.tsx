import { act, renderHook } from '@testing-library/react';
import { minLength, required } from './rules';
import { useField } from './useField';

const change = (value: string) => ({ target: { value } }) as React.ChangeEvent<HTMLInputElement>;

describe('useField', () => {
  it('여러 규칙이 실패해도 첫 오류 하나만 갖는다', () => {
    const { result } = renderHook(() => useField('', [required('필수입니다'), minLength(8, '8자 이상')]));
    expect(result.current.error).toBe('필수입니다');
    act(() => result.current.inputProps.onChange(change('abc')));
    expect(result.current.error).toBe('8자 이상');
    act(() => result.current.inputProps.onChange(change('abcdefgh')));
    expect(result.current.error).toBeNull();
    expect(result.current.valid).toBe(true);
  });

  it('처음에는 오류를 숨기고, blur 후에 보여 준다', () => {
    const { result } = renderHook(() => useField('', [required('필수입니다')]));
    expect(result.current.visibleError).toBeNull();
    expect(result.current.touched).toBe(false);
    act(() => result.current.inputProps.onBlur());
    expect(result.current.touched).toBe(true);
    expect(result.current.visibleError).toBe('필수입니다');
  });
});
