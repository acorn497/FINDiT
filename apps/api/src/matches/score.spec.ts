import { Category, FoundItemStatus } from '@findit/shared';
import {
  dateScore,
  jaccard,
  matchScore,
  MIN_SCORE,
  parsePlace,
  placeScore,
  rankCandidates,
  sameColor,
  textScore,
  words,
  type FoundLike,
  type LostLike,
} from './score';

const lost: LostLike = {
  category: Category.WALLET_CARD,
  lostPlace: '본관 3층 복도',
  lostDate: '2026-10-17',
  color: '갈색',
  description: '모서리 긁힘',
};

let n = 0;
const found = (over: Partial<FoundLike> = {}): FoundLike => ({
  id: `f${++n}`,
  category: Category.WALLET_CARD,
  status: FoundItemStatus.KEEPING,
  title: '지갑',
  keptAt: '본관 1층 행정실',
  foundPlace: '본관 3층 복도',
  foundDate: '2026-10-17',
  color: '갈색',
  description: null,
  ...over,
});

describe('placeScore', () => {
  it('parsePlace — 건물과 층', () => {
    expect(parsePlace('본관 3층 복도')).toEqual({ building: '본관', floor: '3' });
    expect(parsePlace(' 별관 B1층 ')).toEqual({ building: '별관', floor: 'B1' });
    expect(parsePlace('현관 우산꽂이')).toEqual({ building: '현관', floor: null });
  });

  it('같은 건물·같은 층 1.0 / 같은 건물 0.7 / 그 외 0.3', () => {
    expect(placeScore('본관 3층 복도', '본관 3층 계단')).toBe(1.0);
    expect(placeScore('본관 3층 복도', '본관 2층 복도')).toBe(0.7);
    expect(placeScore('체육관', '체육관 탈의실')).toBe(0.7);
    expect(placeScore('본관 3층 복도', '별관 3층 복도')).toBe(0.3);
    expect(placeScore('', '')).toBe(0.3);
  });
});

describe('dateScore — 구간 경계값', () => {
  it.each([
    ['2026-10-17', 1.0],
    ['2026-10-16', 0.8],
    ['2026-10-18', 0.8],
    ['2026-10-15', 0.6],
    ['2026-10-14', 0.6],
    ['2026-10-13', 0.3],
    ['2026-10-10', 0.3],
    ['2026-10-09', 0.0],
    ['2026-09-17', 0.0],
  ])('%s → %s', (d, expected) => {
    expect(dateScore('2026-10-17', d)).toBe(expected);
  });
});

describe('textScore', () => {
  it('sameColor — 공백·끝의 "색" 무시, 빈 값은 불일치', () => {
    expect(sameColor('보라색', '보라')).toBe(true);
    expect(sameColor(' 갈 색 ', '갈색')).toBe(true);
    expect(sameColor('갈색', '검정')).toBe(false);
    expect(sameColor('', '')).toBe(false);
    expect(sameColor(null, '갈색')).toBe(false);
  });

  it('words·jaccard', () => {
    expect([...words('모서리 긁힘, 단추·잠금 a')]).toEqual(['모서리', '긁힘', '단추', '잠금']);
    expect(jaccard(words('모서리 긁힘'), words('모서리 긁힘, 단추 잠금'))).toBe(0.5);
    expect(jaccard(new Set(), words('a'))).toBe(0);
  });

  it('색상 0.5 + 자카드 × 0.5', () => {
    expect(textScore({ color: '갈색', description: '모서리 긁힘' }, { color: '갈색', title: '갈색 반지갑', description: '모서리 긁힘, 단추 잠금' })).toBeCloseTo(
      0.5 + (2 / 6) * 0.5,
    );
    expect(textScore({ color: '흰색', description: null }, { color: '갈색', title: '지갑', description: null })).toBe(0);
  });
});

describe('matchScore', () => {
  it('0.4 × 장소 + 0.3 × 날짜 + 0.3 × 문자', () => {
    const r = matchScore(lost, found({ foundPlace: '본관 2층 복도', foundDate: '2026-10-15', color: '검정' }));
    expect(r).toMatchObject({ place: 0.7, date: 0.6, text: 0 });
    expect(r.score).toBe(0.46);
    expect(r.matches).toEqual({ category: true, place: false, date: false, color: false });
  });

  it('주운 곳이 없으면 맡긴 장소로 비교한다', () => {
    expect(matchScore(lost, found({ foundPlace: null, keptAt: '본관 3층 교무실' })).place).toBe(1.0);
  });

  it('모두 같으면 항목별 일치 표시', () => {
    expect(matchScore(lost, found()).matches).toEqual({ category: true, place: true, date: true, color: true });
  });
});

describe('rankCandidates', () => {
  it('0.35 컷오프 — 경계값은 포함, 미만은 제외', () => {
    // 장소 0.7 × 0.4 = 0.28 + 날짜 4~7일 0.3 × 0.3 = 0.09 → 0.37 (포함)
    const keep = found({ foundPlace: '본관 1층', foundDate: '2026-10-12', color: null });
    // 장소 0.7 × 0.4 = 0.28 + 날짜 0 → 0.28 (제외)
    const drop = found({ foundPlace: '본관 1층', foundDate: '2026-10-01', color: null });
    const ids = rankCandidates(lost, [keep, drop]).map((c) => c.found.id);
    expect(ids).toEqual([keep.id]);
    expect(MIN_SCORE).toBe(0.35);
  });

  it('정확히 0.35 는 후보에 포함된다', () => {
    // 장소 0.3 × 0.4 = 0.12 + 날짜(2일) 0.6 × 0.3 = 0.18 + 자카드 1/3 × 0.5 × 0.3 = 0.05 → 0.35
    const edge = found({ foundPlace: '별관 1층', foundDate: '2026-10-15', color: null, title: '모서리', description: '긁힘 단추 잠금 고리 손잡이' });
    const [c] = rankCandidates(lost, [edge]);
    expect(c.score).toBe(0.35);
    expect(c.found.id).toBe(edge.id);
  });

  it('다른 category·KEEPING 아님·제외 기록은 뺀다', () => {
    const ok = found();
    const other = found({ category: Category.ELECTRONICS });
    const checking = found({ status: FoundItemStatus.CHECKING });
    const excluded = found();
    const ids = rankCandidates(lost, [ok, other, checking, excluded], new Set([excluded.id])).map((c) => c.found.id);
    expect(ids).toEqual([ok.id]);
  });

  it('내림차순 상위 5개만', () => {
    const many = [0, 1, 2, 3, 4, 5, 6].map((d) => found({ foundDate: `2026-10-${String(17 - d).padStart(2, '0')}` }));
    const ranked = rankCandidates(lost, many);
    expect(ranked).toHaveLength(5);
    const scores = ranked.map((c) => c.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
    expect(ranked[0].found.foundDate).toBe('2026-10-17');
  });
});
