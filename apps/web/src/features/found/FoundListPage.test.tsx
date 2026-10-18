import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/render';
import { summary } from '../../test/foundFixtures';
import { FoundListPage } from './FoundListPage';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const page = (items: ReturnType<typeof summary>[], nextCursor: string | null, total: number) => [200, { items, nextCursor, total }] as [number, unknown];

describe('FoundListPage', () => {
  it('2열 카드에 사진·배지·이름·보관 장소·등록일, 건수 문구', async () => {
    renderApp(<FoundListPage />, {
      api: {
        'GET /found-items': page(
          [summary({ title: '갈색 반지갑', status: 'KEEPING', thumbnail: { id: 'p', url: '/api/uploads/p.jpg', width: 1, height: 1 } }), summary({ title: '무선 이어폰', status: 'CHECKING', keptAt: '2학년 교무실' })],
          null,
          2,
        ),
      },
    });
    expect(await screen.findByText('갈색 반지갑')).toBeInTheDocument();
    expect(screen.getByText('확인 중')).toHaveClass('bg-st-check');
    expect(screen.getByText('2학년 교무실')).toBeInTheDocument();
    expect(screen.getAllByText('10월 17일 등록')).toHaveLength(2);
    expect(screen.getByText(/보관 중인 물건/)).toHaveTextContent('보관 중인 물건 2건');
    expect(screen.getByRole('link', { name: /갈색 반지갑/ })).toHaveAttribute('href', expect.stringMatching(/^\/found\/f\d+$/));
    expect(screen.queryByRole('button', { name: /더 보기/ })).not.toBeInTheDocument();
  });

  it('필터 칩을 누르면 색이 바뀌고 그 종류로 다시 받는다', async () => {
    const { api } = renderApp(<FoundListPage />, { api: { 'GET /found-items': page([summary()], null, 1) } });
    await screen.findByText(/보관 중인 물건/);
    await userEvent.click(screen.getByRole('radio', { name: '전자기기' }));
    expect(screen.getByRole('radio', { name: '전자기기' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: '전체' })).toHaveAttribute('aria-checked', 'false');
    await waitFor(() => expect(api.calls.at(-1)?.path).toBe('/found-items'));
    const url = api.fetchMock.mock.calls.at(-1)![0] as string;
    expect(url).toContain('category=ELECTRONICS');
  });

  it('검색은 입력이 멈추고 300ms 뒤에 한 번만 요청한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    const { api } = renderApp(<FoundListPage />, { api: { 'GET /found-items': page([summary()], null, 1) } });
    await act(() => vi.advanceTimersByTimeAsync(0));
    const before = api.fetchMock.mock.calls.filter(([u]) => String(u).startsWith('/api/found-items')).length;

    const input = screen.getByRole('searchbox', { name: '검색' });
    fireEvent.change(input, { target: { value: '갈' } });
    await act(() => vi.advanceTimersByTimeAsync(100));
    fireEvent.change(input, { target: { value: '갈색' } });
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(api.fetchMock.mock.calls.filter(([u]) => String(u).startsWith('/api/found-items')).length).toBe(before);

    await act(() => vi.advanceTimersByTimeAsync(1));
    const after = api.fetchMock.mock.calls.filter(([u]) => String(u).startsWith('/api/found-items'));
    expect(after.length).toBe(before + 1);
    expect(String(after.at(-1)![0])).toContain(`keyword=${encodeURIComponent('갈색')}`);
  });

  it('[더 보기]는 nextCursor 로 다음 6건을 이어 붙이고, 마지막이면 숨는다', async () => {
    const first = Array.from({ length: 6 }, (_, i) => summary({ title: `첫 페이지 ${i}` }));
    const second = [summary({ title: '둘째 페이지 0' })];
    renderApp(<FoundListPage />, {
      api: { 'GET /found-items': (_b, url) => (url.searchParams.get('cursor') === 'c1' ? page(second, null, 7) : page(first, 'c1', 7)) },
    });
    const more = await screen.findByRole('button', { name: '더 보기 (7건 중 6건)' });
    await userEvent.click(more);
    expect(await screen.findByText('둘째 페이지 0')).toBeInTheDocument();
    expect(screen.getByText('첫 페이지 0')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.queryByRole('button', { name: /더 보기/ })).not.toBeInTheDocument();
  });

  it('결과가 없으면 [필터 지우기] — 누르면 전체로 돌아간다', async () => {
    const { api } = renderApp(<FoundListPage />, {
      api: { 'GET /found-items': (_b, url) => (url.searchParams.get('category') ? page([], null, 0) : page([summary({ title: '전체 결과' })], null, 1)) },
    });
    await screen.findByText('전체 결과');
    await userEvent.click(screen.getByRole('radio', { name: '문구' }));
    expect(await screen.findByText('조건에 맞는 습득물이 없습니다')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '필터 지우기' }));
    expect(await screen.findByText('전체 결과')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '전체' })).toHaveAttribute('aria-checked', 'true');
    expect(api.calls.length).toBeGreaterThan(2);
  });

  it('실패하면 오류 화면 — [다시 시도]로 다시 받는다', async () => {
    let fail = true;
    renderApp(<FoundListPage />, {
      api: { 'GET /found-items': () => (fail ? [500, { code: 'INTERNAL_ERROR', message: 'x' }] : page([summary({ title: '복구됨' })], null, 1)) },
    });
    expect(await screen.findByText('목록을 불러오지 못했습니다')).toBeInTheDocument();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(await screen.findByText('복구됨')).toBeInTheDocument();
  });

  it('조건이 바뀐 뒤 늦게 도착한 이전 응답은 버린다', async () => {
    let releaseOld: (() => void) | undefined;
    renderApp(<FoundListPage />, {
      api: {
        'GET /found-items': (_b, url) => {
          if (url.searchParams.get('category') === 'ELECTRONICS') return page([summary({ title: '전자기기 결과' })], null, 1);
          return new Promise((resolve) => {
            releaseOld = () => resolve(page([summary({ title: '늦은 전체 결과' })], null, 1));
          });
        },
      },
    });
    await userEvent.click(screen.getByRole('radio', { name: '전자기기' }));
    expect(await screen.findByText('전자기기 결과')).toBeInTheDocument();
    await act(async () => releaseOld?.());
    expect(screen.queryByText('늦은 전체 결과')).not.toBeInTheDocument();
  });
});
