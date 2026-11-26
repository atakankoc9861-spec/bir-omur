// Renk yardımcıları. Renkler 0xRRGGBB tam sayısı olarak tutulur (hızlı ve kopyalaması ucuz).

export type RGB = number;

export const hex = (s: string): RGB => parseInt(s.replace("#", ""), 16);
export const R = (c: RGB): number => (c >> 16) & 255;
export const G = (c: RGB): number => (c >> 8) & 255;
export const B = (c: RGB): number => c & 255;

const c8 = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));
export const rgb = (r: number, g: number, b: number): RGB => (c8(r) << 16) | (c8(g) << 8) | c8(b);

export function mix(a: RGB, b: RGB, t: number): RGB {
  return rgb(R(a) + (R(b) - R(a)) * t, G(a) + (G(b) - G(a)) * t, B(a) + (B(b) - B(a)) * t);
}

export function mul(c: RGB, f: number): RGB {
  return rgb(R(c) * f, G(c) * f, B(c) * f);
}

/** Gölge: koyulaşır ve hafif soğuk/mora kayar (piksel sanatta düz siyahlaştırmaktan daha canlı durur). */
export function darker(c: RGB, t = 0.25): RGB {
  return mix(mul(c, 1 - t), 0x2a1838, t * 0.35);
}

/** Işık: açılır ve hafif sıcağa kayar. */
export function lighter(c: RGB, t = 0.2): RGB {
  return mix(c, 0xfff4e0, t);
}

/** Kontur rengi: komşu rengin çok koyu, morumsu hali. */
export function outlineOf(c: RGB): RGB {
  return mix(mul(c, 0.4), 0x1c1220, 0.4);
}

export function desat(c: RGB, t: number): RGB {
  const l = 0.3 * R(c) + 0.59 * G(c) + 0.11 * B(c);
  return mix(c, rgb(l, l, l), t);
}

export function luma(c: RGB): number {
  return (0.3 * R(c) + 0.59 * G(c) + 0.11 * B(c)) / 255;
}
