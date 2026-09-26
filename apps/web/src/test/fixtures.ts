import type { AuthUser } from '@findit/shared';

export const STUDENT: AuthUser = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 's2217@gbsw.hs.kr',
  name: '이지우',
  role: 'STUDENT',
  grade: 2,
  classNo: 2,
};

export const TEACHER: AuthUser = {
  id: '00000000-0000-4000-8000-000000000003',
  email: 'teacher@gbsw.hs.kr',
  name: '최은영',
  role: 'TEACHER',
  grade: null,
  classNo: null,
};
