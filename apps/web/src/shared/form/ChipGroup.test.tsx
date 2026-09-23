import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ChipGroup } from './ChipGroup';

const OPTIONS = [
  { value: 'A', label: '등교 전' },
  { value: 'B', label: '점심시간' },
] as const;

function Harness({ allowDeselect = false, error }: { allowDeselect?: boolean; error?: string }) {
  const [v, setV] = useState<'A' | 'B' | null>(null);
  return (
    <ChipGroup
      label="대략적인 시간대"
      optional
      options={[...OPTIONS]}
      value={v}
      onChange={setV}
      allowDeselect={allowDeselect}
      onDeselect={() => setV(null)}
      error={error}
    />
  );
}

describe('ChipGroup', () => {
  it('칩을 누르면 선택되고 하나만 선택된다', async () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: /대략적인 시간대/ });
    expect(group).toBeInTheDocument();
    expect(screen.getByText('(선택)')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: '점심시간' }));
    expect(screen.getByRole('radio', { name: '점심시간' })).toHaveAttribute('aria-checked', 'true');
    await userEvent.click(screen.getByRole('radio', { name: '등교 전' }));
    expect(screen.getByRole('radio', { name: '점심시간' })).toHaveAttribute('aria-checked', 'false');
  });

  it('allowDeselect 면 다시 눌러 해제', async () => {
    render(<Harness allowDeselect />);
    await userEvent.click(screen.getByRole('radio', { name: '등교 전' }));
    await userEvent.click(screen.getByRole('radio', { name: '등교 전' }));
    expect(screen.getByRole('radio', { name: '등교 전' })).toHaveAttribute('aria-checked', 'false');
  });

  it('오류 문구', () => {
    render(<Harness error="물건 종류를 선택해 주세요" />);
    expect(screen.getByRole('alert')).toHaveTextContent('! 물건 종류를 선택해 주세요');
  });
});
