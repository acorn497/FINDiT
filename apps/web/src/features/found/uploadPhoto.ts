import type { ApiErrorBody, Photo } from '@findit/shared';
import { ApiError } from '../../shared/api/client';

/**
 * 사진 1장을 XHR 로 올린다. fetch 는 업로드 진행률을 알 수 없어서 XHR 을 쓴다.
 * onProgress 는 0~100 정수.
 */
export function uploadPhoto(blob: Blob, filename: string, onProgress: (percent: number) => void, signal?: AbortSignal) {
  return new Promise<Photo>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads');
    xhr.withCredentials = true;
    xhr.responseType = 'json';

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      const body = xhr.response as (Photo & Partial<ApiErrorBody>) | null;
      if (xhr.status >= 200 && xhr.status < 300 && body) {
        onProgress(100);
        resolve(body);
      } else {
        reject(new ApiError(xhr.status, body?.code ?? `HTTP_${xhr.status}`, body?.message ?? '사진을 올리지 못했습니다'));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, 'NETWORK_ERROR', '네트워크 오류로 사진을 올리지 못했습니다'));
    xhr.onabort = () => reject(new DOMException('업로드 취소', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort(), { once: true });

    const form = new FormData();
    form.append('file', blob, filename.replace(/\.[^.]+$/, '') + '.jpg');
    xhr.send(form);
  });
}
