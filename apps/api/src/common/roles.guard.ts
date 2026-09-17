import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode, type Role } from '@findit/shared';
import { AppException } from './app.exception';
import { ROLES, type AuthedRequest } from './decorators';

/** 역할 가드 — @Roles(TEACHER) 경로에 다른 역할이 오면 403 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!roles || roles.length === 0) return true;
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user || !roles.includes(user.role)) {
      throw new AppException(403, ErrorCode.FORBIDDEN, '권한이 없습니다');
    }
    return true;
  }
}
