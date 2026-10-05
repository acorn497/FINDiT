// e2e 테스트는 별도 데이터베이스(findit_test)와 임시 업로드 폴더를 쓴다.
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { testDatabaseUrl } from './test-db';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'findit-uploads-'));
