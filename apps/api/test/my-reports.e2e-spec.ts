import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SEED_LOST } from '../src/database/seeds/flow.seed';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('내 신고 관리 API', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let student: string;
  let other: string;

  const list = async (query: Record<string, string | number> = {}) =>
    (await request(http).get('/api/me/reports').query(query).set('Cookie', student).expect(200)).body;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await resetAndSeed(app);
    student = await loginAs(app, 's2217@gbsw.hs.kr');
    other = await loginAs(app, 's2103@gbsw.hs.kr');
    await request(http)
      .post('/api/found-items')
      .set('Cookie', student)
      .send({ category: 'STATIONERY', keptAt: '2학년 교무실', foundDate: '2026-11-01', title: '내가 주운 볼펜' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('구분 표시 — 분실 신고와 습득 등록이 한 목록에, 분실 신고에는 후보 수', async () => {
    const body = await list();
    expect(body.items.map((i: { kind: string }) => i.kind).sort()).toEqual(['found', 'lost', 'lost']);
    const wallet = body.items.find((i: { id: string }) => i.id === SEED_LOST.wallet.id);
    expect(wallet.candidateCount).toBeGreaterThanOrEqual(1);
    const pen = body.items.find((i: { kind: string }) => i.kind === 'found');
    expect(pen).toMatchObject({ title: '내가 주운 볼펜', candidateCount: null });
  });

  it('kind·status 로 거른다', async () => {
    expect((await list({ kind: 'found' })).items.map((i: { title: string }) => i.title)).toEqual(['내가 주운 볼펜']);
    expect((await list({ kind: 'lost', status: 'MATCHED' })).items.map((i: { id: string }) => i.id)).toEqual([SEED_LOST.wallet.id]);
    expect((await list({ kind: 'lost', status: 'OPEN' })).items.map((i: { id: string }) => i.id)).toEqual([SEED_LOST.earphone.id]);
    expect((await list({ kind: 'found', status: 'DONE' })).items).toEqual([]);
    await request(http).get('/api/me/reports').query({ kind: 'x' }).set('Cookie', student).expect(400);
    await request(http).get('/api/me/reports').query({ status: 'LOST' }).set('Cookie', student).expect(400);
  });

  it('커서로 이어 받는다', async () => {
    const first = await list({ limit: 2 });
    expect(first.items).toHaveLength(2);
    const second = await list({ limit: 2, cursor: first.nextCursor });
    expect(second.items).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it('수정 — 본인만, 타인 403', async () => {
    await request(http).patch(`/api/lost-reports/${SEED_LOST.earphone.id}`).set('Cookie', other).send({ color: '검정' }).expect(403);
    const res = await request(http)
      .patch(`/api/lost-reports/${SEED_LOST.earphone.id}`)
      .set('Cookie', student)
      .send({ lostPlace: ' 체육관 2층 ', description: '' })
      .expect(200);
    expect(res.body).toMatchObject({ lostPlace: '체육관 2층', description: null, color: '흰색' });
    const bad = await request(http).patch(`/api/lost-reports/${SEED_LOST.earphone.id}`).set('Cookie', student).send({ color: '' }).expect(400);
    expect(bad.body.message).toBe('색상을 입력해 주세요');
    const got = await request(http).get(`/api/lost-reports/${SEED_LOST.earphone.id}`).set('Cookie', student).expect(200);
    expect(got.body.lostPlace).toBe('체육관 2층');
    await request(http).get(`/api/lost-reports/${SEED_LOST.earphone.id}`).set('Cookie', other).expect(403);
  });

  it('찾음 처리(마감) → CLOSED, 이후 수정 409, 후보 0', async () => {
    await request(http).post(`/api/lost-reports/${SEED_LOST.wallet.id}/close`).set('Cookie', other).expect(403);
    const res = await request(http).post(`/api/lost-reports/${SEED_LOST.wallet.id}/close`).set('Cookie', student).expect(200);
    expect(res.body.status).toBe('CLOSED');
    await request(http).post(`/api/lost-reports/${SEED_LOST.wallet.id}/close`).set('Cookie', student).expect(200);
    await request(http).patch(`/api/lost-reports/${SEED_LOST.wallet.id}`).set('Cookie', student).send({ color: '검정' }).expect(409);
    const closed = await list({ kind: 'lost', status: 'CLOSED' });
    expect(closed.items).toEqual([expect.objectContaining({ id: SEED_LOST.wallet.id, candidateCount: 0 })]);
  });

  it('삭제 — 본인만, 없는 id 404', async () => {
    await request(http).delete(`/api/lost-reports/${SEED_LOST.earphone.id}`).set('Cookie', other).expect(403);
    await request(http).delete(`/api/lost-reports/${SEED_LOST.earphone.id}`).set('Cookie', student).expect(200, { deleted: true });
    await request(http).delete(`/api/lost-reports/${SEED_LOST.earphone.id}`).set('Cookie', student).expect(404);
    await request(http).get('/api/lost-reports/not-a-uuid').set('Cookie', student).expect(404);
  });
});
