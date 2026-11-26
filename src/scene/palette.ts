// Ortak paletler: ten, gökyüzü, ortam ışığı. Bölgeye özel paletler kit dosyalarında.
import { type RGB, hex } from "./color";
import type { TimeOfDay, Weather } from "./types";

/** Tamsayı karıştırma: tohumlardan alt tohum üretmek için. */
export function hash(...parts: number[]): number {
  let h = 0x811c9dc5;
  for (const p of parts) {
    h ^= p | 0;
    h = Math.imul(h, 0x01000193);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    h ^= h >>> 12;
  }
  return h >>> 0;
}

export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/**
 * Ten tonları: açıktan koyuya 10 basamak. Her bölge kendi ağırlıklarını verir;
 * hiçbir bölge tek tona indirgenmez.
 */
export const SKIN: RGB[] = [
  "#f2d4bf", "#e7bf9e", "#d8a680", "#c58e66", "#b07752",
  "#9a6343", "#835033", "#6c4028", "#58331f", "#472818",
].map(hex);

export const SKY: Record<TimeOfDay, RGB[]> = {
  dawn: ["#3b4677", "#8f7aa2", "#e2a596", "#f6cf98"].map(hex),
  day: ["#4f97d6", "#79b6e6", "#a9d3ef", "#d4ebf3"].map(hex),
  dusk: ["#2b2858", "#71457a", "#d46a5c", "#f4a55a"].map(hex),
  night: ["#090d24", "#111a40", "#1b2a58", "#2a3a6a"].map(hex),
};

/** Kapalı / yağmurlu hava gökyüzü. */
export const SKY_OVERCAST: Record<TimeOfDay, RGB[]> = {
  dawn: ["#4a4d63", "#7d7a86", "#a6a0a2"].map(hex),
  day: ["#7f8c99", "#a3adb6", "#c4cbd0"].map(hex),
  dusk: ["#3e3a52", "#6e5e6e", "#9a7f7a"].map(hex),
  night: ["#0d0f1c", "#181b2c", "#24283a"].map(hex),
};

/** Harmattan / toz pusu gökyüzü. */
export const SKY_HAZE: Record<TimeOfDay, RGB[]> = {
  dawn: ["#6c6070", "#b59a8a", "#e2c49a"].map(hex),
  day: ["#c2b08c", "#d9c8a2", "#e8dbbb"].map(hex),
  dusk: ["#5a4250", "#b0705a", "#e0a066"].map(hex),
  night: ["#14121c", "#231e26", "#332a2c"].map(hex),
};

export function skyFor(t: TimeOfDay, w: Weather): RGB[] {
  if (w === "rain" || w === "cloudy" || w === "snow") return SKY_OVERCAST[t];
  if (w === "haze") return SKY_HAZE[t];
  return SKY[t];
}

/** Ortam ışığı çarpanı [r,g,b]. Dış mekân. */
export const AMBIENT_OUT: Record<TimeOfDay, [number, number, number]> = {
  dawn: [0.86, 0.8, 0.84],
  day: [1.0, 1.0, 1.0],
  dusk: [0.98, 0.74, 0.62],
  night: [0.34, 0.38, 0.56],
};

/** İç mekân: pencereden gelen ışık ayrıca eklenir. */
export const AMBIENT_IN: Record<TimeOfDay, [number, number, number]> = {
  dawn: [0.66, 0.62, 0.68],
  day: [0.86, 0.84, 0.82],
  dusk: [0.7, 0.58, 0.54],
  night: [0.34, 0.32, 0.4],
};

export const LAMP_WARM = hex("#ffc874");
export const LAMP_COOL = hex("#e6f0ff");
export const SCREEN_GLOW = hex("#8fb8ff");
export const FIRE = hex("#ff9a3c");
