import * as jpeg from 'jpeg-js';

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

/**
 * 시드용 그라데이션 JPEG (외부에서 내려받지 않고 코드로 만든다).
 * 왼쪽 위 from → 오른쪽 아래 to, 기본 800×800.
 */
const cache = new Map<string, Buffer>();

export function gradientJpeg(from: string, to: string, size = 800, quality = 82): Buffer {
  const key = `${from}${to}${size}${quality}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const [r1, g1, b1] = hex(from);
  const [r2, g2, b2] = hex(to);
  const data = Buffer.alloc(size * size * 4);
  const max = 2 * (size - 1);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / max;
      const o = (y * size + x) * 4;
      data[o] = Math.round(r1 + (r2 - r1) * t);
      data[o + 1] = Math.round(g1 + (g2 - g1) * t);
      data[o + 2] = Math.round(b1 + (b2 - b1) * t);
      data[o + 3] = 255;
    }
  }
  const out = jpeg.encode({ data, width: size, height: size }, quality).data;
  cache.set(key, out);
  return out;
}
