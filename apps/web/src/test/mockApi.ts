import { vi } from 'vitest';

type Reply = [status: number, body?: unknown] | Promise<[number, unknown?]>;
type Handler = (body: unknown, url: URL) => Reply;

/**
 * fetch 를 가로채 "METHOD /경로" 별 응답을 돌려준다. (/api 접두어는 빼고 적는다)
 * 등록되지 않은 요청은 404 로 응답하고 calls 에 기록한다.
 */
export function mockApi(routes: Record<string, Handler | Reply>) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init?.method ?? 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api/, '');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    const key = `${method} ${path}`;
    const route = routes[key] ?? routes[`${method} ${path}${url.search}`];
    const [status, json] = route ? await (typeof route === 'function' ? route(body, url) : route) : [404, { code: 'NOT_FOUND', message: key }];
    return new Response(json === undefined ? '' : JSON.stringify(json), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}
