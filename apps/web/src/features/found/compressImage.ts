/** 업로드 전 사진 축소 기준 — 긴 변 1600px, JPEG 품질 0.8 */
export const MAX_SIDE = 1600;
export const JPEG_QUALITY = 0.8;

/** 비율을 지키며 긴 변이 maxSide 를 넘지 않게 줄인 크기 (키우지는 않는다) */
export function fitWithin(width: number, height: number, maxSide = MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('사진을 읽지 못했습니다'));
    };
    img.src = url;
  });
}

/**
 * 캔버스로 긴 변 1600px 이하, JPEG 0.8 로 다시 그린다.
 * 휴대폰 원본(4~10MB)을 그대로 올리지 않도록 업로드 전에 거친다.
 */
export async function compressImage(file: Blob, maxSide = MAX_SIDE, quality = JPEG_QUALITY): Promise<Blob> {
  const img = await loadImage(file);
  const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('사진을 줄이지 못했습니다');
  ctx.drawImage(img, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('사진을 줄이지 못했습니다'))), 'image/jpeg', quality),
  );
}
