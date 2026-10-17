import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { renderApp } from '../../test/render';
import { MatchesPage } from './MatchesPage';

const LOST = { id: 'lr1', category: 'WALLET_CARD', lostPlace: '본관 3층 복도', lostDate: '2026-10-17', color: '갈색', status: 'MATCHED' };
const CANDIDATE = {
  item: { id: 'f1', title: '갈색 반지갑', category: 'WALLET_CARD', keptAt: '본관 1층 행정실', foundPlace: '본관 3층 복도', foundDate: '2026-10-17', status: 'KEEPING', createdAt: '2026-10-17T07:24:00Z', thumbnail: null, color: '갈색', description: null },
  score: 0.87,
  matches: { category: true, place: true, date: true, color: true },
};

const tree = (
  <Routes>
    <Route path="/matches" element={<MatchesPage />} />
  </Routes>
);

afterEach(() => vi.unstubAllGlobals());

describe('MatchesPage (스캐폴드)', () => {
  it('후보를 세로 목록으로 보여 주고 준비 중 안내를 둔다', async () => {
    renderApp(tree, { route: '/matches?lostReportId=lr1', api: { 'GET /matches': [200, { lostReport: LOST, candidates: [CANDIDATE] }] } });
    expect(await screen.findByText('갈색 반지갑')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /갈색 반지갑/ })).toHaveAttribute('href', '/found/f1');
    expect(screen.getByText('상세 비교 화면은 준비 중입니다')).toBeInTheDocument();
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
