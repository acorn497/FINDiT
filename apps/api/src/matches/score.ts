import { FoundItemStatus, type Category } from '@findit/shared';
import { daysBetween } from '../common/dates';

/**
 * 매칭 점수 (§8)
 *   score = 0.4 × placeScore + 0.3 × dateScore + 0.3 × textScore
 *   placeScore : 같은 건물·같은 층 1.0 / 같은 건물 0.7 / 그 외 0.3
 *   dateScore  : |날짜 차| 0일 1.0 / 1일 0.8 / 2~3일 0.6 / 4~7일 0.3 / 그 외 0.0
 *   textScore  : 색상 일치(0 또는 0.5) + 특징 낱말 자카드 유사도 × 0.5
 * 후보 조건: 같은 category · 제외 기록 없음 · KEEPING · score ≥ 0.35 · 내림차순 상위 5개.
 * 점수는 후보를 좁히는 데만 쓴다 — 자동 매칭·자동 전달은 하지 않는다.
 */
export const WEIGHT = { place: 0.4, date: 0.3, text: 0.3 } as const;
export const MIN_SCORE = 0.35;
export const TOP_N = 5;

export interface LostLike {
  category: Category;
  lostPlace: string;
  lostDate: string;
  color: string;
  description: string | null;
}

export interface FoundLike {
  id: string;
  category: Category;
  status: FoundItemStatus;
  title: string;
  keptAt: string;
  foundPlace: string | null;
  foundDate: string;
  color: string | null;
  description: string | null;
}

/** '본관 3층 복도' → { building: '본관', floor: '3' } */
export function parsePlace(place: string) {
  const text = place.trim();
  const building = text.split(/\s+/)[0] ?? '';
  const floor = text.match(/(B?\d+)\s*층/i)?.[1]?.toUpperCase() ?? null;
  return { building, floor };
}

export function placeScore(a: string, b: string): number {
  const pa = parsePlace(a);
  const pb = parsePlace(b);
  if (!pa.building || pa.building !== pb.building) return 0.3;
  if (pa.floor && pa.floor === pb.floor) return 1.0;
  return 0.7;
}

export function dateScore(a: string, b: string): number {
  const diff = daysBetween(a, b);
  if (diff === 0) return 1.0;
  if (diff === 1) return 0.8;
  if (diff <= 3) return 0.6;
  if (diff <= 7) return 0.3;
  return 0.0;
}

/** 색 이름 비교 — 공백과 끝의 '색'은 무시한다 (보라색 = 보라) */
export function sameColor(a: string | null, b: string | null): boolean {
  const norm = (c: string | null) => (c ?? '').replace(/\s+/g, '').replace(/색$/, '').toLowerCase();
  const na = norm(a);
  return na !== '' && na === norm(b);
}

/** 특징 낱말 — 공백·쉼표·가운뎃점 등으로 나눈 2글자 이상 낱말 */
export function words(text: string | null): Set<string> {
  return new Set(
    (text ?? '')
      .toLowerCase()
      .split(/[\s,.·/()\-_]+/)
      .filter((w) => w.length >= 2),
  );
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  a.forEach((w) => b.has(w) && inter++);
  return inter / (a.size + b.size - inter);
}

export function textScore(lost: Pick<LostLike, 'color' | 'description'>, found: Pick<FoundLike, 'color' | 'title' | 'description'>) {
  const color = sameColor(lost.color, found.color) ? 0.5 : 0;
  const sim = jaccard(words(lost.description), words(`${found.title} ${found.description ?? ''}`));
  return color + sim * 0.5;
}

/** 소수 셋째 자리에서 반올림 (부동소수 오차 정리) */
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export interface MatchBreakdown {
  score: number;
  place: number;
  date: number;
  text: number;
  /** 항목별 일치 여부 — 화면의 좌우 비교 행 색에 쓴다 */
  matches: { category: boolean; place: boolean; date: boolean; color: boolean };
}

export function matchScore(lost: LostLike, found: FoundLike): MatchBreakdown {
  const foundPlace = found.foundPlace || found.keptAt;
  const place = placeScore(lost.lostPlace, foundPlace);
  const date = dateScore(lost.lostDate, found.foundDate);
  const text = textScore(lost, found);
  return {
    score: round3(WEIGHT.place * place + WEIGHT.date * date + WEIGHT.text * text),
    place,
    date,
    text: round3(text),
    matches: {
      category: lost.category === found.category,
      place: place === 1.0,
      date: daysBetween(lost.lostDate, found.foundDate) <= 1,
      color: sameColor(lost.color, found.color),
    },
  };
}

/** 후보 고르기 — 같은 종류 · 제외 기록 없음 · KEEPING · 0.35 이상 · 내림차순 상위 5개 */
export function rankCandidates<F extends FoundLike>(lost: LostLike, founds: F[], excluded: ReadonlySet<string> = new Set()) {
  return founds
    .filter((f) => f.category === lost.category && f.status === FoundItemStatus.KEEPING && !excluded.has(f.id))
    .map((found) => ({ found, ...matchScore(lost, found) }))
    .filter((c) => c.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || b.found.foundDate.localeCompare(a.found.foundDate))
    .slice(0, TOP_N);
}
