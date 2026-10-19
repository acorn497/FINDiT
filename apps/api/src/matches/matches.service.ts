import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ErrorCode,
  FoundItemStatus,
  LostReportStatus,
  type Category,
  type MatchCandidate,
  type MatchesResponse,
} from '@findit/shared';
import { In, Not, Repository } from 'typeorm';
import { AppException } from '../common/app.exception';
import { AppEvents } from '../common/events';
import { FoundItem } from '../found-items/found-item.entity';
import { FoundItemsService } from '../found-items/found-items.service';
import { LostReport } from '../lost-reports/lost-report.entity';
import { LostReportsService } from '../lost-reports/lost-reports.service';
import { UploadsService } from '../uploads/uploads.service';
import { MatchExclusion } from './match-exclusion.entity';
import { rankCandidates } from './score';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class MatchesService implements OnModuleInit {
  constructor(
    @InjectRepository(LostReport) private readonly reports: Repository<LostReport>,
    @InjectRepository(FoundItem) private readonly items: Repository<FoundItem>,
    @InjectRepository(MatchExclusion) private readonly exclusions: Repository<MatchExclusion>,
    private readonly events: AppEvents,
  ) {}

  onModuleInit() {
    // 후보가 달라질 수 있는 변화가 생기면 분실 신고 상태(찾는 중 / 후보 있음)를 다시 맞춘다
    this.events.on('lost-report.saved', async ({ id }) => {
      const report = await this.reports.findOne({ where: { id } });
      if (report) await this.refreshStatus(report);
    });
    this.events.on('found-item.created', ({ category }) => this.refreshCategory(category));
    this.events.on('found-item.status-changed', ({ category }) => this.refreshCategory(category));
  }

  /** 내 분실 신고 하나를 읽는다 — 없으면 404, 남의 것이면 403 */
  async ownReport(lostReportId: string, userId: string) {
    if (!UUID_RE.test(lostReportId)) throw new AppException(404, ErrorCode.NOT_FOUND, '분실 신고를 찾을 수 없습니다');
    const report = await this.reports.findOne({ where: { id: lostReportId } });
    if (!report) throw new AppException(404, ErrorCode.NOT_FOUND, '분실 신고를 찾을 수 없습니다');
    if (report.reporterId !== userId) throw new AppException(403, ErrorCode.FORBIDDEN, '내 분실 신고만 볼 수 있습니다');
    return report;
  }

  /** 점수 계산만 — 같은 종류의 보관 중 습득물 중 제외 기록이 없는 것 */
  async rank(report: LostReport) {
    const [pool, excluded] = await Promise.all([
      this.items.find({ where: { category: report.category, status: FoundItemStatus.KEEPING }, relations: { photos: true } }),
      this.exclusions.find({ where: { lostReportId: report.id } }),
    ]);
    return rankCandidates(report, pool, new Set(excluded.map((e) => e.foundItemId)));
  }

  /** 분실 신고 하나의 후보 (사진은 사람이 눈으로 비교하도록 전부 붙인다) */
  async candidatesFor(report: LostReport): Promise<MatchCandidate[]> {
    const ranked = await this.rank(report);
    return ranked.map((c) => {
      const photos = [...(c.found.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
      return {
        item: {
          ...FoundItemsService.toSummary(c.found, photos[0] ?? null),
          color: c.found.color,
          description: c.found.description,
          photos: photos.map(UploadsService.toDto),
        },
        score: c.score,
        matches: c.matches,
      };
    });
  }

  async forUser(lostReportId: string, userId: string): Promise<MatchesResponse> {
    const report = await this.ownReport(lostReportId, userId);
    return { lostReport: LostReportsService.toDto(report), candidates: await this.candidatesFor(report) };
  }

  /** [이 후보 아님] — 제외 기록을 남기고 이후 조회에서 빼낸다 */
  async exclude(lostReportId: string, foundItemId: string, userId: string) {
    const report = await this.ownReport(lostReportId, userId);
    const item = await this.items.findOne({ where: { id: foundItemId } });
    if (!item) throw new AppException(404, ErrorCode.NOT_FOUND, '습득물을 찾을 수 없습니다');
    await this.exclusions
      .createQueryBuilder()
      .insert()
      .values({ lostReportId, foundItemId })
      .orIgnore()
      .execute();
    await this.refreshStatus(report);
    return { excluded: true as const };
  }

  /** 후보 유무로 OPEN / MATCHED 를 맞춘다 (마감된 신고는 건드리지 않는다) */
  async refreshStatus(report: LostReport) {
    if (report.status === LostReportStatus.CLOSED) return report.status;
    const next = (await this.rank(report)).length > 0 ? LostReportStatus.MATCHED : LostReportStatus.OPEN;
    if (next !== report.status) {
      await this.reports.update({ id: report.id }, { status: next });
      report.status = next;
    }
    return next;
  }

  /** 같은 종류의 열린 분실 신고 전체 */
  async refreshCategory(category: Category) {
    const open = await this.reports.find({ where: { category, status: Not(LostReportStatus.CLOSED) } });
    for (const report of open) await this.refreshStatus(report);
  }

  /** 여러 신고의 현재 후보 수 */
  async candidateCounts(reportIds: string[]) {
    const map = new Map<string, number>();
    if (reportIds.length === 0) return map;
    const reports = await this.reports.find({ where: { id: In(reportIds) } });
    for (const r of reports) map.set(r.id, r.status === LostReportStatus.CLOSED ? 0 : (await this.rank(r)).length);
    return map;
  }
}
