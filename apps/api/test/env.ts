// e2e 테스트는 별도 데이터베이스(findit_test)와 테스트 전용 업로드 폴더를 쓴다.
// 업로드 폴더는 테스트 파일끼리 공유해 시드 사진을 한 번만 만든다.
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { testDatabaseUrl } from './test-db';

process.env.DATABASE_URL = testDatabaseUrl();
process.env.UPLOAD_DIR = join(tmpdir(), 'findit-e2e-uploads');
mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
