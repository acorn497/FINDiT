import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { todayISO } from '../../shared/lib/date';
import { renderApp } from '../../test/render';
import { LostReportNewPage } from './LostReportNewPage';

const tomorrowISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayISO(d);
};

function setup(created: [number, unknown] = [201, { id: 'lr1' }]) {
  return renderApp(
    <Routes>
      <Route path="/lost/new" element={<LostReportNewPage />} />
      <Route path="/register" element={<p>등록 선택 화면</p>} />
      <Route path="/" element={<p>홈 화면</p>} />
    </Routes>,
    { route: '/lost/new', api: { 'POST /lost-reports': created } },
  );
}

const next = () => screen.getByRole('button', { name: /^(다음|신고하기)$/ });

async function fillStep1() {
  await userEvent.click(screen.getByRole('radio', { name: '지갑·카드' }));
  await userEvent.click(next());
}

async function fillStep2(date = '2026-09-25') {
  await userEvent.type(screen.getByLabelText('잃어버린 장소'), '본관 3층 복도');
  await userEvent.type(screen.getByLabelText('잃어버린 날짜'), date);
  await userEvent.click(screen.getByRole('radio', { name: '점심시간' }));
}

afterEach(() => vi.unstubAllGlobals());

describe('LostReportNewPage', () => {
  it('1단계 — 종류를 고르지 않고 [다음]을 누르면 오류', async () => {
    setup();
    expect(screen.getByText(/1 \/ 3 단계/)).toBeInTheDocument();
    await userEvent.click(next());
    expect(screen.getByRole('alert')).toHaveTextContent('물건 종류를 선택해 주세요');
    expect(screen.getByText(/1 \/ 3 단계/)).toBeInTheDocument();
  });

  it('2단계 — 오늘 이후 날짜는 notFuture 오류, 시간대는 칩 선택', async () => {
    setup();
    await fillStep1();
    expect(screen.getByText(/2 \/ 3 단계 · 언제, 어디서 잃어버렸나요\?/)).toBeInTheDocument();
    await fillStep2(tomorrowISO());
    await userEvent.click(next());
    expect(screen.getByRole('alert')).toHaveTextContent('오늘 이후의 날짜는 선택할 수 없습니다');
    expect(screen.getByRole('radio', { name: '점심시간' })).toHaveAttribute('aria-checked', 'true');
  });

  it('단계를 오가도 값이 유지되고, 3단계까지 채우면 신고를 보낸다', async () => {
    const { api } = setup();
    await fillStep1();
    await fillStep2();
    await userEvent.click(next());
    expect(screen.getByText(/3 \/ 3 단계/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '이전' }));
    expect(screen.getByLabelText('잃어버린 장소')).toHaveValue('본관 3층 복도');
    expect(screen.getByLabelText('잃어버린 날짜')).toHaveValue('2026-09-25');
    await userEvent.click(next());

    await userEvent.click(next());
    expect(screen.getByRole('alert')).toHaveTextContent('색상을 입력해 주세요');
    await userEvent.type(screen.getByLabelText('색상'), '갈색');
    await userEvent.type(screen.getByLabelText(/특징/), '모서리 긁힘');
    await userEvent.click(next());

    expect(await screen.findByText('분실 신고가 접수되었습니다')).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === '/lost-reports')?.body).toEqual({
      category: 'WALLET_CARD',
      lostPlace: '본관 3층 복도',
      lostDate: '2026-09-25',
      timeSlot: 'LUNCH',
      color: '갈색',
      description: '모서리 긁힘',
    });
    await userEvent.click(screen.getByRole('button', { name: '홈으로' }));
    expect(screen.getByText('홈 화면')).toBeInTheDocument();
  });

  it('서버 오류는 문구로 보여 준다', async () => {
    setup([400, { code: 'VALIDATION_FAILED', message: '오늘 이후의 날짜는 선택할 수 없습니다' }]);
    await fillStep1();
    await fillStep2();
    await userEvent.click(next());
    await userEvent.type(screen.getByLabelText('색상'), '갈색');
    await userEvent.click(next());
    expect(await screen.findByRole('alert')).toHaveTextContent('오늘 이후의 날짜는 선택할 수 없습니다');
  });

  it('앱바 × — 작성 중이면 삭제를 재확인한다', async () => {
    setup();
    await userEvent.click(screen.getByRole('radio', { name: '전자기기' }));
    await userEvent.click(screen.getByRole('button', { name: '작성 취소' }));
    const dialog = screen.getByRole('dialog', { name: '작성을 그만둘까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '계속 작성' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '전자기기' })).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(screen.getByRole('button', { name: '작성 취소' }));
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: '삭제' }));
    expect(screen.getByText('등록 선택 화면')).toBeInTheDocument();
  });

  it('아무것도 적지 않았으면 × 는 바로 나간다', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: '작성 취소' }));
    expect(screen.getByText('등록 선택 화면')).toBeInTheDocument();
  });

  it('1단계의 [이전]·뒤로 가기는 나가기와 같다', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(screen.getByText('등록 선택 화면')).toBeInTheDocument();
  });
});
