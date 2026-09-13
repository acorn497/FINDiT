import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AppBar } from './AppBar';

function setup(bar: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/prev', '/here']} initialIndex={1}>
      <Routes>
        <Route path="/prev" element={<p>이전 화면</p>} />
        <Route path="/target" element={<p>지정 화면</p>} />
        <Route path="/here" element={bar} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AppBar', () => {
  it('제목과 보조 버튼을 보여 준다', () => {
    setup(<AppBar title="습득물 상세" actions={<button type="button">더 보기</button>} />);
    expect(screen.getByRole('heading', { name: '습득물 상세' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '뒤로 가기' })).not.toBeInTheDocument();
  });

  it('back=true 면 브라우저 뒤로 이동', async () => {
    setup(<AppBar title="상세" back />);
    await userEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(screen.getByText('이전 화면')).toBeInTheDocument();
  });

  it('back 이 경로면 그 경로로 이동', async () => {
    setup(<AppBar title="상세" back="/target" />);
    await userEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(screen.getByText('지정 화면')).toBeInTheDocument();
  });

  it('onBack 이 있으면 그것을 먼저 부른다', async () => {
    const onBack = vi.fn();
    setup(<AppBar title="상세" back onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
