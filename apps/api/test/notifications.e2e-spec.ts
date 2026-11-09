import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationsService } from '../src/notifications/notifications.service';
import { SEED_USER } from '../src/database/seeds/users.seed';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('알림 API', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let cookie: string;
  let service: NotificationsService;

  beforeAll(async () => {
    app = await createTestApp();
    http = app.getHttpServer();
    await resetAndSeed(app);
    cookie = await loginAs(app, 's2103@gbsw.hs.kr');
    service = app.get(NotificationsService);
    for (let i = 0; i < 3; i++) {
      await service.create({ userId: SEED_USER.finder.id, type: 'PICKUP_GUIDE', title: `안내 ${i}`, body: `본문 ${i}`, link: '/found' });
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('최신순 커서 목록과 읽지 않은 수', async () => {
    const first = await request(http).get('/api/notifications').query({ limit: 2 }).set('Cookie', cookie).expect(200);
    expect(first.body.items.map((n: { title: string }) => n.title)).toEqual(['안내 2', '안내 1']);
    expect(first.body.unreadCount).toBe(3);
    const second = await request(http).get('/api/notifications').query({ limit: 2, cursor: first.body.nextCursor }).set('Cookie', cookie).expect(200);
    expect(second.body.items.map((n: { title: string }) => n.title)).toEqual(['안내 0']);
    expect(second.body.nextCursor).toBeNull();
  });

  it('id 를 골라 읽음 처리 → 전체 읽음 처리', async () => {
    const list = await request(http).get('/api/notifications').set('Cookie', cookie).expect(200);
    const [newest] = list.body.items;
    const one = await request(http).post('/api/notifications/read').set('Cookie', cookie).send({ ids: [newest.id] }).expect(200);
    expect(one.body).toEqual({ unreadCount: 2 });
    const after = await request(http).get('/api/notifications').set('Cookie', cookie).expect(200);
    expect(after.body.items[0].readAt).toEqual(expect.any(String));
    expect(after.body.items[1].readAt).toBeNull();
    const all = await request(http).post('/api/notifications/read').set('Cookie', cookie).send({}).expect(200);
    expect(all.body).toEqual({ unreadCount: 0 });
  });

  it('남의 알림은 보이지 않고 읽음 처리도 되지 않는다', async () => {
    const other = await loginAs(app, 'teacher@gbsw.hs.kr');
    const mine = await request(http).get('/api/notifications').set('Cookie', cookie).expect(200);
    const res = await request(http).get('/api/notifications').set('Cookie', other).expect(200);
    expect(res.body.items.map((n: { id: string }) => n.id)).not.toContain(mine.body.items[0].id);
    await request(http).post('/api/notifications/read').set('Cookie', other).send({ ids: ['x'] }).expect(400);
  });

  it('로그인 없이는 401', async () => {
    await request(http).get('/api/notifications').expect(401);
  });
});
