import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { AuthUser } from '@findit/shared';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  findByEmail(email: string) {
    return this.users.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  /** 비밀번호 해시까지 함께 읽는다 (로그인 확인용) */
  findWithPassword(email: string) {
    return this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.trim().toLowerCase() })
      .getOne();
  }

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  static toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      grade: user.grade,
      classNo: user.classNo,
    };
  }
}
