import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ClaimStatus, FoundItemStatus, type AdminStats, type StatsBucket, type StatsPeriod } from '@findit/shared';
import { Between, DataSource, In, LessThan } from 'typeorm';
import { Claim } from '../claims/claim.entity';
import { dateInSeoul } from '../common/dates';
import { AppEvents } from '../common/events';
import { FoundItem } from '../found-items/found-item.entity';
import { LostReport } from '../lost-reports/lost-report.entity';

const DAY = 86_400_000;
/** 서울 'YYYY-MM-DD' 의 0시 */
const seoulMidnight = (ymd: string) => new Date(`${ymd}T00:00:00+09:00`);

/** 통계 구간 — 최근 n개 (주는 월요일 시작, 월은 1일 시작, 모두 서울 기준) */
export function statsRanges(period: StatsPeriod, now = new Date(), count = 6) {
  const today = dateInSeoul(now);
  const [y, m, d] = today.split('-').map(Number);
  const ranges: { label: string; from: Date; to: Date }[] = [];
  if (period === 'week') {
    const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // 월=0
    const monday = seoulMidnight(today).getTime() - dow * DAY;
    for (let i = count - 1; i >= 0; i--) {
      const from = new Date(monday - i * 7 * DAY);
      const to = new Date(from.getTime() + 7 * DAY);
      const [, fm, fd] = dateInSeoul(from).split('-').map(Number);
      ranges.push({ label: `${fm}월 ${Math.ceil(fd / 7)}주`, from, to });
    }
  } else {
    for (let i = count - 1; i >= 0; i--) {
      const total = y * 12 + (m - 1) - i;
      const fy = Math.floor(total / 12);
      const fm = (total % 12) + 1;
      const ny = Math.floor((total + 1) / 12);
      const nm = ((total + 1) % 12) + 1;
      const from = seoulMidnight(`${fy}-${String(fm).padStart(2, '0')}-01`);
      const to = seoulMidnight(`${ny}-${String(nm).padStart(2, '0')}-01`);
      ranges.push({ label: `${fy}년 ${fm}월`, from, to });
    }
  }
  return ranges;
}

/** ⑩ 보관 중 · 요약 */
@Injectable()
export class AdminItemsService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    private readonly events: AppEvents,
  ) {}

  /** 일괄 만료 — ids 가 없으면 보관 기간(30일)이 지난 보관 중 물건 전체 */
  async expire(ids?: string[], now = new Date()) {
    const repo = this.ds.getRepository(FoundItem);
    const targets = await repo.find({
      where: ids?.length ? { id: In(ids), status: FoundItemStatus.KEEPING } : { status: FoundItemStatus.KEEPING, expiresAt: LessThan(now) },
    });
    if (targets.length === 0) return { expired: 0, ids: [] as string[] };
    await repo.update({ id: In(targets.map((t) => t.id)) }, { status: FoundItemStatus.EXPIRED });
    for (const category of new Set(targets.map((t) => t.category))) {
      await this.events.emit('found-item.status-changed', { id: targets[0].id, category });
    }
    return { expired: targets.length, ids: targets.map((t) => t.id) };
  }

  /** 기간별 등록·처리 건수 */
  async stats(period: StatsPeriod, now = new Date()): Promise<AdminStats> {
    const lost = this.ds.getRepository(LostReport);
    const found = this.ds.getRepository(FoundItem);
    const claims = this.ds.getRepository(Claim);
    const buckets: StatsBucket[] = [];
    for (const r of statsRanges(period, now)) {
      const range = Between(r.from, new Date(r.to.getTime() - 1));
      const [lostReports, foundItems, delivered, expired] = await Promise.all([
        lost.count({ where: { createdAt: range } }),
        found.count({ where: { createdAt: range } }),
        claims.count({ where: { status: ClaimStatus.APPROVED, decidedAt: range } }),
        found.count({ where: { status: FoundItemStatus.EXPIRED, updatedAt: range } }),
      ]);
      buckets.push({ label: r.label, from: r.from.toISOString(), to: r.to.toISOString(), lostReports, foundItems, delivered, expired });
    }
    const rows: { status: FoundItemStatus; count: string }[] = await found
      .createQueryBuilder('f')
      .select('f.status', 'status')
      .addSelect('count(*)', 'count')
      .groupBy('f.status')
      .getRawMany();
    const current = { KEEPING: 0, CHECKING: 0, DONE: 0, EXPIRED: 0 } as Record<FoundItemStatus, number>;
    rows.forEach((row) => (current[row.status] = Number(row.count)));
    const pendingClaims = await claims.count({ where: { status: ClaimStatus.PENDING } });
    return { period, buckets, current, pendingClaims };
  }
}
