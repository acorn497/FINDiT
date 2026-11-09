import { Global, Injectable, Module } from '@nestjs/common';
import type { Category } from '@findit/shared';

/** 모듈끼리 서로 import 하지 않고 변화를 알리는 이벤트 */
export interface AppEventMap {
  /** 습득물이 새로 등록됨 */
  'found-item.created': { id: string; category: Category };
  /** 습득물 상태가 바뀜 (신청·취소·승인·만료) — 같은 종류 분실 신고의 후보가 달라질 수 있다 */
  'found-item.status-changed': { id: string; category: Category };
  /** 분실 신고가 만들어지거나 고쳐짐 */
  'lost-report.saved': { id: string };
  /** 수령 신청이 들어옴 */
  'claim.created': { claimId: string; foundItemId: string; claimantId: string };
}

type Handler<K extends keyof AppEventMap> = (payload: AppEventMap[K]) => Promise<void> | void;

/** 순서대로 기다리는 단순한 이벤트 버스 — 응답 전에 후속 처리가 끝나도록 await 한다 */
@Injectable()
export class AppEvents {
  private readonly handlers = new Map<keyof AppEventMap, Handler<never>[]>();

  on<K extends keyof AppEventMap>(event: K, handler: Handler<K>) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler as Handler<never>);
    this.handlers.set(event, list);
  }

  async emit<K extends keyof AppEventMap>(event: K, payload: AppEventMap[K]) {
    for (const handler of this.handlers.get(event) ?? []) {
      await (handler as Handler<K>)(payload);
    }
  }
}

@Global()
@Module({ providers: [AppEvents], exports: [AppEvents] })
export class EventsModule {}
