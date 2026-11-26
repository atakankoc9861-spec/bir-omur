// Ortak eşya ve çevre çizimleri. Bölge kitleri bunları kendi paletleriyle çağırır.
// Kural: ışık sol üstten gelir; sağ ve alt kenar koyu, üst kenar açık.
import { type RGB, darker, lighter, mix, hex, outlineOf } from "./color";
import { type Raster, noise2 } from "./raster";
import { type Garment, patternColor } from "./people";

export interface Rect { x: number; y: number; w: number; h: number }

/** Gölgeli kutu: eşyaların temel yapı taşı. */
export function box(r: Raster, x: number, y: number, w: number, h: number, c: RGB, outline = true): void {
  r.rect(x, y, w, h, c);
  r.hline(x, y, w, lighter(c, 0.18));
  r.vline(x + w - 1, y, h, darker(c, 0.2));
  r.hline(x, y + h - 1, w, darker(c, 0.28));
  if (outline) {
    const o = outlineOf(c);
    r.hline(x, y - 1, w, o); r.hline(x, y + h, w, o);
    r.vline(x - 1, y, h, o); r.vline(x + w, y, h, o);
  }
}

export function clothRect(r: Raster, x: number, y: number, w: number, h: number, g: Garment, shadeRight = true): void {
  for (let j = y; j < y + h; j++)
    for (let i = x; i < x + w; i++) {
      let c = patternColor(g, i, j);
      if (shadeRight && i >= x + w - 1) c = darker(c, 0.2);
      if (j === y + h - 1) c = darker(c, 0.15);
      r.set(i, j, c);
    }
}

/** Zemin altı gölgesi (eşyayı yere oturtur). */
export function groundShadow(r: Raster, x: number, y: number, w: number): void {
  for (let i = x; i < x + w; i++) r.set(i, y, darker(r.get(i, y), 0.3));
  for (let i = x + 1; i < x + w - 1; i++) r.set(i, y + 1, darker(r.get(i, y + 1), 0.15));
}

// ------------------------------------------------------------ İç mekân

export interface WindowStyle {
  frame: RGB;
  curtain: Garment | null;
  shutters: RGB | null;
  grille: boolean;
  arched: boolean;
  sill: RGB;
}

/** Pencere: içine dış görünüm çizilir (gökyüzü, uzak manzara) ve ışıyan alan olarak işaretlenir. */
export function windowFrame(r: Raster, x: number, y: number, w: number, h: number, st: WindowStyle, drawView: (rc: Rect) => void): void {
  const inner = { x: x + 2, y: y + 2, w: w - 4, h: h - 4 };
  drawView(inner);
  r.glow(inner.x, inner.y, inner.w, inner.h);
  const f = st.frame;
  r.rect(x, y, w, 2, f); r.rect(x, y + h - 2, w, 2, f);
  r.rect(x, y, 2, h, f); r.rect(x + w - 2, y, 2, h, darker(f, 0.12));
  r.vline(x + Math.floor(w / 2), y + 2, h - 4, f);
  r.hline(x + 2, y + 2 + Math.floor((h - 4) * 0.4), w - 4, f);
  if (st.arched) {
    for (let i = 0; i < 4; i++) r.hline(x + 3 - i, y - 4 + i, w - 6 + i * 2, f);
  }
  if (st.grille) {
    for (let i = inner.x + 3; i < inner.x + inner.w; i += 4) r.vline(i, inner.y, inner.h, darker(f, 0.35));
  }
  r.rect(x - 2, y + h, w + 4, 2, st.sill);
  r.hline(x - 2, y + h + 2, w + 4, darker(st.sill, 0.4));
  if (st.shutters) {
    const sw = Math.max(4, Math.floor(w / 3));
    for (const sx of [x - sw - 1, x + w + 1]) {
      box(r, sx, y, sw, h, st.shutters, false);
      for (let j = y + 2; j < y + h - 1; j += 2) r.hline(sx + 1, j, sw - 2, darker(st.shutters, 0.22));
    }
  }
  if (st.curtain) {
    const cw = Math.max(4, Math.floor(w / 4));
    clothRect(r, x - 3, y - 2, cw, h + 3, st.curtain);
    clothRect(r, x + w + 3 - cw, y - 2, cw, h + 3, st.curtain);
    r.hline(x - 5, y - 3, w + 10, darker(st.frame, 0.3));
  }
}

export function door(r: Raster, x: number, bottom: number, w: number, h: number, c: RGB, curtain: Garment | null): void {
  const y = bottom - h;
  r.rect(x - 1, y - 1, w + 2, h + 1, darker(c, 0.45));
  if (curtain) {
    r.rect(x, y, w, h, hex("#2a2026"));
    for (let j = y; j < bottom; j++)
      for (let i = x; i < x + w; i++) {
        const sway = Math.round(Math.sin((j - y) / 6) * 0);
        let cc = patternColor(curtain, i + sway, j);
        if ((i - x) % 4 === 3) cc = darker(cc, 0.18);
        if (j > bottom - 3 && (i + j) % 3 === 0) continue;
        r.set(i, j, cc);
      }
    return;
  }
  box(r, x, y, w, h, c, false);
  r.rect(x + 2, y + 2, w - 4, Math.floor(h / 2) - 3, darker(c, 0.1));
  r.rect(x + 2, y + Math.floor(h / 2) + 1, w - 4, Math.floor(h / 2) - 4, darker(c, 0.1));
  r.set(x + w - 3, y + Math.floor(h / 2), hex("#d8b45a"));
}

