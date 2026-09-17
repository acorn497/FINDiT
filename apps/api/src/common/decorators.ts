import { createParamDecorator, SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { AuthUser, Role } from '@findit/shared';
import type { Request } from 'express';

export const IS_PUBLIC = 'isPublic';
/** 로그인 없이 접근 가능한 경로 */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
/** 특정 역할만 접근 가능 (아니면 403) */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

export type AuthedRequest = Request & { user?: AuthUser; sessionToken?: string };

/** 가드가 붙여 둔 로그인 사용자 */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user as AuthUser;
});
