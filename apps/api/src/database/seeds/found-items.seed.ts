import { Category, FoundItemStatus, KEEPING_DAYS } from '@findit/shared';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DataSource } from 'typeorm';
import { config } from '../../config';
import { gradientJpeg } from './images';
import { SEED_USER } from './users.seed';

export interface SeedFoundItem {
  id: string;
  title: string;
  category: Category;
  keptAt: string;
  foundPlace: string;
  foundDate: string;
  color: string;
  description: string;
  status: FoundItemStatus;
  /** 등록 시각 (KST) */
  createdAt: string;
  /** 그라데이션 사진 [from, to] — 여러 장이면 여러 쌍 */
  photos: [string, string][];
}

const fid = (n: number) => `00000000-0000-4000-8001-${String(n).padStart(12, '0')}`;
const pid = (n: number) => `00000000-0000-4000-8002-${String(n).padStart(12, '0')}`;

/** 목업 ④ 와 같은 6건 — 등록 시각 내림차순으로 첫 페이지에 그대로 보인다 */
export const SEED_FOUND_MAIN: SeedFoundItem[] = [
  {
    id: fid(1),
    title: '갈색 반지갑',
    category: Category.WALLET_CARD,
    keptAt: '본관 1층 행정실',
    foundPlace: '본관 3층 복도',
    foundDate: '2026-10-17',
    color: '갈색',
    description: '모서리 긁힘, 단추 잠금',
    status: FoundItemStatus.KEEPING,
    createdAt: '2026-10-17T16:24:00+09:00',
    photos: [
      ['#f0dcc2', '#d8b185'],
      ['#e8d0b0', '#c9a06f'],
    ],
  },
  {
    id: fid(2),
    title: '무선 이어폰',
    category: Category.ELECTRONICS,
    keptAt: '2학년 교무실',
    foundPlace: '본관 2층 복도',
    foundDate: '2026-10-17',
    color: '흰색',
    description: '충전 케이스 포함, 왼쪽 이어팁 없음',
    status: FoundItemStatus.CHECKING,
    createdAt: '2026-10-17T12:41:00+09:00',
    photos: [['#c8d7ef', '#8fa9d6']],
  },
  {
    id: fid(3),
    title: '초록 우산',
    category: Category.ETC,
    keptAt: '현관 우산꽂이',
    foundPlace: '현관',
    foundDate: '2026-10-16',
    color: '초록',
    description: '장우산, 나무 손잡이',
    status: FoundItemStatus.KEEPING,
    createdAt: '2026-10-16T08:15:00+09:00',
    photos: [['#cfe4d2', '#9ac4a4']],
  },
  {
    id: fid(4),
    title: '보라색 필통',
    category: Category.STATIONERY,
    keptAt: '본관 1층 행정실',
    foundPlace: '본관 4층 2학년 3반',
    foundDate: '2026-10-15',
    color: '보라',
    description: '지퍼형, 고양이 스티커',
    status: FoundItemStatus.DONE,
    createdAt: '2026-10-15T15:20:00+09:00',
    photos: [['#e5d3e8', '#bb9ec4']],
  },
  {
    id: fid(5),
    title: '회색 후드집업',
    category: Category.CLOTHING,
    keptAt: '체육관 탈의실',
    foundPlace: '체육관',
    foundDate: '2026-10-15',
    color: '회색',
    description: 'M 사이즈, 지퍼 손잡이 고장',
    status: FoundItemStatus.KEEPING,
    createdAt: '2026-10-15T13:05:00+09:00',
    photos: [['#d6d9de', '#a9aeb8']],
  },
  {
    id: fid(6),
    title: '분홍 텀블러',
    category: Category.ETC,
    keptAt: '급식실 반납대',
    foundPlace: '급식실',
    foundDate: '2026-09-12',
    color: '분홍',
    description: '스테인리스, 뚜껑 있음',
    status: FoundItemStatus.EXPIRED,
    createdAt: '2026-09-12T13:30:00+09:00',
    photos: [['#f3d6d6', '#cf9d9d']],
  },
];

const GRADIENT: Record<Category, [string, string]> = {
  WALLET_CARD: ['#f0dcc2', '#d8b185'],
  ELECTRONICS: ['#c8d7ef', '#8fa9d6'],
  CLOTHING: ['#d6d9de', '#a9aeb8'],
  STATIONERY: ['#e5d3e8', '#bb9ec4'],
  ETC: ['#cfe4d2', '#9ac4a4'],
};

