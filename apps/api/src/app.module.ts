import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database/data-source';
import { HealthModule } from './health/health.module';

@Module({
  imports: [TypeOrmModule.forRootAsync({ useFactory: () => buildDataSourceOptions() }), HealthModule],
})
export class AppModule {}