/** Kanepe. Oturma noktalarının x listesini döner. */
export function sofa(r: Raster, x: number, bottom: number, w: number, c: RGB, cushion: Garment | null, legs: RGB, highBack = true): number[] {
  const backH = highBack ? 13 : 10;
  box(r, x + 2, bottom - backH - 7, w - 4, backH, darker(c, 0.05));
  box(r, x + 2, bottom - 9, w - 4, 6, c);
  box(r, x, bottom - 12, 4, 9, lighter(c, 0.05));
  box(r, x + w - 4, bottom - 12, 4, 9, darker(c, 0.1));
  const n = Math.max(1, Math.round((w - 8) / 12));
  const seats: number[] = [];
  for (let i = 0; i < n; i++) {
    const sx = x + 4 + Math.round(((w - 8) / n) * (i + 0.5));
    seats.push(sx);
    if (cushion && i % 2 === 0) clothRect(r, sx - 3, bottom - backH - 4, 6, 5, cushion);
  }
  r.rect(x + 1, bottom - 3, 2, 3, legs); r.rect(x + w - 3, bottom - 3, 2, 3, legs);
  return seats;
}

/** Yer minderi / sedir: alçak oturma. */
export function floorSeating(r: Raster, x: number, bottom: number, w: number, g: Garment, back: Garment): number[] {
  clothRect(r, x, bottom - 14, w, 9, back);
  clothRect(r, x, bottom - 5, w, 5, g);
  r.hline(x, bottom - 5, w, lighter(patternColor(g, 0, 0), 0.2));
  const seats: number[] = [];
  for (let sx = x + 7; sx < x + w - 4; sx += 13) seats.push(sx);
  return seats;
}

export function table(r: Raster, x: number, bottom: number, w: number, h: number, wood: RGB, cloth: Garment | null): Rect {
  const top = bottom - h;
  if (cloth) {
    clothRect(r, x - 1, top, w + 2, 5, cloth);
    for (let i = x - 1; i < x + w + 1; i += 2) r.set(i, top + 5, patternColor(cloth, i, top + 5));
  } else box(r, x, top, w, 3, wood);
  r.rect(x + 1, top + 3, 2, h - 3, darker(wood, 0.15));
  r.rect(x + w - 3, top + 3, 2, h - 3, darker(wood, 0.3));
  return { x, y: top, w, h };
}

export function lowTable(r: Raster, x: number, bottom: number, w: number, wood: RGB): Rect {
  r.ellipse(x + w / 2, bottom - 4, Math.floor(w / 2), 2, wood);
  r.hline(x + 1, bottom - 6, w - 2, lighter(wood, 0.2));
  r.hline(x + 2, bottom - 2, w - 4, darker(wood, 0.3));
  r.rect(x + 3, bottom - 2, 2, 2, darker(wood, 0.35)); r.rect(x + w - 5, bottom - 2, 2, 2, darker(wood, 0.35));
  return { x, y: bottom - 6, w, h: 6 };
}

export function chair(r: Raster, x: number, bottom: number, c: RGB, plastic: boolean): void {
  if (plastic) {
    r.rect(x, bottom - 17, 8, 8, c);
    r.hline(x, bottom - 17, 8, lighter(c, 0.25));
    r.rect(x + 1, bottom - 15, 6, 1, darker(c, 0.1));
    r.rect(x - 1, bottom - 9, 10, 2, c);
    r.line(x, bottom - 7, x - 1, bottom - 1, darker(c, 0.15));
    r.line(x + 7, bottom - 7, x + 8, bottom - 1, darker(c, 0.25));
  } else {
    r.rect(x, bottom - 18, 2, 18, c);
    r.rect(x + 6, bottom - 18, 2, 18, darker(c, 0.2));
    r.rect(x, bottom - 17, 8, 2, lighter(c, 0.1));
    r.rect(x - 1, bottom - 9, 10, 2, c);
  }
}

export function stool(r: Raster, x: number, bottom: number, c: RGB): void {
  box(r, x, bottom - 5, 8, 2, c);
  r.rect(x + 1, bottom - 3, 1, 3, darker(c, 0.25));
  r.rect(x + 6, bottom - 3, 1, 3, darker(c, 0.35));
}

export type TvKind = "radio" | "crt" | "flat";
export function tvKindFor(year: number): TvKind {
  if (year < 1975) return "radio";
  if (year < 2008) return "crt";
  return "flat";
}

/** Televizyon/radyo. Ekranı ışıyan dikdörtgen olarak döner (gece aydınlatması için). */
export function screen(r: Raster, x: number, bottom: number, kind: TvKind, standColor: RGB, on: boolean, big: boolean): Rect | null {
  if (kind === "radio") {
    box(r, x, bottom - 8, 13, 8, hex("#7a4e2c"));
    r.rect(x + 2, bottom - 6, 5, 4, hex("#c9b48a"));
    for (let j = bottom - 6; j < bottom - 2; j += 2) r.hline(x + 2, j, 5, hex("#8a7450"));
    r.set(x + 9, bottom - 5, hex("#e8d8a0")); r.set(x + 10, bottom - 3, hex("#3a2a1a"));
    r.vline(x + 11, bottom - 13, 5, hex("#9a9a9a"));
    return null;
  }
  const w = kind === "crt" ? 16 : big ? 30 : 22;
  const h = kind === "crt" ? 13 : big ? 17 : 13;
  if (kind === "crt") {
    box(r, x, bottom - h, w, h, hex("#4a4644"));
    r.rect(x + 2, bottom - h + 2, w - 6, h - 4, on ? hex("#7fa8c8") : hex("#2c3236"));
    r.set(x + w - 3, bottom - h + 3, hex("#c04a3a")); r.set(x + w - 3, bottom - h + 5, hex("#9a9a9a"));
    if (on) { r.dither(x + 2, bottom - h + 2, w - 6, h - 4, hex("#b8d0e0"), 0.2); r.glow(x + 2, bottom - h + 2, w - 6, h - 4); }
    return { x: x + 2, y: bottom - h + 2, w: w - 6, h: h - 4 };
  }
  box(r, x, bottom - h, w, h, hex("#1c1d22"));
  const sc = { x: x + 1, y: bottom - h + 1, w: w - 2, h: h - 3 };
  if (on) {
    r.gradV(sc.x, sc.y, sc.w, sc.h, [hex("#5a8ad0"), hex("#8ac0e0"), hex("#5aa060")], 4);
    r.glow(sc.x, sc.y, sc.w, sc.h);
  } else r.rect(sc.x, sc.y, sc.w, sc.h, hex("#22262e"));
  r.rect(x + w / 2 - 1, bottom, 3, 2, hex("#1c1d22"));
  void standColor;
  return sc;
}

