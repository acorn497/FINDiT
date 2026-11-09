import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SEED_LOST } from '../src/database/seeds/flow.seed';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('GET /api/home/summary · 시드 알림', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await resetAndSeed(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('학생 — 내 신고 상태, 새 매칭 후보(갈색 반지갑), 최근 습득물 6건, 승인 대기 수는 없음', async () => {
    const cookie = await loginAs(app, 's2217@gbsw.hs.kr');
    const res = await request(http).get('/api/home/summary').set('Cookie', cookie).expect(200);
    expect(res.body.isNewUser).toBe(false);
    expect(res.body.myReports.map((r: { id: string }) => r.id)).toEqual([SEED_LOST.wallet.id, SEED_LOST.earphone.id]);
    expect(res.body.newMatches[0]).toMatchObject({ lostReportId: SEED_LOST.wallet.id, lostReportTitle: '갈색 지갑·카드' });
    expect(res.body.newMatches[0].candidate.item.title).toBe('갈색 반지갑');
    expect(res.body.recentFound).toHaveLength(6);
    expect(res.body.pendingClaims).toBeNull();
  });

  it('교사 — 승인 대기 1건 (무선 이어폰), 신고가 없으면 새 사용자', async () => {
    const cookie = await loginAs(app, 'teacher@gbsw.hs.kr');
    const res = await request(http).get('/api/home/summary').set('Cookie', cookie).expect(200);
    expect(res.body.pendingClaims).toBe(1);
    expect(res.body.isNewUser).toBe(true);
    expect(res.body.newMatches).toEqual([]);
  });

  it('시드 알림 — s2217 에게 읽지 않음 2건 + 읽음 1건', async () => {
    const cookie = await loginAs(app, 's2217@gbsw.hs.kr');
    const res = await request(http).get('/api/notifications').set('Cookie', cookie).expect(200);
    expect(res.body.unreadCount).toBe(2);
    expect(res.body.items.map((n: { type: string; readAt: string | null }) => [n.type, n.readAt === null])).toEqual([
      ['NEW_MATCH', true],
      ['CLAIM_RECEIVED', true],
      ['PICKUP_GUIDE', false],
    ]);
  });
});
