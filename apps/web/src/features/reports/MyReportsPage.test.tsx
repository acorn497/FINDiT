import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/render';
import { MyReportsPage } from './MyReportsPage';

const LOST = { kind: 'lost', id: 'lr1', title: '갈색 지갑·카드', category: 'WALLET_CARD', place: '본관 3층 복도', date: '2026-10-17', status: 'MATCHED', createdAt: '2026-10-17T10:10:00Z', thumbnail: null, candidateCount: null };
const FOUND = { kind: 'found', id: 'f1', title: '회색 후드집업', category: 'CLOTHING', place: '체육관 탈의실', date: '2026-10-15', status: 'KEEPING', createdAt: '2026-10-15T04:05:00Z', thumbnail: null, candidateCount: null };

afterEach(() => vi.unstubAllGlobals());

describe('MyReportsPage (스캐폴드)', () => {
  it('분실 신고·습득 등록을 한 목록으로, 상태 배지와 함께', async () => {
    renderApp(<MyReportsPage />, {
      route: '/me/reports',
      api: {
        'GET /me/reports': (_b, url) =>
          url.searchParams.get('cursor') ? [200, { items: [FOUND], nextCursor: null }] : [200, { items: [LOST], nextCursor: 'c1' }],
      },
    });
    expect(await screen.findByText('갈색 지갑·카드')).toBeInTheDocument();
    expect(screen.getByText('후보 있음')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /갈색 지갑·카드/ })).toHaveAttribute('href', '/matches?lostReportId=lr1');
    await userEvent.click(screen.getByRole('button', { name: '더 보기' }));
    expect(await screen.findByText('회색 후드집업')).toBeInTheDocument();
    expect(screen.getByText('보관 중')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
    expect(screen.getByText('상세 관리 기능은 준비 중입니다')).toBeInTheDocument();
  });

  it('빈 결과·오류', async () => {
    const { unmount } = renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [200, { items: [], nextCursor: null }] } });
    expect(await screen.findByText('아직 올린 신고가 없습니다')).toBeInTheDocument();
    unmount();
    renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [500, {}] } });
    expect(await screen.findByText('목록을 불러오지 못했습니다')).toBeInTheDocument();
  });
});
