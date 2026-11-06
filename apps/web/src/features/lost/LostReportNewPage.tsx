import type { Category, TimeSlot } from '@findit/shared';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
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
import { LoadingScreen } from '../../shared/ui/LoadingScreen';
import { StateView } from '../../shared/ui/StateView';
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
 * /lost/:id/edit 로 들어오면 같은 화면으로 수정한다.
 */
export function LostReportNewPage() {
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const editing = Boolean(editId);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>(editing ? 'loading' : 'idle');
  const [initialDirty, setInitialDirty] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [showAll, setShowAll] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  /** 후보가 없을 때만 보여 주는 안내 (후보가 있으면 바로 매칭 후보 화면으로) */
  const [noCandidates, setNoCandidates] = useState(false);

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

  // 수정이면 기존 값을 채운다
  useEffect(() => {
    if (!editId) return;
    const controller = new AbortController();
    lostApi
      .get(editId, controller.signal)
      .then((r) => {
        category.reset(r.category);
        lostPlace.reset(r.lostPlace);
        lostDate.reset(r.lostDate);
        setTimeSlot(r.timeSlot === 'UNKNOWN' ? null : r.timeSlot);
        color.reset(r.color);
        description.reset(r.description ?? '');
        setLoadState('idle');
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadState('error');
      });
    return () => controller.abort();
    // 처음 한 번만 채운다
  }, [editId]);

  const dirty =
    initialDirty || (!editing && Boolean(category.value || lostPlace.value || lostDate.value || timeSlot || color.value || description.value));
  const markDirty = () => editing && setInitialDirty(true);

  const leave = () => navigate(editing ? '/me/reports' : '/register', { replace: true });
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
    const body = {
      category: category.value!,
      lostPlace: lostPlace.value.trim(),
      lostDate: lostDate.value,
      timeSlot: timeSlot ?? (editing ? 'UNKNOWN' : undefined),
      color: color.value.trim(),
      description: description.value.trim() || (editing ? '' : undefined),
    } as const;
    try {
      if (editId) {
        await lostApi.update(editId, body);
        navigate('/me/reports', { replace: true });
        return;
      }
      const created = await lostApi.create(body);
      if (created.status === 'MATCHED') navigate(`/matches?lostReportId=${created.id}`, { replace: true });
      else setNoCandidates(true);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : editing ? '신고를 수정하지 못했습니다' : '신고를 등록하지 못했습니다');
    } finally {
      setPending(false);
    }
  };

  const goPrev = () => {
    setShowAll(false);
    if (step === 1) requestLeave();
    else setStep((step - 1) as Step);
  };

  if (loadState === 'loading') return <LoadingScreen message="신고 내용을 불러오고 있어요" />;
  if (loadState === 'error') {
    return (
      <StateView
        kind="error"
        title="신고를 불러오지 못했습니다"
        description="삭제되었거나 내 신고가 아닙니다."
        action={<Button onClick={() => navigate('/me/reports', { replace: true })}>내 신고 관리로</Button>}
      />
    );
  }

  if (noCandidates) {
    return (
      <DoneView
        title="분실 신고가 접수되었습니다"
        description="아직 비슷한 습득물이 없습니다. 새로 등록되면 알려 드릴게요."
        actions={
          <Button block onClick={() => navigate('/me/reports', { replace: true })}>
            내 신고 관리로
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
            title={editing ? '분실 신고 수정' : '분실 신고 작성'}
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
              {step === 3 ? (editing ? '수정하기' : '신고하기') : '다음'}
            </Button>
          </div>
        }
      >
        <StepProgress step={step} total={3} label={STEP_LABEL[step]} />

        <div className="mt-5 flex flex-col gap-5" onInput={markDirty}>
          {step === 1 && (
            <ChipGroup
              label="물건 종류"
              options={CATEGORY_OPTIONS}
              value={category.value}
              onChange={(v) => {
                markDirty();
                category.setValue(v);
              }}
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
        title={editing ? '수정을 그만둘까요?' : '작성을 그만둘까요?'}
        message={editing ? '바꾼 내용이 저장되지 않습니다.' : '지금까지 작성한 내용이 삭제됩니다.'}
        confirmLabel="삭제"
        cancelLabel="계속 작성"
        danger
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />
    </>
  );
}
