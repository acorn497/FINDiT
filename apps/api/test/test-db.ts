/** 실행 중인 DB 와 섞이지 않도록 e2e 전용 데이터베이스 이름을 쓴다. */
export function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const base = new URL(process.env.DATABASE_URL ?? 'postgres://findit:findit@localhost:5432/findit');
  base.pathname = '/findit_test';
  return base.toString();
}
