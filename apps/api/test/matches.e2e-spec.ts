import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SEED_LOST } from '../src/database/seeds/flow.seed';
import { SEED_FOUND } from '../src/database/seeds/found-items.seed';
import { runSeed } from '../src/database/seeds/seed';
import { createTestApp } from './app';
import { loginAs } from './helpers';

describe('매칭 후보 · 내 신고 목록 (기본형)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let student: string;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await runSeed(app.get(DataSource));
    student = await loginAs(app, 's2217@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  it('시드 분실 신고 ① — 갈색 반지갑이 0.35 이상으로 첫 후보', async () => {
    const res = await request(http).get('/api/matches').query({ lostReportId: SEED_LOST.wallet.id }).set('Cookie', student).expect(200);
    expect(res.body.lostReport).toMatchObject({ id: SEED_LOST.wallet.id, status: 'MATCHED' });
    const [first] = res.body.candidates;
    expect(first.item).toMatchObject({ id: SEED_FOUND['갈색 반지갑'].id, title: '갈색 반지갑', color: '갈색' });
    expect(first.score).toBeGreaterThanOrEqual(0.35);
    expect(first.matches).toEqual({ category: true, place: true, date: true, color: true });
    expect(res.body.candidates.length).toBeLessThanOrEqual(5);
    for (const c of res.body.candidates) expect(c.item.category).toBe('WALLET_CARD');
  });

  it('시드 분실 신고 ② — 후보 0건 또는 낮은 점수', async () => {
    const res = await request(http).get('/api/matches').query({ lostReportId: SEED_LOST.earphone.id }).set('Cookie', student).expect(200);
    for (const c of res.body.candidates) expect(c.score).toBeLessThan(0.5);
  });

  it('남의 신고는 403, 없는 신고 404, 값 없음 400', async () => {
    const other = await loginAs(app, 's2103@gbsw.hs.kr');
    await request(http).get('/api/matches').query({ lostReportId: SEED_LOST.wallet.id }).set('Cookie', other).expect(403);
    await request(http).get('/api/matches').query({ lostReportId: '00000000-0000-4000-8003-999999999999' }).set('Cookie', student).expect(404);
    await request(http).get('/api/matches').set('Cookie', student).expect(400);
  });

  it('GET /me/reports — 내 신고·등록 통합 목록 (커서)', async () => {
    const res = await request(http).get('/api/me/reports').query({ limit: 1 }).set('Cookie', student).expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ kind: 'lost', title: '갈색 지갑·카드', place: '본관 3층 복도', date: '2026-10-17' });
    const next = await request(http).get('/api/me/reports').query({ limit: 10, cursor: res.body.nextCursor }).set('Cookie', student).expect(200);
    expect(next.body.items.map((i: { id: string }) => i.id)).toContain(SEED_LOST.earphone.id);
  });

  it('습득 등록자의 목록에는 습득물이 썸네일과 함께 나온다', async () => {
    const finder = await loginAs(app, 's2103@gbsw.hs.kr');
    const res = await request(http).get('/api/me/reports').set('Cookie', finder).expect(200);
    const wallet = res.body.items.find((i: { title: string }) => i.title === '갈색 반지갑');
    expect(wallet).toMatchObject({ kind: 'found', status: 'KEEPING', place: '본관 1층 행정실' });
    expect(wallet.thumbnail.url).toMatch(/^\/api\/uploads\//);
  });

  it('수령 신청 시드 — 무선 이어폰에 s2217 의 PENDING 1건', async () => {
    const res = await request(http).get(`/api/found-items/${SEED_FOUND['무선 이어폰'].id}`).set('Cookie', student).expect(200);
    expect(res.body).toMatchObject({ status: 'CHECKING', myClaim: { status: 'PENDING' } });
  });
});
