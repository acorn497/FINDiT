import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesGuard } from '../common/roles.guard';
import { SessionGuard } from '../common/session.guard';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { Session } from './session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordResetService,
    // 순서대로 실행된다: 세션 확인 → 역할 확인
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService],
})
export class AuthModule {}
