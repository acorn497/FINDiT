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
  </Routes>
);

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

  it('로딩 → 빈 결과', async () => {
    renderApp(tree, { route: '/matches?lostReportId=lr1', api: { 'GET /matches': [200, { lostReport: LOST, candidates: [] }] } });
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(await screen.findByText('아직 비슷한 습득물이 없습니다')).toBeInTheDocument();
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
