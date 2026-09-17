import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { AuthUser } from '@findit/shared';
import type { CookieOptions, Response } from 'express';
import { config } from '../config';
import { CurrentUser, Public, type AuthedRequest } from '../common/decorators';
import { CheckEmailDto, LoginDto } from './auth.dto';
import { AuthService, SESSION_COOKIE, SESSION_TTL_MS } from './auth.service';

const cookieOptions = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSecure,
  path: '/',
});

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('check-email')
  @HttpCode(200)
  checkEmail(@Body() dto: CheckEmailDto) {
    return this.auth.checkEmail(dto.email);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    const { token, user } = await this.auth.login(dto.email, dto.password, req.headers['user-agent']);
    res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
    return user;
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, cookieOptions());
    return { ok: true };
  }
}