/** Alçak dolap / TV sehpası. Üst yüzeyin y değerini döner. */
export function cabinet(r: Raster, x: number, bottom: number, w: number, h: number, wood: RGB): number {
  box(r, x, bottom - h, w, h, wood);
  const n = Math.max(1, Math.round(w / 12));
  for (let i = 1; i < n; i++) r.vline(x + Math.round((w / n) * i), bottom - h + 2, h - 3, darker(wood, 0.25));
  for (let i = 0; i < n; i++) r.set(x + Math.round((w / n) * (i + 0.5)), bottom - h / 2, hex("#d0b070"));
  return bottom - h;
}

/** Vitrin / raf: tabak, kâse, kitap. */
export function shelfWithItems(r: Raster, x: number, y: number, w: number, wood: RGB, items: RGB[], kind: "bowls" | "books" | "jars", seed: number): void {
  r.rect(x, y, w, 2, wood);
  r.hline(x, y + 2, w, darker(wood, 0.4));
  let i = x + 1;
  let k = 0;
  while (i < x + w - 3) {
    const c = items[(seed + k) % items.length];
    if (kind === "books") {
      const bh = 5 + ((seed + k * 7) % 3);
      r.rect(i, y - bh, 2, bh, c); r.vline(i + 1, y - bh, bh, darker(c, 0.2));
      i += 2 + ((seed + k) % 3 === 0 ? 1 : 0);
    } else if (kind === "bowls") {
      r.rect(i, y - 3, 5, 3, c); r.hline(i, y - 3, 5, lighter(c, 0.3)); r.hline(i + 1, y - 1, 3, darker(c, 0.25));
      r.set(i + 1, y - 2, hex("#f0f0e8"));
      i += 6;
    } else {
      r.rect(i, y - 5, 3, 5, c); r.hline(i, y - 6, 3, darker(c, 0.3)); r.set(i, y - 4, lighter(c, 0.3));
      i += 4;
    }
    k++;
  }
}

export function glassCabinet(r: Raster, x: number, bottom: number, w: number, h: number, wood: RGB, dishes: RGB[]): void {
  box(r, x, bottom - h, w, h, wood);
  r.rect(x + 2, bottom - h + 2, w - 4, h - 10, mix(hex("#a8c0c8"), wood, 0.25));
  for (let s = 0; s < 3; s++) {
    const sy = bottom - h + 2 + Math.round(((h - 10) / 3) * (s + 1)) - 1;
    r.hline(x + 2, sy, w - 4, darker(wood, 0.1));
    for (let i = x + 3; i < x + w - 4; i += 4) {
      const c = dishes[(i + s) % dishes.length];
      r.rect(i, sy - 3, 3, 3, c); r.set(i, sy - 3, lighter(c, 0.4));
    }
  }
  r.vline(x + Math.floor(w / 2), bottom - h + 2, h - 10, wood);
  r.rect(x + 2, bottom - 7, w - 4, 5, darker(wood, 0.1));
}

export function framePicture(r: Raster, x: number, y: number, w: number, h: number, frame: RGB, paint: (rc: Rect) => void): void {
  r.rect(x - 1, y - 1, w + 2, h + 2, frame);
  r.hline(x - 1, y + h + 1, w + 2, darker(frame, 0.5));
  paint({ x, y, w, h });
}

/** Küçük manzara resmi. */
export function landscapeArt(r: Raster, rc: Rect, sky: RGB, land: RGB): void {
  r.rect(rc.x, rc.y, rc.w, rc.h, sky);
  for (let i = 0; i < rc.w; i++) {
    const hh = Math.round(rc.h * 0.45 + Math.sin(i * 0.9) * 1.2);
    r.vline(rc.x + i, rc.y + rc.h - hh, hh, i % 3 === 0 ? darker(land, 0.15) : land);
  }
  r.set(rc.x + rc.w - 3, rc.y + 1, hex("#f6e0a0"));
}

/** Aile fotoğrafı (vefat eden yakın için siyah kurdeleli çerçeve). */
export function portrait(r: Raster, x: number, y: number, skin: RGB, hair: RGB, memorial: boolean): void {
  framePicture(r, x, y, 6, 7, memorial ? hex("#2a2420") : hex("#c8a060"), (rc) => {
    r.rect(rc.x, rc.y, rc.w, rc.h, memorial ? hex("#d8d0c0") : hex("#bcd0d8"));
    r.rect(rc.x + 2, rc.y + 2, 3, 3, skin);
    r.hline(rc.x + 2, rc.y + 1, 3, hair);
    r.rect(rc.x + 1, rc.y + 5, 5, 2, memorial ? hex("#5a5050") : hex("#5a7090"));
  });
  if (memorial) { r.set(x + 5, y - 1, hex("#101010")); r.set(x + 6, y, hex("#101010")); }
}

export function wallClock(r: Raster, x: number, y: number, c: RGB): void {
  r.ellipse(x, y, 3, 3, c);
  r.ellipse(x, y, 2, 2, hex("#f4eee0"));
  r.vline(x, y - 2, 2, hex("#222")); r.hline(x, y, 2, hex("#222"));
}

export function calendar(r: Raster, x: number, y: number, top: RGB): void {
  r.rect(x, y, 7, 9, hex("#f2ede2"));
  r.rect(x, y, 7, 3, top);
  for (let j = y + 4; j < y + 9; j += 2) for (let i = x + 1; i < x + 7; i += 2) r.set(i, j, hex("#9a9488"));
  r.set(x + 3, y - 1, hex("#555"));
}

