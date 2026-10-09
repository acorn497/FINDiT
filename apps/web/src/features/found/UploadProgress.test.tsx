import { render, screen } from '@testing-library/react';
import { UploadProgress } from './UploadProgress';

describe('UploadProgress', () => {
  it('사진이 없으면 그리지 않는다', () => {
    const { container } = render(<UploadProgress current={null} total={0} failed={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('진행 중 — 좌 "업로드 중... 2장 중 2번째" / 우 "62%"', () => {
    render(<UploadProgress current={{ index: 2, total: 2, progress: 62 }} total={2} failed={0} />);
    expect(screen.getByText('업로드 중... 2장 중 2번째')).toBeInTheDocument();
    expect(screen.getByText('62%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '사진 업로드' })).toHaveAttribute('aria-valuenow', '62');
  });

  it('실패가 남아 있으면 그 수를 알린다', () => {
    render(<UploadProgress current={null} total={3} failed={1} />);
    expect(screen.getByText('1장을 올리지 못했습니다')).toBeInTheDocument();
  });

  it('모두 끝나면 완료', () => {
    render(<UploadProgress current={null} total={3} failed={0} />);
    expect(screen.getByText('업로드 완료 · 3장')).toBeInTheDocument();
  });
});
