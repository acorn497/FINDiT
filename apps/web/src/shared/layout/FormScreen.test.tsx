import { render, screen } from '@testing-library/react';
import { FormScreen } from './FormScreen';

describe('FormScreen', () => {
  it('높이를 100dvh 로 잡아 하단 버튼이 모바일 주소창에 가려지지 않게 한다', () => {
    const { container } = render(
      <FormScreen appBar={<header>앱바</header>} actions={<button type="button">등록하기</button>}>
        <p>본문</p>
      </FormScreen>,
    );
    const root = container.firstElementChild!;
    expect(root.className).toContain('h-dvh');
    expect(root.className).not.toContain('h-screen');
    expect(root.lastElementChild).toContainElement(screen.getByRole('button', { name: '등록하기' }));
  });
});
