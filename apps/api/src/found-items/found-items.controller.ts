import { Body, Controller, Post } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { CurrentUser } from '../common/decorators';
import { CreateFoundItemDto } from './found-items.dto';
import { FoundItemsService } from './found-items.service';

@Controller('found-items')
export class FoundItemsController {
  constructor(private readonly service: FoundItemsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFoundItemDto) {
    return this.service.create(user.id, dto);
  }
}
