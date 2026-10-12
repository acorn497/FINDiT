import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { CurrentUser } from '../common/decorators';
import { CreateFoundItemDto } from './found-items.dto';
import { FoundItemListQuery } from './found-items.query';
import { FoundItemsService } from './found-items.service';

@Controller('found-items')
export class FoundItemsController {
  constructor(private readonly service: FoundItemsService) {}

  /** 목록 — ?category &keyword &place &status &limit(기본 6) &cursor */
  @Get()
  list(@Query() q: FoundItemListQuery) {
    return this.service.list(q);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFoundItemDto) {
    return this.service.create(user.id, dto);
  }
}
