import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../shared/api/client';
import { compressImage } from './compressImage';
import { uploadPhoto } from './uploadPhoto';

export const MAX_PHOTOS = 3;

export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error';

export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  photoId?: string;
  error?: string;
}

interface Deps {
  compress?: (file: Blob) => Promise<Blob>;
  upload?: typeof uploadPhoto;
}

let seq = 0;

/**
 * 고른 사진을 한 장씩 차례로 축소 → 업로드한다.
 * 상태는 사진별로 따로 둔다 (한 장이 실패해도 나머지는 그대로).
 */
export function usePhotoUploads({ compress = compressImage, upload = uploadPhoto }: Deps = {}) {
  const itemsRef = useRef<UploadItem[]>([]);
  const [items, setItems] = useState<UploadItem[]>([]);
  const running = useRef(false);
  const controllers = useRef(new Map<string, AbortController>());

  const commit = () => setItems([...itemsRef.current]);
  const patch = (id: string, change: Partial<UploadItem>) => {
    itemsRef.current = itemsRef.current.map((it) => (it.id === id ? { ...it, ...change } : it));
    commit();
  };
  const exists = (id: string) => itemsRef.current.some((it) => it.id === id);

  const pump = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      for (;;) {
        const next = itemsRef.current.find((it) => it.status === 'queued');
        if (!next) break;
        const controller = new AbortController();
        controllers.current.set(next.id, controller);
        patch(next.id, { status: 'uploading', progress: 0, error: undefined });
        try {
          const blob = await compress(next.file);
          const photo = await upload(
            blob,
            next.file.name,
            (progress) => exists(next.id) && patch(next.id, { progress }),
            controller.signal,
          );
          if (exists(next.id)) patch(next.id, { status: 'done', progress: 100, photoId: photo.id });
        } catch (e) {
          if (!exists(next.id)) continue; // 지운 사진
          patch(next.id, { status: 'error', error: e instanceof ApiError || e instanceof Error ? e.message : '업로드 실패' });
        } finally {
          controllers.current.delete(next.id);
        }
      }
    } finally {
      running.current = false;
    }
  }, [compress, upload]);

  useEffect(() => {
    if (items.some((it) => it.status === 'queued')) void pump();
  }, [items, pump]);

  // 화면을 떠나면 미리보기 URL·진행 중 업로드 정리
  useEffect(
    () => () => {
      controllers.current.forEach((c) => c.abort());
      itemsRef.current.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    },
    [],
  );

  const add = useCallback((files: File[]) => {
    const room = MAX_PHOTOS - itemsRef.current.length;
    const added = files.slice(0, Math.max(0, room)).map<UploadItem>((file) => ({
      id: `photo-${++seq}`,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'queued',
      progress: 0,
    }));
    itemsRef.current = [...itemsRef.current, ...added];
    commit();
  }, []);

  const remove = useCallback((id: string) => {
    const target = itemsRef.current.find((it) => it.id === id);
    if (!target) return;
    controllers.current.get(id)?.abort();
    URL.revokeObjectURL(target.previewUrl);
    itemsRef.current = itemsRef.current.filter((it) => it.id !== id);
    commit();
  }, []);

  const active = items.findIndex((it) => it.status === 'uploading');
  return {
    items,
    add,
    remove,
    /** 진행 중인 사진의 순번(1부터)과 진행률 */
    current: active >= 0 ? { index: active + 1, total: items.length, progress: items[active].progress } : null,
    uploading: items.some((it) => it.status === 'queued' || it.status === 'uploading'),
    failed: items.filter((it) => it.status === 'error').length,
    photoIds: items.filter((it) => it.status === 'done').map((it) => it.photoId!),
  };
}
