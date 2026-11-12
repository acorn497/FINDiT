import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { CurrentUser, Public } from '../common/decorators';
import { CreateFoundItemDto } from './found-items.dto';
import { FoundItemListQuery } from './found-items.query';
import { FoundItemsService } from './found-items.service';

@Controller('found-items')
export class FoundItemsController {
  constructor(private readonly service: FoundItemsService) {}

  /**
   * 목록 — ?category &keyword &place &status &overdue &limit(기본 6) &cursor
   * 게시판처럼 로그인 없이도 볼 수 있다 (상세·수령 신청은 로그인 필요).
   */
  @Public()
  @Get()
  list(@Query() q: FoundItemListQuery) {
    return this.service.list(q);
  }

  /** 상세 — 사진 전체, canClaim, 내 신청 상태 */
  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.detail(id, user.id);
  }

  /** 수령 신청 → CHECKING. 전달 완료·기간 만료면 409 */
  @Post(':id/claims')
  @HttpCode(201)
  claim(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.claim(id, user.id);
  }

  /** 신청 취소. 남은 신청이 없으면 KEEPING 복귀 */
  @Delete(':id/claims')
  cancelClaim(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.service.cancelClaim(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFoundItemDto) {
    return this.service.create(user.id, dto);
  }
}
