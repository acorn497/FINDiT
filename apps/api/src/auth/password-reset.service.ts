import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode, PASSWORD_RESET_COOLDOWN_SEC, type PasswordResetResponse } from '@findit/shared';
import { AppException } from '../common/app.exception';
import { UsersService } from '../users/users.service';

/**
 * 비밀번호 재설정 메일 요청.
 * 실제 메일 발송은 학교 메일 연동 범위 밖이라 기록만 남기고,
 * 재발송 대기 60초는 서버에서 강제한다 (재요청 시 429 + retryAfter).
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger('PasswordReset');
  private readonly lastSentAt = new Map<string, number>();

  constructor(private readonly users: UsersService) {}

  async request(email: string, now = Date.now()): Promise<PasswordResetResponse> {
    const user = await this.users.findByEmail(email);
    if (!user) throw new AppException(404, ErrorCode.USER_NOT_FOUND, '등록되지 않은 계정입니다');

    const last = this.lastSentAt.get(user.id);
    const cooldownMs = PASSWORD_RESET_COOLDOWN_SEC * 1000;
    if (last !== undefined && now - last < cooldownMs) {
      const retryAfter = Math.ceil((cooldownMs - (now - last)) / 1000);
      throw new AppException(429, ErrorCode.RESEND_TOO_SOON, `${retryAfter}초 후에 다시 보낼 수 있습니다`, { retryAfter });
    }

    this.lastSentAt.set(user.id, now);
    this.logger.log(`재설정 안내 발송 → ${user.email}`);
    return { sent: true, retryAfter: PASSWORD_RESET_COOLDOWN_SEC };
  }
}
