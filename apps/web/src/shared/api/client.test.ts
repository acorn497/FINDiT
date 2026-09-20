import { mockApi } from '../../test/mockApi';
import { api, ApiError } from './client';

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('/api 접두어·쿠키·JSON 본문으로 부른다', async () => {
    const { fetchMock } = mockApi({ 'POST /auth/login': [200, { id: 'u1' }] });
    await expect(api('/auth/login', { body: { email: 'a' } })).resolves.toEqual({ id: 'u1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', body: '{"email":"a"}' });
  });

  it('오류 응답은 code·message·retryAfter 를 담은 ApiError', async () => {
    mockApi({ 'POST /auth/password-reset': [429, { code: 'RESEND_TOO_SOON', message: '잠시 후', retryAfter: 30 }] });
    const err = await api('/auth/password-reset', { body: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 429, code: 'RESEND_TOO_SOON', message: '잠시 후', retryAfter: 30 });
  });

  it('본문이 JSON 이 아니어도 상태 코드로 오류를 만든다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>bad gateway</html>', { status: 502 })));
    await expect(api('/x')).rejects.toMatchObject({ status: 502, code: 'HTTP_502' });
  });

  it('빈 본문 성공 응답은 null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 200 })));
    await expect(api('/x', { method: 'DELETE' })).resolves.toBeNull();
  });

  it('네트워크 실패는 status 0 NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(api('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('요청 취소는 그대로 던진다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new DOMException('aborted', 'AbortError'))));
    await expect(api('/x')).rejects.toMatchObject({ name: 'AbortError' });
  });
});
