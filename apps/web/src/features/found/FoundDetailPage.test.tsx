import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderApp } from '../../test/render';
import { detail } from '../../test/foundFixtures';
import { FoundDetailPage } from './FoundDetailPage';

const tree = (
  <Routes>
    <Route path="/found/:id" element={<FoundDetailPage />} />
    <Route path="/found" element={<p>목록 화면</p>} />
  </Routes>
);

afterEach(() => vi.unstubAllGlobals());

describe('FoundDetailPage', () => {
  it('정보 목록은 왼쪽 항목명 / 오른쪽 값, 사진 1 / 2', async () => {
    renderApp(tree, { route: '/found/f-wallet', api: { 'GET /found-items/f-wallet': [200, detail()] } });
    expect(await screen.findByRole('heading', { name: '갈색 반지갑' })).toBeInTheDocument();
    expect(screen.getByText('지갑·카드 · 본관 3층 복도에서 습득')).toBeInTheDocument();
    const rows = within(screen.getAllByRole('term')[0].closest('dl')!)
      .getAllByRole('term')
      .map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]);
    expect(rows).toEqual([
      ['보관 장소', '본관 1층 행정실'],
      ['주운 날짜', '2026년 10월 17일'],
      ['등록 시각', '10월 17일 16:24'],
      ['특징', '모서리 긁힘, 단추 잠금'],
    ]);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음 사진' }));
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '갈색 반지갑 사진 2' })).toHaveAttribute('src', '/api/uploads/p2.jpg');
    await userEvent.click(screen.getByRole('button', { name: '이전 사진' }));
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('목록에서 넘어오면 받은 이름·사진으로 먼저 그린다 (빈 화면 없음)', async () => {
    const item = {
      id: 'f-wallet',
      title: '갈색 반지갑',
      category: 'WALLET_CARD',
      keptAt: '본관 1층 행정실',
      foundPlace: '본관 3층 복도',
      foundDate: '2026-10-17',
      status: 'KEEPING',
      createdAt: '2026-10-17T07:24:00.000Z',
      thumbnail: { id: 'p1', url: '/api/uploads/p1.jpg', width: 800, height: 800 },
    };
    renderApp(tree, {
      route: { pathname: '/found/f-wallet', state: { item } },
      api: { 'GET /found-items/f-wallet': new Promise(() => undefined) },
    });
    expect(await screen.findByRole('heading', { name: '갈색 반지갑' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '갈색 반지갑 사진 1' })).toHaveAttribute('src', '/api/uploads/p1.jpg');
    expect(screen.getByText('본관 1층 행정실')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내 물건인 것 같아요' })).toBeDisabled();
  });

  it('신청하면 배지가 확인 중으로 바뀌고 버튼이 [신청 취소]가 된다 — 취소하면 되돌아온다', async () => {
    renderApp(tree, {
      route: '/found/f-wallet',
      api: {
        'GET /found-items/f-wallet': [200, detail()],
        'POST /found-items/f-wallet/claims': [201, detail({ status: 'CHECKING', canClaim: false, myClaim: { id: 'c1', status: 'PENDING', rejectReason: null, createdAt: '' } })],
        'DELETE /found-items/f-wallet/claims': [200, detail({ status: 'KEEPING', myClaim: { id: 'c1', status: 'CANCELLED', rejectReason: null, createdAt: '' } })],
      },
    });
    expect(await screen.findByText('보관 중')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '내 물건인 것 같아요' }));
    expect(await screen.findByText('확인 중')).toHaveClass('bg-st-check');
    await userEvent.click(screen.getByRole('button', { name: '신청 취소' }));
    expect(await screen.findByText('보관 중')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내 물건인 것 같아요' })).toBeEnabled();
  });

  it('전달 완료 물건은 버튼을 막고 이유를 문구로', async () => {
    renderApp(tree, {
      route: '/found/f-wallet',
      api: { 'GET /found-items/f-wallet': [200, detail({ status: 'DONE', canClaim: false, claimBlockedReason: '이미 주인에게 전달된 물건입니다' })] },
    });
    expect(await screen.findByText('이미 주인에게 전달된 물건입니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '내 물건인 것 같아요' })).toBeDisabled();
    expect(screen.getByText('전달 완료')).toBeInTheDocument();
  });

  it('신청 실패(409)는 문구로', async () => {
    renderApp(tree, {
      route: '/found/f-wallet',
      api: {
        'GET /found-items/f-wallet': [200, detail()],
        'POST /found-items/f-wallet/claims': [409, { code: 'CONFLICT', message: '이미 주인에게 전달된 물건입니다' }],
      },
    });
    await userEvent.click(await screen.findByRole('button', { name: '내 물건인 것 같아요' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 주인에게 전달된 물건입니다');
  });

  it('거절된 지난 신청은 사유를 보여 준다', async () => {
    renderApp(tree, {
      route: '/found/f-wallet',
      api: { 'GET /found-items/f-wallet': [200, detail({ myClaim: { id: 'c1', status: 'REJECTED', rejectReason: '본인 확인 불가', createdAt: '' } })] },
    });
    expect(await screen.findByText(/지난 신청이 거절되었습니다 — 본인 확인 불가/)).toBeInTheDocument();
  });

  it('없는 물건은 404 안내 → 목록으로', async () => {
    renderApp(tree, { route: '/found/nope', api: { 'GET /found-items/nope': [404, { code: 'NOT_FOUND', message: '습득물을 찾을 수 없습니다' }] } });
    expect(await screen.findByText('습득물을 찾을 수 없습니다')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '목록으로' }));
    expect(screen.getByText('목록 화면')).toBeInTheDocument();
  });

  it('그 밖의 오류', async () => {
    renderApp(tree, { route: '/found/f-wallet', api: { 'GET /found-items/f-wallet': [500, {}] } });
    expect(await screen.findByText('상세 정보를 불러오지 못했습니다')).toBeInTheDocument();
  });
});

describe('FoundDetailPage — 넓은 화면', () => {
  it('≥768px 에서는 신청 버튼을 하단 고정 대신 정보 열 바로 아래에 둔다', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    renderApp(tree, { route: '/found/f-wallet', api: { 'GET /found-items/f-wallet': [200, detail()] } });
    const button = await screen.findByRole('button', { name: '내 물건인 것 같아요' });
    expect(button.closest('article')).not.toBeNull();
    expect(button.closest('.fixed')).toBeNull();
  });
});
