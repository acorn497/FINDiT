import { decodeCursor, encodeCursor, paginate } from './cursor';

const ID = '00000000-0000-4000-8001-000000000001';

describe('cursor', () => {
  it('인코딩·디코딩 왕복', () => {
    const at = new Date('2026-10-17T07:24:00.123Z');
    const c = encodeCursor(at, ID);
    expect(Buffer.from(c, 'base64').toString()).toBe(`2026-10-17T07:24:00.123Z|${ID}`);
    expect(decodeCursor(c)).toEqual({ createdAt: at, id: ID });
    expect(encodeCursor('2026-10-17T07:24:00.123Z', ID)).toBe(c);
  });

  it.each([
    ['base64 가 아닌 문자', '!!!'],
    ['구분자 없음', Buffer.from('2026-10-17T07:24:00.000Z').toString('base64')],
    ['날짜가 아님', Buffer.from(`yesterday|${ID}`).toString('base64')],
    ['id 가 uuid 가 아님', Buffer.from('2026-10-17T07:24:00.000Z|1').toString('base64')],
    ['ISO 정규형이 아님', Buffer.from(`2026-10-17|${ID}`).toString('base64')],
  ])('잘못된 커서는 400 BAD_CURSOR — %s', (_, cursor) => {
    expect(() => decodeCursor(cursor)).toThrow(expect.objectContaining({ status: 400, response: expect.objectContaining({ code: 'BAD_CURSOR' }) }));
  });

  it('paginate — limit+1 개면 다음 커서, 아니면 null', () => {
    const rows = [1, 2, 3].map((n) => ({ id: ID, createdAt: new Date(Date.UTC(2026, 9, 10 - n)) }));
    const page = paginate(rows, 2);
    expect(page.items).toHaveLength(2);
    expect(decodeCursor(page.nextCursor!).createdAt).toEqual(rows[1].createdAt);
    expect(paginate(rows, 3).nextCursor).toBeNull();
    expect(paginate([], 3)).toEqual({ items: [], nextCursor: null });
  });
});