/** 나머지 18건 — 같은 장소·종류 풀. 모두 첫 6건(9월 12일)보다 먼저 등록돼 "더 보기"로 이어진다 */
const EXTRA: [string, Category, string, string, string, string, FoundItemStatus][] = [
  // 이름, 종류, 맡긴 장소, 주운 곳, 색상, 특징, 상태
  ['갈색 카드지갑', Category.WALLET_CARD, '본관 1층 행정실', '본관 3층 계단', '갈색', '카드 두 장, 모서리 해짐', FoundItemStatus.KEEPING],
  ['검정 장지갑', Category.WALLET_CARD, '본관 1층 행정실', '별관 1층 매점 앞', '검정', '지퍼형, 영수증 들어 있음', FoundItemStatus.KEEPING],
  ['학생증', Category.WALLET_CARD, '2학년 교무실', '본관 2층 복도', '파랑', '목걸이 줄 있음', FoundItemStatus.DONE],
  ['교통카드', Category.WALLET_CARD, '본관 1층 행정실', '현관', '흰색', '캐릭터 스티커', FoundItemStatus.KEEPING],
  ['보조배터리', Category.ELECTRONICS, '2학년 교무실', '별관 3층 컴퓨터실', '검정', '10000mAh, 케이블 없음', FoundItemStatus.KEEPING],
  ['충전 케이블', Category.ELECTRONICS, '2학년 교무실', '도서관', '흰색', 'C 타입, 1m', FoundItemStatus.EXPIRED],
  ['공학용 계산기', Category.ELECTRONICS, '본관 1층 행정실', '본관 4층 복도', '검정', '뒷면에 이름 지워짐', FoundItemStatus.KEEPING],
  ['유선 이어폰', Category.ELECTRONICS, '2학년 교무실', '운동장 벤치', '검정', '줄 꼬임', FoundItemStatus.DONE],
  ['남색 체육복 상의', Category.CLOTHING, '체육관 탈의실', '운동장', '남색', 'L 사이즈, 학교 로고', FoundItemStatus.KEEPING],
  ['검정 패딩 조끼', Category.CLOTHING, '체육관 탈의실', '급식실', '검정', '경량 패딩', FoundItemStatus.KEEPING],
  ['흰색 운동화', Category.CLOTHING, '체육관 탈의실', '체육관', '흰색', '260mm, 끈 회색', FoundItemStatus.EXPIRED],
  ['야구 모자', Category.CLOTHING, '본관 1층 행정실', '운동장 벤치', '빨강', '뒤 조절 끈', FoundItemStatus.KEEPING],
  ['파란 샤프', Category.STATIONERY, '본관 1층 행정실', '본관 3층 3학년 1반', '파랑', '0.5mm, 지우개 없음', FoundItemStatus.KEEPING],
  ['수학 문제집', Category.STATIONERY, '2학년 교무실', '도서관', '노랑', '앞장에 이름 없음', FoundItemStatus.KEEPING],
  ['형광펜 세트', Category.STATIONERY, '본관 1층 행정실', '별관 2층 복도', '노랑', '5색, 투명 케이스', FoundItemStatus.DONE],
  ['검정 우산', Category.ETC, '현관 우산꽂이', '현관', '검정', '3단 접이식', FoundItemStatus.KEEPING],
  ['물병', Category.ETC, '급식실 반납대', '급식실', '하늘', '플라스틱, 500ml', FoundItemStatus.EXPIRED],
  ['열쇠고리', Category.ETC, '본관 1층 행정실', '본관 2층 복도', '노랑', '곰 인형 모양', FoundItemStatus.KEEPING],
];

export const SEED_FOUND_EXTRA: SeedFoundItem[] = EXTRA.map(([title, category, keptAt, foundPlace, color, description, status], i) => {
  // 2026-09-11 18:00 부터 하루씩 거슬러 올라간다 (09-11 ~ 08-25)
  const d = new Date(Date.UTC(2026, 8, 11, 9, 0) - i * 86_400_000 - (i % 3) * 3_600_000);
  const day = d.toISOString().slice(0, 10);
  return {
    id: fid(7 + i),
    title,
    category,
    keptAt,
    foundPlace,
    foundDate: day,
    color,
    description,
    status,
    createdAt: d.toISOString(),
    photos: [GRADIENT[category]],
  };
});

export const SEED_FOUND_ITEMS = [...SEED_FOUND_MAIN, ...SEED_FOUND_EXTRA];
export const SEED_FOUND = Object.fromEntries(SEED_FOUND_MAIN.map((f) => [f.title, f])) as Record<string, SeedFoundItem>;

/** 습득물 24건 + 그라데이션 사진. 고정 id 로 넣고 이미 있으면 건너뛴다. */
export async function seedFoundItems(ds: DataSource) {
  mkdirSync(config.uploadDir, { recursive: true });
  let inserted = 0;
  let photoNo = 0;
  for (const item of SEED_FOUND_ITEMS) {
    const created = new Date(item.createdAt);
    const res: unknown[] = await ds.query(
      `INSERT INTO found_items
         (id, title, category, kept_at, found_place, found_date, color, description, status, reporter_id, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
       ON CONFLICT (id) DO NOTHING RETURNING id`,
      [
        item.id,
        item.title,
        item.category,
        item.keptAt,
        item.foundPlace,
        item.foundDate,
        item.color,
        item.description,
        item.status,
        SEED_USER.finder.id,
        new Date(created.getTime() + KEEPING_DAYS * 86_400_000),
        created,
      ],
    );
    if (res.length) inserted++;

    for (const [order, [from, to]] of item.photos.entries()) {
      const id = pid(++photoNo);
      const fileName = `seed-${id}.jpg`;
      const filePath = join(config.uploadDir, fileName);
      if (!existsSync(filePath)) writeFileSync(filePath, gradientJpeg(from, to));
      await ds.query(
        `INSERT INTO photos (id, found_item_id, file_path, width, height, bytes, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, 800, 800, $4, $5, $6, $6) ON CONFLICT (id) DO NOTHING`,
        [id, item.id, fileName, statSync(filePath).size, order, created],
      );
    }
  }
  return inserted;
}