export function plantPot(r: Raster, x: number, bottom: number, pot: RGB, leaf: RGB, kind: "bush" | "tall" | "flower", flower: RGB): void {
  if (kind === "tall") {
    for (let i = 0; i < 5; i++) {
      const lx = x + 1 + i;
      const lh = 8 + ((i * 5) % 6);
      r.vline(lx, bottom - 5 - lh, lh, i % 2 ? leaf : lighter(leaf, 0.15));
    }
  } else {
    r.ellipse(x + 3, bottom - 8, 4, 3, leaf);
    r.dither(x - 1, bottom - 11, 9, 6, lighter(leaf, 0.2), 0.3);
    r.dither(x - 1, bottom - 8, 9, 3, darker(leaf, 0.25), 0.4);
    if (kind === "flower") { r.set(x + 1, bottom - 10, flower); r.set(x + 4, bottom - 9, flower); r.set(x + 6, bottom - 11, flower); r.set(x + 2, bottom - 7, lighter(flower, 0.3)); }
  }
  box(r, x, bottom - 5, 7, 5, pot, false);
}

export function rug(r: Raster, x: number, y: number, w: number, h: number, g: Garment, border: RGB): void {
  for (let j = 0; j < h; j++) {
    const inset = Math.round((1 - j / h) * 3);
    for (let i = inset; i < w - inset; i++) {
      const edge = j === 0 || j === h - 1 || i === inset || i === w - inset - 1;
      r.set(x + i, y + j, edge ? border : patternColor(g, i, j));
    }
  }
  for (let i = 3; i < w - 3; i += 2) r.set(x + i, y + h, darker(border, 0.2));
}

export function ceilingFan(r: Raster, cx: number, y: number): void {
  r.vline(cx, 0, y, hex("#7a7a7a"));
  r.rect(cx - 2, y, 5, 2, hex("#d8d8d0"));
  r.hline(cx - 12, y + 1, 10, hex("#8a6a4a")); r.hline(cx + 3, y + 1, 10, hex("#6a4a3a"));
}

export function standingFan(r: Raster, x: number, bottom: number): void {
  r.vline(x + 4, bottom - 16, 14, hex("#cfcfcf"));
  r.rect(x + 1, bottom - 2, 7, 2, hex("#bfbfbf"));
  r.ellipse(x + 4, bottom - 20, 4, 4, hex("#e6e6e6"));
  r.ellipse(x + 4, bottom - 20, 2, 2, hex("#5a8ac0"));
}

export function acUnit(r: Raster, x: number, y: number): void {
  box(r, x, y, 20, 6, hex("#eceae4"));
  r.hline(x + 2, y + 4, 16, hex("#a8a8a4"));
  r.set(x + 17, y + 2, hex("#4ad07a"));
}

export function radiator(r: Raster, x: number, bottom: number, w: number): void {
  for (let i = 0; i < w; i += 2) { r.vline(x + i, bottom - 10, 9, hex("#e8e4dc")); r.vline(x + i + 1, bottom - 10, 9, hex("#c8c4bc")); }
}

/** Soba (odun/kömür) ve borusu. Işık kaynağı konumunu döner. */
export function woodStove(r: Raster, x: number, bottom: number, wallTop: number): { x: number; y: number } {
  box(r, x, bottom - 14, 12, 12, hex("#3a3634"));
  r.rect(x + 2, bottom - 9, 8, 4, hex("#e06a2a"));
  r.dither(x + 2, bottom - 9, 8, 4, hex("#ffc04a"), 0.4);
  r.glow(x + 2, bottom - 9, 8, 4);
  r.rect(x + 1, bottom - 2, 2, 2, hex("#2a2624")); r.rect(x + 9, bottom - 2, 2, 2, hex("#2a2624"));
  r.rect(x + 4, wallTop + 6, 3, bottom - 14 - wallTop - 6, hex("#5a5654"));
  r.rect(x + 4, wallTop + 6, 12, 3, hex("#5a5654"));
  r.rect(x + 3, bottom - 17, 6, 3, hex("#4a4644"));
  return { x: x + 6, y: bottom - 7 };
}

/** Mutfak tezgâhı ve ocak. */
export function kitchenCounter(r: Raster, x: number, bottom: number, w: number, c: RGB, top: RGB, tiles: RGB): void {
  for (let j = bottom - 30; j < bottom - 11; j++)
    for (let i = x; i < x + w; i++) r.set(i, j, (i - x) % 5 === 0 || (j - bottom) % 5 === 0 ? darker(tiles, 0.12) : tiles);
  box(r, x, bottom - 11, w, 11, c);
  r.rect(x, bottom - 12, w, 2, top);
  for (let i = x + 6; i < x + w; i += 10) r.vline(i, bottom - 9, 7, darker(c, 0.25));
  r.rect(x + 2, bottom - 15, 7, 3, hex("#5a5a60"));
  r.hline(x + 1, bottom - 16, 9, hex("#7a7a80"));
}

/** Kömür ocağı / mangal üzerinde tencere. */
export function coalPot(r: Raster, x: number, bottom: number, pot: RGB): { x: number; y: number } {
  r.rect(x + 1, bottom - 5, 8, 5, hex("#4a4a4e"));
  r.hline(x, bottom - 5, 10, hex("#6a6a6e"));
  r.rect(x + 3, bottom - 3, 4, 2, hex("#ff7a2a")); r.glow(x + 3, bottom - 3, 4, 2);
  r.ellipse(x + 5, bottom - 9, 5, 3, pot);
  r.hline(x + 1, bottom - 12, 9, lighter(pot, 0.3));
  r.set(x - 1, bottom - 10, darker(pot, 0.3)); r.set(x + 11, bottom - 10, darker(pot, 0.3));
  return { x: x + 5, y: bottom - 3 };
}

export function clayPot(r: Raster, x: number, bottom: number, c: RGB): void {
  r.ellipse(x + 5, bottom - 6, 5, 6, c);
  r.dither(x + 6, bottom - 11, 5, 11, darker(c, 0.2), 0.5);
  r.hline(x + 3, bottom - 12, 5, darker(c, 0.25));
  r.hline(x + 2, bottom - 13, 7, lighter(c, 0.2));
  r.hline(x + 2, bottom - 8, 7, darker(c, 0.15));
}

