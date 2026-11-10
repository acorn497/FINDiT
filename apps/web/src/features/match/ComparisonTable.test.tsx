import type { LostReport, MatchCandidate } from '@findit/shared';
import { render, screen } from '@testing-library/react';
import { ComparisonTable } from './ComparisonTable';

const report: LostReport = {
  id: 'lr1',
  category: 'WALLET_CARD',
  lostPlace: '본관 3층 복도',
  lostDate: '2026-10-17',
  timeSlot: 'LUNCH',
  color: '갈색',
  description: '모서리 긁힘',
  status: 'MATCHED',
  reporterId: 'u1',
  createdAt: '',
};

const candidate: MatchCandidate = {
  item: {
    id: 'f1',
    title: '갈색 카드지갑',
    category: 'WALLET_CARD',
    keptAt: '본관 1층 행정실',
    foundPlace: '본관 2층 복도',
    foundDate: '2026-09-11',
    status: 'KEEPING',
    createdAt: '',
    expiresAt: '',
    thumbnail: null,
    color: '갈색',
    description: null,
    photos: [],
  },
  score: 0.58,
  matches: { category: true, place: false, date: false, color: true },
};

describe('ComparisonTable', () => {
  it('좌(내 신고)·우(습득물)를 같은 행에 놓고, 일치 행은 st-done, 어긋난 행은 흐리게', () => {
    render(<ComparisonTable report={report} candidate={candidate} />);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows.map((r) => Array.from(r.children).map((c) => c.textContent))).toEqual([
      ['종류', '지갑·카드', '지갑·카드'],
      ['장소', '본관 3층 복도', '본관 2층 복도'],
      ['날짜', '2026년 10월 17일', '2026년 9월 11일'],
      ['색상', '갈색', '갈색'],
      ['특징', '모서리 긁힘', '—'],
    ]);
    expect(rows[0]).toHaveClass('text-st-done');
    expect(rows[1]).toHaveClass('text-tx-3');
    expect(rows[2]).toHaveClass('text-tx-3');
    expect(rows[3]).toHaveClass('text-st-done');
    expect(rows[4]).not.toHaveAttribute('data-match');
    expect(screen.getAllByLabelText('일치')).toHaveLength(2);
    expect(screen.getAllByLabelText('다름')).toHaveLength(2);
  });

  it('주운 곳이 없으면 맡긴 장소를 쓴다', () => {
    render(<ComparisonTable report={report} candidate={{ ...candidate, item: { ...candidate.item, foundPlace: null, color: null } }} />);
    expect(screen.getByText('본관 1층 행정실')).toBeInTheDocument();
  });
});
