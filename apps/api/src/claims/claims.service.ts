import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClaimStatus, ErrorCode, FoundItemStatus } from '@findit/shared';
import { DataSource, type EntityManager } from 'typeorm';
import { AppException } from '../common/app.exception';
import { FoundItem } from '../found-items/found-item.entity';
import { Claim } from './claim.entity';

export const CLAIM_BLOCKED: Partial<Record<FoundItemStatus, string>> = {
  DONE: '이미 주인에게 전달된 물건입니다',
  EXPIRED: '보관 기간(30일)이 지나 신청할 수 없습니다',
};

export const notFound = () => new AppException(404, ErrorCode.NOT_FOUND, '습득물을 찾을 수 없습니다');

/** 물건 행을 잠그고 읽는다 (같은 물건의 신청·승인이 동시에 오면 차례로 처리) */
export async function lockItem(em: EntityManager, id: string) {
  const item = await em.findOne(FoundItem, { where: { id }, lock: { mode: 'pessimistic_write' } });
  if (!item) throw notFound();
  return item;
}

@Injectable()
export class ClaimsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  /** 수령 신청 — 물건은 CHECKING 이 된다. 전달 완료·기간 만료면 409 */
  async create(itemId: string, userId: string) {
    return this.ds.transaction(async (em) => {
      const item = await lockItem(em, itemId);
      const blocked = CLAIM_BLOCKED[item.status];
      if (blocked) throw new AppException(409, ErrorCode.CONFLICT, blocked);
      if (item.reporterId === userId) throw new AppException(409, ErrorCode.CONFLICT, '내가 등록한 물건입니다');

      const pending = await em.findOne(Claim, { where: { foundItemId: itemId, claimantId: userId, status: ClaimStatus.PENDING } });
      if (pending) throw new AppException(409, ErrorCode.CONFLICT, '이미 수령 신청한 물건입니다');

      const claim = await em.save(em.create(Claim, { foundItemId: itemId, claimantId: userId }));
      if (item.status !== FoundItemStatus.CHECKING) {
        await em.update(FoundItem, { id: itemId }, { status: FoundItemStatus.CHECKING });
      }
      return claim;
    });
  }

  /** 신청 취소 — 남은 신청이 없으면 KEEPING 으로 되돌린다 */
  async cancel(itemId: string, userId: string) {
    return this.ds.transaction(async (em) => {
      const item = await lockItem(em, itemId);
      const claim = await em.findOne(Claim, { where: { foundItemId: itemId, claimantId: userId, status: ClaimStatus.PENDING } });
      if (!claim) throw new AppException(404, ErrorCode.NOT_FOUND, '취소할 수령 신청이 없습니다');

      claim.status = ClaimStatus.CANCELLED;
      await em.save(claim);
      const left = await em.count(Claim, { where: { foundItemId: itemId, status: ClaimStatus.PENDING } });
      if (left === 0 && item.status === FoundItemStatus.CHECKING) {
        await em.update(FoundItem, { id: itemId }, { status: FoundItemStatus.KEEPING });
      }
      return claim;
    });
  }

  /** 내 신청 중 가장 최근 것 */
  latestOf(itemId: string, userId: string) {
    return this.ds.getRepository(Claim).findOne({
      where: { foundItemId: itemId, claimantId: userId },
      order: { createdAt: 'DESC' },
    });
  }
}
