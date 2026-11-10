import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { summary } from '../../test/foundFixtures';
import { TEACHER } from '../../test/fixtures';
import { renderApp } from '../../test/render';
import { AdminPage } from './AdminPage';
import { expiryLabel } from './KeepingTab';

const claim = (id: string, name: string, grade = 2, classNo = 2) => ({
  id,
  claimant: { id: `u-${id}`, name, email: `${id}@gbsw.hs.kr`, grade, classNo },
  createdAt: '2026-11-10T09:00:00.000Z',
});

const GROUPS = [
  { item: summary({ id: 'f-ear', title: '무선 이어폰', status: 'CHECKING', keptAt: '2학년 교무실' }), claims: [claim('c1', '이지우')] },
  { item: summary({ id: 'f-umb', title: '초록 우산', status: 'CHECKING' }), claims: [claim('c2', '박서준', 2, 1), claim('c3', '김하늘', 2, 9)] },
];

const STATS = {
  period: 'week',
  buckets: [
    { label: '11월 1주', from: 'a', to: 'b', lostReports: 1, foundItems: 3, delivered: 0, expired: 0 },
    { label: '11월 2주', from: 'c', to: 'd', lostReports: 2, foundItems: 0, delivered: 1, expired: 1 },
  ],
  current: { KEEPING: 10, CHECKING: 2, DONE: 4, EXPIRED: 5 },
  pendingClaims: 3,
};

afterEach(() => vi.unstubAllGlobals());

