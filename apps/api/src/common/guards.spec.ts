import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@findit/shared';
import type { AuthService } from '../auth/auth.service';
import { IS_PUBLIC, ROLES } from './decorators';
import { RolesGuard } from './roles.guard';
import { SessionGuard } from './session.guard';

const ctxWith = (req: object): ExecutionContext =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }),
  }) as unknown as ExecutionContext;

const reflectorReturning = (map: Record<string, unknown>) =>
  ({ getAllAndOverride: (key: string) => map[key] }) as unknown as Reflector;

describe('SessionGuard', () => {
  const user = { id: 'u1', email: 'a@b.kr', name: '가', role: Role.STUDENT, grade: 1, classNo: 1 };
  const auth = { userFromToken: jest.fn().mockResolvedValue(user) } as unknown as AuthService;

  it('@Public 경로는 쿠키 없이 통과', async () => {
    const guard = new SessionGuard(reflectorReturning({ [IS_PUBLIC]: true }), auth);
    await expect(guard.canActivate(ctxWith({}))).resolves.toBe(true);
  });

  it('쿠키가 없으면 401 UNAUTHENTICATED', async () => {
    const guard = new SessionGuard(reflectorReturning({}), auth);
    await expect(guard.canActivate(ctxWith({ cookies: {} }))).rejects.toMatchObject({
      status: 401,
      response: { code: 'UNAUTHENTICATED' },
    });
  });

  it('유효한 쿠키면 req.user 를 붙인다', async () => {
    const guard = new SessionGuard(reflectorReturning({}), auth);
    const req: Record<string, unknown> = { cookies: { findit_sid: 'tok' } };
    await expect(guard.canActivate(ctxWith(req))).resolves.toBe(true);
    expect(req.user).toEqual(user);
    expect(auth.userFromToken).toHaveBeenCalledWith('tok');
  });
});

describe('RolesGuard', () => {
  it('역할 지정이 없으면 통과', () => {
    expect(new RolesGuard(reflectorReturning({})).canActivate(ctxWith({}))).toBe(true);
  });

  it('TEACHER 경로에 학생이 오면 403', () => {
    const guard = new RolesGuard(reflectorReturning({ [ROLES]: [Role.TEACHER] }));
    expect(() => guard.canActivate(ctxWith({ user: { role: Role.STUDENT } }))).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });

  it('TEACHER 경로에 교사는 통과', () => {
    const guard = new RolesGuard(reflectorReturning({ [ROLES]: [Role.TEACHER] }));
    expect(guard.canActivate(ctxWith({ user: { role: Role.TEACHER } }))).toBe(true);
  });
});
