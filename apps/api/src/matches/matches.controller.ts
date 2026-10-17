import { Controller, Get, Query } from '@nestjs/common';
import { ErrorCode, type AuthUser } from '@findit/shared';
import { AppException } from '../common/app.exception';
import { CurrentUser } from '../common/decorators';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  /** ?lostReportId= — 상위 5개 후보 + 점수 + 항목별 일치 여부 */
  @Get()
  list(@Query('lostReportId') lostReportId: string | undefined, @CurrentUser() user: AuthUser) {
    if (!lostReportId) throw new AppException(400, ErrorCode.VALIDATION_FAILED, 'lostReportId 가 필요합니다');
    return this.matches.forUser(lostReportId, user.id);
  }
}
