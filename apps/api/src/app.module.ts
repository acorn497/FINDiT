import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './common/events';
import { buildDataSourceOptions } from './database/data-source';
import { FoundItemsModule } from './found-items/found-items.module';
import { HealthModule } from './health/health.module';
import { LostReportsModule } from './lost-reports/lost-reports.module';
import { MatchesModule } from './matches/matches.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';
import { UploadsModule } from './uploads/uploads.module';
import { MeModule } from './users/me.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() }),
    EventsModule,
    HealthModule,
    UsersModule,
    AuthModule,
    LostReportsModule,
    FoundItemsModule,
    UploadsModule,
    MatchesModule,
    NotificationsModule,
    RealtimeModule,
    MeModule,
  ],
})
export class AppModule {}
