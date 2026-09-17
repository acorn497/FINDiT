import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { ErrorCode } from '@findit/shared';
import { AppException } from './app.exception';

function firstMessage(errors: ValidationError[]): string {
  for (const e of errors) {
    if (e.constraints) return Object.values(e.constraints)[0];
    if (e.children?.length) return firstMessage(e.children);
  }
  return '요청 값이 올바르지 않습니다';
}

/** DTO 검사 — 첫 오류 하나만 { code: VALIDATION_FAILED, message } 로 돌려준다. */
export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => new AppException(400, ErrorCode.VALIDATION_FAILED, firstMessage(errors)),
  });
}
