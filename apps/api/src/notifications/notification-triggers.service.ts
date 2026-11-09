import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FoundItemStatus, LostReportStatus, NotificationType, Role, lostReportTitle } from '@findit/shared';
import { Between, Not, Repository } from 'typeorm';
import { AppEvents } from '../common/events';
import { FoundItem } from '../found-items/found-item.entity';
import { LostReport } from '../lost-reports/lost-report.entity';
import { MatchesService } from '../matches/matches.service';
import { User } from '../users/user.entity';
import { NotificationsService } from './notifications.service';

/** 보관 기간 임박 알림 — 만료 3일 전부터 */
export const EXPIRING_WITHIN_DAYS = 3;

/**
 * 어떤 일이 생기면 누구에게 어떤 알림을 보낼지.
 * 다른 모듈은 이벤트만 내보내고, 알림 문구는 여기 한곳에서 정한다.
 */
@Injectable()
export class NotificationTriggersService implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger('NotificationTriggers');
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly events: AppEvents,
    private readonly notifications: NotificationsService,
    private readonly matches: MatchesService,
    @InjectRepository(FoundItem) private readonly items: Repository<FoundItem>,
    @InjectRepository(LostReport) private readonly reports: Repository<LostReport>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  onModuleInit() {
    this.events.on('found-item.created', ({ id }) => this.onFoundItemCreated(id));
    this.events.on('claim.created', ({ foundItemId, claimantId }) => this.onClaimCreated(foundItemId, claimantId));
  }

  /** 보관 기간 임박은 기동할 때와 한 시간마다 확인한다 (테스트에서는 직접 부른다) */
  onApplicationBootstrap() {
    if (process.env.NODE_ENV === 'test') return;
    void this.checkExpiring().catch((e) => this.logger.warn(e));
    this.timer = setInterval(() => void this.checkExpiring().catch((e) => this.logger.warn(e)), 60 * 60 * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  /** 새 후보 도착 — 새 습득물이 어떤 분실 신고의 후보(상위 5개)에 들면 그 신고자에게 */
  async onFoundItemCreated(itemId: string) {
    const item = await this.items.findOne({ where: { id: itemId } });
    if (!item) return;
    const reports = await this.reports.find({
      where: { category: item.category, status: Not(LostReportStatus.CLOSED), reporterId: Not(item.reporterId) },
    });
    for (const report of reports) {
      const ranked = await this.matches.rank(report);
      const hit = ranked.find((c) => c.found.id === item.id);
      if (!hit) continue;
      const key = `match:${report.id}:${item.id}`;
      if (await this.notifications.exists(report.reporterId, NotificationType.NEW_MATCH, key)) continue;
      await this.notifications.create({
        userId: report.reporterId,
        type: NotificationType.NEW_MATCH,
        title: '새 후보 도착',
        body: `'${lostReportTitle(report)}' 신고와 비슷한 ${item.title}이(가) 등록되었습니다. (유사도 ${Math.round(hit.score * 100)}%)`,
        link: `/matches?lostReportId=${report.id}`,
        payload: { key, lostReportId: report.id, foundItemId: item.id },
      });
    }
  }

  /** 수령 신청 접수 — 신청한 학생에게 접수 안내, 교사에게 새 신청 알림 */
  async onClaimCreated(itemId: string, claimantId: string) {
    const [item, claimant, teachers] = await Promise.all([
      this.items.findOne({ where: { id: itemId } }),
      this.users.findOne({ where: { id: claimantId } }),
      this.users.find({ where: { role: Role.TEACHER } }),
    ]);
    if (!item || !claimant) return;
    await this.notifications.create({
      userId: claimantId,
      type: NotificationType.CLAIM_RECEIVED,
      title: '수령 신청 접수',
      body: `${item.title} 수령 신청이 접수되었습니다. 담당 선생님이 확인하면 알려 드릴게요.`,
      link: `/found/${item.id}`,
      payload: { foundItemId: item.id },
    });
    for (const teacher of teachers) {
      if (teacher.id === claimantId) continue;
      await this.notifications.create({
        userId: teacher.id,
        type: NotificationType.CLAIM_RECEIVED,
        title: '새 수령 신청',
        body: `${claimant.name} 학생이 ${item.title} 수령을 신청했습니다.`,
        link: '/admin',
        payload: { foundItemId: item.id, claimantId },
      });
    }
  }

  /** 보관 기간 임박 — 만료 3일 안에 드는 보관 중 물건을 등록한 사람에게 한 번 */
  async checkExpiring(now = new Date()) {
    const until = new Date(now.getTime() + EXPIRING_WITHIN_DAYS * 86_400_000);
    const soon = await this.items.find({ where: { status: FoundItemStatus.KEEPING, expiresAt: Between(now, until) } });
    let sent = 0;
    for (const item of soon) {
      const key = `expiring:${item.id}`;
      if (await this.notifications.exists(item.reporterId, NotificationType.EXPIRING, key)) continue;
      const days = Math.max(1, Math.ceil((item.expiresAt.getTime() - now.getTime()) / 86_400_000));
      await this.notifications.create({
        userId: item.reporterId,
        type: NotificationType.EXPIRING,
        title: '보관 기간 임박',
        body: `${item.title} 보관 기간이 ${days}일 남았습니다. 주인이 나타나지 않으면 기간 만료로 처리됩니다.`,
        link: `/found/${item.id}`,
        payload: { key, foundItemId: item.id },
      });
      sent++;
    }
    return sent;
  }
}
