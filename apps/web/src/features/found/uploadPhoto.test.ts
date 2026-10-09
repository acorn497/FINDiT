import { uploadPhoto } from './uploadPhoto';

class FakeXHR {
  static last: FakeXHR;
  method = '';
  url = '';
  withCredentials = false;
  responseType = '';
  status = 0;
  response: unknown = null;
  body: FormData | null = null;
  upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  constructor() {
    FakeXHR.last = this;
  }
  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }
  send(body: FormData) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
  respond(status: number, response: unknown) {
    this.status = status;
    this.response = response;
    this.onload?.();
  }
}

beforeEach(() => vi.stubGlobal('XMLHttpRequest', FakeXHR));
afterEach(() => vi.unstubAllGlobals());

describe('uploadPhoto (XHR)', () => {
  it('쿠키와 함께 multipart(file) 로 보내고 진행률을 알려 준다', async () => {
    const onProgress = vi.fn();
    const p = uploadPhoto(new Blob(['x'], { type: 'image/jpeg' }), 'IMG_0001.HEIC', onProgress);
    const xhr = FakeXHR.last;
    expect(xhr.method).toBe('POST');
    expect(xhr.url).toBe('/api/uploads');
    expect(xhr.withCredentials).toBe(true);
    expect((xhr.body!.get('file') as File).name).toBe('IMG_0001.jpg');

    xhr.upload.onprogress!({ lengthComputable: true, loaded: 62, total: 100 });
    expect(onProgress).toHaveBeenLastCalledWith(62);
    xhr.upload.onprogress!({ lengthComputable: false, loaded: 0, total: 0 });
    expect(onProgress).toHaveBeenCalledTimes(1);

    xhr.respond(201, { id: 'p1', url: '/api/uploads/p1.jpg', width: 10, height: 10 });
    await expect(p).resolves.toMatchObject({ id: 'p1' });
    expect(onProgress).toHaveBeenLastCalledWith(100);
  });

  it('413·415 는 서버 문구를 담은 ApiError', async () => {
    const p = uploadPhoto(new Blob(['x']), 'a.jpg', vi.fn());
    FakeXHR.last.respond(413, { code: 'PAYLOAD_TOO_LARGE', message: '파일이 너무 큽니다 (최대 5MB)' });
    await expect(p).rejects.toMatchObject({ status: 413, code: 'PAYLOAD_TOO_LARGE', message: '파일이 너무 큽니다 (최대 5MB)' });
  });

  it('본문 없는 실패·네트워크 오류·취소', async () => {
    const p1 = uploadPhoto(new Blob(['x']), 'a.jpg', vi.fn());
    FakeXHR.last.respond(502, null);
    await expect(p1).rejects.toMatchObject({ status: 502, message: '사진을 올리지 못했습니다' });

    const p2 = uploadPhoto(new Blob(['x']), 'a.jpg', vi.fn());
    FakeXHR.last.onerror!();
    await expect(p2).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });

    const controller = new AbortController();
    const p3 = uploadPhoto(new Blob(['x']), 'a.jpg', vi.fn(), controller.signal);
    controller.abort();
    await expect(p3).rejects.toMatchObject({ name: 'AbortError' });
  });
});
