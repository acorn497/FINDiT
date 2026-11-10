import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClaimStatus, ErrorCode, FoundItemStatus, NotificationType, type AdminClaimGroup } from '@findit/shared';
import { DataSource, In } from 'typeorm';
import { Claim } from '../claims/claim.entity';
import { lockItem } from '../claims/claims.service';
import { AppException } from '../common/app.exception';
import { AppEvents } from '../common/events';
import { FoundItem } from '../found-items/found-item.entity';
import { FoundItemsService } from '../found-items/found-items.service';
import { NotificationsService } from '../notifications/notifications.service';

export const AUTO_REJECT_REASON = '같은 물건의 다른 신청이 승인되었습니다';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** ⑩ 승인 대기 — 교사가 수령 신청을 승인·거절한다 */
@Injectable()
export class AdminClaimsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly found: FoundItemsService,
    private readonly notifications: NotificationsService,
    private readonly events: AppEvents,
  ) {}

  /** PENDING 신청을 물건별로 묶는다 — 먼저 들어온 신청이 있는 물건부터 */
  async pending(): Promise<AdminClaimGroup[]> {
    const claims = await this.ds.getRepository(Claim).find({
      where: { status: ClaimStatus.PENDING },
      relations: { claimant: true, foundItem: true },
      order: { createdAt: 'ASC' },
    });
    const groups = new Map<string, { item: FoundItem; claims: Claim[] }>();
    for (const c of claims) {
      const g = groups.get(c.foundItemId) ?? { item: c.foundItem, claims: [] };
      g.claims.push(c);
      groups.set(c.foundItemId, g);
    }
    const thumbs = await this.found.thumbnails([...groups.keys()]);
    return [...groups.values()].map(({ item, claims: list }) => ({
      item: FoundItemsService.toSummary(item, thumbs.get(item.id) ?? null),
      claims: list.map((c) => ({
        id: c.id,
        claimant: {
          id: c.claimant.id,
          name: c.claimant.name,
          email: c.claimant.email,
          grade: c.claimant.grade,
          classNo: c.claimant.classNo,
        },
        createdAt: c.createdAt.toISOString(),
      })),
    }));
  }

  private async pendingClaim(claimId: string) {
    if (!UUID_RE.test(claimId)) throw new AppException(404, ErrorCode.NOT_FOUND, '수령 신청을 찾을 수 없습니다');
    const claim = await this.ds.getRepository(Claim).findOne({ where: { id: claimId } });
    if (!claim) throw new AppException(404, ErrorCode.NOT_FOUND, '수령 신청을 찾을 수 없습니다');
    if (claim.status !== ClaimStatus.PENDING) {
      throw new AppException(409, ErrorCode.CONFLICT, '이미 처리된 수령 신청입니다');
    }
    return claim;
  }

  /**
   * 승인 → 물건 DONE(전달 완료). 같은 물건의 다른 PENDING 신청은 자동 거절된다.
   * 승인된 학생에게는 수령 안내를, 자동 거절된 학생에게는 거절 알림을 보낸다.
   */
  async approve(claimId: string, teacherId: string) {
    const target = await this.pendingClaim(claimId);
    const { item, rejected } = await this.ds.transaction(async (em) => {
      const item = await lockItem(em, target.foundItemId);
      const claim = await em.findOneOrFail(Claim, { where: { id: claimId } });
      if (claim.status !== ClaimStatus.PENDING) throw new AppException(409, ErrorCode.CONFLICT, '이미 처리된 수령 신청입니다');
      if (item.status === FoundItemStatus.DONE || item.status === FoundItemStatus.EXPIRED) {
        throw new AppException(409, ErrorCode.CONFLICT, '이미 전달되었거나 보관 기간이 지난 물건입니다');
      }
      const now = new Date();
      const others = await em.find(Claim, { where: { foundItemId: item.id, status: ClaimStatus.PENDING } });
      const rejected = others.filter((c) => c.id !== claimId);
      if (rejected.length) {
        await em.update(
          Claim,
          { id: In(rejected.map((c) => c.id)) },
          { status: ClaimStatus.REJECTED, rejectReason: AUTO_REJECT_REASON, decidedBy: teacherId, decidedAt: now },
        );
      }
      await em.update(Claim, { id: claimId }, { status: ClaimStatus.APPROVED, decidedBy: teacherId, decidedAt: now });
      await em.update(FoundItem, { id: item.id }, { status: FoundItemStatus.DONE });
      return { item, rejected };
    });

    await this.notifications.create({
      userId: target.claimantId,
      type: NotificationType.CLAIM_APPROVED,
      title: '신청 승인',
      body: `${item.title} 수령 신청이 승인되었습니다. ${item.keptAt}에서 학생증을 보여 주고 받아 가세요.`,
      link: `/found/${item.id}`,
      payload: { foundItemId: item.id, claimId },
    });
    for (const r of rejected) {
      await this.notifications.create({
        userId: r.claimantId,
        type: NotificationType.CLAIM_REJECTED,
        title: '신청 거절',
        body: `${item.title} 수령 신청이 거절되었습니다 — ${AUTO_REJECT_REASON}`,
        link: `/found/${item.id}`,
        payload: { foundItemId: item.id, claimId: r.id },
      });
    }
    await this.events.emit('found-item.status-changed', { id: item.id, category: item.category });
    return { approved: claimId, rejected: rejected.map((r) => r.id), itemStatus: FoundItemStatus.DONE };
  }

  /** 거절(사유 필수) → 남은 신청이 없으면 물건은 KEEPING(보관 중)으로 돌아간다. 사유는 알림에 담긴다. */
  async reject(claimId: string, teacherId: string, reason: string) {
    const target = await this.pendingClaim(claimId);
    const { item, itemStatus } = await this.ds.transaction(async (em) => {
      const item = await lockItem(em, target.foundItemId);
      await em.update(Claim, { id: claimId }, { status: ClaimStatus.REJECTED, rejectReason: reason, decidedBy: teacherId, decidedAt: new Date() });
      const left = await em.count(Claim, { where: { foundItemId: item.id, status: ClaimStatus.PENDING } });
      let itemStatus = item.status;
      if (left === 0 && item.status === FoundItemStatus.CHECKING) {
        itemStatus = FoundItemStatus.KEEPING;
        await em.update(FoundItem, { id: item.id }, { status: itemStatus });
      }
      return { item, itemStatus };
    });

    await this.notifications.create({
      userId: target.claimantId,
      type: NotificationType.CLAIM_REJECTED,
      title: '신청 거절',
      body: `${item.title} 수령 신청이 거절되었습니다 — ${reason}`,
      link: `/found/${item.id}`,
      payload: { foundItemId: item.id, claimId, reason },
    });
    await this.events.emit('found-item.status-changed', { id: item.id, category: item.category });
    return { rejected: claimId, itemStatus };
  }
}
