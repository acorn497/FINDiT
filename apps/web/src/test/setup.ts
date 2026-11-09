import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// 단위 테스트에서는 실제 소켓 대신 아무 일도 하지 않는 가짜를 쓴다 (테스트마다 바꿔 끼울 수 있다)
vi.mock('../features/notification/socket', async () => {
  const { createFakeSocket } = await import('./fakeSocket');
  return { connectSocket: vi.fn(() => createFakeSocket()) };
});
