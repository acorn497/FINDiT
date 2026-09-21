import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { config } from '../config';
import { Session } from '../auth/session.entity';
import { FoundItem } from '../found-items/found-item.entity';
import { LostReport } from '../lost-reports/lost-report.entity';
import { User } from '../users/user.entity';
import { CreateUsers1789557600000 } from './migrations/1789557600000-CreateUsers';
import { CreateSessions1789641000000 } from './migrations/1789641000000-CreateSessions';
import { CreateLostReportsAndFoundItems1790074800000 } from './migrations/1790074800000-CreateLostReportsAndFoundItems';

/** 엔티티·마이그레이션 목록 — 단계별로 필요한 테이블만 추가한다. */
export const ENTITIES: DataSourceOptions['entities'] = [User, Session, LostReport, FoundItem];
export const MIGRATIONS: DataSourceOptions['migrations'] = [
  CreateUsers1789557600000,
  CreateSessions1789641000000,
  CreateLostReportsAndFoundItems1790074800000,
];

export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    url: config.databaseUrl,
    entities: ENTITIES,
    migrations: MIGRATIONS,
    synchronize: false,
    migrationsRun: true,
    logging: ['error'],
  };
}

/** typeorm CLI 용 */
export default new DataSource(buildDataSourceOptions());
