import { ArgumentsHost, NotFoundException, PayloadTooLargeException } from '@nestjs/common';
import { AppException } from './app.exception';
import { HttpExceptionFilter } from './http-exception.filter';

function hostFor() {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
  return { res, host };
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  it('AppException 은 code·message·추가 필드를 그대로', () => {
    const { res, host } = hostFor();
    filter.catch(new AppException(429, 'RESEND_TOO_SOON', '잠시 후', { retryAfter: 42 }), host);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ code: 'RESEND_TOO_SOON', message: '잠시 후', retryAfter: 42 });
  });

  it('Nest 기본 예외는 상태별 기본 코드로', () => {
    const { res, host } = hostFor();
    filter.catch(new NotFoundException(), host);
    expect(res.json).toHaveBeenCalledWith({ code: 'NOT_FOUND', message: '찾을 수 없습니다' });
    filter.catch(new PayloadTooLargeException(), host);
    expect(res.json).toHaveBeenLastCalledWith({ code: 'PAYLOAD_TOO_LARGE', message: '파일이 너무 큽니다 (최대 5MB)' });
  });

  it('알 수 없는 오류는 500 INTERNAL_ERROR', () => {
    const { res, host } = hostFor();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    filter.catch(new Error('boom'), host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' });
  });
});
