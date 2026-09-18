import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SEED_PASSWORD } from '../src/database/seeds/users.seed';

/** 로그인해서 세션 쿠키 문자열을 돌려준다. */
export async function loginAs(app: INestApplication, email: string, password = SEED_PASSWORD): Promise<string> {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password }).expect(200);
  const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? [])[0];
  return cookie.split(';')[0];
}
