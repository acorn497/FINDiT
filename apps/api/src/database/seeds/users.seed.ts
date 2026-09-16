import { Role } from '@findit/shared';
import * as bcrypt from 'bcryptjs';
import type { DataSource } from 'typeorm';

/** 시드 계정 — 비밀번호는 모두 findit1234 */
export const SEED_PASSWORD = 'findit1234';

export const SEED_USERS = [
  { id: '00000000-0000-4000-8000-000000000001', email: 's2217@gbsw.hs.kr', name: '이지우', role: Role.STUDENT, grade: 2, classNo: 2 },
  { id: '00000000-0000-4000-8000-000000000002', email: 's2103@gbsw.hs.kr', name: '박서준', role: Role.STUDENT, grade: 2, classNo: 1 },
  { id: '00000000-0000-4000-8000-000000000003', email: 'teacher@gbsw.hs.kr', name: '최은영', role: Role.TEACHER, grade: null, classNo: null },
] as const;

export const SEED_USER = {
  student: SEED_USERS[0],
  finder: SEED_USERS[1],
  teacher: SEED_USERS[2],
};

export async function seedUsers(ds: DataSource) {
  const existing: { id: string }[] = await ds.query(`SELECT id FROM users WHERE id = ANY($1)`, [SEED_USERS.map((u) => u.id)]);
  const have = new Set(existing.map((r) => r.id));
  const missing = SEED_USERS.filter((u) => !have.has(u.id));
  if (missing.length === 0) return 0;

  const hash = await bcrypt.hash(SEED_PASSWORD, 10);
  for (const u of missing) {
    await ds.query(
      `INSERT INTO users (id, email, password_hash, name, role, grade, class_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
      [u.id, u.email, hash, u.name, u.role, u.grade, u.classNo],
    );
  }
  return missing.length;
}