export function lantern(r: Raster, x: number, bottom: number, lit: boolean): { x: number; y: number } {
  r.rect(x + 1, bottom - 2, 5, 2, hex("#4a5a5a"));
  r.rect(x + 1, bottom - 7, 5, 5, lit ? hex("#ffd27a") : hex("#a8b8b0"));
  if (lit) r.glow(x + 2, bottom - 6, 3, 3);
  r.hline(x + 1, bottom - 8, 5, hex("#4a5a5a"));
  r.set(x + 3, bottom - 9, hex("#4a5a5a"));
  return { x: x + 3, y: bottom - 5 };
}

export function floorLamp(r: Raster, x: number, bottom: number, shade: RGB, lit: boolean): { x: number; y: number } {
  r.vline(x + 3, bottom - 24, 22, hex("#3a3a3a"));
  r.rect(x + 1, bottom - 2, 5, 2, hex("#3a3a3a"));
  for (let j = 0; j < 6; j++) r.hline(x + 2 - Math.floor(j / 2), bottom - 31 + j, 3 + Math.floor(j / 2) * 2, lit ? lighter(shade, 0.35) : shade);
  if (lit) r.glow(x, bottom - 28, 7, 3);
  return { x: x + 3, y: bottom - 26 };
}

export function crib(r: Raster, x: number, bottom: number, wood: RGB): void {
  // beşik / bebek yatağı: ayaklı kızak
  r.rect(x, bottom - 4, 18, 2, darker(wood, 0.2));
  r.line(x, bottom - 2, x + 4, bottom - 1, darker(wood, 0.35));
  r.line(x + 17, bottom - 2, x + 13, bottom - 1, darker(wood, 0.35));
  for (let i = x; i < x + 18; i += 3) r.vline(i, bottom - 12, 8, wood);
  r.hline(x, bottom - 12, 18, lighter(wood, 0.2));
  r.vline(x - 1, bottom - 15, 12, darker(wood, 0.1)); r.vline(x + 18, bottom - 15, 12, darker(wood, 0.25));
}

export function wovenMat(r: Raster, x: number, y: number, w: number, h: number, c1: RGB, c2: RGB): void {
  for (let j = 0; j < h; j++) {
    const inset = Math.round((1 - j / h) * 4);
    for (let i = inset; i < w - inset; i++) {
      const band = Math.floor((i + j * 0) / 4) % 5 === 0;
      r.set(x + i, y + j, band ? c2 : (i + j) % 2 === 0 ? c1 : darker(c1, 0.08));
    }
  }
}

/** Ortak yemek kabı + kenarında küçük kaseler. */
export function sharedBowl(r: Raster, cx: number, y: number, bowl: RGB, food: RGB): void {
  r.ellipse(cx, y, 6, 2, bowl);
  r.hline(cx - 6, y + 2, 13, darker(bowl, 0.3));
  r.ellipse(cx, y - 1, 4, 1, food);
  r.dither(cx - 4, y - 2, 9, 2, lighter(food, 0.25), 0.3);
}

export function teaSet(r: Raster, x: number, y: number): void {
  r.rect(x, y - 3, 5, 3, hex("#d0d4d8")); r.set(x + 5, y - 2, hex("#d0d4d8")); r.hline(x + 1, y - 4, 3, hex("#a0a4a8"));
  r.rect(x + 7, y - 2, 1, 2, hex("#b5502a")); r.rect(x + 9, y - 2, 1, 2, hex("#b5502a"));
}

export function fruitBowl(r: Raster, x: number, y: number): void {
  r.hline(x, y, 7, hex("#c8c0b0")); r.hline(x + 1, y + 1, 5, hex("#a8a090"));
  r.set(x + 1, y - 1, hex("#e04a2a")); r.set(x + 3, y - 1, hex("#f0b030")); r.set(x + 5, y - 1, hex("#6ab04a")); r.set(x + 2, y - 2, hex("#e86a2a")); r.set(x + 4, y - 2, hex("#c03a3a"));
}

// ------------------------------------------------------------ Zemin dokuları

export type FloorKind = "tile" | "wood" | "concrete" | "earth" | "terrazzo";

/** Perspektifli zemin. Ufuk çizgisi sahnenin üstünde; satırlar aşağı doğru genişler. */
export function floorFill(r: Raster, y0: number, kind: FloorKind, c1: RGB, c2: RGB, seed: number): void {
  const horizon = y0 - 34;
  for (let y = y0; y < r.h; y++) {
    const depth = 44 / (y - horizon); // uzakta büyük
    const v = (y - horizon) / 6;
    for (let x = 0; x < r.w; x++) {
      const u = ((x - r.w / 2) * depth) / 4;
      let c = c1;
      const n = noise2(x, y, seed);
      switch (kind) {
        case "tile": {
          const iu = Math.floor(u), iv = Math.floor(v * depth * 1.1);
          c = (iu + iv) % 2 === 0 ? c1 : c2;
          const fu = u - iu;
          if (fu < 0.08 * (y - horizon) / 40) c = darker(c, 0.18);
          if (Math.floor((y - horizon) * 0.5) !== Math.floor((y - horizon - 1) * 0.5) && (y - y0) % 5 === 0) c = darker(c, 0.18);
          break;
        }
        case "wood": {
          const plank = Math.floor(u * 1.6);
          c = plank % 3 === 0 ? c1 : plank % 3 === 1 ? mix(c1, c2, 0.5) : c2;
          if (n < 0.06) c = darker(c, 0.12);
          if (u * 1.6 - plank < 0.1 * (y - horizon) / 40) c = darker(c, 0.25);
          break;
        }
        case "terrazzo":
          c = n < 0.08 ? c2 : n > 0.95 ? lighter(c1, 0.3) : c1;
          if ((y - y0) % 9 === 0) c = darker(c, 0.08);
          break;
        case "concrete":
          c = n < 0.3 ? mix(c1, c2, 0.4) : c1;
          if (n > 0.985) c = darker(c1, 0.2);
          break;
        case "earth":
          c = n < 0.35 ? mix(c1, c2, 0.5) : c1;
          if (noise2(x >> 2, y >> 1, seed + 3) < 0.15) c = darker(c, 0.08);
          break;
      }
      // uzak satırlar biraz koyu (derinlik)
      if (y < y0 + 4) c = darker(c, 0.1 * (4 - (y - y0)) / 4);
      r.set(x, y, c);
    }
  }
}

