import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import { mkdirSync } from 'node:fs';
import { config } from './config';
import { UPLOAD_URL_PREFIX } from './uploads/uploads.service';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { createValidationPipe } from './common/validation.pipe';

/** main.ts 와 e2e 테스트가 같은 설정을 쓰도록 한곳에 모은다. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  // 업로드한 사진 정적 서빙 — 파일 이름이 추측 불가능한 uuid 라 로그인 없이 읽는다
  mkdirSync(config.uploadDir, { recursive: true });
  app.use(UPLOAD_URL_PREFIX, express.static(config.uploadDir, { index: false, maxAge: '7d' }));
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  return app;
}
