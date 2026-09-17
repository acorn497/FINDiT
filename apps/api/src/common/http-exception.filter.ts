import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ErrorCode, type ApiErrorBody } from '@findit/shared';
import type { Response } from 'express';

const DEFAULT_CODE: Record<number, string> = {
  400: ErrorCode.VALIDATION_FAILED,
  401: ErrorCode.UNAUTHENTICATED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.CONFLICT,
  413: ErrorCode.PAYLOAD_TOO_LARGE,
  415: ErrorCode.UNSUPPORTED_MEDIA_TYPE,
  429: ErrorCode.RESEND_TOO_SOON,
};

const DEFAULT_MESSAGE: Record<number, string> = {
  400: '요청 값이 올바르지 않습니다',
  401: '로그인이 필요합니다',
  403: '권한이 없습니다',
  404: '찾을 수 없습니다',
  409: '현재 상태에서는 처리할 수 없습니다',
  413: '파일이 너무 큽니다 (최대 5MB)',
  415: '이미지 파일만 올릴 수 있습니다',
  429: '잠시 후 다시 시도해 주세요',
};

/** 모든 오류를 { code, message } 로 통일한다. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body: ApiErrorBody =
        typeof raw === 'object' && raw !== null && 'code' in raw
          ? (raw as ApiErrorBody)
          : {
              code: DEFAULT_CODE[status] ?? `HTTP_${status}`,
              message: DEFAULT_MESSAGE[status] ?? exception.message,
            };
      res.status(status).json(body);
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ code: ErrorCode.INTERNAL_ERROR, message: '서버 오류가 발생했습니다' } satisfies ApiErrorBody);
  }
}
