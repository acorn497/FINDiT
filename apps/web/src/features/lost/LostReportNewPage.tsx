import type { Category, TimeSlot } from '@findit/shared';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../../shared/api/client';
import { ChipGroup } from '../../shared/form/ChipGroup';
import { CATEGORY_OPTIONS, TIME_SLOT_OPTIONS } from '../../shared/form/options';
import { maxLength, notFuture, required } from '../../shared/form/rules';
import { StepProgress } from '../../shared/form/StepProgress';
import { TextAreaField } from '../../shared/form/TextAreaField';
import { TextField } from '../../shared/form/TextField';
import { useField } from '../../shared/form/useField';
import { AppBar } from '../../shared/layout/AppBar';
import { FormScreen } from '../../shared/layout/FormScreen';
import { Button } from '../../shared/ui/Button';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { DoneView } from '../../shared/ui/DoneView';
import { lostApi } from './api';

type Step = 1 | 2 | 3;

const STEP_LABEL: Record<Step, string> = {
  1: '어떤 물건을 잃어버렸나요?',
  2: '언제, 어디서 잃어버렸나요?',
  3: '색상과 특징을 알려 주세요',
};

/**
 * ② 분실 신고 작성 — (1) 물건 종류 (2) 장소·날짜·시간대 (3) 색상·특징
 * 단계를 오가도 값을 유지하고, 앱바 × 는 작성 내용 삭제를 재확인한다.
 */
export function LostReportNewPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [showAll, setShowAll] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [done, setDone] = useState(false);

  const category = useField<Category | null>(null, [required('물건 종류를 선택해 주세요')], { showAll: showAll && step === 1 });
  const lostPlace = useField('', [required('잃어버린 장소를 입력해 주세요'), maxLength(60, '장소는 60자 이하로 입력해 주세요')], {
    showAll: showAll && step === 2,
  });
  const lostDate = useField('', [required('잃어버린 날짜를 선택해 주세요'), notFuture()], { showAll: showAll && step === 2 });
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const color = useField('', [required('색상을 입력해 주세요'), maxLength(20, '색상은 20자 이하로 입력해 주세요')], {
    showAll: showAll && step === 3,
  });
  const description = useField('', [maxLength(200, '특징은 200자 이하로 입력해 주세요')], { showAll: showAll && step === 3 });

  const stepFields = {
    1: [category],
    2: [lostPlace, lostDate],
    3: [color, description],
  }[step];

  const dirty = Boolean(category.value || lostPlace.value || lostDate.value || timeSlot || color.value || description.value);

  const leave = () => navigate('/register', { replace: true });
  const requestLeave = () => (dirty ? setConfirmLeave(true) : leave());

  const goNext = async () => {
    setShowAll(true);
    stepFields.forEach((f) => f.touch());
    if (!stepFields.every((f) => f.valid) || pending) return;

    if (step < 3) {
      setShowAll(false);
      setStep((step + 1) as Step);
      return;
    }

    setPending(true);
    setSubmitError(null);
    try {
      await lostApi.create({
        category: category.value!,
        lostPlace: lostPlace.value.trim(),
        lostDate: lostDate.value,
        timeSlot: timeSlot ?? undefined,
        color: color.value.trim(),
        description: description.value.trim() || undefined,
      });
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : '신고를 등록하지 못했습니다');
    } finally {
      setPending(false);
    }
  };

  const goPrev = () => {
    setShowAll(false);
    if (step === 1) requestLeave();
    else setStep((step - 1) as Step);
  };

  if (done) {
    return (
      <DoneView
        title="분실 신고가 접수되었습니다"
        description="비슷한 습득물이 등록되면 후보로 보여 드릴게요."
        actions={
          <Button block onClick={() => navigate('/', { replace: true })}>
            홈으로
          </Button>
        }
      />
    );
  }

  return (
    <>
      <FormScreen
        appBar={
          <AppBar
            title="분실 신고 작성"
            onBack={goPrev}
            actions={
              <button
                type="button"
                aria-label="작성 취소"
                onClick={requestLeave}
                className="flex size-9 items-center justify-center rounded-field bg-bg-2 text-tx-2"
              >
                <X size={20} aria-hidden />
              </button>
            }
          />
        }
        actions={
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" onClick={goPrev}>
              이전
            </Button>
            <Button className="col-span-2" loading={pending} onClick={() => void goNext()}>
              {step === 3 ? '신고하기' : '다음'}
            </Button>
          </div>
        }
      >
        <StepProgress step={step} total={3} label={STEP_LABEL[step]} />

        <div className="mt-5 flex flex-col gap-5">
          {step === 1 && (
            <ChipGroup
              label="물건 종류"
              options={CATEGORY_OPTIONS}
              value={category.value}
              onChange={(v) => category.setValue(v)}
              error={category.visibleError}
            />
          )}

          {step === 2 && (
            <>
              <TextField label="잃어버린 장소" placeholder="예: 본관 3층 복도" error={lostPlace.visibleError} {...lostPlace.inputProps} />
              <TextField label="잃어버린 날짜" type="date" error={lostDate.visibleError} {...lostDate.inputProps} />
              <ChipGroup
                label="대략적인 시간대"
                optional
                options={TIME_SLOT_OPTIONS}
                value={timeSlot}
                onChange={setTimeSlot}
                allowDeselect
                onDeselect={() => setTimeSlot(null)}
              />
            </>
          )}

          {step === 3 && (
            <>
              <TextField label="색상" placeholder="예: 갈색" error={color.visibleError} {...color.inputProps} />
              <TextAreaField
                label="특징"
                optional
                placeholder="예: 모서리 긁힘, 단추 잠금"
                error={description.visibleError}
                {...description.inputProps}
              />
            </>
          )}

          {submitError && (
            <p role="alert" className="text-[12.5px] font-medium text-err">
              ! {submitError}
            </p>
          )}
        </div>
      </FormScreen>

      <ConfirmDialog
        open={confirmLeave}
        title="작성을 그만둘까요?"
        message="지금까지 작성한 내용이 삭제됩니다."
        confirmLabel="삭제"
        cancelLabel="계속 작성"
        danger
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />
    </>
  );
}
