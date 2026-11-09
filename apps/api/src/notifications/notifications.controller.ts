import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { CurrentUser } from '../common/decorators';
import { NotificationsService } from './notifications.service';

export class NotificationListQuery {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

export class MarkReadDto {
  /** 비우면 전체 읽음 */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true, message: '알림 id 가 올바르지 않습니다' })
  ids?: string[];
}

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** 커서 목록 + unreadCount */
  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: NotificationListQuery) {
    return this.notifications.list(user.id, q);
  }

  /** 읽음 처리 (전체 또는 id 배열) */
  @Post('read')
  @HttpCode(200)
  read(@CurrentUser() user: AuthUser, @Body() dto: MarkReadDto) {
    return this.notifications.markRead(user.id, dto.ids);
  }
}
