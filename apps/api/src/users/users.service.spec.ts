import { Role } from '@findit/shared';
import type { Repository } from 'typeorm';
import type { User } from './user.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const user = {
    id: 'u1',
    email: 's2217@gbsw.hs.kr',
    name: '이지우',
    role: Role.STUDENT,
    grade: 2,
    classNo: 2,
  } as User;

  it('이메일은 공백을 지우고 소문자로 찾는다', async () => {
    const repo = { findOne: jest.fn().mockResolvedValue(user) } as unknown as Repository<User>;
    await new UsersService(repo).findByEmail('  S2217@GBSW.hs.kr ');
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 's2217@gbsw.hs.kr' } });
  });

  it('toAuthUser 는 비밀번호 해시 없이 공개 필드만 돌려준다', () => {
    expect(UsersService.toAuthUser({ ...user, passwordHash: 'secret' } as User)).toEqual({
      id: 'u1',
      email: 's2217@gbsw.hs.kr',
      name: '이지우',
      role: 'STUDENT',
      grade: 2,
      classNo: 2,
    });
  });
});
