import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode } from '@findit/shared';
import { AuthService, SESSION_COOKIE } from '../auth/auth.service';
import { AppException } from './app.exception';
import { IS_PUBLIC, type AuthedRequest } from './decorators';

/** 세션 쿠키 확인 — @Public() 이 아닌 모든 경로에 적용된다. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const token: string | undefined = req.cookies?.[SESSION_COOKIE];
    if (!token) throw new AppException(401, ErrorCode.UNAUTHENTICATED, '로그인이 필요합니다');

    req.user = await this.auth.userFromToken(token);
    req.sessionToken = token;
    return true;
  }
}
