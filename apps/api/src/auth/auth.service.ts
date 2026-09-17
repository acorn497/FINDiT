import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode, type AuthUser } from '@findit/shared';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { AppException } from '../common/app.exception';
import { UsersService } from '../users/users.service';
import { Session } from './session.entity';

export const SESSION_COOKIE = 'findit_sid';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
  ) {}

  /** 1단계 — 계정 확인 */
  async checkEmail(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new AppException(404, ErrorCode.USER_NOT_FOUND, '등록되지 않은 계정입니다');
    return { exists: true as const, name: user.name };
  }

  /** 2단계 — 비밀번호 확인 후 세션 발급 */
  async login(email: string, password: string, userAgent?: string) {
    const user = await this.users.findWithPassword(email);
    if (!user) throw new AppException(401, ErrorCode.USER_NOT_FOUND, '등록되지 않은 계정입니다');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new AppException(401, ErrorCode.WRONG_PASSWORD, '비밀번호가 올바르지 않습니다');

    const token = randomBytes(32).toString('base64url');
    await this.sessions.insert({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: userAgent?.slice(0, 300) ?? null,
    });
    return { token, user: UsersService.toAuthUser(user) };
  }

  /** 쿠키 토큰 → 사용자. 만료된 세션은 지우고 401 */
  async userFromToken(token: string): Promise<AuthUser> {
    const session = await this.sessions.findOne({ where: { tokenHash: hashToken(token) }, relations: { user: true } });
    if (!session) throw new AppException(401, ErrorCode.UNAUTHENTICATED, '로그인이 필요합니다');
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.sessions.delete({ id: session.id });
      throw new AppException(401, ErrorCode.SESSION_EXPIRED, '로그인이 만료되었습니다. 다시 로그인해 주세요');
    }
    return UsersService.toAuthUser(session.user);
  }

  async logout(token: string | undefined) {
    if (token) await this.sessions.delete({ tokenHash: hashToken(token) });
  }
}
