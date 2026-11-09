import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { AppNotification, NotificationListResponse, NotificationType } from '@findit/shared';
import { In, IsNull, Repository } from 'typeorm';
import { decodeCursor, paginate } from '../common/cursor';
import { Notification } from './notification.entity';

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  payload?: Record<string, unknown> | null;
}

/** 새 알림이 저장될 때 실시간으로 내보내는 쪽(게이트웨이)이 구독한다 */
export type NotificationListener = (n: AppNotification, userId: string, unreadCount: number) => void;

@Injectable()
export class NotificationsService {
  private readonly listeners: NotificationListener[] = [];

  constructor(@InjectRepository(Notification) private readonly repo: Repository<Notification>) {}

  onCreated(listener: NotificationListener) {
    this.listeners.push(listener);
  }

  async create(input: NewNotification) {
    const saved = await this.repo.save(
      this.repo.create({
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
        payload: input.payload ?? null,
      }),
    );
    const dto = NotificationsService.toDto(saved);
    const unread = await this.unreadCount(input.userId);
    this.listeners.forEach((l) => l(dto, input.userId, unread));
    return dto;
  }

  unreadCount(userId: string) {
    return this.repo.count({ where: { userId, readAt: IsNull() } });
  }

  /** 시간순(최신 먼저) 커서 목록 + 읽지 않은 수 */
  async list(userId: string, opts: { cursor?: string; limit: number }): Promise<NotificationListResponse> {
    const qb = this.repo.createQueryBuilder('n').where('n.user_id = :userId', { userId });
    if (opts.cursor) {
      const c = decodeCursor(opts.cursor);
      qb.andWhere('(n.created_at, n.id) < (:cAt, :cId)', { cAt: c.createdAt, cId: c.id });
    }
    const rows = await qb.orderBy('n.created_at', 'DESC').addOrderBy('n.id', 'DESC').take(opts.limit + 1).getMany();
    const { items, nextCursor } = paginate(rows, opts.limit);
    return { items: items.map(NotificationsService.toDto), nextCursor, unreadCount: await this.unreadCount(userId) };
  }

  /** 읽음 처리 — ids 가 없으면 전체 */
  async markRead(userId: string, ids?: string[]) {
    const where = ids?.length ? { userId, id: In(ids), readAt: IsNull() } : { userId, readAt: IsNull() };
    await this.repo.update(where, { readAt: new Date() });
    return { unreadCount: await this.unreadCount(userId) };
  }

  /** 같은 종류의 알림을 이미 보냈는지 (중복 방지) */
  async exists(userId: string, type: NotificationType, key: string) {
    return this.repo
      .createQueryBuilder('n')
      .where('n.user_id = :userId AND n.type = :type', { userId, type })
      .andWhere(`n.payload ->> 'key' = :key`, { key })
      .getExists();
  }

  static toDto(n: Notification): AppNotification {
    return {
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      readAt: n.readAt ? n.readAt.toISOString() : null,
      createdAt: n.createdAt.toISOString(),
      payload: n.payload,
    };
  }
}
