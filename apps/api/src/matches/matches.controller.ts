import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ErrorCode, type AuthUser } from '@findit/shared';
import { AppException } from '../common/app.exception';
import { CurrentUser } from '../common/decorators';
import { CreateExclusionDto } from './matches.dto';
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

  /** [이 후보 아님] — 이후 조회에서 제외 */
  @Post('exclusions')
  @HttpCode(201)
  exclude(@Body() dto: CreateExclusionDto, @CurrentUser() user: AuthUser) {
    return this.matches.exclude(dto.lostReportId, dto.foundItemId, user.id);
  }
}
