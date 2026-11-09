import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderApp } from '../../test/render';
import { FoundNewPage } from './FoundNewPage';

function setup(created: [number, unknown] = [201, { id: 'f-new' }]) {
  return renderApp(
    <Routes>
      <Route path="/found/new" element={<FoundNewPage />} />
      <Route path="/found/:id" element={<p>습득물 상세 화면</p>} />
    </Routes>,
    { route: '/found/new', api: { 'POST /found-items': created } },
  );
}

const image = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

beforeAll(() => {
  URL.createObjectURL = vi.fn((f: Blob) => `blob:${(f as File).name}`);
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => vi.unstubAllGlobals());

describe('FoundNewPage', () => {
  it('단계를 나누지 않은 한 화면에 네 항목과 개인정보 안내가 있다', () => {
    setup();
    expect(screen.getByText(/사진/)).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: '물건 종류' })).toBeInTheDocument();
    expect(screen.getByLabelText('맡긴 장소')).toBeInTheDocument();
    expect(screen.getByLabelText('주운 날짜')).toBeInTheDocument();
    expect(screen.getByText(/개인정보가 보이는 물건은/)).toBeInTheDocument();
    expect(screen.queryByText(/단계/)).not.toBeInTheDocument();
  });

  it('사진은 최대 3장 — 썸네일·× 삭제·[+ 추가]', async () => {
    setup();
    await userEvent.upload(screen.getByLabelText('사진 추가'), [image('a.jpg'), image('b.jpg')]);
    expect(screen.getAllByRole('img')).toHaveLength(2);
    await userEvent.upload(screen.getByLabelText('사진 추가'), [image('c.jpg'), image('d.jpg')]);
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.queryByLabelText('사진 추가')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '사진 2 삭제' }));
    expect(screen.getAllByRole('img').map((i) => i.getAttribute('src'))).toEqual(['blob:a.jpg', 'blob:c.jpg']);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:b.jpg');
    expect(screen.getByLabelText('사진 추가')).toBeInTheDocument();
  });

  it('사진을 고르면 바로 올리고, 등록할 때 올린 사진 id 를 보낸다', async () => {
    const { api } = setup();
    vi.stubGlobal('Image', class {
      naturalWidth = 3200;
      naturalHeight = 2400;
      onload?: () => void;
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb: BlobCallback) => cb(new Blob(['j'])));
    class OkXHR {
      upload = {};
      status = 201;
      response = { id: '11111111-1111-4111-8111-111111111111', url: '/api/uploads/x.jpg', width: 1600, height: 1200 };
      onload?: () => void;
      withCredentials = false;
      open() {}
      send() {
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal('XMLHttpRequest', OkXHR);

    await userEvent.upload(screen.getByLabelText('사진 추가'), [image('a.jpg')]);
    expect(await screen.findByText('업로드 완료 · 1장')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: '전자기기' }));
    await userEvent.type(screen.getByLabelText('맡긴 장소'), '2학년 교무실');
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    expect(await screen.findByText('습득물이 등록되었습니다. 고맙습니다!')).toBeInTheDocument();
    expect(screen.getByText('습득물 상세 화면')).toBeInTheDocument();
    expect((api.calls.find((c) => c.path === '/found-items')?.body as { photoIds: string[] }).photoIds).toEqual([
      '11111111-1111-4111-8111-111111111111',
    ]);
    vi.restoreAllMocks();
  });

  it('업로드가 끝나지 않았거나 실패한 사진이 있으면 등록하지 않는다', async () => {
    const { api } = setup();
    vi.stubGlobal('Image', class {
      naturalWidth = 10;
      naturalHeight = 10;
      onload?: () => void;
      set src(_: string) {
        queueMicrotask(() => this.onload?.());
      }
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      () => ({ drawImage: vi.fn() }) as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb: BlobCallback) => cb(new Blob(['j'])));
    let finish: (() => void) | undefined;
    class FailXHR {
      upload = {};
      status = 413;
      response = { code: 'PAYLOAD_TOO_LARGE', message: '파일이 너무 큽니다' };
      onload?: () => void;
      withCredentials = false;
      open() {}
      send() {
        finish = () => this.onload?.();
      }
    }
    vi.stubGlobal('XMLHttpRequest', FailXHR);

    await userEvent.click(screen.getByRole('radio', { name: '전자기기' }));
    await userEvent.type(screen.getByLabelText('맡긴 장소'), '2학년 교무실');
    await userEvent.upload(screen.getByLabelText('사진 추가'), [image('a.jpg')]);
    await screen.findByText(/업로드 중\.\.\. 1장 중 1번째/);
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    expect(await screen.findByText(/사진을 올리는 중이에요/)).toBeInTheDocument();

    finish!();
    expect(await screen.findByText('1장을 올리지 못했습니다')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '사진 1 다시 올리기' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('올리지 못한 사진이 있어요');
    expect(api.calls.some((c) => c.path === '/found-items')).toBe(false);
    vi.restoreAllMocks();
  });

  it('[등록하기]는 비어 있는 칸의 오류를 한 번에 드러낸다', async () => {
    const { api } = setup();
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent);
    expect(alerts).toEqual(['! 물건 종류를 선택해 주세요', '! 맡긴 장소를 입력해 주세요']);
    expect(api.calls.some((c) => c.path === '/found-items')).toBe(false);
  });

  it('선택 항목을 펼쳐 이름까지 적어 등록한다', async () => {
    const { api } = setup();
    await userEvent.click(screen.getByRole('radio', { name: '지갑·카드' }));
    await userEvent.type(screen.getByLabelText('맡긴 장소'), '본관 1층 행정실');
    await userEvent.clear(screen.getByLabelText('주운 날짜'));
    await userEvent.type(screen.getByLabelText('주운 날짜'), '2026-09-26');
    await userEvent.click(screen.getByRole('button', { name: /물건 정보 더 적기/ }));
    await userEvent.type(screen.getByLabelText('물건 이름'), '갈색 반지갑');
    await userEvent.type(screen.getByLabelText('색상'), '갈색');
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));

    expect(await screen.findByText('습득물 상세 화면')).toBeInTheDocument();
    expect(api.calls.find((c) => c.path === '/found-items')?.body).toEqual({
      category: 'WALLET_CARD',
      keptAt: '본관 1층 행정실',
      foundDate: '2026-09-26',
      title: '갈색 반지갑',
      color: '갈색',
      photoIds: [],
    });
  });

  it('선택 항목에 오류가 있으면 접힌 영역을 펼쳐 보여 준다', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: /물건 정보 더 적기/ }));
    await userEvent.type(screen.getByLabelText('색상'), 'x'.repeat(21));
    await userEvent.click(screen.getByRole('button', { name: /물건 정보 더 적기/ }));
    expect(screen.queryByLabelText('색상')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    expect(screen.getByLabelText('색상')).toBeInTheDocument();
    expect(screen.getByText('! 색상은 20자 이하로 입력해 주세요')).toBeInTheDocument();
  });

  it('서버 오류는 문구로', async () => {
    setup([500, { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' }]);
    await userEvent.click(screen.getByRole('radio', { name: '문구' }));
    await userEvent.type(screen.getByLabelText('맡긴 장소'), '행정실');
    await userEvent.click(screen.getByRole('button', { name: '등록하기' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('서버 오류가 발생했습니다');
  });
});
