import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/render';
import { MyReportsPage } from './MyReportsPage';

const LOST = {
  kind: 'lost',
  id: 'lr1',
  title: '갈색 지갑·카드',
  category: 'WALLET_CARD',
  place: '본관 3층 복도',
  date: '2026-10-17',
  status: 'MATCHED',
  createdAt: '2026-10-17T10:10:00Z',
  thumbnail: null,
  candidateCount: 2,
};
const FOUND = {
  kind: 'found',
  id: 'f1',
  title: '회색 후드집업',
  category: 'CLOTHING',
  place: '체육관 탈의실',
  date: '2026-10-15',
  status: 'KEEPING',
  createdAt: '2026-10-15T04:05:00Z',
  thumbnail: null,
  candidateCount: null,
};

afterEach(() => vi.unstubAllGlobals());

describe('MyReportsPage', () => {
  it('분실 신고·습득 등록을 한 목록으로, 구분 표시·상태 배지와 함께 (커서 더 보기)', async () => {
    renderApp(<MyReportsPage />, {
      api: {
        'GET /me/reports': (_b, url) =>
          url.searchParams.get('cursor') ? [200, { items: [FOUND], nextCursor: null }] : [200, { items: [LOST], nextCursor: 'c1' }],
      },
    });
    const lost = await screen.findByRole('article', { name: '분실 신고 갈색 지갑·카드' });
    expect(lost).toHaveTextContent('후보 있음');
    expect(screen.getByRole('link', { name: '갈색 지갑·카드' })).toHaveAttribute('href', '/matches?lostReportId=lr1');
    await userEvent.click(screen.getByRole('button', { name: '더 보기' }));
    expect(await screen.findByRole('article', { name: '습득 등록 회색 후드집업' })).toHaveTextContent('보관 중');
    expect(screen.getByRole('link', { name: '회색 후드집업' })).toHaveAttribute('href', '/found/f1');
    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('구분을 고르면 그 구분의 상태 칩이 나오고, 칩을 누르면 다시 받는다', async () => {
    const { api } = renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [200, { items: [LOST], nextCursor: null }] } });
    await screen.findByRole('article', { name: /갈색 지갑·카드/ });
    expect(screen.queryByRole('radiogroup', { name: '상태' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: '분실 신고' }));
    const lostChips = screen.getAllByRole('radio').filter((r) => r.closest('[aria-label="상태"]')).map((r) => r.textContent);
    expect(lostChips).toEqual(['전체', '찾는 중', '후보 있음', '마감']);
    await userEvent.click(screen.getByRole('radio', { name: '마감' }));
    await waitFor(() => expect(String(api.fetchMock.mock.calls.at(-1)![0])).toContain('kind=lost&status=CLOSED'));

    await userEvent.click(screen.getByRole('radio', { name: '습득 등록' }));
    const foundChips = screen.getAllByRole('radio').filter((r) => r.closest('[aria-label="상태"]')).map((r) => r.textContent);
    expect(foundChips).toEqual(['전체', '보관 중', '확인 중', '전달 완료', '기간 만료']);
    await waitFor(() => expect(String(api.fetchMock.mock.calls.at(-1)![0])).toMatch(/kind=found$/));
  });

  it('빈 결과·오류', async () => {
    const { unmount } = renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [200, { items: [], nextCursor: null }] } });
    expect(await screen.findByText('아직 올린 신고가 없습니다')).toBeInTheDocument();
    unmount();
    renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [500, {}] } });
    expect(await screen.findByText('목록을 불러오지 못했습니다')).toBeInTheDocument();
  });
});