export type WallKind = "plaster" | "mud" | "paint" | "stone";
export function wallFill(r: Raster, y0: number, y1: number, kind: WallKind, c: RGB, lower: RGB | null, seed: number): void {
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < r.w; x++) {
      const n = noise2(x, y, seed);
      let cc = lower && y > y1 - 26 ? lower : c;
      if (kind === "plaster" && n < 0.1) cc = darker(cc, 0.05);
      if (kind === "paint" && n < 0.04) cc = darker(cc, 0.04);
      if (kind === "mud") {
        const sw = noise2(x >> 3, (y + (x >> 1)) >> 2, seed + 1);
        if (sw < 0.3) cc = darker(cc, 0.07);
        else if (sw > 0.85) cc = lighter(cc, 0.06);
      }
      if (kind === "stone") {
        const row = Math.floor(y / 6);
        const bx = Math.floor((x + (row % 2) * 5) / 10);
        if (y % 6 === 0 || (x + (row % 2) * 5) % 10 === 0) cc = darker(cc, 0.2);
        else if (noise2(bx, row, seed) < 0.3) cc = darker(cc, 0.07);
      }
      r.set(x, y, cc);
    }
  if (lower) r.hline(0, y1 - 26, r.w, darker(lower, 0.25));
}

// ------------------------------------------------------------ Dış mekân

export type TreeKind = "olive" | "plane" | "cypress" | "palm" | "mango" | "baobab" | "neem" | "acacia" | "bare";

export function tree(r: Raster, x: number, base: number, kind: TreeKind, leaf: RGB, trunk: RGB, scale = 1, blossom: RGB | null = null): void {
  const s = scale;
  const blob = (cx: number, cy: number, rx: number, ry: number, c: RGB) => {
    r.ellipse(cx, cy, rx, ry, c);
    r.dither(cx - rx, cy - ry, rx * 2 + 1, Math.ceil(ry * 0.8), lighter(c, 0.18), 0.35);
    r.dither(cx - rx, cy + Math.floor(ry * 0.3), rx * 2 + 1, Math.ceil(ry * 0.7), darker(c, 0.2), 0.45);
  };
  switch (kind) {
    case "palm": {
      const h = Math.round(34 * s);
      for (let i = 0; i < h; i++) r.rect(x + Math.round(Math.sin(i / 12) * 2), base - i, 3, 1, i % 3 === 0 ? darker(trunk, 0.2) : trunk);
      const tx = x + 1 + Math.round(Math.sin(h / 12) * 2), ty = base - h;
      for (const [dx, dy] of [[-12, 4], [12, 4], [-9, -3], [9, -3], [-4, 7], [5, 7], [0, -6]]) r.line(tx, ty, tx + dx * s, ty + dy * s, leaf);
      for (const [dx, dy] of [[-12, 5], [12, 5], [-9, -2], [9, -2]]) r.line(tx, ty + 1, tx + dx * s, ty + dy * s, darker(leaf, 0.2));
      break;
    }
    case "cypress":
      r.rect(x, base - 4, 2, 4, trunk);
      for (let i = 0; i < 30 * s; i++) { const w = Math.round(Math.sin((i / (30 * s)) * Math.PI) * 4 + 1); r.hline(x + 1 - w, base - 4 - i, w * 2, i % 4 === 0 ? lighter(leaf, 0.1) : leaf); }
      break;
    case "baobab": {
      const h = Math.round(26 * s);
      r.rect(x - 5, base - h, 11, h, trunk);
      r.vline(x + 5, base - h, h, darker(trunk, 0.2));
      r.vline(x - 2, base - h + 4, h - 6, lighter(trunk, 0.1));
      for (const [dx, dy] of [[-12, -8], [10, -9], [-6, -12], [4, -13], [14, -4]]) r.line(x, base - h, x + dx * s, base - h + dy * s, trunk);
      for (const [dx, dy] of [[-12, -9], [10, -10], [-6, -13], [4, -14], [14, -5]]) blob(x + dx * s, base - h + dy * s, 4, 2, leaf);
      break;
    }
    case "acacia": {
      const h = Math.round(18 * s);
      r.line(x, base, x - 2, base - h, trunk); r.line(x - 2, base - h, x - 8, base - h - 4, trunk); r.line(x - 2, base - h, x + 7, base - h - 5, trunk);
      r.ellipse(x, base - h - 6, Math.round(15 * s), 3, leaf);
      r.dither(x - 15, base - h - 9, 31, 3, lighter(leaf, 0.2), 0.4);
      r.hline(x - 13, base - h - 3, 27, darker(leaf, 0.25));
      break;
    }
    case "bare": {
      const h = Math.round(20 * s);
      r.rect(x, base - h, 2, h, trunk);
      for (const [dx, dy] of [[-8, -10], [7, -12], [-4, -16], [3, -18], [10, -6], [-10, -4]]) r.line(x, base - h + 4, x + dx * s, base - h + dy * s, darker(trunk, 0.1));
      break;
    }
    default: {
      const h = Math.round((kind === "olive" ? 12 : 18) * s);
      r.rect(x, base - h, 3, h, trunk);
      r.vline(x + 2, base - h, h, darker(trunk, 0.25));
      if (kind === "olive") r.line(x + 1, base - h + 3, x - 4, base - h - 2, trunk);
      const rx = Math.round((kind === "olive" ? 11 : kind === "mango" ? 13 : 12) * s);
      const ry = Math.round((kind === "olive" ? 7 : 10) * s);
      blob(x + 1, base - h - ry + 3, rx, ry, leaf);
      if (kind === "olive") blob(x - 6, base - h - 2, 6, 4, leaf);
      if (kind === "neem" || kind === "plane") blob(x + 8, base - h - 2, 6, 5, darker(leaf, 0.05));
      if (kind === "mango") blob(x - 7, base - h - 1, 7, 6, leaf);
      if (blossom) for (let i = 0; i < 18; i++) r.set(x + 1 + Math.round(Math.sin(i * 2.3) * rx * 0.8), base - h - ry + 3 + Math.round(Math.cos(i * 1.7) * ry * 0.7), blossom);
    }
  }
}

