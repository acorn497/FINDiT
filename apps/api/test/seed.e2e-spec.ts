import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { config } from '../src/config';
import { runSeed } from '../src/database/seeds/seed';
import { SEED_PASSWORD } from '../src/database/seeds/users.seed';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('시드', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    ds = await resetAndSeed(app);
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

  it('습득물 24건 · 첫 페이지는 목업 ④ 와 같은 6건 · 더 보기가 3페이지 이상', async () => {
    const [{ count }] = await ds.query(`SELECT count(*)::int AS count FROM found_items WHERE id::text LIKE '00000000-0000-4000-8001-%'`);
    expect(count).toBe(24);

    const cookie = await loginAs(app, 's2217@gbsw.hs.kr');
    const http = app.getHttpServer();
    const first = await request(http).get('/api/found-items?limit=6').set('Cookie', cookie).expect(200);
    expect(first.body.items.map((i: { title: string; status: string }) => [i.title, i.status])).toEqual([
      ['갈색 반지갑', 'KEEPING'],
      ['무선 이어폰', 'CHECKING'],
      ['초록 우산', 'KEEPING'],
      ['보라색 필통', 'DONE'],
      ['회색 후드집업', 'KEEPING'],
      ['분홍 텀블러', 'EXPIRED'],
    ]);
    expect(first.body.total).toBeGreaterThanOrEqual(24);
    expect(first.body.items[0].thumbnail.url).toMatch(/^\/api\/uploads\/seed-.+\.jpg$/);

    let cursor = first.body.nextCursor;
    let pages = 1;
    while (cursor) {
      const next = await request(http).get('/api/found-items').query({ limit: 6, cursor }).set('Cookie', cookie).expect(200);
      cursor = next.body.nextCursor;
      pages++;
    }
    expect(pages).toBeGreaterThanOrEqual(4);
  });

  it('갈색 반지갑은 사진 2장, 등록 16:24 (KST), 그라데이션 JPEG 파일이 있다', async () => {
    const rows = await ds.query(
      `SELECT p.file_path, p.width, p.sort_order, to_char(f.created_at AT TIME ZONE 'Asia/Seoul', 'MM-DD HH24:MI') AS at
         FROM photos p JOIN found_items f ON f.id = p.found_item_id
        WHERE f.title = '갈색 반지갑' ORDER BY p.sort_order`,
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ width: 800, sort_order: 0, at: '10-17 16:24' });
    for (const r of rows) expect(existsSync(join(config.uploadDir, r.file_path))).toBe(true);
  });
});
