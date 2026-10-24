import { render, screen } from '@testing-library/react';
import { SimilarityBar } from './SimilarityBar';

describe('SimilarityBar', () => {
  it.each([
    [0.87, 87],
    [0.355, 36],
    [1.2, 100],
    [-1, 0],
  ])('score %s → 막대 폭 %s%%', (score, percent) => {
    render(<SimilarityBar score={score} />);
    const meter = screen.getByRole('meter', { name: '유사한 정도' });
    expect(meter).toHaveAttribute('aria-valuenow', String(percent));
    expect((meter.firstElementChild as HTMLElement).style.width).toBe(`${percent}%`);
    expect(screen.getByText(`${percent}%`)).toBeInTheDocument();
  });
});
