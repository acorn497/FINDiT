import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { config } from '../config';

/** 엔티티·마이그레이션 목록 — 단계별로 필요한 테이블만 추가한다. */
export const ENTITIES: DataSourceOptions['entities'] = [];
export const MIGRATIONS: DataSourceOptions['migrations'] = [];

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
