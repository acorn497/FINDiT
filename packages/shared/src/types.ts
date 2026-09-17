/**
 * FINDiT 공용 타입 — web 과 api 가 함께 쓰는 enum, API 응답 타입, 한글 라벨의 단일 출처.
 */

// ── 역할 ────────────────────────────────────────────────
export const Role = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: '학생',
  TEACHER: '교사',
};

// ── 오류 응답 ───────────────────────────────────────────
/** 모든 API 오류는 이 형태로 통일한다. */
export interface ApiErrorBody {
  code: string;
  message: string;
  /** 429 재요청 대기 시간(초) */
  retryAfter?: number;
}

// ── 인증 ────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  grade: number | null;
  classNo: number | null;
}

export interface CheckEmailResponse {
  exists: true;
  name: string;
}

export interface PasswordResetResponse {
  sent: true;
  /** 다음 재발송까지 남은 시간(초) */
  retryAfter: number;
}

/** 비밀번호 재설정 메일 재발송 대기 시간(초) */
export const PASSWORD_RESET_COOLDOWN_SEC = 60;

/** API 오류 코드 */
export const ErrorCode = {
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  BAD_CURSOR: 'BAD_CURSOR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA_TYPE: 'UNSUPPORTED_MEDIA_TYPE',
  RESEND_TOO_SOON: 'RESEND_TOO_SOON',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
