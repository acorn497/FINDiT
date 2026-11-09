import { Logger, OnModuleInit } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { SOCKET_EVENT, type NotificationNewEvent } from '@findit/shared';
import type { Server, Socket } from 'socket.io';
import { AuthService, SESSION_COOKIE } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';

/** 'a=1; b=2' → { a: '1', b: '2' } */
export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    if (key) out[key] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export const userRoom = (userId: string) => `user:${userId}`;

/**
 * ⑧ 실시간 알림 — /socket.io
 * 연결할 때 세션 쿠키로 사용자를 확인해 그 사용자 방에 넣고, 새 알림이 저장되면 방으로 보낸다.
 */
@WebSocketGateway({ path: '/socket.io' })
export class RealtimeGateway implements OnGatewayConnection, OnModuleInit {
  private readonly logger = new Logger('Realtime');

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly auth: AuthService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    this.notifications.onCreated((notification, userId, unreadCount) => {
      const event: NotificationNewEvent = { notification, unreadCount };
      this.server?.to(userRoom(userId)).emit(SOCKET_EVENT.NOTIFICATION_NEW, event);
    });
  }

  async handleConnection(client: Socket) {
    const token = parseCookies(client.handshake.headers.cookie)[SESSION_COOKIE];
    try {
      if (!token) throw new Error('no session');
      const user = await this.auth.userFromToken(token);
      await client.join(userRoom(user.id));
      client.data.userId = user.id;
    } catch {
      client.emit('unauthorized');
      client.disconnect(true);
    }
  }
}
