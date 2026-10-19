import { AppEvents } from './events';

describe('AppEvents', () => {
  it('등록 순서대로 기다리며 부른다', async () => {
    const events = new AppEvents();
    const order: string[] = [];
    events.on('lost-report.saved', async ({ id }) => {
      await new Promise((r) => setTimeout(r, 5));
      order.push(`a:${id}`);
    });
    events.on('lost-report.saved', ({ id }) => {
      order.push(`b:${id}`);
    });
    await events.emit('lost-report.saved', { id: 'x' });
    expect(order).toEqual(['a:x', 'b:x']);
  });

  it('듣는 쪽이 없어도 된다', async () => {
    await expect(new AppEvents().emit('found-item.created', { id: 'f', category: 'ETC' })).resolves.toBeUndefined();
  });
});
