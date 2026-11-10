import { Module } from '@nestjs/common';
import { FoundItemsModule } from '../found-items/found-items.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminClaimsService } from './admin-claims.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [FoundItemsModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminClaimsService],
})
export class AdminModule {}
