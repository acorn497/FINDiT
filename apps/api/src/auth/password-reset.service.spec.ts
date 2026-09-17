import type { UsersService } from '../users/users.service';
import { PasswordResetService } from './password-reset.service';

describe('PasswordResetService', () => {
  const users = {
    findByEmail: jest.fn(async (email: string) => (email === 's2217@gbsw.hs.kr' ? { id: 'u1', email } : null)),
  } as unknown as UsersService;

  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));

  it('처음 요청은 보내고 retryAfter 60', async () => {
    const svc = new PasswordResetService(users);
    await expect(svc.request('s2217@gbsw.hs.kr', 0)).resolves.toEqual({ sent: true, retryAfter: 60 });
  });

  it('60초 안에 다시 요청하면 429 + 남은 초', async () => {
    const svc = new PasswordResetService(users);
    await svc.request('s2217@gbsw.hs.kr', 0);
    await expect(svc.request('s2217@gbsw.hs.kr', 18_500)).rejects.toMatchObject({
      status: 429,
      response: { code: 'RESEND_TOO_SOON', retryAfter: 42 },
    });
  });

  it('60초가 지나면 다시 보낼 수 있다', async () => {
    const svc = new PasswordResetService(users);
    await svc.request('s2217@gbsw.hs.kr', 0);
    await expect(svc.request('s2217@gbsw.hs.kr', 60_000)).resolves.toMatchObject({ sent: true });
  });

  it('없는 계정은 404', async () => {
    const svc = new PasswordResetService(users);
    await expect(svc.request('nobody@gbsw.hs.kr')).rejects.toMatchObject({ status: 404 });
  });
});
