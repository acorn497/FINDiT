import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoundItem } from '../found-items/found-item.entity';
import { LostReport } from '../lost-reports/lost-report.entity';
import { MatchesModule } from '../matches/matches.module';
import { User } from '../users/user.entity';
import { Notification } from './notification.entity';
import { NotificationTriggersService } from './notification-triggers.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, FoundItem, LostReport, User]), MatchesModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationTriggersService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
