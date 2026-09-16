import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { config } from './config';
import { runSeed } from './database/seeds/seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  // 마이그레이션은 TypeORM 초기화 때(migrationsRun) 이미 실행됐다.
  if (config.seedOnStart) await runSeed(app.get(DataSource));
  await app.listen(config.port);
}

void bootstrap();
