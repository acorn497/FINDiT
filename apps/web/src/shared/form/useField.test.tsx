import { act, renderHook } from '@testing-library/react';
import { minLength, required } from './rules';
import { touchAll, useField } from './useField';

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

describe('useField — 오류 표시 시점', () => {
  it('입력 중에는 오류를 보여 주지 않는다 (blur 이후부터)', () => {
    const { result } = renderHook(() => useField('', [minLength(8, '8자 이상')]));
    act(() => result.current.inputProps.onChange(change('abc')));
    expect(result.current.error).toBe('8자 이상');
    expect(result.current.visibleError).toBeNull();
    act(() => result.current.inputProps.onBlur());
    expect(result.current.visibleError).toBe('8자 이상');
  });

  it('showAll 이면 건드리지 않은 칸도 오류를 드러낸다', () => {
    const { result } = renderHook(() => useField('', [required('필수입니다')], { showAll: true }));
    expect(result.current.touched).toBe(false);
    expect(result.current.visibleError).toBe('필수입니다');
  });

  it('touchAll 은 모든 칸을 건드림 처리하고 전체 통과 여부를 돌려준다', () => {
    const { result } = renderHook(() => ({
      a: useField('', [required('a 필수')]),
      b: useField('ok', [required('b 필수')]),
    }));
    let ok = true;
    act(() => {
      ok = touchAll(result.current.a, result.current.b);
    });
    expect(ok).toBe(false);
    expect(result.current.a.visibleError).toBe('a 필수');
    expect(result.current.b.visibleError).toBeNull();
  });

  it('서버 오류는 바로 보이고, 값을 바꾸면 사라진다', () => {
    const { result } = renderHook(() => useField('x@y.kr', [required()]));
    act(() => result.current.setServerError('등록되지 않은 계정입니다'));
    expect(result.current.visibleError).toBe('등록되지 않은 계정입니다');
    expect(result.current.valid).toBe(false);
    act(() => result.current.setValue('z@y.kr'));
    expect(result.current.visibleError).toBeNull();
  });

  it('reset 은 값·touched·서버 오류를 되돌린다', () => {
    const { result } = renderHook(() => useField('', [required('필수')]));
    act(() => {
      result.current.setValue('abc');
      result.current.touch();
    });
    act(() => result.current.reset());
    expect(result.current.value).toBe('');
    expect(result.current.touched).toBe(false);
    act(() => result.current.reset('기본'));
    expect(result.current.value).toBe('기본');
  });
});
