import { Bell, ClipboardList, House, Package, ShieldCheck, SquarePlus, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** 하위 경로까지 활성으로 볼지 여부 */
  end?: boolean;
}

/** 하단 탭 5개 — 홈 · 습득물 · 등록 · 내 신고 · 알림 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '홈', icon: House, end: true },
  { to: '/found', label: '습득물', icon: Package },
  { to: '/register', label: '등록', icon: SquarePlus },
  { to: '/me/reports', label: '내 신고', icon: ClipboardList },
  { to: '/notifications', label: '알림', icon: Bell },
];

/** 교사 전용 메뉴 — 학생 계정에는 보이지 않는다 */
export const TEACHER_NAV_ITEMS: NavItem[] = [{ to: '/admin', label: '관리자', icon: ShieldCheck }];
