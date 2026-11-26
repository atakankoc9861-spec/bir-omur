// Piksel tamponu ve çizim ilkelleri. DOM'a bağlı değil: tarayıcıda da Node'da da aynı çalışır.
import { type RGB, R, G, B, mix, outlineOf } from "./color";

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** 4x4 Bayer eşiği (0-1). Geçişleri piksel sanat tarzı "noktalı" yapar. */
export const bayer = (x: number, y: number): number => (BAYER4[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

/** Konuma bağlı sabit gürültü (0-1). Doku için; her çizimde aynı sonucu verir. */
export function noise2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export abstract class Surface {
  constructor(
    public readonly w: number,
    public readonly h: number,
  ) {}
  abstract set(x: number, y: number, c: RGB): void;
  /** Saydam ise -1. */
  abstract get(x: number, y: number): number;

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    const x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.w, Math.round(x + w)), y1 = Math.min(this.h, Math.round(y + h));
    for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) this.set(i, j, c);
  }
  hline(x: number, y: number, len: number, c: RGB): void {
    this.rect(x, y, len, 1, c);
  }
  vline(x: number, y: number, len: number, c: RGB): void {
    this.rect(x, y, 1, len, c);
  }
  /** Yoğunluğa göre Bayer noktalama (0 = hiç, 1 = tam dolu). */
  dither(x: number, y: number, w: number, h: number, c: RGB, density: number): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (bayer(i, j) < density) this.set(i, j, c);
  }
  /** Dikey degrade: bantlara ayrılır, bant aralarında Bayer noktalama. */
  gradV(x: number, y: number, w: number, h: number, stops: RGB[], bands = 8): void {
    const cols: RGB[] = [];
    for (let k = 0; k <= bands; k++) {
      const t = (k / bands) * (stops.length - 1);
      const i = Math.min(stops.length - 2, Math.floor(t));
      cols.push(mix(stops[i], stops[i + 1], t - i));
    }
    for (let j = 0; j < h; j++) {
      const f = (j / Math.max(1, h - 1)) * bands;
      const k = Math.min(bands - 1, Math.floor(f));
      const fr = f - k;
      for (let i = 0; i < w; i++) this.set(x + i, y + j, bayer(x + i, y + j) < fr ? cols[k + 1] : cols[k]);
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / ((ry + 0.5) * (ry + 0.5)))));
      this.hline(cx - hw, cy + dy, hw * 2 + 1, c);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
}

/** Ana sahne tamponu: RGBA, doğrudan ImageData'ya kopyalanabilir. */
export class Raster extends Surface {
  readonly data: Uint8ClampedArray;
  private readonly px: Uint32Array;
  /** 1 = kendi ışığını yayan piksel (gökyüzü, yanan pencere, ekran). Işık geçişi bunlara dokunmaz. */
  readonly emissive: Uint8Array;

  constructor(w: number, h: number) {
    super(w, h);
    this.data = new Uint8ClampedArray(w * h * 4);
    this.px = new Uint32Array(this.data.buffer);
    this.emissive = new Uint8Array(w * h);
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    // Küçük-endian (tüm Android/x86 cihazlar): bellekte R,G,B,A sırası.
    this.px[(y | 0) * this.w + (x | 0)] = 0xff000000 | (B(c) << 16) | (G(c) << 8) | R(c);
  }
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    const v = this.px[(y | 0) * this.w + (x | 0)];
    return ((v & 255) << 16) | (((v >> 8) & 255) << 8) | ((v >> 16) & 255);
  }
  glow(x: number, y: number, w: number, h: number): void {
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.emissive[j * this.w + i] = 1;
  }
  /** Alanı bir renge doğru karıştırır (pus, sis, ıslaklık). */
  tint(x: number, y: number, w: number, h: number, c: RGB, t: number): void {
    for (let j = Math.max(0, y); j < Math.min(this.h, y + h); j++)
      for (let i = Math.max(0, x); i < Math.min(this.w, x + w); i++) this.set(i, j, mix(this.get(i, j), c, t));
  }
  copyFrom(o: Raster): void {
    this.data.set(o.data);
    this.emissive.set(o.emissive);
  }
}

/** Küçük saydam çizim: karakterler ve eşyalar. Otomatik kontur ekler. */
export class Sprite extends Surface {
  readonly px: Int32Array;
  constructor(w: number, h: number) {
    super(w, h);
    this.px = new Int32Array(w * h).fill(-1);
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[(y | 0) * this.w + (x | 0)] = c;
  }
  get(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return -1;
    return this.px[(y | 0) * this.w + (x | 0)];
  }
  clear(x: number, y: number): void {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = -1;
  }
  /** Seçici kontur: her dış kenara komşu rengin koyusu. */
  outline(): void {
    const src = this.px.slice();
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : src[y * this.w + x]);
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] !== -1) continue;
        const n = [at(x, y - 1), at(x, y + 1), at(x - 1, y), at(x + 1, y)].find((v) => v !== -1);
        if (n !== undefined) this.px[y * this.w + x] = outlineOf(n);
      }
  }
  blitTo(dst: Surface, x: number, y: number, flip = false): void {
    for (let j = 0; j < this.h; j++)
      for (let i = 0; i < this.w; i++) {
        const c = this.px[j * this.w + (flip ? this.w - 1 - i : i)];
        if (c !== -1) dst.set(x + i, y + j, c);
      }
  }
}
