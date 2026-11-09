import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule, NotificationsModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
