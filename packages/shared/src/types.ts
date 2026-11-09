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

// ── 목록 · 커서 ─────────────────────────────────────────
/** 커서 페이지 — 마지막 페이지의 nextCursor 는 null */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

/** 습득물 목록 기본 페이지 크기 */
export const FOUND_PAGE_SIZE = 6;

export interface FoundItemSummary {
  id: string;
  title: string;
  category: Category;
  keptAt: string;
  foundPlace: string | null;
  foundDate: string;
  status: FoundItemStatus;
  createdAt: string;
  thumbnail: Photo | null;
}

export interface FoundItemListResponse extends CursorPage<FoundItemSummary> {
  /** 조건에 맞는 전체 건수 */
  total: number;
}

// ── 수령 신청 ───────────────────────────────────────────
export const ClaimStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const;
export type ClaimStatus = (typeof ClaimStatus)[keyof typeof ClaimStatus];

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  PENDING: '승인 대기',
  APPROVED: '승인',
  REJECTED: '거절',
  CANCELLED: '취소',
};

export interface MyClaim {
  id: string;
  status: ClaimStatus;
  rejectReason: string | null;
  createdAt: string;
}

/** GET /found-items/:id */
export interface FoundItemDetail extends FoundItem {
  /** 지금 [내 물건인 것 같아요]를 누를 수 있는지 */
  canClaim: boolean;
  /** 누를 수 없을 때 이유 (전달 완료·기간 만료·내가 등록함) */
  claimBlockedReason: string | null;
  /** 내 수령 신청 중 가장 최근 것 */
  myClaim: MyClaim | null;
  isMine: boolean;
}

// ── 매칭 후보 ───────────────────────────────────────────
/** 매칭 후보 최소 점수 · 개수 */
export const MATCH_MIN_SCORE = 0.35;
export const MATCH_TOP_N = 5;

export interface MatchCandidate {
  item: FoundItemSummary & { color: string | null; description: string | null; photos: Photo[] };
  /** 0~1 */
  score: number;
  /** 항목별 일치 여부 (종류·장소·날짜·색상) */
  matches: { category: boolean; place: boolean; date: boolean; color: boolean };
}

export interface MatchesResponse {
  lostReport: LostReport;
  candidates: MatchCandidate[];
}

// ── 내 신고 관리 ────────────────────────────────────────
export type ReportKind = 'lost' | 'found';

export interface MyReportItem {
  kind: ReportKind;
  id: string;
  /** 습득물은 물건 이름, 분실 신고는 "색상 + 종류" */
  title: string;
  category: Category;
  place: string;
  date: string;
  status: LostReportStatus | FoundItemStatus;
  createdAt: string;
  thumbnail: Photo | null;
  /** 분실 신고의 현재 후보 수 (습득물은 null) */
  candidateCount: number | null;
}

export type MyReportsResponse = CursorPage<MyReportItem>;

/** 분실 신고를 부르는 이름 — "갈색 지갑·카드" */
export function lostReportTitle(r: { color: string; category: Category }): string {
  return [r.color, CATEGORY_LABEL[r.category]].filter(Boolean).join(' ');
}

// ── 알림 ────────────────────────────────────────────────
export const NotificationType = {
  NEW_MATCH: 'NEW_MATCH',
  CLAIM_RECEIVED: 'CLAIM_RECEIVED',
  CLAIM_APPROVED: 'CLAIM_APPROVED',
  CLAIM_REJECTED: 'CLAIM_REJECTED',
  PICKUP_GUIDE: 'PICKUP_GUIDE',
  EXPIRING: 'EXPIRING',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  NEW_MATCH: '새 후보 도착',
  CLAIM_RECEIVED: '수령 신청 접수',
  CLAIM_APPROVED: '신청 승인',
  CLAIM_REJECTED: '신청 거절',
  PICKUP_GUIDE: '수령 안내',
  EXPIRING: '보관 기간 임박',
};

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** 누르면 이동할 화면 */
  link: string | null;
  readAt: string | null;
  createdAt: string;
  payload: Record<string, unknown> | null;
}

export interface NotificationListResponse extends CursorPage<AppNotification> {
  unreadCount: number;
}

/** Socket.IO 이벤트 이름 */
export const SOCKET_EVENT = {
  NOTIFICATION_NEW: 'notification:new',
} as const;

export interface NotificationNewEvent {
  notification: AppNotification;
  unreadCount: number;
}

// ── 홈 요약 ─────────────────────────────────────────────
export interface HomeMatch {
  lostReportId: string;
  lostReportTitle: string;
  candidate: MatchCandidate;
}

/** GET /home/summary — 로그인 직후 첫 화면 */
export interface HomeSummary {
  /** 내 신고 진행 상태 (최근 3건) */
  myReports: MyReportItem[];
  /** 새로 도착한 매칭 후보 (열린 신고마다 1위, 최대 3건) */
  newMatches: HomeMatch[];
  /** 최근 등록된 습득물 */
  recentFound: FoundItemSummary[];
  /** 교사만 — 승인 대기 수 */
  pendingClaims: number | null;
  /** 신고·등록이 하나도 없는 새 사용자 */
  isNewUser: boolean;
}
