import { render, screen } from '@testing-library/react';
import { FOUND_STATUS_CLASS, FoundStatusBadge, LostStatusBadge } from './StatusBadge';

describe('상태 배지', () => {
  it.each([
    ['KEEPING', '보관 중', 'bg-st-keep'],
    ['CHECKING', '확인 중', 'bg-st-check'],
    ['DONE', '전달 완료', 'bg-st-done'],
    ['EXPIRED', '기간 만료', 'bg-st-expire'],
  ] as const)('%s → "%s" · %s', (status, label, cls) => {
    render(<FoundStatusBadge status={status} />);
    const badge = screen.getByText(label);
    expect(badge).toHaveClass(cls);
    expect(FOUND_STATUS_CLASS[status]).toBe(cls);
  });

  it('분실 신고 상태 라벨', () => {
    render(
      <>
        <LostStatusBadge status="OPEN" />
        <LostStatusBadge status="MATCHED" />
        <LostStatusBadge status="CLOSED" />
      </>,
    );
    expect(screen.getByText('찾는 중')).toHaveClass('bg-accent');
    expect(screen.getByText('후보 있음')).toHaveClass('bg-st-check');
    expect(screen.getByText('마감')).toHaveClass('bg-st-expire');
  });
});
