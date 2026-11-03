import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { CurrentUser } from '../common/decorators';
import { CreateLostReportDto, UpdateLostReportDto } from './lost-reports.dto';
import { LostReportsService } from './lost-reports.service';

@Controller('lost-reports')
export class LostReportsController {
  constructor(private readonly service: LostReportsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLostReportDto) {
    return this.service.create(user.id, dto);
  }

  /** 본인 신고 하나 (수정 화면 채우기) */
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.get(id, user.id);
  }

  /** 수정 — 본인만, 타인 403 */
  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: UpdateLostReportDto) {
    return this.service.update(id, user.id, dto);
  }

  /** 삭제 — 본인만 */
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.remove(id, user.id);
  }

  /** 찾음 처리(마감) → CLOSED */
  @Post(':id/close')
  @HttpCode(200)
  close(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.close(id, user.id);
  }
}
