import type { Category } from '@findit/shared';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from '../../shared/api/client';
import { ChipGroup } from '../../shared/form/ChipGroup';
import { CATEGORY_OPTIONS } from '../../shared/form/options';
import { maxLength, notFuture, required } from '../../shared/form/rules';
import { TextAreaField } from '../../shared/form/TextAreaField';
import { TextField } from '../../shared/form/TextField';
import { useField } from '../../shared/form/useField';
import { todayISO } from '../../shared/lib/date';
import { AppBar } from '../../shared/layout/AppBar';
import { FormScreen } from '../../shared/layout/FormScreen';
import { Button } from '../../shared/ui/Button';
import { DoneView } from '../../shared/ui/DoneView';
import { foundApi } from './api';
import { PhotoPicker } from './PhotoPicker';
import { UploadProgress } from './UploadProgress';
import { usePhotoUploads } from './usePhotoUploads';

/**
 * ③ 습득물 등록 — 단계를 나누지 않는 단일 화면.
 * 사진 / 물건 종류 / 맡긴 장소 / 주운 날짜 네 항목. 이름·주운 곳·색상·특징은 접어 둔 선택 항목.
 */
export function FoundNewPage() {
  const navigate = useNavigate();
  const uploads = usePhotoUploads();
  const [showAll, setShowAll] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const category = useField<Category | null>(null, [required('물건 종류를 선택해 주세요')], { showAll });
  const keptAt = useField('', [required('맡긴 장소를 입력해 주세요'), maxLength(60, '장소는 60자 이하로 입력해 주세요')], { showAll });
  const foundDate = useField(todayISO(), [required('주운 날짜를 선택해 주세요'), notFuture()], { showAll });
  const title = useField('', [maxLength(40, '물건 이름은 40자 이하로 입력해 주세요')], { showAll });
  const foundPlace = useField('', [maxLength(60, '장소는 60자 이하로 입력해 주세요')], { showAll });
  const color = useField('', [maxLength(20, '색상은 20자 이하로 입력해 주세요')], { showAll });
  const description = useField('', [maxLength(200, '특징은 200자 이하로 입력해 주세요')], { showAll });

  const submit = async () => {
    setShowAll(true);
    const fields = [category, keptAt, foundDate, title, foundPlace, color, description];
    fields.forEach((f) => f.touch());
    if (!fields.every((f) => f.valid) || pending) {
      if (!fields.slice(3).every((f) => f.valid)) setShowMore(true);
      return;
    }
    if (uploads.uploading) {
      setSubmitError('사진을 올리는 중이에요. 업로드가 끝난 뒤 등록해 주세요');
      return;
    }
    if (uploads.failed > 0) {
      setSubmitError('올리지 못한 사진이 있어요. 다시 시도하거나 삭제해 주세요');
      return;
    }
    setPending(true);
    setSubmitError(null);
    try {
      await foundApi.create({
        category: category.value!,
        keptAt: keptAt.value.trim(),
        foundDate: foundDate.value,
        title: title.value.trim() || undefined,
        foundPlace: foundPlace.value.trim() || undefined,
        color: color.value.trim() || undefined,
        description: description.value.trim() || undefined,
        photoIds: uploads.photoIds,
      });
      setDone(true);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : '습득물을 등록하지 못했습니다');
    } finally {
      setPending(false);
    }
  };

  if (done) {
    return (
      <DoneView
        title="습득물이 등록되었습니다"
        description="주인이 확인하면 담당 선생님을 통해 전달됩니다. 고맙습니다!"
        actions={
          <Button block onClick={() => navigate('/', { replace: true })}>
            홈으로
          </Button>
        }
      />
    );
  }

  return (
    <FormScreen
      appBar={<AppBar title="습득물 등록" back="/register" />}
      actions={
        <Button block loading={pending} onClick={() => void submit()}>
          등록하기
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <PhotoPicker photos={uploads.items} onAdd={uploads.add} onRemove={uploads.remove} onRetry={uploads.retry} />
          <UploadProgress current={uploads.current} total={uploads.items.length} failed={uploads.failed} />
        </div>

        <ChipGroup
          label="물건 종류"
          options={CATEGORY_OPTIONS}
          value={category.value}
          onChange={(v) => category.setValue(v)}
          error={category.visibleError}
        />
        <TextField label="맡긴 장소" placeholder="예: 본관 1층 행정실" error={keptAt.visibleError} {...keptAt.inputProps} />
        <TextField label="주운 날짜" type="date" error={foundDate.visibleError} {...foundDate.inputProps} />

        <div className="rounded-card border border-line bg-bg-1">
          <button
            type="button"
            aria-expanded={showMore}
            onClick={() => setShowMore((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-tx-2"
          >
            물건 정보 더 적기 <span className="font-normal text-tx-3">(선택 · 매칭 정확도가 올라가요)</span>
            <ChevronDown size={18} aria-hidden className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>
          {showMore && (
            <div className="flex flex-col gap-4 border-t border-line px-4 pb-4 pt-3">
              <TextField label="물건 이름" placeholder="예: 갈색 반지갑" error={title.visibleError} {...title.inputProps} />
              <TextField label="주운 곳" placeholder="예: 본관 3층 복도" error={foundPlace.visibleError} {...foundPlace.inputProps} />
              <TextField label="색상" placeholder="예: 갈색" error={color.visibleError} {...color.inputProps} />
              <TextAreaField
                label="특징"
                placeholder="예: 모서리 긁힘, 단추 잠금"
                error={description.visibleError}
                {...description.inputProps}
              />
            </div>
          )}
        </div>

        <p className="rounded-card bg-accent-weak px-4 py-3 text-[13px] leading-relaxed text-accent-dark">
          지갑·학생증처럼 개인정보가 보이는 물건은 해당 부분을 가린 뒤 촬영해 주세요.
        </p>

        {submitError && (
          <p role="alert" className="text-[12.5px] font-medium text-err">
            ! {submitError}
          </p>
        )}
      </div>
    </FormScreen>
  );
}
