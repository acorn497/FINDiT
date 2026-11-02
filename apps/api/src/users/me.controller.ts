import { Controller, Get, Query } from '@nestjs/common';
import { FoundItemStatus, LostReportStatus, type AuthUser, type ReportKind } from '@findit/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const STATUSES = [...Object.values(LostReportStatus), ...Object.values(FoundItemStatus)];
import { CurrentUser } from '../common/decorators';
import { MeReportsService } from './me-reports.service';

export class MeReportsQuery {
  @IsOptional()
  @IsString()
  cursor?: string;

  /** lost | found — 비우면 둘 다 */
  @IsOptional()
  @IsIn(['lost', 'found'], { message: 'kind 는 lost 또는 found 입니다' })
  kind?: ReportKind;

  /** 분실 신고(OPEN·MATCHED·CLOSED) 또는 습득물(KEEPING·CHECKING·DONE·EXPIRED) 상태 */
  @IsOptional()
  @IsIn(STATUSES, { message: '상태 값이 올바르지 않습니다' })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit: number = 10;
}

@Controller('me')
export class MeController {
  constructor(private readonly reports: MeReportsService) {}

  /** 내 신고·등록 통합 목록 (커서) — ?kind= ?status= */
  @Get('reports')
  list(@CurrentUser() user: AuthUser, @Query() q: MeReportsQuery) {
    return this.reports.list(user.id, q);
  }
}
