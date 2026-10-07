import { compressImage, fitWithin } from './compressImage';

describe('fitWithin', () => {
  it('긴 변을 1600 으로 맞추고 비율을 지킨다', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000)).toEqual({ width: 1200, height: 1600 });
  });

  it('이미 작으면 키우지 않는다', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1600, 10)).toEqual({ width: 1600, height: 10 });
  });
});

describe('compressImage', () => {
  let drawn: unknown[] = [];
  let toBlobArgs: unknown[] = [];

  beforeEach(() => {
    drawn = [];
    toBlobArgs = [];
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ({ drawImage: (...args: unknown[]) => drawn.push(args) }) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
      this: HTMLCanvasElement,
      cb: BlobCallback,
      type?: string,
      quality?: unknown,
    ) {
      toBlobArgs = [this.width, this.height, type, quality];
      cb(new Blob(['jpeg'], { type: 'image/jpeg' }));
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function stubImage(width: number, height: number, fail = false) {
    vi.stubGlobal(
      'Image',
      class {
        naturalWidth = width;
        naturalHeight = height;
        onload?: () => void;
        onerror?: () => void;
        set src(_: string) {
          queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()));
        }
      },
    );
  }

  it('긴 변 1600px, image/jpeg, 품질 0.8 로 다시 그린다', async () => {
    stubImage(4032, 3024);
    const blob = await compressImage(new Blob(['raw']));
    expect(blob.type).toBe('image/jpeg');
    expect(toBlobArgs).toEqual([1600, 1200, 'image/jpeg', 0.8]);
    expect(drawn).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    vi.unstubAllGlobals();
  });

  it('읽을 수 없는 파일이면 오류', async () => {
    stubImage(1, 1, true);
    await expect(compressImage(new Blob(['raw']))).rejects.toThrow('사진을 읽지 못했습니다');
    vi.unstubAllGlobals();
  });
});
