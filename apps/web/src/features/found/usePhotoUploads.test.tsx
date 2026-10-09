import type { Photo } from '@findit/shared';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ApiError } from '../../shared/api/client';
import { usePhotoUploads } from './usePhotoUploads';

const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

/** 업로드 호출을 테스트가 직접 끝내도록 잡아 둔다. */
function controllableUpload() {
  const pending: { name: string; progress: (p: number) => void; resolve: (p: Photo) => void; reject: (e: unknown) => void }[] = [];
  const upload = vi.fn(
    (_blob: Blob, name: string, onProgress: (p: number) => void) =>
      new Promise<Photo>((resolve, reject) => pending.push({ name, progress: onProgress, resolve, reject })),
  );
  return { upload, pending };
}

beforeAll(() => {
  URL.createObjectURL = vi.fn((f: Blob) => `blob:${(f as File).name}`);
  URL.revokeObjectURL = vi.fn();
});

describe('usePhotoUploads', () => {
  const compress = vi.fn(async (b: Blob) => b);

  it('한 장씩 차례로 올리고 진행 중인 순번·진행률을 알려 준다', async () => {
    const { upload, pending } = controllableUpload();
    const { result } = renderHook(() => usePhotoUploads({ compress, upload }));
    act(() => result.current.add([file('a.jpg'), file('b.jpg')]));

    await waitFor(() => expect(pending).toHaveLength(1));
    expect(result.current.current).toEqual({ index: 1, total: 2, progress: 0 });
    act(() => pending[0].progress(62));
    expect(result.current.current).toEqual({ index: 1, total: 2, progress: 62 });
    expect(result.current.uploading).toBe(true);

    await act(async () => pending[0].resolve({ id: 'p-a', url: '/a', width: 1, height: 1 }));
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(result.current.current?.index).toBe(2);

    await act(async () => pending[1].resolve({ id: 'p-b', url: '/b', width: 1, height: 1 }));
    await waitFor(() => expect(result.current.uploading).toBe(false));
    expect(result.current.photoIds).toEqual(['p-a', 'p-b']);
    expect(result.current.current).toBeNull();
  });

  it('한 장이 실패해도 나머지는 유지하고, 실패한 사진만 다시 올린다', async () => {
    const { upload, pending } = controllableUpload();
    const { result } = renderHook(() => usePhotoUploads({ compress, upload }));
    act(() => result.current.add([file('a.jpg'), file('b.jpg'), file('c.jpg')]));

    await waitFor(() => expect(pending).toHaveLength(1));
    await act(async () => pending[0].resolve({ id: 'p-a', url: '/a', width: 1, height: 1 }));
    await waitFor(() => expect(pending).toHaveLength(2));
    await act(async () => pending[1].reject(new ApiError(413, 'PAYLOAD_TOO_LARGE', '파일이 너무 큽니다')));
    await waitFor(() => expect(pending).toHaveLength(3));
    await act(async () => pending[2].resolve({ id: 'p-c', url: '/c', width: 1, height: 1 }));

    await waitFor(() => expect(result.current.uploading).toBe(false));
    expect(result.current.items.map((i) => i.status)).toEqual(['done', 'error', 'done']);
    expect(result.current.items[1].error).toBe('파일이 너무 큽니다');
    expect(result.current.failed).toBe(1);
    expect(result.current.photoIds).toEqual(['p-a', 'p-c']);

    act(() => result.current.retry(result.current.items[1].id));
    await waitFor(() => expect(pending).toHaveLength(4));
    expect(pending[3].name).toBe('b.jpg');
    await act(async () => pending[3].resolve({ id: 'p-b', url: '/b', width: 1, height: 1 }));
    await waitFor(() => expect(result.current.failed).toBe(0));
    expect(result.current.photoIds).toEqual(['p-a', 'p-b', 'p-c']);
    expect(upload).toHaveBeenCalledTimes(4);
  });

  it('완료된 사진에 retry 는 아무 일도 하지 않는다', async () => {
    const { upload, pending } = controllableUpload();
    const { result } = renderHook(() => usePhotoUploads({ compress, upload }));
    act(() => result.current.add([file('a.jpg')]));
    await waitFor(() => expect(pending).toHaveLength(1));
    await act(async () => pending[0].resolve({ id: 'p-a', url: '/a', width: 1, height: 1 }));
    act(() => result.current.retry(result.current.items[0].id));
    act(() => result.current.retry('nope'));
    expect(result.current.items[0].status).toBe('done');
  });

  it('최대 3장까지만 받는다', () => {
    const { upload } = controllableUpload();
    const { result } = renderHook(() => usePhotoUploads({ compress, upload }));
    act(() => result.current.add([file('a'), file('b'), file('c'), file('d')]));
    expect(result.current.items).toHaveLength(3);
    act(() => result.current.add([file('e')]));
    expect(result.current.items).toHaveLength(3);
  });

  it('올리는 중에 지우면 그 업로드를 취소하고 다음 사진으로 넘어간다', async () => {
    const signals: AbortSignal[] = [];
    const { pending } = controllableUpload();
    const upload = vi.fn((_b: Blob, name: string, onProgress: (p: number) => void, signal?: AbortSignal) => {
      signals.push(signal!);
      return new Promise<Photo>((resolve, reject) => {
        pending.push({ name, progress: onProgress, resolve, reject });
        signal?.addEventListener('abort', () => reject(new DOMException('취소', 'AbortError')));
      });
    });
    const { result } = renderHook(() => usePhotoUploads({ compress, upload }));
    act(() => result.current.add([file('a.jpg'), file('b.jpg')]));
    await waitFor(() => expect(pending).toHaveLength(1));
    act(() => result.current.remove(result.current.items[0].id));
    expect(signals[0].aborted).toBe(true);
    await waitFor(() => expect(pending).toHaveLength(2));
    expect(pending[1].name).toBe('b.jpg');
    expect(result.current.items).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:a.jpg');
  });

  it('화면을 떠나면 진행 중 업로드를 취소한다', async () => {
    const signals: AbortSignal[] = [];
    const upload = vi.fn((_b: Blob, _n: string, _p: (n: number) => void, signal?: AbortSignal) => {
      signals.push(signal!);
      return new Promise<Photo>(() => undefined);
    });
    const { result, unmount } = renderHook(() => usePhotoUploads({ compress, upload }));
    act(() => result.current.add([file('a.jpg')]));
    await waitFor(() => expect(signals).toHaveLength(1));
    unmount();
    expect(signals[0].aborted).toBe(true);
  });
});
