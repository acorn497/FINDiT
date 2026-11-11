import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterChips, Segmented } from './FilterChips';

describe('FilterChips · Segmented', () => {
  it('고른 칩만 aria-checked, 누르면 onChange', async () => {
    const onChange = vi.fn();
    render(
      <FilterChips
        label="물건 종류 필터"
        options={[
          { value: null, label: '전체' },
          { value: 'ETC', label: '기타' },
        ]}
        value={null}
        onChange={onChange}
        scroll
      />,
    );
    expect(screen.getByRole('radiogroup', { name: '물건 종류 필터' })).toHaveClass('overflow-x-auto');
    expect(screen.getByRole('radio', { name: '전체' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: '기타' }));
    expect(onChange).toHaveBeenCalledWith('ETC');
  });

  it('Segmented 는 옵션 수만큼 칸을 나눈다', async () => {
    const onChange = vi.fn();
    render(
      <Segmented
        label="구분"
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
        value="b"
        onChange={onChange}
      />,
    );
    expect(screen.getByRole('radiogroup', { name: '구분' }).style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: 'A' }));
    expect(onChange).toHaveBeenCalledWith('a');
  });
});
