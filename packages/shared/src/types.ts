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

// ── 물건 종류 ───────────────────────────────────────────
export const Category = {
  WALLET_CARD: 'WALLET_CARD',
  ELECTRONICS: 'ELECTRONICS',
  CLOTHING: 'CLOTHING',
  STATIONERY: 'STATIONERY',
  ETC: 'ETC',
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const CATEGORY_LABEL: Record<Category, string> = {
  WALLET_CARD: '지갑·카드',
  ELECTRONICS: '전자기기',
  CLOTHING: '의류',
  STATIONERY: '문구',
  ETC: '기타',
};
export const CATEGORIES = Object.keys(CATEGORY_LABEL) as Category[];

// ── 습득물 상태 ─────────────────────────────────────────
export const FoundItemStatus = {
  KEEPING: 'KEEPING',
  CHECKING: 'CHECKING',
  DONE: 'DONE',
  EXPIRED: 'EXPIRED',
} as const;
export type FoundItemStatus = (typeof FoundItemStatus)[keyof typeof FoundItemStatus];

export const FOUND_STATUS_LABEL: Record<FoundItemStatus, string> = {
  KEEPING: '보관 중',
  CHECKING: '확인 중',
  DONE: '전달 완료',
  EXPIRED: '기간 만료',
};

/** 습득물 보관 기간(일) — 지나면 관리자가 만료 처리한다 */
export const KEEPING_DAYS = 30;

// ── 분실 신고 상태 ──────────────────────────────────────
export const LostReportStatus = {
  OPEN: 'OPEN',
  MATCHED: 'MATCHED',
  CLOSED: 'CLOSED',
} as const;
export type LostReportStatus = (typeof LostReportStatus)[keyof typeof LostReportStatus];

export const LOST_STATUS_LABEL: Record<LostReportStatus, string> = {
  OPEN: '찾는 중',
  MATCHED: '후보 있음',
  CLOSED: '마감',
};

// ── 잃어버린 시간대 ─────────────────────────────────────
export const TimeSlot = {
  BEFORE_SCHOOL: 'BEFORE_SCHOOL',
  LUNCH: 'LUNCH',
  AFTER_SCHOOL: 'AFTER_SCHOOL',
  UNKNOWN: 'UNKNOWN',
} as const;
export type TimeSlot = (typeof TimeSlot)[keyof typeof TimeSlot];

export const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  BEFORE_SCHOOL: '등교 전',
  LUNCH: '점심시간',
  AFTER_SCHOOL: '방과 후',
  UNKNOWN: '모르겠음',
};

// ── 분실 신고 · 습득물 ──────────────────────────────────
export interface CreateLostReportBody {
  category: Category;
  lostPlace: string;
  /** YYYY-MM-DD, 오늘 이후 불가 */
  lostDate: string;
  timeSlot?: TimeSlot;
  color: string;
  description?: string;
}

export interface LostReport {
  id: string;
  category: Category;
  lostPlace: string;
  lostDate: string;
  timeSlot: TimeSlot;
  color: string;
  description: string | null;
  status: LostReportStatus;
  reporterId: string;
  createdAt: string;
}

export interface CreateFoundItemBody {
  category: Category;
  /** 맡긴 장소 */
  keptAt: string;
  /** YYYY-MM-DD, 오늘 이후 불가 */
  foundDate: string;
  title?: string;
  foundPlace?: string;
  color?: string;
  description?: string;
  photoIds?: string[];
}

export interface Photo {
  id: string;
  url: string;
  width: number;
  height: number;
}

export interface FoundItem {
  id: string;
  title: string;
  category: Category;
  keptAt: string;
  foundPlace: string | null;
  foundDate: string;
  color: string | null;
  description: string | null;
  status: FoundItemStatus;
  reporterId: string;
  createdAt: string;
  expiresAt: string;
  photos: Photo[];
}
