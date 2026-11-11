import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Link, Route, Routes } from 'react-router';
import { renderApp } from '../../test/render';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { AppBar } from './AppBar';
import { AppLayout } from './AppLayout';

afterEach(() => vi.unstubAllGlobals());

describe('접근성', () => {
  const tree = (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          path="/a"
          element={
            <>
              <AppBar title="첫 화면" />
              <Link to="/b">다음 화면으로</Link>
            </>
          }
        />
        <Route path="/b" element={<AppBar title="둘째 화면" />} />
      </Route>
    </Routes>
  );

  it('본문으로 건너뛰기 링크가 맨 앞에 있다', async () => {
    renderApp(tree, { route: '/a' });
    await screen.findByRole('heading', { name: '첫 화면' });
    const skip = screen.getByRole('link', { name: '본문으로 건너뛰기' });
    expect(skip).toHaveAttribute('href', '#main');
    expect(document.querySelector('#main')).toHaveAttribute('tabindex', '-1');
    await userEvent.tab();
    expect(skip).toHaveFocus();
  });

  it('화면이 바뀌면 본문으로 초점을 옮기고 문서 제목을 바꾼다', async () => {
    renderApp(tree, { route: '/a' });
    await screen.findByRole('heading', { name: '첫 화면' });
    expect(document.title).toBe('첫 화면 · FINDiT');
    expect(document.querySelector('#main')).not.toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: '다음 화면으로' }));
    await screen.findByRole('heading', { name: '둘째 화면' });
    expect(document.title).toBe('둘째 화면 · FINDiT');
    await waitFor(() => expect(document.querySelector('#main')).toHaveFocus());
  });

  it('모달이 열려 있으면 Tab 초점이 모달 안에서 돌고, 닫히면 연 버튼으로 돌아간다', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            열기
          </button>
          <button type="button">바깥 버튼</button>
          <ConfirmDialog open={open} title="삭제할까요?" onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </>
      );
    }
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: '열기' }));
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: '확인' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: '취소' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: '확인' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '열기' })).toHaveFocus();
  });

  it('아이콘만 있는 버튼에도 이름이 있다', async () => {
    renderApp(tree, { route: '/a' });
    await screen.findByRole('heading', { name: '첫 화면' });
    for (const button of screen.queryAllByRole('button')) expect(button).toHaveAccessibleName();
    for (const link of screen.getAllByRole('link')) expect(link).toHaveAccessibleName();
  });
});
