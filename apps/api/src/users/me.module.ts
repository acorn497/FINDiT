import { Module } from '@nestjs/common';
import { FoundItemsModule } from '../found-items/found-items.module';
import { MatchesModule } from '../matches/matches.module';
import { MeController } from './me.controller';
import { MeReportsService } from './me-reports.service';

@Module({
  imports: [FoundItemsModule, MatchesModule],
  controllers: [MeController],
  providers: [MeReportsService],
})
export class MeModule {}
