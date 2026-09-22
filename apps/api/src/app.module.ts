import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { buildDataSourceOptions } from './database/data-source';
import { FoundItemsModule } from './found-items/found-items.module';
import { HealthModule } from './health/health.module';
import { LostReportsModule } from './lost-reports/lost-reports.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() }),
    HealthModule,
    UsersModule,
    AuthModule,
    LostReportsModule,
    FoundItemsModule,
  ],
})
export class AppModule {}
