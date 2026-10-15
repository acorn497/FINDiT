import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { SEED_FOUND } from '../src/database/seeds/found-items.seed';
import { runSeed } from '../src/database/seeds/seed';
import { createTestApp } from './app';
import { loginAs } from './helpers';

describe('습득물 상세 · 수령 신청', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let student: string;
  let finder: string;

  const wallet = SEED_FOUND['갈색 반지갑'].id;
  const pencilCase = SEED_FOUND['보라색 필통'].id;
  const tumbler = SEED_FOUND['분홍 텀블러'].id;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    ds = app.get(DataSource);
    await runSeed(ds);
    student = await loginAs(app, 's2217@gbsw.hs.kr');
    finder = await loginAs(app, 's2103@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  it('상세 — 사진 전체(순서대로)와 정보, 신청 가능', async () => {
    const res = await request(http).get(`/api/found-items/${wallet}`).set('Cookie', student).expect(200);
    expect(res.body).toMatchObject({
      title: '갈색 반지갑',
      keptAt: '본관 1층 행정실',
      foundPlace: '본관 3층 복도',
      foundDate: '2026-10-17',
      description: '모서리 긁힘, 단추 잠금',
      status: 'KEEPING',
      canClaim: true,
      claimBlockedReason: null,
      myClaim: null,
      isMine: false,
    });
    expect(res.body.photos).toHaveLength(2);
  });

  it('없는 id 는 404 (uuid 가 아니어도)', async () => {
    await request(http).get('/api/found-items/00000000-0000-4000-8000-999999999999').set('Cookie', student).expect(404);
    const res = await request(http).get('/api/found-items/abc').set('Cookie', student).expect(404);
    expect(res.body).toEqual({ code: 'NOT_FOUND', message: '습득물을 찾을 수 없습니다' });
  });

  it('신청 → CHECKING, 중복 신청 409, 취소 → KEEPING 복귀', async () => {
    const claimed = await request(http).post(`/api/found-items/${wallet}/claims`).set('Cookie', student).expect(201);
    expect(claimed.body).toMatchObject({ status: 'CHECKING', canClaim: false, myClaim: { status: 'PENDING' } });

    const dup = await request(http).post(`/api/found-items/${wallet}/claims`).set('Cookie', student).expect(409);
    expect(dup.body).toEqual({ code: 'CONFLICT', message: '이미 수령 신청한 물건입니다' });

    const cancelled = await request(http).delete(`/api/found-items/${wallet}/claims`).set('Cookie', student).expect(200);
    expect(cancelled.body).toMatchObject({ status: 'KEEPING', canClaim: true, myClaim: { status: 'CANCELLED' } });

    await request(http).delete(`/api/found-items/${wallet}/claims`).set('Cookie', student).expect(404);
  });

  it('다른 신청이 남아 있으면 취소해도 CHECKING 유지', async () => {
    const teacher = await loginAs(app, 'teacher@gbsw.hs.kr');
    await request(http).post(`/api/found-items/${wallet}/claims`).set('Cookie', student).expect(201);
    await request(http).post(`/api/found-items/${wallet}/claims`).set('Cookie', teacher).expect(201);
    const res = await request(http).delete(`/api/found-items/${wallet}/claims`).set('Cookie', student).expect(200);
    expect(res.body.status).toBe('CHECKING');
    await request(http).delete(`/api/found-items/${wallet}/claims`).set('Cookie', teacher).expect(200);
  });

  it('DONE·EXPIRED 물건은 409 와 이유', async () => {
    const done = await request(http).post(`/api/found-items/${pencilCase}/claims`).set('Cookie', student).expect(409);
    expect(done.body.message).toBe('이미 주인에게 전달된 물건입니다');
    const expired = await request(http).post(`/api/found-items/${tumbler}/claims`).set('Cookie', student).expect(409);
    expect(expired.body.message).toBe('보관 기간(30일)이 지나 신청할 수 없습니다');
    const detail = await request(http).get(`/api/found-items/${pencilCase}`).set('Cookie', student).expect(200);
    expect(detail.body).toMatchObject({ canClaim: false, claimBlockedReason: '이미 주인에게 전달된 물건입니다' });
  });

  it('내가 등록한 물건은 신청할 수 없다', async () => {
    const res = await request(http).post(`/api/found-items/${wallet}/claims`).set('Cookie', finder).expect(409);
    expect(res.body.message).toBe('내가 등록한 물건입니다');
    const detail = await request(http).get(`/api/found-items/${wallet}`).set('Cookie', finder).expect(200);
    expect(detail.body).toMatchObject({ isMine: true, canClaim: false });
  });

  it('DB 도 같은 사용자의 PENDING 중복을 막는다 (부분 유니크 인덱스)', async () => {
    const [{ id: userId }] = await ds.query(`SELECT id FROM users WHERE email = 's2217@gbsw.hs.kr'`);
    const insert = () => ds.query(`INSERT INTO claims (found_item_id, claimant_id) VALUES ($1, $2)`, [SEED_FOUND['초록 우산'].id, userId]);
    await insert();
    await expect(insert()).rejects.toThrow(/uq_claims_pending/);
    await ds.query(`DELETE FROM claims WHERE found_item_id = $1`, [SEED_FOUND['초록 우산'].id]);
  });
});

describe('커서 페이지네이션 — 중간에 새 등록이 끼어들어도', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let cookie: string;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await runSeed(app.get(DataSource));
    cookie = await loginAs(app, 's2103@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  it('3페이지 이상 넘겨 받아도 중복·누락 0건', async () => {
    const all: string[] = (
      await request(http).get('/api/found-items').query({ limit: 30 }).set('Cookie', cookie).expect(200)
    ).body.items.map((i: { id: string }) => i.id);

    const seen: string[] = [];
    let cursor: string | null = null;
    let pages = 0;
    do {
      const res: request.Response = await request(http)
        .get('/api/found-items')
        .query(cursor ? { limit: 6, cursor } : { limit: 6 })
        .set('Cookie', cookie)
        .expect(200);
      seen.push(...res.body.items.map((i: { id: string }) => i.id));
      cursor = res.body.nextCursor;
      pages++;
      if (pages === 1) {
        // 첫 페이지를 받은 뒤 새 물건이 등록된다 — 페이지 번호 방식이면 하나가 밀려 중복된다
        await request(http)
          .post('/api/found-items')
          .set('Cookie', cookie)
          .send({ category: 'ETC', keptAt: '행정실', foundDate: '2026-10-15', title: '끼어든 물건' })
          .expect(201);
      }
    } while (cursor && pages < 20);

    expect(pages).toBeGreaterThanOrEqual(3);
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toEqual(all.slice(0, seen.length));
    expect(seen.length).toBe(all.length);
  });
});
