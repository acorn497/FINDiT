import { Body, Controller, Post } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import { CurrentUser } from '../common/decorators';
import { CreateLostReportDto } from './lost-reports.dto';
import { LostReportsService } from './lost-reports.service';

@Controller('lost-reports')
export class LostReportsController {
  constructor(private readonly service: LostReportsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLostReportDto) {
    return this.service.create(user.id, dto);
  }
}
