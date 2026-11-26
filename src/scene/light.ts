// Işık geçişi (en son katman). Gün saatine göre ortam rengi + nokta ışıklar.
// Işık 32 basamağa yuvarlanır (gözle görülmeyecek kadar ince). Noktalama (dither) ışıkta
// kullanılmaz: denemelerde tüm yüzeyi kumlu gösterdi; noktalama sadece gökyüzü ve dokularda.
//
// Hız (Kalite Y3): piksel başına renk çözme yok; doğrudan RGBA bayt dizisi üzerinde çalışır,
// her ışık yalnız kendi sınır kutusunu gezer.
import { type RGB, R, G, B } from "./color";
import type { Raster } from "./raster";

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: RGB;
  strength: number;
  /** Elips: yatayda yayılan ışık havuzu için (yer lambası, pencere ışığı). */
  squashY?: number;
}

const STEPS = 32;
const MAX = 1.16;

let buf = new Float32Array(0);

export function applyLighting(r: Raster, ambient: [number, number, number], lights: LightSource[]): void {
  const { w, h } = r;
  const n = w * h;
  if (buf.length < n * 3) buf = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { buf[i * 3] = ambient[0]; buf[i * 3 + 1] = ambient[1]; buf[i * 3 + 2] = ambient[2]; }
  for (const L of lights) {
    const sq = L.squashY ?? 1;
    const rad = L.radius;
    const lr = (R(L.color) / 255) * L.strength, lg = (G(L.color) / 255) * L.strength, lb = (B(L.color) / 255) * L.strength;
    const x0 = Math.max(0, Math.floor(L.x - rad)), x1 = Math.min(w - 1, Math.ceil(L.x + rad));
    const y0 = Math.max(0, Math.floor(L.y - rad * sq)), y1 = Math.min(h - 1, Math.ceil(L.y + rad * sq));
    const r2 = rad * rad;
    for (let y = y0; y <= y1; y++) {
      const dy = (y - L.y) / sq;
      const dy2 = dy * dy;
      if (dy2 >= r2) continue;
      for (let x = x0; x <= x1; x++) {
        const dx = x - L.x;
        const d2 = dx * dx + dy2;
        if (d2 >= r2) continue;
        const f = 1 - Math.sqrt(d2) / rad;
        const k = f * f * (3 - 2 * f); // yumuşak düşüş
        const o = (y * w + x) * 3;
        buf[o] += lr * k; buf[o + 1] += lg * k; buf[o + 2] += lb * k;
      }
    }
  }
  const d = r.data, em = r.emissive;
  for (let i = 0; i < n; i++) {
    if (em[i]) continue;
    const o = i * 3, p = i * 4;
    d[p] = d[p] * (Math.round(Math.min(MAX, buf[o]) * STEPS) / STEPS);
    d[p + 1] = d[p + 1] * (Math.round(Math.min(MAX, buf[o + 1]) * STEPS) / STEPS);
    d[p + 2] = d[p + 2] * (Math.round(Math.min(MAX, buf[o + 2]) * STEPS) / STEPS);
  }
}
