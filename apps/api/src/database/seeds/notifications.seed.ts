import type { DataSource } from 'typeorm';
import { SEED_LOST } from './flow.seed';
import { SEED_FOUND } from './found-items.seed';
import { SEED_USER } from './users.seed';

const nid = (n: number) => `00000000-0000-4000-8005-${String(n).padStart(12, '0')}`;

/** s2217 의 알림 3건 — 읽지 않음 2건 + 읽음 1건 (하단 탭 배지 2) */
export const SEED_NOTIFICATIONS = [
  {
    id: nid(1),
    type: 'NEW_MATCH',
    title: '새 후보 도착',
    body: "'갈색 지갑·카드' 신고와 비슷한 갈색 반지갑이(가) 등록되었습니다. (유사도 90%)",
    link: `/matches?lostReportId=${SEED_LOST.wallet.id}`,
    readAt: null,
    createdAt: '2026-10-17T19:12:00+09:00',
  },
  {
    id: nid(2),
    type: 'CLAIM_RECEIVED',
    title: '수령 신청 접수',
    body: '무선 이어폰 수령 신청이 접수되었습니다. 담당 선생님이 확인하면 알려 드릴게요.',
    link: `/found/${SEED_FOUND['무선 이어폰'].id}`,
    readAt: null,
    createdAt: '2026-10-17T18:02:30+09:00',
  },
  {
    id: nid(3),
    type: 'PICKUP_GUIDE',
    title: '수령 안내',
    body: '분실물은 담당 선생님 확인 후 본관 1층 행정실에서 받을 수 있습니다. 학생증을 꼭 챙겨 오세요.',
    link: '/found',
    readAt: '2026-10-10T21:00:00+09:00',
    createdAt: '2026-10-10T20:31:00+09:00',
  },
] as const;

export async function seedNotifications(ds: DataSource) {
  let n = 0;
  for (const s of SEED_NOTIFICATIONS) {
    const res: unknown[] = await ds.query(
      `INSERT INTO notifications (id, user_id, type, title, body, link, read_at, payload, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $8) ON CONFLICT (id) DO NOTHING RETURNING id`,
      [s.id, SEED_USER.student.id, s.type, s.title, s.body, s.link, s.readAt ? new Date(s.readAt) : null, new Date(s.createdAt)],
    );
    n += res.length;
  }
  return n;
}
