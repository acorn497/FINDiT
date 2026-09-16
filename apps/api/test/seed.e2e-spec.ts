import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { runSeed } from '../src/database/seeds/seed';
import { SEED_PASSWORD } from '../src/database/seeds/users.seed';
import { createTestApp } from './app';

describe('시드', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('계정 3개를 넣고, 다시 실행해도 늘어나지 않는다 (멱등)', async () => {
    await runSeed(ds);
    await runSeed(ds);
    const rows: { email: string; role: string; password_hash: string }[] = await ds.query(
      `SELECT email, role, password_hash FROM users WHERE email LIKE '%@gbsw.hs.kr' ORDER BY email`,
    );
    expect(rows.map((r) => [r.email, r.role])).toEqual([
      ['s2103@gbsw.hs.kr', 'STUDENT'],
      ['s2217@gbsw.hs.kr', 'STUDENT'],
      ['teacher@gbsw.hs.kr', 'TEACHER'],
    ]);
    await expect(bcrypt.compare(SEED_PASSWORD, rows[0].password_hash)).resolves.toBe(true);
  });
});
