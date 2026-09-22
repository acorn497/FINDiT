import { Category } from '@findit/shared';
import { defaultTitle } from './found-items.service';

describe('defaultTitle', () => {
  it('이름이 있으면 그대로', () => {
    expect(defaultTitle({ title: '갈색 반지갑', category: Category.WALLET_CARD })).toBe('갈색 반지갑');
  });
  it('없으면 색상 + 종류', () => {
    expect(defaultTitle({ color: '갈색', category: Category.WALLET_CARD })).toBe('갈색 지갑·카드');
    expect(defaultTitle({ category: Category.ELECTRONICS })).toBe('전자기기');
  });
});
