import { LostReportStatus, TimeSlot, Category } from '@findit/shared';
import type { DataSource } from 'typeorm';
import { SEED_FOUND } from './found-items.seed';
import { SEED_USER } from './users.seed';

/** 흐름 확인용 — s2217 의 분실 신고 2건 */
export const SEED_LOST = {
  wallet: {
    id: '00000000-0000-4000-8003-000000000001',
    category: Category.WALLET_CARD,
    lostPlace: '본관 3층 복도',
    lostDate: '2026-10-17',
    timeSlot: TimeSlot.LUNCH,
    color: '갈색',
    description: '모서리 긁힘',
    status: LostReportStatus.MATCHED,
    createdAt: '2026-10-17T19:10:00+09:00',
  },
  earphone: {
    id: '00000000-0000-4000-8003-000000000002',
    category: Category.ELECTRONICS,
    lostPlace: '체육관',
    lostDate: '2026-10-10',
    timeSlot: TimeSlot.AFTER_SCHOOL,
    color: '흰색',
    description: '케이스 없음, 한쪽만',
    status: LostReportStatus.OPEN,
    createdAt: '2026-10-10T20:30:00+09:00',
  },
} as const;

/** 수령 신청 1건 — 무선 이어폰에 s2217 의 PENDING (교사 승인 대기 1건) */
export const SEED_CLAIM_ID = '00000000-0000-4000-8004-000000000001';

export async function seedFlow(ds: DataSource) {
  let n = 0;
  for (const r of Object.values(SEED_LOST)) {
    const res: unknown[] = await ds.query(
      `INSERT INTO lost_reports (id, category, lost_place, lost_date, time_slot, color, description, status, reporter_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10) ON CONFLICT (id) DO NOTHING RETURNING id`,
      [r.id, r.category, r.lostPlace, r.lostDate, r.timeSlot, r.color, r.description, r.status, SEED_USER.student.id, new Date(r.createdAt)],
    );
    n += res.length;
  }
  const res: unknown[] = await ds.query(
    `INSERT INTO claims (id, found_item_id, claimant_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'PENDING', $4, $4) ON CONFLICT (id) DO NOTHING RETURNING id`,
    [SEED_CLAIM_ID, SEED_FOUND['무선 이어폰'].id, SEED_USER.student.id, new Date('2026-10-17T18:02:00+09:00')],
  );
  return n + res.length;
}
