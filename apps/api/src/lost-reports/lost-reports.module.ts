import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LostReport } from './lost-report.entity';
import { LostReportsController } from './lost-reports.controller';
import { LostReportsService } from './lost-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([LostReport])],
  controllers: [LostReportsController],
  providers: [LostReportsService],
  exports: [LostReportsService],
})
export class LostReportsModule {}
