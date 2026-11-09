import { io, type Socket } from 'socket.io-client';

/** 같은 출처의 /socket.io 로 연결한다 (쿠키 인증). 테스트에서는 이 함수를 바꿔 끼운다. */
export function connectSocket(): Socket {
  return io({
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });
}
