import { useEffect, useId, useRef, useState } from 'react';
import { useFocusTrap } from '../../shared/hooks/useFocusTrap';
import { maxLength, required } from '../../shared/form/rules';
import { TextAreaField } from '../../shared/form/TextAreaField';
import { useField } from '../../shared/form/useField';
import { Button } from '../../shared/ui/Button';

interface RejectDialogProps {
  open: boolean;
  claimantName: string;
  itemTitle: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

/** 거절 — 사유를 받아야 보낼 수 있다 (사유는 학생 알림에 담긴다) */
export function RejectDialog({ open, claimantName, itemTitle, onSubmit, onCancel }: RejectDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  const [showAll, setShowAll] = useState(false);
  const reason = useField('', [required('거절 사유를 입력해 주세요'), maxLength(200, '사유는 200자 이하로 입력해 주세요')], { showAll });

  useEffect(() => {
    if (open) {
      reason.reset('');
      setShowAll(false);
    }
    // 열릴 때마다 비운다
  }, [open]);

  if (!open) return null;

  const submit = () => {
    setShowAll(true);
    reason.touch();
    if (reason.valid) onSubmit(reason.value.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-tx-1/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[400px] rounded-card bg-bg-1 p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-[17px] font-bold">
          수령 신청 거절
        </h2>
        <p className="mt-1.5 text-sm text-tx-2">
          {claimantName} 학생의 {itemTitle} 신청을 거절합니다. 사유는 학생에게 알림으로 전달됩니다.
        </p>
        <TextAreaField
          className="mt-4"
          label="거절 사유"
          placeholder="예: 안에 든 물건 설명이 다릅니다"
          autoFocus
          error={reason.visibleError}
          {...reason.inputProps}
        />
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onCancel}>
            취소
          </Button>
          <Button variant="danger" onClick={submit}>
            거절하기
          </Button>
        </div>
      </div>
    </div>
  );
}
