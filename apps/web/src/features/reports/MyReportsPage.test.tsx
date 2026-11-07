import { screen, waitFor, within } from '@testing-library/react';
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

  it('분실 신고에 새 후보 개수 배지 — 누르면 ⑥ 매칭 후보로', async () => {
    renderApp(<MyReportsPage />, {
      api: { 'GET /me/reports': [200, { items: [LOST, { ...LOST, id: 'lr2', title: '흰색 전자기기', candidateCount: 0 }, FOUND], nextCursor: null }] },
    });
    const badge = await screen.findByRole('link', { name: '새 후보 2개 보기' });
    expect(badge).toHaveTextContent('새 후보 2');
    expect(badge).toHaveAttribute('href', '/matches?lostReportId=lr1');
    expect(screen.getAllByRole('link', { name: /새 후보/ })).toHaveLength(1);
  });

  it('찾음 처리(마감) — 재확인 모달에서 확인해야 보내고, 배지가 마감으로 바뀐다', async () => {
    const { api } = renderApp(<MyReportsPage />, {
      api: {
        'GET /me/reports': [200, { items: [LOST], nextCursor: null }],
        'POST /lost-reports/lr1/close': [200, { ...LOST, status: 'CLOSED' }],
      },
    });
    const card = await screen.findByRole('article', { name: '분실 신고 갈색 지갑·카드' });
    await userEvent.click(within(card).getByRole('button', { name: '찾음 처리' }));
    const dialog = screen.getByRole('dialog', { name: '찾음 처리할까요?' });
    expect(dialog).toHaveTextContent('되돌릴 수 없습니다');
    await userEvent.click(within(dialog).getByRole('button', { name: '취소' }));
    expect(api.calls.some((c) => c.path === '/lost-reports/lr1/close')).toBe(false);

    await userEvent.click(within(card).getByRole('button', { name: '찾음 처리' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '찾음 처리' }));
    await waitFor(() => expect(within(card).getByText('마감')).toBeInTheDocument());
    expect(within(card).queryByRole('button', { name: '찾음 처리' })).not.toBeInTheDocument();
    expect(within(card).queryByRole('link', { name: '수정' })).not.toBeInTheDocument();
    expect(within(card).queryByRole('link', { name: /새 후보/ })).not.toBeInTheDocument();
  });

  it('삭제 — 재확인 후 목록에서 사라진다', async () => {
    renderApp(<MyReportsPage />, {
      api: {
        'GET /me/reports': [200, { items: [LOST, FOUND], nextCursor: null }],
        'DELETE /lost-reports/lr1': [200, { deleted: true }],
      },
    });
    const card = await screen.findByRole('article', { name: '분실 신고 갈색 지갑·카드' });
    expect(within(card).getByRole('link', { name: '수정' })).toHaveAttribute('href', '/lost/lr1/edit');
    await userEvent.click(within(card).getByRole('button', { name: '삭제' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: '이 분실 신고를 삭제할까요?' })).getByRole('button', { name: '삭제' }));
    await waitFor(() => expect(screen.queryByRole('article', { name: /갈색 지갑·카드/ })).not.toBeInTheDocument());
    expect(screen.getByRole('article', { name: '습득 등록 회색 후드집업' })).toBeInTheDocument();
  });

  it('습득 등록 항목에는 관리 버튼이 없다', async () => {
    renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [200, { items: [FOUND], nextCursor: null }] } });
    const card = await screen.findByRole('article', { name: '습득 등록 회색 후드집업' });
    expect(within(card).queryByRole('button')).not.toBeInTheDocument();
  });

  it('처리 실패는 문구로', async () => {
    renderApp(<MyReportsPage />, {
      api: {
        'GET /me/reports': [200, { items: [LOST], nextCursor: null }],
        'DELETE /lost-reports/lr1': [403, { code: 'FORBIDDEN', message: '내 신고만 볼 수 있고 고칠 수 있습니다' }],
      },
    });
    await userEvent.click(await screen.findByRole('button', { name: '삭제' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('내 신고만 볼 수 있고 고칠 수 있습니다');
    expect(screen.getByRole('article', { name: /갈색 지갑·카드/ })).toBeInTheDocument();
  });

  it('조건에 맞는 항목이 없으면 다른 안내', async () => {
    renderApp(<MyReportsPage />, {
      api: { 'GET /me/reports': (_b, url) => (url.searchParams.get('kind') ? [200, { items: [], nextCursor: null }] : [200, { items: [LOST], nextCursor: null }]) },
    });
    await screen.findByRole('article', { name: /갈색 지갑·카드/ });
    await userEvent.click(screen.getByRole('radio', { name: '습득 등록' }));
    expect(await screen.findByText('이 조건의 신고가 없습니다')).toBeInTheDocument();
  });

  it('빈 결과·오류', async () => {
    const { unmount } = renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [200, { items: [], nextCursor: null }] } });
    expect(await screen.findByText('아직 올린 신고가 없습니다')).toBeInTheDocument();
    unmount();
    renderApp(<MyReportsPage />, { api: { 'GET /me/reports': [500, {}] } });
    expect(await screen.findByText('목록을 불러오지 못했습니다')).toBeInTheDocument();
  });
});
