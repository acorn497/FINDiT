import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('인증 /api/auth', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    ds = app.get(DataSource);
    await resetAndSeed(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /check-email', () => {
    it('등록된 계정이면 { exists, name }', async () => {
      const res = await request(http).post('/api/auth/check-email').send({ email: 'S2217@gbsw.hs.kr' }).expect(200);
      expect(res.body).toEqual({ exists: true, name: '이지우' });
    });

    it('미등록이면 404 USER_NOT_FOUND', async () => {
      const res = await request(http).post('/api/auth/check-email').send({ email: 'nobody@gbsw.hs.kr' }).expect(404);
      expect(res.body).toEqual({ code: 'USER_NOT_FOUND', message: '등록되지 않은 계정입니다' });
    });

    it('형식이 틀리면 400 VALIDATION_FAILED (첫 오류 하나)', async () => {
      const res = await request(http).post('/api/auth/check-email').send({ email: 'abc' }).expect(400);
      expect(res.body).toEqual({ code: 'VALIDATION_FAILED', message: '이메일 형식이 아닙니다' });
    });
  });

  describe('POST /login', () => {
    it('성공하면 HttpOnly 세션 쿠키와 사용자 정보', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: 's2217@gbsw.hs.kr', password: 'findit1234' })
        .expect(200);
      expect(res.body).toMatchObject({ email: 's2217@gbsw.hs.kr', name: '이지우', role: 'STUDENT' });
      expect(res.body.passwordHash).toBeUndefined();
      const cookie = ([] as string[]).concat(res.headers['set-cookie'])[0];
      expect(cookie).toMatch(/^findit_sid=/);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
    });

    it('비밀번호가 틀리면 401 WRONG_PASSWORD', async () => {
      const res = await request(http)
        .post('/api/auth/login')
        .send({ email: 's2217@gbsw.hs.kr', password: 'wrong-password' })
        .expect(401);
      expect(res.body.code).toBe('WRONG_PASSWORD');
    });

    it('없는 계정이면 401 USER_NOT_FOUND', async () => {
      const res = await request(http).post('/api/auth/login').send({ email: 'x@gbsw.hs.kr', password: 'x' }).expect(401);
      expect(res.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('GET /me · 세션 가드', () => {
    it('쿠키가 없으면 401 UNAUTHENTICATED', async () => {
      const res = await request(http).get('/api/auth/me').expect(401);
      expect(res.body).toEqual({ code: 'UNAUTHENTICATED', message: '로그인이 필요합니다' });
    });

    it('위조된 쿠키도 401', async () => {
      await request(http).get('/api/auth/me').set('Cookie', 'findit_sid=forged').expect(401);
    });

    it('로그인 쿠키로 { id, name, role }', async () => {
      const cookie = await loginAs(app, 'teacher@gbsw.hs.kr');
      const res = await request(http).get('/api/auth/me').set('Cookie', cookie).expect(200);
      expect(res.body).toMatchObject({ name: '최은영', role: 'TEACHER' });
    });

    it('만료된 세션은 401 SESSION_EXPIRED 이고 세션을 지운다', async () => {
      const cookie = await loginAs(app, 's2103@gbsw.hs.kr');
      await ds.query(`UPDATE sessions SET expires_at = now() - interval '1 minute'`);
      const res = await request(http).get('/api/auth/me').set('Cookie', cookie).expect(401);
      expect(res.body.code).toBe('SESSION_EXPIRED');
      await request(http).get('/api/auth/me').set('Cookie', cookie).expect(401, {
        code: 'UNAUTHENTICATED',
        message: '로그인이 필요합니다',
      });
    });
  });

  describe('POST /logout', () => {
    it('세션을 지우고 쿠키를 비운다', async () => {
      const cookie = await loginAs(app, 's2217@gbsw.hs.kr');
      const res = await request(http).post('/api/auth/logout').set('Cookie', cookie).expect(200);
      expect(([] as string[]).concat(res.headers['set-cookie'])[0]).toMatch(/findit_sid=;/);
      await request(http).get('/api/auth/me').set('Cookie', cookie).expect(401);
    });
  });

  describe('POST /password-reset', () => {
    it('첫 요청은 보내고, 60초 안의 재요청은 429 + retryAfter', async () => {
      const first = await request(http).post('/api/auth/password-reset').send({ email: 's2217@gbsw.hs.kr' }).expect(200);
      expect(first.body).toEqual({ sent: true, retryAfter: 60 });
      const again = await request(http).post('/api/auth/password-reset').send({ email: 's2217@gbsw.hs.kr' }).expect(429);
      expect(again.body.code).toBe('RESEND_TOO_SOON');
      expect(again.body.retryAfter).toBeGreaterThan(55);
      expect(again.body.retryAfter).toBeLessThanOrEqual(60);
    });
  });

  it('없는 API 경로는 404 { code, message }', async () => {
    const cookie = await loginAs(app, 's2217@gbsw.hs.kr');
    const res = await request(http).get('/api/nope').set('Cookie', cookie).expect(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
