import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { Role, type AuthUser } from '@findit/shared';
import { Transform } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CurrentUser, Roles } from '../common/decorators';
import { AdminClaimsService } from './admin-claims.service';
import { AdminItemsService } from './admin-items.service';

export class RejectClaimDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '거절 사유를 입력해 주세요' })
  @IsNotEmpty({ message: '거절 사유를 입력해 주세요' })
  @MaxLength(200, { message: '사유는 200자 이하로 입력해 주세요' })
  reason: string;
}

export class ExpireDto {
  /** 비우면 보관 기간이 지난 보관 중 물건 전체 */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('4', { each: true, message: '습득물 id 가 올바르지 않습니다' })
  ids?: string[];
}

export class StatsQuery {
  @IsOptional()
  @IsIn(['week', 'month'], { message: 'period 는 week 또는 month 입니다' })
  period: 'week' | 'month' = 'week';
}

/** ⑩ 관리자 — TEACHER 만. 학생은 403 */
@Roles(Role.TEACHER)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly claims: AdminClaimsService,
    private readonly items: AdminItemsService,
  ) {}

  /** 승인 대기 목록 (물건별로 묶음) */
  @Get('claims')
  pending() {
    return this.claims.pending();
  }

  /** 승인 → 물건 DONE, 같은 물건의 다른 신청 자동 거절, 알림 발송 */
  @Post('claims/:id/approve')
  @HttpCode(200)
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.claims.approve(id, user.id);
  }

  /** 거절(사유 필수) → 남은 신청이 없으면 물건 KEEPING 복귀, 알림 발송 */
  @Post('claims/:id/reject')
  @HttpCode(200)
  reject(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RejectClaimDto) {
    return this.claims.reject(id, user.id, dto.reason);
  }

  /** 보관 기간 경과분 일괄 EXPIRED (ids 를 주면 그 물건들만) */
  @Post('found-items/expire')
  @HttpCode(200)
  expire(@Body() dto: ExpireDto) {
    return this.items.expire(dto.ids);
  }

  /** 기간별 등록·처리 건수 요약 */
  @Get('stats')
  stats(@Query() q: StatsQuery) {
    return this.items.stats(q.period);
  }
}
