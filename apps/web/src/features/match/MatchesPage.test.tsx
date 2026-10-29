import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderApp } from '../../test/render';
import { MatchesPage } from './MatchesPage';

const LOST = { id: 'lr1', category: 'WALLET_CARD', lostPlace: '본관 3층 복도', lostDate: '2026-10-17', timeSlot: 'LUNCH', color: '갈색', description: '모서리 긁힘', status: 'MATCHED', reporterId: 'u1', createdAt: '' };
const CANDIDATE = {
  item: { id: 'f1', title: '갈색 반지갑', category: 'WALLET_CARD', keptAt: '본관 1층 행정실', foundPlace: '본관 3층 복도', foundDate: '2026-10-17', status: 'KEEPING', createdAt: '2026-10-17T07:24:00Z', thumbnail: null, color: '갈색', description: null, photos: [] },
  score: 0.87,
  matches: { category: true, place: true, date: true, color: true },
};

const tree = (
  <Routes>
    <Route path="/matches" element={<MatchesPage />} />
    <Route path="/found/:id" element={<p>습득물 상세 화면</p>} />
  </Routes>
);

const SECOND = {
  ...CANDIDATE,
  item: { ...CANDIDATE.item, id: 'f2', title: '갈색 카드지갑', foundPlace: '본관 2층 복도', foundDate: '2026-09-11', photos: [{ id: 'p', url: '/api/uploads/p.jpg', width: 1, height: 1 }] },
  score: 0.58,
  matches: { category: true, place: false, date: false, color: true },
};

afterEach(() => vi.unstubAllGlobals());

describe('MatchesPage', () => {
  it('내 분실 신고를 위에 고정하고 후보를 하나씩 넘겨 본다', async () => {
    const second = { ...CANDIDATE, item: { ...CANDIDATE.item, id: 'f2', title: '갈색 카드지갑' }, score: 0.58 };
    renderApp(tree, { route: '/matches?lostReportId=lr1', api: { 'GET /matches': [200, { lostReport: LOST, candidates: [CANDIDATE, second] }] } });
    expect(await screen.findByLabelText('내 분실 신고')).toHaveTextContent('갈색 지갑·카드');
    expect(screen.getByRole('article', { name: '후보 갈색 반지갑' })).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '후보 1 / 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '다음 후보' }));
    expect(screen.getByRole('article', { name: '후보 갈색 카드지갑' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 후보' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: '이전 후보' }));
    expect(screen.getByRole('article', { name: '후보 갈색 반지갑' })).toBeInTheDocument();
  });

  it('항목별 일치/불일치 표시와 유사도 막대 폭이 score 에 비례', async () => {
    renderApp(tree, { route: '/matches?lostReportId=lr1', api: { 'GET /matches': [200, { lostReport: LOST, candidates: [CANDIDATE, SECOND] }] } });
    const meter = await screen.findByRole('meter', { name: '유사한 정도' });
    expect(meter).toHaveAttribute('aria-valuenow', '87');
    expect((meter.firstElementChild as HTMLElement).style.width).toBe('87%');
    expect(screen.getAllByLabelText('일치')).toHaveLength(4);

    await userEvent.click(screen.getByRole('button', { name: '다음 후보' }));
    expect(screen.getByRole('meter', { name: '유사한 정도' })).toHaveAttribute('aria-valuenow', '58');
    expect(screen.getAllByLabelText('일치')).toHaveLength(2);
    expect(screen.getAllByLabelText('다름')).toHaveLength(2);
    expect(screen.getByRole('img', { name: '갈색 카드지갑 사진 1' })).toBeInTheDocument();
    expect(screen.getByText(/자동으로 판단하지 않습니다/)).toBeInTheDocument();
  });

  it('[이 후보 아님] 후 목록에서 사라지고, 마지막 후보까지 빼면 0건 안내', async () => {
    const { api } = renderApp(tree, {
      route: '/matches?lostReportId=lr1',
      api: { 'GET /matches': [200, { lostReport: LOST, candidates: [CANDIDATE, SECOND] }], 'POST /matches/exclusions': [201, { excluded: true }] },
    });
    await screen.findByRole('article', { name: '후보 갈색 반지갑' });
    await userEvent.click(screen.getByRole('button', { name: '이 후보 아님' }));
    expect(await screen.findByRole('article', { name: '후보 갈색 카드지갑' })).toBeInTheDocument();
    expect(screen.queryByRole('article', { name: '후보 갈색 반지갑' })).not.toBeInTheDocument();
    expect(api.calls.find((c) => c.path === '/matches/exclusions')?.body).toEqual({ lostReportId: 'lr1', foundItemId: 'f1' });

    await userEvent.click(screen.getByRole('button', { name: '이 후보 아님' }));
    expect(await screen.findByText('아직 비슷한 습득물이 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '습득물 목록 보기' })).toHaveAttribute('href', '/found');
  });

  it('제외 실패는 문구로 알리고 후보는 그대로', async () => {
    renderApp(tree, {
      route: '/matches?lostReportId=lr1',
      api: { 'GET /matches': [200, { lostReport: LOST, candidates: [CANDIDATE] }], 'POST /matches/exclusions': [500, { code: 'X', message: '잠시 후 다시 시도해 주세요' }] },
    });
    await userEvent.click(await screen.findByRole('button', { name: '이 후보 아님' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('잠시 후 다시 시도해 주세요');
    expect(screen.getByRole('article', { name: '후보 갈색 반지갑' })).toBeInTheDocument();
  });

  it('[내 물건인 것 같아요] — 수령 신청 후 그 물건의 상세로', async () => {
    const { api } = renderApp(tree, {
      route: '/matches?lostReportId=lr1',
      api: { 'GET /matches': [200, { lostReport: LOST, candidates: [CANDIDATE] }], 'POST /found-items/f1/claims': [201, {}] },
    });
    await userEvent.click(await screen.findByRole('button', { name: '내 물건인 것 같아요' }));
    expect(await screen.findByText('습득물 상세 화면')).toBeInTheDocument();
    expect(api.calls.some((c) => c.method === 'POST' && c.path === '/found-items/f1/claims')).toBe(true);
  });

  it('수령 신청 실패(409)는 문구로', async () => {
    renderApp(tree, {
      route: '/matches?lostReportId=lr1',
      api: { 'GET /matches': [200, { lostReport: LOST, candidates: [CANDIDATE] }], 'POST /found-items/f1/claims': [409, { code: 'CONFLICT', message: '이미 수령 신청한 물건입니다' }] },
    });
    await userEvent.click(await screen.findByRole('button', { name: '내 물건인 것 같아요' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 수령 신청한 물건입니다');
  });

  it('로딩 → 빈 결과', async () => {
    renderApp(tree, { route: '/matches?lostReportId=lr1', api: { 'GET /matches': [200, { lostReport: LOST, candidates: [] }] } });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('아직 비슷한 습득물이 없습니다')).toBeInTheDocument();
    expect(screen.getByLabelText('내 분실 신고')).toHaveTextContent('본관 3층 복도 · 2026년 10월 17일 · 점심시간');
  });

  it('오류', async () => {
    renderApp(tree, { route: '/matches?lostReportId=lr1', api: { 'GET /matches': [500, { code: 'X', message: 'x' }] } });
    expect(await screen.findByText('후보를 불러오지 못했습니다')).toBeInTheDocument();
  });

  it('신고를 고르지 않았으면 내 신고 관리로 안내', async () => {
    renderApp(tree, { route: '/matches' });
    expect(await screen.findByRole('link', { name: '내 신고 관리로' })).toHaveAttribute('href', '/me/reports');
  });
});
