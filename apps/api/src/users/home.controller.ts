import { Controller, Get } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { CurrentUser } from '../common/decorators';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  /** ⑨ 홈 — 내 신고 상태, 새 후보, 최근 습득물, (교사) 승인 대기 수 */
  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.home.summary(user);
  }
}
