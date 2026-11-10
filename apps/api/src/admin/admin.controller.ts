import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Role, type AuthUser } from '@findit/shared';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurrentUser, Roles } from '../common/decorators';
import { AdminClaimsService } from './admin-claims.service';

export class RejectClaimDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: '거절 사유를 입력해 주세요' })
  @IsNotEmpty({ message: '거절 사유를 입력해 주세요' })
  @MaxLength(200, { message: '사유는 200자 이하로 입력해 주세요' })
  reason: string;
}

/** ⑩ 관리자 — TEACHER 만. 학생은 403 */
@Roles(Role.TEACHER)
@Controller('admin')
export class AdminController {
  constructor(private readonly claims: AdminClaimsService) {}

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
}
