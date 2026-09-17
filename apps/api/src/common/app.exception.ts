import { HttpException } from '@nestjs/common';
import type { ApiErrorBody } from '@findit/shared';

/** { code, message } 형태로 응답되는 예외 */
export class AppException extends HttpException {
  constructor(status: number, code: string, message: string, extra: Partial<ApiErrorBody> = {}) {
    super({ code, message, ...extra }, status);
  }
}
