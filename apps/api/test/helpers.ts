import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { runSeed } from '../src/database/seeds/seed';
import { SEED_PASSWORD } from '../src/database/seeds/users.seed';

/** 로그인해서 세션 쿠키 문자열을 돌려준다. */
export async function loginAs(app: INestApplication, email: string, password = SEED_PASSWORD): Promise<string> {
  const res = await request(app.getHttpServer()).post('/api/auth/login').send({ email, password }).expect(200);
  const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? [])[0];
  return cookie.split(';')[0];
}

/** 데이터 테이블을 비우고 시드를 다시 넣는다 — 테스트 파일 실행 순서와 상관없이 같은 상태에서 시작한다 */
export async function resetAndSeed(app: INestApplication) {
  const ds = app.get(DataSource);
  await ds.query(`TRUNCATE claims, photos, found_items, lost_reports, sessions RESTART IDENTITY CASCADE`);
  await runSeed(ds);
  return ds;
}