describe('AdminPage — 승인 대기', () => {
  it('신청을 물건별로 묶어 보여 주고, 여러 건이면 자동 거절을 미리 알린다', async () => {
    renderApp(<AdminPage />, { user: TEACHER, api: { 'GET /admin/claims': [200, GROUPS] } });
    const umbrella = await screen.findByRole('article', { name: '초록 우산 신청 2건' });
    expect(within(umbrella).getByText('신청 2건 — 하나를 승인하면 나머지 1건은 자동 거절됩니다')).toBeInTheDocument();
    expect(within(umbrella).getByText('박서준 (2학년 1반)')).toBeInTheDocument();
    expect(screen.getByRole('article', { name: '무선 이어폰 신청 1건' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '승인 대기' })).toHaveAttribute('aria-selected', 'true');
  });

  it('승인은 재확인 후 보내고, 목록을 다시 받는다', async () => {
    let approved = false;
    const { api } = renderApp(<AdminPage />, {
      user: TEACHER,
      api: {
        'GET /admin/claims': () => [200, approved ? [GROUPS[0]] : GROUPS],
        'POST /admin/claims/c2/approve': () => {
          approved = true;
          return [200, { approved: 'c2', rejected: ['c3'] }];
        },
      },
    });
    await userEvent.click(await screen.findByRole('button', { name: '박서준 신청 승인' }));
    const dialog = screen.getByRole('dialog', { name: '수령 신청을 승인할까요?' });
    expect(dialog).toHaveTextContent('나머지 1건은 자동 거절됩니다');
    await userEvent.click(within(dialog).getByRole('button', { name: '승인' }));
    expect(await screen.findByText('승인했습니다. 나머지 신청 1건은 자동 거절되었습니다')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('article', { name: /초록 우산/ })).not.toBeInTheDocument());
    expect(api.calls.some((c) => c.path === '/admin/claims/c2/approve')).toBe(true);
  });

  it('거절은 사유가 있어야 보낸다', async () => {
    const { api } = renderApp(<AdminPage />, {
      user: TEACHER,
      api: { 'GET /admin/claims': [200, GROUPS], 'POST /admin/claims/c1/reject': [200, { rejected: 'c1' }] },
    });
    await userEvent.click(await screen.findByRole('button', { name: '이지우 신청 거절' }));
    const dialog = screen.getByRole('dialog', { name: '수령 신청 거절' });
    await userEvent.click(within(dialog).getByRole('button', { name: '거절하기' }));
    expect(within(dialog).getByText('! 거절 사유를 입력해 주세요')).toBeInTheDocument();
    expect(api.calls.some((c) => c.path === '/admin/claims/c1/reject')).toBe(false);
    await userEvent.type(within(dialog).getByLabelText('거절 사유'), '케이스 색이 다릅니다');
    await userEvent.click(within(dialog).getByRole('button', { name: '거절하기' }));
    expect(await screen.findByText('거절했습니다. 학생에게 사유를 알렸습니다')).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === '/admin/claims/c1/reject')?.body).toEqual({ reason: '케이스 색이 다릅니다' });
  });

  it('처리 실패(409)는 토스트로, 비어 있으면 안내', async () => {
    renderApp(<AdminPage />, {
      user: TEACHER,
      api: { 'GET /admin/claims': [200, GROUPS], 'POST /admin/claims/c1/approve': [409, { code: 'CONFLICT', message: '이미 처리된 수령 신청입니다' }] },
    });
    await userEvent.click(await screen.findByRole('button', { name: '이지우 신청 승인' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '승인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('이미 처리된 수령 신청입니다');
  });

  it('승인 대기가 없으면 안내', async () => {
    renderApp(<AdminPage />, { user: TEACHER, api: { 'GET /admin/claims': [200, []] } });
    expect(await screen.findByText('승인 대기 중인 수령 신청이 없습니다')).toBeInTheDocument();
  });
});

describe('AdminPage — 보관 중', () => {
  const old = summary({ id: 'f-old', title: '검정 우산', expiresAt: new Date(Date.now() - 5 * 86_400_000).toISOString() });
  const fresh = summary({ id: 'f-new', title: '파란 샤프', expiresAt: new Date(Date.now() + 10 * 86_400_000).toISOString() });

  it('기본은 30일 경과분 — 골라서·전체 만료 처리 (재확인)', async () => {
    const { api } = renderApp(<AdminPage />, {
      user: TEACHER,
      api: {
        'GET /admin/claims': [200, []],
        'GET /found-items': (_b, url) =>
          url.searchParams.get('overdue') === 'true'
            ? [200, { items: [old], nextCursor: null, total: 1 }]
            : [200, { items: [old, fresh], nextCursor: null, total: 2 }],
        'POST /admin/found-items/expire': [200, { expired: 1, ids: ['f-old'] }],
      },
    });
    await userEvent.click(await screen.findByRole('tab', { name: '보관 중' }));
    expect(await screen.findByText('검정 우산')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '30일 경과' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('만료 5일 지남')).toHaveClass('text-err');

    const pick = screen.getByRole('button', { name: '선택 만료 처리 (0)' });
    expect(pick).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: '검정 우산 선택' }));
    await userEvent.click(screen.getByRole('button', { name: '선택 만료 처리 (1)' }));
    await userEvent.click(within(screen.getByRole('dialog', { name: '기간 만료로 처리할까요?' })).getByRole('button', { name: '만료 처리' }));
    expect(await screen.findByText('1건을 기간 만료로 처리했습니다')).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === '/admin/found-items/expire')?.body).toEqual({ ids: ['f-old'] });

    await userEvent.click(screen.getByRole('button', { name: '경과분 모두 만료' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('30일이 지난 물건 1건을 모두');
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '만료 처리' }));
    await waitFor(() => expect(api.calls.filter((c) => c.path === '/admin/found-items/expire').at(-1)?.body).toEqual({}));

    await userEvent.click(screen.getByRole('radio', { name: '전체 보관 중' }));
    expect(await screen.findByText('파란 샤프')).toBeInTheDocument();
    expect(screen.getByText('만료까지 10일')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '경과분 모두 만료' })).not.toBeInTheDocument();
  });

  it('expiryLabel', () => {
    const now = Date.parse('2026-11-10T00:00:00Z');
    expect(expiryLabel('2026-11-08T00:00:00Z', now)).toEqual({ overdue: true, text: '만료 2일 지남' });
    expect(expiryLabel('2026-11-09T23:00:00Z', now)).toEqual({ overdue: true, text: '만료 1일 지남' });
    expect(expiryLabel('2026-11-12T12:00:00Z', now)).toEqual({ overdue: false, text: '만료까지 3일' });
  });
});

describe('AdminPage — 요약', () => {
  it('상태별 수와 기간별 등록·처리 막대 (가장 큰 값 기준 폭)', async () => {
    const { api } = renderApp(<AdminPage />, {
      user: TEACHER,
      api: { 'GET /admin/claims': [200, []], 'GET /admin/stats': (_b, url) => [200, { ...STATS, period: url.searchParams.get('period') }] },
    });
    await userEvent.click(await screen.findByRole('tab', { name: '요약' }));
    const bars = await screen.findAllByRole('img', { name: /등록|처리/ });
    const widths = bars.map((b) => (b.firstElementChild as HTMLElement).style.width);
    expect(widths).toEqual(['100%', '0%', '50%', '50%']);
    expect(screen.getByRole('img', { name: '11월 1주 등록 4건 (분실 신고 1 · 습득물 3)' })).toBeInTheDocument();
    expect(screen.getByText('승인 대기', { selector: 'dt' }).nextElementSibling).toHaveTextContent('3');

    await userEvent.click(screen.getByRole('radio', { name: '월별' }));
    await waitFor(() => expect(String(api.fetchMock.mock.calls.at(-1)![0])).toContain('period=month'));
  });
});