export function car(r: Raster, x: number, bottom: number, body: RGB, year: number): void {
  const old = year < 1995;
  const w = 30;
  box(r, x, bottom - 9, w, 6, body);
  if (old) box(r, x + 6, bottom - 14, 16, 5, body);
  else for (let j = 0; j < 5; j++) r.hline(x + 5 + (4 - j), bottom - 10 - j, 20 - (4 - j) * 1 - j, body);
  r.rect(x + 8, bottom - 13, 6, 3, hex("#9ab4c4")); r.rect(x + 15, bottom - 13, 6, 3, hex("#86a0b0"));
  r.hline(x + 1, bottom - 6, w - 2, darker(body, 0.2));
  r.set(x, bottom - 8, hex("#f0e8b0")); r.set(x + w - 1, bottom - 8, hex("#d04030"));
  for (const wx of [x + 6, x + w - 7]) { r.ellipse(wx, bottom - 2, 3, 2, hex("#1e1e22")); r.set(wx, bottom - 2, hex("#8a8a8a")); }
}

export function motorbike(r: Raster, x: number, bottom: number, body: RGB): void {
  for (const wx of [x + 2, x + 14]) { r.ellipse(wx, bottom - 3, 3, 3, hex("#1e1e22")); r.set(wx, bottom - 3, hex("#9a9a9a")); }
  r.line(x + 2, bottom - 3, x + 8, bottom - 6, hex("#5a5a5a"));
  r.rect(x + 5, bottom - 8, 8, 3, body);
  r.rect(x + 6, bottom - 10, 5, 2, hex("#2a2a2a"));
  r.line(x + 13, bottom - 6, x + 14, bottom - 3, hex("#5a5a5a"));
  r.line(x + 12, bottom - 8, x + 13, bottom - 13, hex("#4a4a4a"));
  r.hline(x + 11, bottom - 13, 4, hex("#2a2a2a"));
  r.set(x + 15, bottom - 10, hex("#f0e8b0"));
}

export function bicycle(r: Raster, x: number, bottom: number, c: RGB): void {
  for (const wx of [x + 3, x + 13]) for (let a = 0; a < 16; a++) r.set(wx + Math.round(Math.cos(a / 2.55) * 3), bottom - 3 + Math.round(Math.sin(a / 2.55) * 3), hex("#2a2a2a"));
  r.line(x + 3, bottom - 3, x + 7, bottom - 8, c); r.line(x + 7, bottom - 8, x + 12, bottom - 8, c); r.line(x + 12, bottom - 8, x + 13, bottom - 3, c); r.line(x + 7, bottom - 8, x + 8, bottom - 3, c);
  r.hline(x + 6, bottom - 9, 3, hex("#2a2a2a")); r.hline(x + 11, bottom - 10, 3, hex("#2a2a2a"));
}

export function cat(r: Raster, x: number, bottom: number, c: RGB, sitting: boolean): void {
  if (sitting) {
    r.rect(x, bottom - 5, 4, 5, c); r.rect(x, bottom - 8, 4, 3, c);
    r.set(x, bottom - 9, c); r.set(x + 3, bottom - 9, c);
    r.set(x + 1, bottom - 7, hex("#e8d040")); r.set(x + 2, bottom - 7, hex("#e8d040"));
    r.line(x + 4, bottom - 1, x + 6, bottom - 3, c);
  } else {
    r.rect(x, bottom - 4, 8, 3, c); r.rect(x + 7, bottom - 6, 3, 3, c); r.set(x + 7, bottom - 7, c); r.set(x + 9, bottom - 7, c);
    for (const lx of [x, x + 2, x + 5, x + 7]) r.vline(lx, bottom - 1, 1, darker(c, 0.2));
    r.line(x, bottom - 4, x - 3, bottom - 7, c);
    r.set(x + 8, bottom - 5, hex("#e8d040"));
  }
}

export function dog(r: Raster, x: number, bottom: number, c: RGB): void {
  r.rect(x, bottom - 6, 9, 4, c); r.rect(x + 8, bottom - 9, 4, 4, c); r.set(x + 12, bottom - 7, darker(c, 0.3)); r.set(x + 8, bottom - 10, darker(c, 0.3));
  for (const lx of [x, x + 2, x + 6, x + 8]) r.vline(lx, bottom - 2, 2, darker(c, 0.15));
  r.line(x, bottom - 6, x - 2, bottom - 9, c);
  r.set(x + 10, bottom - 8, hex("#1a1a1a"));
}

export function chicken(r: Raster, x: number, bottom: number, c: RGB): void {
  r.rect(x, bottom - 4, 4, 3, c); r.rect(x + 3, bottom - 6, 2, 2, c); r.set(x + 5, bottom - 5, hex("#e0a030")); r.set(x + 4, bottom - 7, hex("#d03a2a"));
  r.set(x - 1, bottom - 5, darker(c, 0.2)); r.vline(x + 1, bottom - 1, 1, hex("#d0a040")); r.vline(x + 3, bottom - 1, 1, hex("#d0a040"));
}

export function goat(r: Raster, x: number, bottom: number, c: RGB): void {
  r.rect(x, bottom - 8, 10, 4, c); r.rect(x + 9, bottom - 11, 3, 4, c); r.set(x + 12, bottom - 9, darker(c, 0.2));
  r.set(x + 9, bottom - 12, hex("#6a5a4a")); r.set(x + 10, bottom - 13, hex("#6a5a4a"));
  for (const lx of [x + 1, x + 3, x + 7, x + 9]) r.vline(lx, bottom - 4, 4, darker(c, 0.2));
  r.set(x - 1, bottom - 8, c);
}

