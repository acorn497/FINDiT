import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode, FoundItemStatus, type MatchCandidate, type MatchesResponse } from '@findit/shared';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception';
import { FoundItem } from '../found-items/found-item.entity';
import { FoundItemsService } from '../found-items/found-items.service';
import { LostReport } from '../lost-reports/lost-report.entity';
import { LostReportsService } from '../lost-reports/lost-reports.service';
import { rankCandidates } from './score';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(LostReport) private readonly reports: Repository<LostReport>,
    @InjectRepository(FoundItem) private readonly items: Repository<FoundItem>,
    private readonly found: FoundItemsService,
  ) {}

  /** 내 분실 신고 하나를 읽는다 — 없으면 404, 남의 것이면 403 */
  async ownReport(lostReportId: string, userId: string) {
    if (!UUID_RE.test(lostReportId)) throw new AppException(404, ErrorCode.NOT_FOUND, '분실 신고를 찾을 수 없습니다');
    const report = await this.reports.findOne({ where: { id: lostReportId } });
    if (!report) throw new AppException(404, ErrorCode.NOT_FOUND, '분실 신고를 찾을 수 없습니다');
    if (report.reporterId !== userId) throw new AppException(403, ErrorCode.FORBIDDEN, '내 분실 신고만 볼 수 있습니다');
    return report;
  }

  /** 분실 신고 하나의 후보 — 같은 종류의 보관 중 습득물을 점수로 좁힌다 */
  async candidatesFor(report: LostReport): Promise<MatchCandidate[]> {
    const pool = await this.items.find({ where: { category: report.category, status: FoundItemStatus.KEEPING } });
    const ranked = rankCandidates(report, pool);
    const thumbs = await this.found.thumbnails(ranked.map((c) => c.found.id));
    return ranked.map((c) => ({
      item: {
        ...FoundItemsService.toSummary(c.found, thumbs.get(c.found.id) ?? null),
        color: c.found.color,
        description: c.found.description,
      },
      score: c.score,
      matches: c.matches,
    }));
  }

  async forUser(lostReportId: string, userId: string): Promise<MatchesResponse> {
    const report = await this.ownReport(lostReportId, userId);
    return { lostReport: LostReportsService.toDto(report), candidates: await this.candidatesFor(report) };
  }
}
