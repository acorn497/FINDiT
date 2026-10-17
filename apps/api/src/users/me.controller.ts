import { Controller, Get, Query } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { CurrentUser } from '../common/decorators';
import { MeReportsService } from './me-reports.service';

export class MeReportsQuery {
  @IsOptional()
  @IsString()
  cursor?: string;

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

  /** 내 신고·등록 통합 목록 (커서) */
  @Get('reports')
  list(@CurrentUser() user: AuthUser, @Query() q: MeReportsQuery) {
    return this.reports.list(user.id, q);
  }
}
