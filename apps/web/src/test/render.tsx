import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';

/** 라우터 안에서 렌더한다. */
export function renderWithRouter(ui: ReactElement, { route = '/' }: { route?: string | string[] } = {}) {
  const entries = Array.isArray(route) ? route : [route];
  return render(<MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>);
}
