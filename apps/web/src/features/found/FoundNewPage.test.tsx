import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderApp } from '../../test/render';
import { FoundNewPage } from './FoundNewPage';

function setup(created: [number, unknown] = [201, { id: 'f1' }]) {
  return renderApp(
    <Routes>
      <Route path="/found/new" element={<FoundNewPage />} />
      <Route path="/" element={<p>홈 화면</p>} />
    </Routes>,
    { route: '/found/new', api: { 'POST /found-items': created } },
  );
}

const image = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

beforeAll(() => {
  URL.createObjectURL = vi.fn((f: Blob) => `blob:${(f as File).name}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

describe('FoundNewPage', () => {
  it('단계를 나누지 않은 한 화면에 네 항목과 개인정보 안내가 있다', () => {
    setup();
    expect(screen.getByText(/사진/)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: '물건 종류' })).toBeInTheDocument();
    expect(screen.getByLabelText('맡긴 장소')).toBeInTheDocument();
    expect(screen.getByLabelText('주운 날짜')).toBeInTheDocument();
    expect(screen.getByText(/개인정보가 보이는 물건은/)).toBeInTheDocument();
    expect(screen.queryByText(/단계/)).not.toBeInTheDocument();
  });

  it('사진은 최대 3장 — 썸네일·× 삭제·[+ 추가]', async () => {
    setup();
    await userEvent.upload(screen.getByLabelText('사진 추가'), [image('a.jpg'), image('b.jpg')]);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    await userEvent.upload(screen.getByLabelText('사진 추가'), [image('c.jpg'), image('d.jpg')]);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.queryByLabelText('사진 추가')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '사진 2 삭제' }));
    expect(screen.getAllByRole('img').map((i) => i.getAttribute('src'))).toEqual(['blob:a.jpg', 'blob:c.jpg']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:b.jpg');
    expect(screen.getByLabelText('사진 추가')).toBeInTheDocument();
  });

  it('[등록하기]는 비어 있는 칸의 오류를 한 번에 드러낸다', async () => {
    const { api } = setup();
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent);
    expect(alerts).toEqual(['! 물건 종류를 선택해 주세요', '! 맡긴 장소를 입력해 주세요']);
    expect(api.calls.some((c) => c.path === '/found-items')).toBe(false);
  });

  it('선택 항목을 펼쳐 이름까지 적어 등록한다', async () => {
    const { api } = setup();
    await userEvent.click(screen.getByRole('radio', { name: '지갑·카드' }));
    await userEvent.type(screen.getByLabelText('맡긴 장소'), '본관 1층 행정실');
    await userEvent.clear(screen.getByLabelText('주운 날짜'));
    await userEvent.type(screen.getByLabelText('주운 날짜'), '2026-09-26');
    await userEvent.click(screen.getByRole('button', { name: /물건 정보 더 적기/ }));
    await userEvent.type(screen.getByLabelText('물건 이름'), '갈색 반지갑');
    await userEvent.type(screen.getByLabelText('색상'), '갈색');
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));

    expect(await screen.findByText('습득물이 등록되었습니다')).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === '/found-items')?.body).toEqual({
      category: 'WALLET_CARD',
      keptAt: '본관 1층 행정실',
      foundDate: '2026-09-26',
      title: '갈색 반지갑',
      color: '갈색',
      photoIds: [],
    });
  });

  it('선택 항목에 오류가 있으면 접힌 영역을 펼쳐 보여 준다', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /물건 정보 더 적기/ }));
    await userEvent.type(screen.getByLabelText('색상'), 'x'.repeat(21));
    await userEvent.click(screen.getByRole('button', { name: /물건 정보 더 적기/ }));
    expect(screen.queryByLabelText('색상')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    expect(screen.getByLabelText('색상')).toBeInTheDocument();
    expect(screen.getByText('! 색상은 20자 이하로 입력해 주세요')).toBeInTheDocument();
  });

  it('서버 오류는 문구로', async () => {
    setup([500, { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' }]);
    await userEvent.click(screen.getByRole('radio', { name: '문구' }));
    await userEvent.type(screen.getByLabelText('맡긴 장소'), '행정실');
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다');
  });
});
