import type { INestApplication } from '@nestjs/common';
import type { AddressInfo } from 'node:net';
import { io, type Socket } from 'socket.io-client';
import { SEED_USER } from '../src/database/seeds/users.seed';
import { NotificationsService } from '../src/notifications/notifications.service';
import { createTestApp } from './app';
import { loginAs, resetAndSeed } from './helpers';

describe('Socket.IO 실시간 알림', () => {
  let app: INestApplication;
  let url: string;
  const sockets: Socket[] = [];

  const connect = (cookie?: string) => {
    const s = io(url, { path: '/socket.io', transports: ['websocket'], extraHeaders: cookie ? { Cookie: cookie } : {}, reconnection: false });
    sockets.push(s);
    return s;
  };

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(0);
    url = `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`;
    await resetAndSeed(app);
  });

  afterAll(async () => {
    sockets.forEach((s) => s.close());
    await app.close();
  });

  it('로그인 쿠키로 연결하면 내 방에 들어가 새 알림을 바로 받는다', async () => {
    const cookie = await loginAs(app, 's2217@gbsw.hs.kr');
    const socket = connect(cookie);
    await new Promise<void>((resolve) => socket.on('connect', () => resolve()));
    // 방에 들어가는 handleConnection 이 끝날 시간을 준다
    await new Promise((r) => setTimeout(r, 100));

    const received = new Promise<{ notification: { title: string }; unreadCount: number }>((resolve) =>
      socket.on('notification:new', resolve),
    );
    await app.get(NotificationsService).create({
      userId: SEED_USER.student.id,
      type: 'PICKUP_GUIDE',
      title: '실시간 테스트',
      body: '본문',
    });
    const event = await received;
    expect(event.notification.title).toBe('실시간 테스트');
    expect(event.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('다른 사람의 알림은 받지 않는다', async () => {
    const cookie = await loginAs(app, 's2103@gbsw.hs.kr');
    const socket = connect(cookie);
    await new Promise<void>((resolve) => socket.on('connect', () => resolve()));
    await new Promise((r) => setTimeout(r, 100));
    const got: unknown[] = [];
    socket.on('notification:new', (e) => got.push(e));
    await app.get(NotificationsService).create({ userId: SEED_USER.student.id, type: 'PICKUP_GUIDE', title: '남의 알림', body: '-' });
    await new Promise((r) => setTimeout(r, 200));
    expect(got).toHaveLength(0);
  });

  it('쿠키가 없으면 연결을 끊는다', async () => {
    const socket = connect();
    const reason = await new Promise<string>((resolve) => socket.on('disconnect', (r) => resolve(r)));
    expect(reason).toBe('io server disconnect');
  });
});
