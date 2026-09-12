import { Client } from 'pg';
import { testDatabaseUrl } from './test-db';

/** e2e 시작 전에 테스트 DB 를 만들고 스키마를 비운다. 마이그레이션은 앱이 뜰 때 실행된다. */
export default async function globalSetup() {
  const url = new URL(testDatabaseUrl());
  const dbName = url.pathname.slice(1);

  const admin = new URL(url.toString());
  admin.pathname = '/postgres';
  const adminClient = new Client({ connectionString: admin.toString() });
  await adminClient.connect();
  const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rowCount === 0) await adminClient.query(`CREATE DATABASE "${dbName}"`);
  await adminClient.end();

  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  await client.query('DROP SCHEMA IF EXISTS public CASCADE');
  await client.query('CREATE SCHEMA public');
  await client.end();
}
