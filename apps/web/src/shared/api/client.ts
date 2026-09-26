import type { ApiErrorBody } from '@findit/shared';

/** API 오류 — 서버의 { code, message } 를 그대로 담는다. 네트워크 실패는 status 0. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Listener = () => void;
const unauthorizedListeners = new Set<Listener>();

/** 로그인이 필요한 API 가 401 을 돌려줄 때 알림을 받는다 (세션 만료 처리) */
export function onUnauthorized(listener: Listener) {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

/** 401 이어도 세션 만료로 보지 않는 경로 (로그인 과정) */
const AUTH_FLOW = /^\/auth\/(check-email|login|password-reset|me)$/;

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/** /api 아래 경로를 쿠키와 함께 부른다. */
export async function api<T>(path: string, { method, body, signal }: ApiOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: method ?? (body === undefined ? 'GET' : 'POST'),
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요');
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const err = (data ?? {}) as Partial<ApiErrorBody>;
    if (res.status === 401 && !AUTH_FLOW.test(path)) unauthorizedListeners.forEach((l) => l());
    throw new ApiError(res.status, err.code ?? `HTTP_${res.status}`, err.message ?? '요청을 처리하지 못했습니다', err.retryAfter);
  }
  return data as T;
}
