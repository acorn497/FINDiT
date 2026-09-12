import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './app';

describe('GET /api/health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('DB 연결까지 확인해 ok/up 을 돌려준다', async () => {
    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up' });
  });
});
