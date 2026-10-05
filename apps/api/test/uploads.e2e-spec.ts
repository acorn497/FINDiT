import type { INestApplication } from '@nestjs/common';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { config } from '../src/config';
import { runSeed } from '../src/database/seeds/seed';
import { createTestApp } from './app';
import { loginAs } from './helpers';
import { tinyPng } from './images';

describe('POST /api/uploads', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let cookie: string;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    ds = app.get(DataSource);
    await runSeed(ds);
    cookie = await loginAs(app, 's2103@gbsw.hs.kr');
  });

  afterAll(async () => {
    await app.close();
  });

  it('로그인 없이는 401', async () => {
    await request(http).post('/api/uploads').attach('file', tinyPng(), 'a.png').expect(401);
  });

  it('사진 1장을 올리면 id·url·크기를 돌려주고 정적으로 읽을 수 있다', async () => {
    const res = await request(http).post('/api/uploads').set('Cookie', cookie).attach('file', tinyPng(3, 2), 'a.png').expect(201);
    expect(res.body).toMatchObject({ width: 3, height: 2 });
    expect(res.body.url).toMatch(/^\/api\/uploads\/[0-9a-f-]{36}\.png$/);
    const rows = await ds.query(`SELECT found_item_id, bytes FROM photos WHERE id = $1`, [res.body.id]);
    expect(rows[0].found_item_id).toBeNull();
    expect(rows[0].bytes).toBeGreaterThan(0);

    const file = await request(http).get(res.body.url).expect(200);
    expect(file.headers['content-type']).toBe('image/png');
  });

  it('없는 파일은 404 { code, message }', async () => {
    const res = await request(http).get('/api/uploads/nope.png').set('Cookie', cookie).expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('5MB 초과는 413', async () => {
    const big = Buffer.alloc(5 * 1024 * 1024 + 10, 1);
    const res = await request(http)
      .post('/api/uploads')
      .set('Cookie', cookie)
      .attach('file', big, { filename: 'big.jpg', contentType: 'image/jpeg' })
      .expect(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('이미지가 아니면 415 (MIME)', async () => {
    const res = await request(http)
      .post('/api/uploads')
      .set('Cookie', cookie)
      .attach('file', Buffer.from('hello'), { filename: 'a.txt', contentType: 'text/plain' })
      .expect(415);
    expect(res.body).toEqual({ code: 'UNSUPPORTED_MEDIA_TYPE', message: '이미지 파일만 올릴 수 있습니다' });
  });

  it('이미지라고 속인 파일도 415 이고 저장하지 않는다', async () => {
    const before = existsSync(config.uploadDir) ? readdirSync(config.uploadDir).length : 0;
    await request(http)
      .post('/api/uploads')
      .set('Cookie', cookie)
      .attach('file', Buffer.from('not really a jpeg'), { filename: 'fake.jpg', contentType: 'image/jpeg' })
      .expect(415);
    expect(readdirSync(config.uploadDir).length).toBe(before);
    expect(join(config.uploadDir)).toBeTruthy();
  });

  it('파일이 없으면 400', async () => {
    const res = await request(http).post('/api/uploads').set('Cookie', cookie).field('x', '1').expect(400);
    expect(res.body.message).toBe('사진 파일을 첨부해 주세요');
  });
});
