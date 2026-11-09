type Handler = (...args: unknown[]) => void;

/** socket.io-client 의 필요한 부분만 흉내 낸 가짜 소켓 */
export function createFakeSocket() {
  const handlers = new Map<string, Handler[]>();
  const socket = {
    connected: false,
    on(event: string, handler: Handler) {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
      return socket;
    },
    removeAllListeners() {
      handlers.clear();
      return socket;
    },
    close() {
      socket.connected = false;
      return socket;
    },
    /** 테스트에서 서버 이벤트를 흉내 낸다 */
    serverEmit(event: string, ...args: unknown[]) {
      if (event === 'connect') socket.connected = true;
      if (event === 'disconnect') socket.connected = false;
      (handlers.get(event) ?? []).forEach((h) => h(...args));
    },
  };
  return socket;
}

export type FakeSocket = ReturnType<typeof createFakeSocket>;
