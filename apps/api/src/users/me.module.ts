import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Claim } from '../claims/claim.entity';
import { FoundItemsModule } from '../found-items/found-items.module';
import { LostReport } from '../lost-reports/lost-report.entity';
import { MatchesModule } from '../matches/matches.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { MeController } from './me.controller';
import { MeReportsService } from './me-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([LostReport, Claim]), FoundItemsModule, MatchesModule],
  controllers: [MeController, HomeController],
  providers: [MeReportsService, HomeService],
})
export class MeModule {}
