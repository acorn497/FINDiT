// e2e 테스트는 별도 데이터베이스(findit_test)를 쓴다.
import { testDatabaseUrl } from './test-db';

process.env.DATABASE_URL = testDatabaseUrl();
