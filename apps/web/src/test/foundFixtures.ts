import type { FoundItemDetail, FoundItemStatus, FoundItemSummary } from '@findit/shared';

let n = 0;
export function summary(over: Partial<FoundItemSummary> = {}): FoundItemSummary {
  n++;
  return {
    id: `f${n}`,
    title: `물건 ${n}`,
    category: 'WALLET_CARD',
    keptAt: '본관 1층 행정실',
    foundPlace: '본관 3층 복도',
    foundDate: '2026-10-17',
    status: 'KEEPING',
    createdAt: '2026-10-17T07:24:00.000Z',
    expiresAt: '2026-11-16T07:24:00.000Z',
    thumbnail: null,
    ...over,
  };
}

export function detail(over: Partial<FoundItemDetail> = {}): FoundItemDetail {
  const status: FoundItemStatus = over.status ?? 'KEEPING';
  return {
    id: 'f-wallet',
    title: '갈색 반지갑',
    category: 'WALLET_CARD',
    keptAt: '본관 1층 행정실',
    foundPlace: '본관 3층 복도',
    foundDate: '2026-10-17',
    color: '갈색',
    description: '모서리 긁힘, 단추 잠금',
    status,
    reporterId: 'u-finder',
    createdAt: '2026-10-17T07:24:00.000Z',
    expiresAt: '2026-11-16T07:24:00.000Z',
    photos: [
      { id: 'p1', url: '/api/uploads/p1.jpg', width: 800, height: 800 },
      { id: 'p2', url: '/api/uploads/p2.jpg', width: 800, height: 800 },
    ],
    canClaim: true,
    claimBlockedReason: null,
    myClaim: null,
    isMine: false,
    ...over,
  };
}
