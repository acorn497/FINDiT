import { parseCookies, userRoom } from './realtime.gateway';

describe('parseCookies', () => {
  it('쿠키 헤더를 나눈다', () => {
    expect(parseCookies('findit_sid=abc%2Bdef; theme=light')).toEqual({ findit_sid: 'abc+def', theme: 'light' });
    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('broken; =x; a=1')).toEqual({ a: '1' });
  });

  it('사용자 방 이름', () => {
    expect(userRoom('u1')).toBe('user:u1');
  });
});
