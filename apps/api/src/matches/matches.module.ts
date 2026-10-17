import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoundItem } from '../found-items/found-item.entity';
import { FoundItemsModule } from '../found-items/found-items.module';
import { LostReport } from '../lost-reports/lost-report.entity';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';

@Module({
  imports: [TypeOrmModule.forFeature([LostReport, FoundItem]), FoundItemsModule],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
