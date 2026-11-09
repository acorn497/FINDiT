import { screen } from '@testing-library/react';
import { renderApp } from '../../test/render';
import { TEACHER } from '../../test/fixtures';
import { summary } from '../../test/foundFixtures';
import { HomePage } from './HomePage';

const CANDIDATE = {
  item: { ...summary({ id: 'f-wallet', title: '갈색 반지갑' }), color: '갈색', description: null, photos: [] },
  score: 0.9,
  matches: { category: true, place: true, date: true, color: true },
};

const SUMMARY = {
  myReports: [
    { kind: 'lost', id: 'lr1', title: '갈색 지갑·카드', category: 'WALLET_CARD', place: '본관 3층 복도', date: '2026-10-17', status: 'MATCHED', createdAt: '', thumbnail: null, candidateCount: 2 },
  ],
  newMatches: [{ lostReportId: 'lr1', lostReportTitle: '갈색 지갑·카드', candidate: CANDIDATE }],
  recentFound: [summary({ title: '초록 우산' }), summary({ title: '회색 후드집업' })],
  pendingClaims: null,
  isNewUser: false,
};

afterEach(() => vi.unstubAllGlobals());

describe('HomePage', () => {
  it('위에서부터 내 신고 진행 상태 → 새로 도착한 매칭 후보 → 최근 등록된 습득물, 각 묶음에 전체 보기', async () => {
    renderApp(<HomePage />, { api: { 'GET /home/summary': [200, SUMMARY] } });
    expect(await screen.findByText('이지우님, 안녕하세요')).toBeInTheDocument();
    const sections = screen.getAllByRole('region').map((s) => s.getAttribute('aria-label'));
    expect(sections).toEqual(['내 신고 진행 상태', '새로 도착한 매칭 후보', '최근 등록된 습득물']);
    expect(screen.getByRole('link', { name: '내 신고 진행 상태 전체 보기' })).toHaveAttribute('href', '/me/reports');
    expect(screen.getByRole('link', { name: '새로 도착한 매칭 후보 전체 보기' })).toHaveAttribute('href', '/matches?lostReportId=lr1');
    expect(screen.getByRole('link', { name: '최근 등록된 습득물 전체 보기' })).toHaveAttribute('href', '/found');
    expect(screen.getByText('후보 2개')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '최근 습득물 목록' }).children).toHaveLength(2);
    expect(screen.queryByText(/승인 대기/)).not.toBeInTheDocument();
  });

  it('신고가 하나도 없는 새 사용자에게는 시작 버튼 두 개', async () => {
    renderApp(<HomePage />, { api: { 'GET /home/summary': [200, { ...SUMMARY, myReports: [], newMatches: [], isNewUser: true }] } });
    expect(await screen.findByRole('link', { name: /분실 신고 작성/ })).toHaveAttribute('href', '/lost/new');
    expect(screen.getByRole('link', { name: /습득물 등록/ })).toHaveAttribute('href', '/found/new');
    expect(screen.queryByRole('region', { name: '내 신고 진행 상태' })).not.toBeInTheDocument();
  });

  it('교사에게는 승인 대기 건수 카드 → ⑩', async () => {
    renderApp(<HomePage />, {
      user: TEACHER,
      api: { 'GET /home/summary': [200, { ...SUMMARY, myReports: [], newMatches: [], isNewUser: true, pendingClaims: 1 }] },
    });
    expect(await screen.findByRole('link', { name: '승인 대기 1건 — 관리자 화면으로' })).toHaveAttribute('href', '/admin');
  });

  it('오류', async () => {
    renderApp(<HomePage />, { api: { 'GET /home/summary': [500, {}] } });
    expect(await screen.findByText('요약을 불러오지 못했습니다')).toBeInTheDocument();
  });
});
