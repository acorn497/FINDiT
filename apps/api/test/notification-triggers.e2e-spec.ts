import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SEED_LOST } from '../src/database/seeds/flow.seed';
import { SEED_FOUND } from '../src/database/seeds/found-items.seed';
import { NotificationTriggersService } from '../src/notifications/notification-triggers.service';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('알림 발생', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let student: string;
  let finder: string;
  let teacher: string;

  const notes = async (cookie: string) => (await request(http).get('/api/notifications').set('Cookie', cookie).expect(200)).body;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    ds = await resetAndSeed(app);
    await ds.query('DELETE FROM notifications');
    student = await loginAs(app, 's2217@gbsw.hs.kr');
    finder = await loginAs(app, 's2103@gbsw.hs.kr');
    teacher = await loginAs(app, 'teacher@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  it('새 후보 도착 — 내 분실 신고의 후보에 드는 습득물이 등록되면', async () => {
    await request(http)
      .post('/api/found-items')
      .set('Cookie', finder)
      .send({ category: 'WALLET_CARD', keptAt: '본관 1층 행정실', foundPlace: '본관 3층 복도', foundDate: '2026-10-17', title: '갈색 동전지갑', color: '갈색' })
      .expect(201);
    const body = await notes(student);
    expect(body.unreadCount).toBe(1);
    expect(body.items[0]).toMatchObject({
      type: 'NEW_MATCH',
      title: '새 후보 도착',
      link: `/matches?lostReportId=${SEED_LOST.wallet.id}`,
      readAt: null,
    });
    expect(body.items[0].body).toContain('갈색 동전지갑');
    // 등록한 사람 자신에게는 보내지 않는다
    expect((await notes(finder)).items).toHaveLength(0);
  });

  it('후보에 들지 않는 습득물은 알리지 않는다', async () => {
    await request(http)
      .post('/api/found-items')
      .set('Cookie', finder)
      .send({ category: 'CLOTHING', keptAt: '체육관 탈의실', foundDate: '2026-11-01', title: '검정 양말' })
      .expect(201);
    expect((await notes(student)).unreadCount).toBe(1);
  });

  it('수령 신청 접수 — 신청자에게 접수 안내, 교사에게 새 신청', async () => {
    await request(http).post(`/api/found-items/${SEED_FOUND['초록 우산'].id}/claims`).set('Cookie', student).expect(201);
    const mine = await notes(student);
    expect(mine.items[0]).toMatchObject({ type: 'CLAIM_RECEIVED', title: '수령 신청 접수', link: `/found/${SEED_FOUND['초록 우산'].id}` });
    const t = await notes(teacher);
    expect(t.items[0]).toMatchObject({ type: 'CLAIM_RECEIVED', title: '새 수령 신청', link: '/admin' });
    expect(t.items[0].body).toBe('이지우 학생이 초록 우산 수령을 신청했습니다.');
  });

  it('보관 기간 임박 — 만료 3일 안의 보관 중 물건, 한 번만', async () => {
    const triggers = app.get(NotificationTriggersService);
    await ds.query(`UPDATE found_items SET expires_at = now() + interval '2 days' WHERE id = $1`, [SEED_FOUND['회색 후드집업'].id]);
    expect(await triggers.checkExpiring()).toBeGreaterThanOrEqual(1);
    expect(await triggers.checkExpiring()).toBe(0);
    const body = await notes(finder);
    const expiring = body.items.find((n: { type: string }) => n.type === 'EXPIRING');
    expect(expiring.title).toBe('보관 기간 임박');
    expect(expiring.body).toContain('회색 후드집업 보관 기간이 2일 남았습니다');
  });
});
