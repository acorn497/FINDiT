import { PASSWORD_RESET_COOLDOWN_SEC } from '@findit/shared';
import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ApiError } from '../../shared/api/client';
import { email as emailRule, minLength, required } from '../../shared/form/rules';
import { StepProgress } from '../../shared/form/StepProgress';
import { TextField } from '../../shared/form/TextField';
import { useField } from '../../shared/form/useField';
import { useCountdown } from '../../shared/hooks/useCountdown';
import { Logo } from '../../shared/layout/Logo';
import { Button } from '../../shared/ui/Button';
import { authApi } from './api';

type Step = 1 | 2 | 3;

const STEP_LABEL: Record<Step, string> = {
  1: '계정 확인',
  2: '비밀번호 입력',
  3: '비밀번호 재설정',
};

/**
 * ① 로그인 — 주소를 바꾸지 않고 한 화면 안에서 3단계.
 * 계정 확인 → 비밀번호 → (필요하면) 비밀번호 재설정
 */
export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [step, setStep] = useState<Step>(1);
  const [showAll, setShowAll] = useState(false);
  const [pending, setPending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const cooldown = useCountdown();

  const email = useField('', [required('학교 계정을 입력해 주세요'), emailRule('이메일 형식이 아닙니다')], {
    showAll: showAll && step === 1,
  });
  const password = useField('', [required('비밀번호를 입력해 주세요'), minLength(8, '비밀번호는 8자 이상이어야 합니다')], {
    showAll: showAll && step === 2,
  });

  const goTo = (next: Step) => {
    setShowAll(false);
    setStep(next);
  };

  const submitEmail = async () => {
    setShowAll(true);
    email.touch();
    if (!email.valid || pending) return;
    setPending(true);
    try {
      await authApi.checkEmail(email.value.trim());
      goTo(2);
    } catch (e) {
      email.setServerError(e instanceof ApiError ? e.message : '계정을 확인하지 못했습니다');
    } finally {
      setPending(false);
    }
  };

  const submitPassword = async () => {
    setShowAll(true);
    password.touch();
    if (!password.valid || pending) return;
    setPending(true);
    try {
      await authApi.login(email.value.trim(), password.value);
      navigate(from, { replace: true });
    } catch (e) {
      password.setServerError(e instanceof ApiError ? e.message : '로그인하지 못했습니다');
    } finally {
      setPending(false);
    }
  };

  const sendReset = async () => {
    if (pending || cooldown.running) return;
    setPending(true);
    setResetError(null);
    try {
      const res = await authApi.passwordReset(email.value.trim());
      setResetSent(true);
      cooldown.start(res.retryAfter ?? PASSWORD_RESET_COOLDOWN_SEC);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429 && e.retryAfter) {
        // 서버가 강제하는 대기 시간에 맞춘다
        setResetSent(true);
        cooldown.start(e.retryAfter);
      } else {
        setResetError(e instanceof ApiError ? e.message : '재설정 안내를 보내지 못했습니다');
      }
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) void submitEmail();
    else if (step === 2) void submitPassword();
    else void sendReset();
  };

  return (
    <main className="min-h-screen bg-bg-2">
      <div className="mx-auto flex w-full max-w-[390px] flex-col px-6 pb-10 pt-16">
        <Logo className="text-[32px]" />
        <p className="mt-3 text-[15px] leading-relaxed text-tx-2">
          교내 분실물 등록·매칭 서비스
          <br />
          학교 계정으로 로그인하세요.
        </p>

        <form className="mt-8" onSubmit={onSubmit} noValidate>
          <StepProgress step={step} total={3} label={STEP_LABEL[step]} />

          <div className="mt-4 flex flex-col gap-4">
            {step === 1 ? (
              <TextField
                label="학교 계정"
                type="email"
                inputMode="email"
                autoComplete="username"
                placeholder="s0000@gbsw.hs.kr"
                autoFocus
                error={email.visibleError}
                {...email.inputProps}
              />
            ) : (
              <TextField
                label="학교 계정"
                type="email"
                value={email.value}
                readOnly
                success={step === 2 ? '등록된 계정입니다' : null}
              />
            )}

            {step === 2 && (
              <TextField
                label="비밀번호"
                type="password"
                autoComplete="current-password"
                autoFocus
                error={password.visibleError}
                {...password.inputProps}
              />
            )}

            {step === 3 && (
              <div className="rounded-card bg-accent-weak px-4 py-3 text-[13px] leading-relaxed text-accent-dark" role="status">
                {resetSent
                  ? `${email.value} 으로 재설정 안내를 보냈습니다. 학교 메일함을 확인해 주세요.`
                  : '학교 메일로 비밀번호 재설정 안내를 보내 드립니다.'}
              </div>
            )}
            {step === 3 && resetError && (
              <p role="alert" className="text-[12.5px] font-medium text-err">
                ! {resetError}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            {step === 3 ? (
              <Button type="submit" block loading={pending} disabled={cooldown.running}>
                {!resetSent ? '재설정 안내 보내기' : cooldown.running ? `다시 보내기 (${cooldown.remaining}초)` : '다시 보내기'}
              </Button>
            ) : (
              <Button type="submit" block loading={pending}>
                다음
              </Button>
            )}
            {step > 1 && (
              <Button variant="secondary" block onClick={() => goTo((step - 1) as Step)}>
                이전 단계로
              </Button>
            )}
          </div>
        </form>

        {step === 2 && (
          <p className="mt-6 text-center text-[13px] text-tx-2">
            비밀번호가 기억나지 않나요?{' '}
            <button type="button" className="font-bold text-accent" onClick={() => goTo(3)}>
              재설정
            </button>
          </p>
        )}
      </div>
    </main>
  );
}
