import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { ClaimStatus, LostReportStatus, Role, lostReportTitle, type AuthUser, type HomeMatch, type HomeSummary } from '@findit/shared';
import { DataSource, Not, Repository } from 'typeorm';
import { Claim } from '../claims/claim.entity';
import { FoundItemsService } from '../found-items/found-items.service';
import { LostReport } from '../lost-reports/lost-report.entity';
import { MatchesService } from '../matches/matches.service';
import { MeReportsService } from './me-reports.service';

/** ⑨ 홈 요약 — 내 신고 상태 → 새 매칭 후보 → 최근 습득물 (+ 교사: 승인 대기 수) */
@Injectable()
export class HomeService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(LostReport) private readonly reports: Repository<LostReport>,
    private readonly me: MeReportsService,
    private readonly matches: MatchesService,
    private readonly found: FoundItemsService,
  ) {}

  async summary(user: AuthUser): Promise<HomeSummary> {
    const [mine, recent, open] = await Promise.all([
      this.me.list(user.id, { limit: 3 }),
      this.found.list({ limit: 6 }),
      this.reports.find({
        where: { reporterId: user.id, status: Not(LostReportStatus.CLOSED) },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    const newMatches: HomeMatch[] = [];
    for (const report of open) {
      const [top] = await this.matches.candidatesFor(report);
      if (top) newMatches.push({ lostReportId: report.id, lostReportTitle: lostReportTitle(report), candidate: top });
    }
    newMatches.sort((a, b) => b.candidate.item.createdAt.localeCompare(a.candidate.item.createdAt));

    const pendingClaims =
      user.role === Role.TEACHER
        ? await this.ds.getRepository(Claim).count({ where: { status: ClaimStatus.PENDING } })
        : null;

    return {
      myReports: mine.items,
      newMatches: newMatches.slice(0, 3),
      recentFound: recent.items,
      pendingClaims,
      isNewUser: mine.items.length === 0,
    };
  }
}
