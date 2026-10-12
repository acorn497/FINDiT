import { ErrorCode } from '@findit/shared';
import { AppException } from './app.exception';

/**
 * 커서 — 정렬 created_at DESC, id DESC 기준의 마지막 항목.
 * 형식: base64("<created_at ISO>|<id>")
 */
export interface Cursor {
  createdAt: Date;
  id: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(createdAt: Date | string, id: string): string {
  const iso = typeof createdAt === 'string' ? new Date(createdAt).toISOString() : createdAt.toISOString();
  return Buffer.from(`${iso}|${id}`, 'utf8').toString('base64');
}

/** 잘못된 커서는 400 BAD_CURSOR */
export function decodeCursor(cursor: string): Cursor {
  const bad = () => new AppException(400, ErrorCode.BAD_CURSOR, '잘못된 커서입니다');
  if (!/^[A-Za-z0-9+/=_-]+$/.test(cursor)) throw bad();
  const text = Buffer.from(cursor, 'base64').toString('utf8');
  const sep = text.indexOf('|');
  if (sep < 0) throw bad();
  const iso = text.slice(0, sep);
  const id = text.slice(sep + 1);
  const createdAt = new Date(iso);
  if (Number.isNaN(createdAt.getTime()) || createdAt.toISOString() !== iso || !UUID_RE.test(id)) throw bad();
  return { createdAt, id };
}

/** limit+1 개를 읽은 결과에서 다음 커서를 만든다 */
export function paginate<T extends { createdAt: Date | string; id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return { items, nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null };
}
