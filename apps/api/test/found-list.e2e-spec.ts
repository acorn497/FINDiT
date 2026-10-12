import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { runSeed } from '../src/database/seeds/seed';
import { createTestApp } from './app';
import { loginAs } from './helpers';

describe('GET /api/found-items — 조건', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let cookie: string;
  const tag = `list${Date.now()}`;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await runSeed(app.get(DataSource));
    cookie = await loginAs(app, 's2103@gbsw.hs.kr');
    const make = (body: object) => request(http).post('/api/found-items').set('Cookie', cookie).send(body).expect(201);
    await make({ category: 'WALLET_CARD', keptAt: '본관 1층 행정실', foundDate: '2026-10-01', title: `${tag} 갈색 지갑`, description: '모서리 100%_긁힘' });
    await make({ category: 'ELECTRONICS', keptAt: '2학년 교무실', foundPlace: '별관 2층', foundDate: '2026-10-01', title: `${tag} 이어폰` });
    await make({ category: 'ELECTRONICS', keptAt: '체육관 탈의실', foundDate: '2026-10-01', title: `${tag} 보조배터리` });
  });

  afterAll(async () => {
    await app.close();
  });

  it('로그인 없이는 401', async () => {
    await request(http).get('/api/found-items').expect(401);
  });

  it('검색어 — 이름·특징, 건수 total 은 조건 기준', async () => {
    const res = await request(http).get('/api/found-items').query({ keyword: tag }).set('Cookie', cookie).expect(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items.map((i: { title: string }) => i.title)).toEqual([`${tag} 보조배터리`, `${tag} 이어폰`, `${tag} 갈색 지갑`]);
    expect(res.body.nextCursor).toBeNull();
    expect(res.body.items[0]).toMatchObject({ status: 'KEEPING', thumbnail: null });
  });

  it('% 와 _ 는 문자 그대로 찾는다', async () => {
    const res = await request(http).get('/api/found-items').query({ keyword: '100%_' }).set('Cookie', cookie).expect(200);
    expect(res.body.items.map((i: { title: string }) => i.title)).toEqual([`${tag} 갈색 지갑`]);
  });

  it('종류 + 장소', async () => {
    const res = await request(http)
      .get('/api/found-items')
      .query({ keyword: tag, category: 'ELECTRONICS', place: '별관' })
      .set('Cookie', cookie)
      .expect(200);
    expect(res.body).toMatchObject({ total: 1, items: [{ title: `${tag} 이어폰` }] });
  });

  it('limit 과 커서로 이어 받는다', async () => {
    const first = await request(http).get('/api/found-items').query({ keyword: tag, limit: 2 }).set('Cookie', cookie).expect(200);
    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toEqual(expect.any(String));
    const second = await request(http)
      .get('/api/found-items')
      .query({ keyword: tag, limit: 2, cursor: first.body.nextCursor })
      .set('Cookie', cookie)
      .expect(200);
    expect(second.body.items.map((i: { title: string }) => i.title)).toEqual([`${tag} 갈색 지갑`]);
    expect(second.body.nextCursor).toBeNull();
  });

  it('잘못된 커서·값은 400', async () => {
    const bad = await request(http).get('/api/found-items').query({ cursor: 'abc' }).set('Cookie', cookie).expect(400);
    expect(bad.body.code).toBe('BAD_CURSOR');
    await request(http).get('/api/found-items').query({ category: 'PHONE' }).set('Cookie', cookie).expect(400);
    await request(http).get('/api/found-items').query({ limit: 100 }).set('Cookie', cookie).expect(400);
  });
});
