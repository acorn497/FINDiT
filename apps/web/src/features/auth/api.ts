import type { AuthUser, CheckEmailResponse, PasswordResetResponse } from '@findit/shared';
import { api } from '../../shared/api/client';

export const authApi = {
  checkEmail: (email: string) => api<CheckEmailResponse>('/auth/check-email', { body: { email } }),
  login: (email: string, password: string) => api<AuthUser>('/auth/login', { body: { email, password } }),
  me: () => api<AuthUser>('/auth/me'),
  logout: () => api<{ ok: true }>('/auth/logout', { method: 'POST' }),
  passwordReset: (email: string) => api<PasswordResetResponse>('/auth/password-reset', { body: { email } }),
};