export function streetLamp(r: Raster, x: number, bottom: number, lit: boolean): { x: number; y: number } {
  r.vline(x, bottom - 40, 40, hex("#4a4c50"));
  r.vline(x + 1, bottom - 40, 40, hex("#34363a"));
  r.hline(x, bottom - 40, 7, hex("#4a4c50"));
  r.rect(x + 5, bottom - 39, 4, 2, lit ? hex("#fff0b0") : hex("#9a9a90"));
  if (lit) r.glow(x + 5, bottom - 39, 4, 2);
  return { x: x + 7, y: bottom - 36 };
}

export function powerPole(r: Raster, x: number, bottom: number, toX: number): void {
  r.vline(x, bottom - 46, 46, hex("#6a5a48"));
  r.vline(x + 1, bottom - 46, 46, hex("#54463a"));
  r.hline(x - 4, bottom - 44, 10, hex("#54463a"));
  for (const off of [-4, 5]) {
    for (let i = 0; i <= Math.abs(toX - x); i++) {
      const t = i / Math.max(1, Math.abs(toX - x));
      const sag = Math.round(Math.sin(t * Math.PI) * 4);
      r.set(x + off + Math.sign(toX - x) * i, bottom - 45 + sag, hex("#2a2a2a"));
    }
  }
}

export function stall(r: Raster, x: number, bottom: number, wood: RGB, umbrella: Garment, goods: RGB[]): void {
  box(r, x, bottom - 12, 26, 3, wood);
  r.rect(x + 1, bottom - 9, 2, 9, darker(wood, 0.2)); r.rect(x + 23, bottom - 9, 2, 9, darker(wood, 0.3));
  for (let i = 0; i < 5; i++) {
    const c = goods[i % goods.length];
    const gx = x + 1 + i * 5;
    r.rect(gx, bottom - 14, 4, 2, darker(c, 0.15)); r.set(gx + 1, bottom - 15, c); r.set(gx + 2, bottom - 15, lighter(c, 0.2)); r.set(gx + 1, bottom - 16, c);
  }
  r.vline(x + 12, bottom - 34, 22, hex("#5a5a5a"));
  for (let j = 0; j < 6; j++) {
    const half = 5 + j * 3;
    for (let i = -half; i <= half; i++) r.set(x + 13 + i, bottom - 38 + j, patternColor(umbrella, Math.floor((i + 40) / 4), 0));
  }
}

export function laundryLine(r: Raster, x0: number, x1: number, y: number, cloths: RGB[]): void {
  r.hline(x0, y, x1 - x0, hex("#d0d0d0"));
  let k = 0;
  for (let x = x0 + 2; x < x1 - 4; x += 6) {
    const c = cloths[k++ % cloths.length];
    const h = 4 + (k % 3);
    r.rect(x, y + 1, 4, h, c);
    r.vline(x + 3, y + 1, h, darker(c, 0.2));
  }
}

export function waterTank(r: Raster, x: number, bottom: number, c: RGB): void {
  r.rect(x, bottom - 3, 1, 3, hex("#5a5a5a")); r.rect(x + 7, bottom - 3, 1, 3, hex("#5a5a5a"));
  r.rect(x, bottom - 10, 8, 7, c);
  r.hline(x, bottom - 10, 8, lighter(c, 0.2));
  r.vline(x + 7, bottom - 10, 7, darker(c, 0.3));
  r.hline(x + 2, bottom - 11, 4, darker(c, 0.2));
}

export function satelliteDish(r: Raster, x: number, y: number): void {
  r.ellipse(x, y, 2, 3, hex("#e2e2de"));
  r.vline(x + 2, y - 1, 3, hex("#a0a0a0"));
  r.set(x + 3, y, hex("#7a7a7a"));
}

/** Çatıda güneş enerjili su ısıtıcı: eğik panel + yatay silindir depo. */
export function solarHeater(r: Raster, x: number, bottom: number): void {
  for (let j = 0; j < 5; j++) r.hline(x + j, bottom - 2 - j, 11, j === 4 ? hex("#8a8a8a") : j % 2 ? hex("#2a3a5a") : hex("#34486e"));
  r.rect(x + 4, bottom - 10, 12, 3, hex("#e2e2de"));
  r.hline(x + 4, bottom - 10, 12, hex("#f4f4f0"));
  r.hline(x + 4, bottom - 8, 12, hex("#a8a8a4"));
  r.vline(x + 14, bottom - 7, 6, hex("#6a6a6a"));
}

export function solarPanel(r: Raster, x: number, y: number): void {
  for (let j = 0; j < 4; j++) r.hline(x + j, y + j, 12, j % 2 ? hex("#2a3a6a") : hex("#3a4c80"));
  r.vline(x + 6, y + 4, 4, hex("#5a5a5a"));
}

export function mortar(r: Raster, x: number, bottom: number, wood: RGB): void {
  r.rect(x, bottom - 7, 8, 2, wood); r.rect(x + 1, bottom - 5, 6, 3, darker(wood, 0.1)); r.rect(x + 2, bottom - 2, 4, 2, darker(wood, 0.2));
  r.hline(x + 1, bottom - 7, 6, hex("#e8dcb0"));
}

export function bench(r: Raster, x: number, bottom: number, w: number, c: RGB): void {
  box(r, x, bottom - 7, w, 2, c);
  r.rect(x + 1, bottom - 5, 2, 5, darker(c, 0.25)); r.rect(x + w - 3, bottom - 5, 2, 5, darker(c, 0.3));
}

export function ball(r: Raster, x: number, y: number): void {
  r.rect(x, y - 2, 3, 3, hex("#f4f4f0")); r.set(x + 1, y - 1, hex("#2a2a2a")); r.set(x + 2, y, hex("#c8c8c0"));
}
