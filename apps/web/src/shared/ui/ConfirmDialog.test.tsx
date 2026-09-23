import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const setup = (open = true) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog open={open} title="작성을 그만둘까요?" message="입력한 내용이 사라집니다." confirmLabel="삭제" danger onConfirm={onConfirm} onCancel={onCancel} />,
    );
    return { onConfirm, onCancel };
  };

  it('닫혀 있으면 그리지 않는다', () => {
    setup(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('제목·설명을 보여 주고 취소 버튼에 초점', () => {
    setup();
    expect(screen.getByRole('dialog', { name: '작성을 그만둘까요?' })).toBeInTheDocument();
    expect(screen.getByText('입력한 내용이 사라집니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
  });

  it('확인·취소·Esc·바깥 클릭', async () => {
    const { onConfirm, onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: '삭제' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: '취소' }));
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('dialog').parentElement!);
    expect(onCancel).toHaveBeenCalledTimes(3);
  });
});
