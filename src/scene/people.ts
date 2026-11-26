// İnsan figürleri: tamamen kodla, önden görünüm, yaşa göre oran değişir.
// Ölçüler docs/stil-rehberi.md "Karakter boyu" tablosuyla aynı tutulmalı.
import type { Sex } from "../engine/types";
import { type RGB, R, G, B, darker, lighter, luma, mix, hex } from "./color";
import { Sprite, type Surface } from "./raster";

export type Stage = "baby" | "toddler" | "child" | "preteen" | "teen" | "adult" | "elder";

export function stageOf(age: number): Stage {
  if (age < 2) return "baby";
  if (age < 4) return "toddler";
  if (age < 9) return "child";
  if (age < 13) return "preteen";
  if (age < 18) return "teen";
  if (age < 62) return "adult";
  return "elder";
}

export const isGrown = (s: Stage): boolean => s === "teen" || s === "adult" || s === "elder";

export type Pattern = "solid" | "stripesH" | "stripesV" | "check" | "dots" | "wax" | "zigzag" | "floral" | "embroidered";
export interface Garment {
  c1: RGB;
  c2: RGB;
  pattern: Pattern;
}
export type HairStyle = "short" | "bob" | "cropped" | "coily" | "long" | "bun" | "braids" | "puffs" | "ponytail" | "bald" | "balding";
export type Headwear = "none" | "scarf" | "wrap" | "gele" | "kufi" | "flatcap" | "cap";
export type Facial = "none" | "mustache" | "beard" | "stubble";
export type BottomKind = "trousers" | "shorts" | "skirt" | "dress" | "robe";

export interface Look {
  skin: RGB;
  hair: RGB;
  hairStyle: HairStyle;
  facial: Facial;
  headwear: Headwear;
  headCloth: Garment;
  top: Garment;
  sleeves: "short" | "long";
  outer: Garment | null;
  bottomKind: BottomKind;
  bottom: Garment;
  shoes: RGB;
  glasses: boolean;
  earrings: RGB | null;
}

export type Pose = "stand" | "sit" | "sitFloor" | "cane" | "lie";
export type Hold = "none" | "book" | "phone" | "spoon" | "glass" | "bag" | "pestle";

export interface Figure {
  look: Look;
  stage: Stage;
  sex: Sex;
  age: number;
  pose: Pose;
  hold?: Hold;
  carry?: { baby: Figure; back: boolean };
  blanket?: Garment;
}

interface Dims {
  hw: number; hh: number; tw: number; th: number; lh: number; aw: number; neck: number;
}

/**
 * Yaş evresine göre beden ölçüleri (piksel). Toplam boy = hh + neck + th + lh.
 * Yaş verilirse yetişkin içinde de fark: 45+ gövde 1 piksel geniş (orta yaş),
 * 78+ bacak 1 piksel kısa (çökme).
 */
export function dims(stage: Stage, sex: Sex, age?: number): Dims {
  const d = baseDims(stage, sex);
  if (age !== undefined) {
    if ((stage === "adult" && age >= 45) || stage === "elder") d.tw += 1;
    if (stage === "elder" && age >= 78) d.lh -= 1;
  }
  return d;
}

function baseDims(stage: Stage, sex: Sex): Dims {
  const f = sex === "female";
  switch (stage) {
    case "baby": return { hw: 5, hh: 5, tw: 5, th: 4, lh: 2, aw: 1, neck: 0 };
    case "toddler": return { hw: 6, hh: 6, tw: 6, th: 5, lh: 4, aw: 1, neck: 0 };
    case "child": return { hw: 7, hh: 7, tw: 7, th: 6, lh: 6, aw: 1, neck: 0 };
    case "preteen": return { hw: 7, hh: 7, tw: 7, th: 8, lh: 8, aw: 1, neck: 1 };
    case "teen": return { hw: 7, hh: 8, tw: f ? 7 : 8, th: 9, lh: 10, aw: 2, neck: 1 };
    case "adult": return { hw: 7, hh: 8, tw: f ? 8 : 9, th: 10, lh: 12, aw: 2, neck: 1 };
    case "elder": return { hw: 7, hh: 8, tw: f ? 8 : 9, th: 10, lh: 11, aw: 2, neck: 0 };
  }
}

export function figureHeight(stage: Stage, sex: Sex, age?: number): number {
  const d = dims(stage, sex, age);
  return d.hh + d.neck + d.th + d.lh;
}

export function patternColor(g: Garment, x: number, y: number): RGB {
  const { c1, c2 } = g;
  switch (g.pattern) {
    case "solid": return c1;
    case "stripesH": return y % 3 === 0 ? c2 : c1;
    case "stripesV": return x % 3 === 0 ? c2 : c1;
    case "check": return ((x >> 1) + (y >> 1)) % 2 === 0 ? c1 : mix(c1, c2, 0.5);
    case "dots": return (x + (y % 4 < 2 ? 0 : 2)) % 4 === 0 && y % 2 === 0 ? c2 : c1;
    case "wax": {
      const a = Math.abs((x % 6) - 3) + Math.abs((y % 6) - 3);
      return a <= 1 ? c2 : a === 3 ? mix(c1, c2, 0.45) : c1;
    }
    case "zigzag": {
      const p = y % 4;
      return (x + (p < 2 ? p : 4 - p)) % 4 === 0 ? c2 : c1;
    }
    case "floral": return (x * 7 + y * 3) % 11 === 0 ? c2 : (x * 5 + y * 9) % 13 === 0 ? lighter(c1, 0.35) : c1;
    case "embroidered": return y % 5 === 1 && x % 2 === 0 ? c2 : c1;
  }
}

const EYE = hex("#21160f");
const EYE_ON_DARK = hex("#050302");

const colorDist = (a: RGB, b: RGB) => Math.abs(R(a) - R(b)) + Math.abs(G(a) - G(b)) + Math.abs(B(a) - B(b));

/**
 * Kalite Y4: başörtüsü/başlık rengi tene çok yakınsa baş tek leke gibi görünür.
 * Kumaşı tenden uzaklaştırır (açık tende koyulaştır, koyu tende açılaştır).
 */
export function ensureHeadContrast(look: Look): Look {
  if (look.headwear === "none") return look;
  const fix = (c: RGB) => {
    if (colorDist(c, look.skin) >= 110) return c;
    return luma(look.skin) > 0.42 ? darker(c, 0.5) : lighter(c, 0.5);
  };
  look.headCloth = { ...look.headCloth, c1: fix(look.headCloth.c1), c2: fix(look.headCloth.c2) };
  return look;
}
const GLASS_FRAME = hex("#c8c0b4");
const SHOE_SOLE = hex("#2a2220");

/**
 * Figürü hedef yüzeye çizer. (cx, fy): ayakların ortası ve en alt satırı.
 * fade: arka plandaki kişileri havaya doğru soldurmak için. Dönüş: başın en üst satırı (hedefte).
 */
export function drawFigure(dst: Surface, f: Figure, cx: number, fy: number, fade?: { color: RGB; t: number }): number {
  const s = new Sprite(30, 50);
  const ox = 15, oy = 46;
  paintFigure(s, f, ox, oy);
  s.outline();
  if (fade) for (let i = 0; i < s.px.length; i++) if (s.px[i] !== -1) s.px[i] = mix(s.px[i], fade.color, fade.t);
  s.blitTo(dst, Math.round(cx) - ox, Math.round(fy) - oy);
  let top = 0;
  while (top < s.h && !s.px.subarray(top * s.w, top * s.w + s.w).some((v) => v !== -1)) top++;
  return Math.round(fy) - oy + top;
}

function paintFigure(s: Sprite, f: Figure, cx: number, fy: number): void {
  if (f.stage === "baby") {
    if (f.pose === "lie") paintBabyLying(s, f, cx, fy);
    else paintBabySitting(s, f, cx, fy);
    return;
  }
  const L = f.look;
  const d = dims(f.stage, f.sex, f.age);
  const tw = d.tw;
  const tx0 = cx - Math.floor(tw / 2);
  const tx1 = tx0 + tw - 1;
  const garmentAt = (g: Garment, x: number, y: number) => patternColor(g, x - tx0 + 16, y);
  const longGarment = L.bottomKind === "dress" || L.bottomKind === "robe";

  // ---- Bacaklar
  let torsoBottom: number;
  if (f.pose === "sit") {
    const knee = Math.max(2, Math.round(d.lh * 0.5));
    const thighY = fy - knee; // diz satırı
    torsoBottom = thighY - 2;
    // uyluk (önden kısalmış görünüm): 2 satır
    for (let y = thighY - 1; y <= thighY; y++)
      for (let x = tx0; x <= tx1; x++) s.set(x, y, x === tx1 ? darker(garmentAt(L.bottom, x, y), 0.15) : garmentAt(L.bottom, x, y));
    paintShins(s, L, tx0, tx1, thighY + 1, fy, longGarment || L.bottomKind === "skirt" ? "skin" : "cloth", garmentAt);
  } else if (f.pose === "sitFloor") {
    torsoBottom = fy - 3;
    for (let y = fy - 2; y <= fy; y++)
      for (let x = tx0 - 2; x <= tx1 + 2; x++) {
        if (y === fy - 2 && (x === tx0 - 2 || x === tx1 + 2)) continue;
        s.set(x, y, y === fy ? darker(garmentAt(L.bottom, x, y), 0.2) : garmentAt(L.bottom, x, y));
      }
    s.set(tx0 - 2, fy, L.skin);
    s.set(tx1 + 2, fy, darker(L.skin, 0.15));
  } else {
    const legTop = fy - d.lh + 1;
    torsoBottom = legTop - 1;
    paintStandingLegs(s, L, d, tx0, tx1, legTop, fy, garmentAt);
  }

  const torsoTop = torsoBottom - d.th + 1;

  // ---- Gövde
  const topG = longGarment ? L.bottom : L.top;
  for (let y = torsoTop; y <= torsoBottom; y++)
    for (let x = tx0; x <= tx1; x++) {
      let c = garmentAt(topG, x, y);
      if (L.outer && x !== cx && !(tw % 2 === 0 && x === cx - 1)) c = garmentAt(L.outer, x, y);
      if (x === tx1) c = darker(c, 0.18);
      else if (x === tx0) c = lighter(c, 0.06);
      s.set(x, y, c);
    }
  s.clear(tx0, torsoTop);
  s.clear(tx1, torsoTop);
  if (f.stage === "elder" && f.age >= 72) { s.clear(tx0 + 1, torsoTop); s.clear(tx1 - 1, torsoTop); } // düşük, yuvarlak omuz
  if (!L.outer && L.headwear !== "scarf" && isGrown(f.stage)) s.set(cx, torsoTop, darker(L.skin, 0.1));

  // ---- Kollar
  const sleeveG = L.outer ?? topG;
  const carryFront = f.carry && !f.carry.back;
  const armEnd = carryFront ? torsoTop + Math.min(5, d.th - 2) : torsoBottom;
  const sleeveLen = L.sleeves === "long" || L.outer ? 99 : isGrown(f.stage) ? 3 : 2;
  for (let side = 0; side < 2; side++) {
    for (let k = 0; k < d.aw; k++) {
      const x = side === 0 ? tx0 - d.aw + k : tx1 + 1 + k;
      for (let y = torsoTop + 1; y <= armEnd; y++) {
        const i = y - (torsoTop + 1);
        let c = i < sleeveLen ? garmentAt(sleeveG, x, y) : L.skin;
        if (side === 1) c = darker(c, 0.2);
        s.set(x, y, c);
      }
      s.set(x, armEnd + 1, side === 1 ? darker(L.skin, 0.15) : L.skin); // el
    }
  }

  // ---- Boyun ve baş
  if (d.neck) s.hline(cx - 1, torsoTop - 1, 3, darker(L.skin, 0.2));
  // yaşlıda baş öne-aşağı: 62+ bir, 78+ iki piksel (kambur)
  const hy1 = torsoTop - 1 - d.neck + (f.stage === "elder" ? (f.age >= 78 ? 2 : 1) : 0);
  paintHead(s, f, d, cx, hy1);

  // ---- Taşınan bebek
  if (f.carry) {
    if (f.carry.back) paintBackCarry(s, f.carry.baby, L, tx0, tx1, torsoTop);
    else paintFrontCarry(s, f.carry.baby, sleeveG, L, tx0, tx1, cx, torsoTop, armEnd, d.aw);
  }

  // ---- Elde tutulan
  paintHold(s, f.hold ?? "none", L, tx0, tx1, cx, torsoBottom, d.aw);

  // ---- Battaniye (hasta / yaşlı dinlenirken)
  if (f.blanket && (f.pose === "sit" || f.pose === "sitFloor")) {
    for (let y = torsoBottom - 2; y <= fy; y++)
      for (let x = tx0 - d.aw; x <= tx1 + d.aw; x++) s.set(x, y, patternColor(f.blanket, x, y));
  }
  if (f.pose === "cane") {
    const x = tx1 + d.aw + 1;
    for (let y = torsoBottom; y <= fy; y++) s.set(x, y, hex("#6b4a2e"));
    s.set(x - 1, torsoBottom, hex("#6b4a2e"));
  }
}

function paintStandingLegs(
  s: Sprite, L: Look, d: Dims, tx0: number, tx1: number, legTop: number, fy: number,
  garmentAt: (g: Garment, x: number, y: number) => RGB,
): void {
  const tw = tx1 - tx0 + 1;
  const lw = Math.max(2, Math.floor((tw - 1) / 2));
  const legs = [[tx0, tx0 + lw - 1], [tx1 - lw + 1, tx1]];
  const shoe = (x0: number, x1: number) => {
    for (let x = x0; x <= x1; x++) s.set(x, fy, x === x1 ? SHOE_SOLE : L.shoes);
  };
  if (L.bottomKind === "dress" || L.bottomKind === "robe") {
    const hem = L.bottomKind === "robe" ? fy - 2 : fy - 1;
    for (let y = legTop; y <= hem; y++) {
      const flare = Math.floor(((y - legTop) / Math.max(1, hem - legTop)) * 1.99);
      for (let x = tx0 - flare; x <= tx1 + flare; x++) {
        const c = garmentAt(L.bottom, x, y);
        s.set(x, y, x >= tx1 ? darker(c, 0.18) : c);
      }
    }
    if (L.bottomKind === "robe") for (const [a, b] of legs) s.hline(a, fy - 1, b - a + 1, darker(L.top.c1, 0.3));
    shoe(legs[0][0], legs[0][1]);
    shoe(legs[1][0], legs[1][1]);
    return;
  }
  if (L.bottomKind === "skirt") {
    const len = Math.ceil(d.lh * 0.6);
    for (let y = legTop; y < legTop + len; y++) {
      const flare = y - legTop > len / 2 ? 1 : 0;
      for (let x = tx0 - flare; x <= tx1 + flare; x++) {
        const c = garmentAt(L.bottom, x, y);
        s.set(x, y, x >= tx1 ? darker(c, 0.18) : c);
      }
    }
    for (const [a, b] of legs) {
      const m = Math.floor((a + b) / 2);
      for (let y = legTop + len; y < fy; y++) { s.set(m, y, L.skin); s.set(m + 1, y, darker(L.skin, 0.15)); }
      shoe(m, m + 1);
    }
    return;
  }
  const clothRows = L.bottomKind === "shorts" ? Math.ceil(d.lh * 0.4) : d.lh - 1;
  // kalça satırı: bacaklar arasını kapat
  for (let x = tx0; x <= tx1; x++) s.set(x, legTop, garmentAt(L.bottom, x, legTop));
  legs.forEach(([a, b], li) => {
    for (let y = legTop; y < fy; y++)
      for (let x = a; x <= b; x++) {
        let c = y - legTop < clothRows ? garmentAt(L.bottom, x, y) : L.skin;
        if (li === 1 || x === b) c = darker(c, li === 1 ? 0.18 : 0.08);
        s.set(x, y, c);
      }
    shoe(a, b);
  });
}

function paintShins(
  s: Sprite, L: Look, tx0: number, tx1: number, y0: number, fy: number, mode: "skin" | "cloth",
  garmentAt: (g: Garment, x: number, y: number) => RGB,
): void {
  const tw = tx1 - tx0 + 1;
  const lw = Math.max(2, Math.floor((tw - 1) / 2));
  [[tx0, tx0 + lw - 1], [tx1 - lw + 1, tx1]].forEach(([a, b], li) => {
    for (let y = y0; y < fy; y++)
      for (let x = a; x <= b; x++) {
        let c = mode === "skin" ? L.skin : garmentAt(L.bottom, x, y);
        if (li === 1) c = darker(c, 0.18);
        s.set(x, y, c);
      }
    for (let x = a; x <= b; x++) s.set(x, fy, x === b ? SHOE_SOLE : L.shoes);
  });
}

function paintHead(s: Sprite, f: Figure, d: Dims, cx: number, hy1: number): void {
  const L = f.look;
  const { hw, hh } = d;
  const hx0 = cx - Math.floor(hw / 2);
  const hx1 = hx0 + hw - 1;
  const hy0 = hy1 - hh + 1;
  const skinSh = darker(L.skin, 0.18);
  for (let y = hy0; y <= hy1; y++) for (let x = hx0; x <= hx1; x++) s.set(x, y, x === hx1 ? skinSh : L.skin);
  s.clear(hx0, hy0); s.clear(hx1, hy0); s.clear(hx0, hy1); s.clear(hx1, hy1);

  const ey = hy0 + Math.ceil(hh / 2);
  const exL = hx0 + Math.floor((hw - 1) / 2) - 1;
  const exR = hx0 + Math.ceil((hw - 1) / 2) + 1;

  paintHair(s, f, hx0, hx1, hy0, hy1, ey);

  // Yüz. Kalite Y2: çok koyu tende göz kaybolmasın; göz daha koyu, üstüne ince ışık (göz kapağı).
  const darkSkin = luma(L.skin) < 0.3;
  if (darkSkin) { s.set(exL, ey - 1, lighter(L.skin, 0.16)); s.set(exR, ey - 1, lighter(skinSh, 0.12)); }
  s.set(exL, ey, darkSkin ? EYE_ON_DARK : EYE);
  s.set(exR, ey, darkSkin ? EYE_ON_DARK : EYE);
  if (isGrown(f.stage) && ey + 2 <= hy1) s.set(cx, ey + 2, darker(L.skin, 0.32));
  else if (ey + 2 <= hy1) s.set(cx, ey + 2, mix(L.skin, hex("#c0605a"), 0.3));
  if (!isGrown(f.stage)) {
    // çocuk yanakları
    s.set(exL - 1, ey + 1, mix(L.skin, hex("#e07a6a"), 0.22));
    s.set(exR + 1, ey + 1, mix(skinSh, hex("#e07a6a"), 0.22));
  }
  if (L.glasses) {
    // Y2: koyu tende açık gri çerçeve göz yanında beyaz leke gibi duruyordu; orada koyu altın
    const gf = darkSkin ? hex("#9a7a40") : GLASS_FRAME;
    s.set(exL - 1, ey, gf); s.set(cx, ey, gf); s.set(exR + 1, ey, gf);
  }
  // Yaş izleri (saçtan bağımsız; başörtülü yüzde de görünür) — Kalite O2.
  // Koyu tende koyulaştırmak yüzü silip "maske" gibi gösteriyordu (Y2): orada ışıkla çizilir.
  if (isGrown(f.stage)) {
    const line = darkSkin ? lighter(L.skin, 0.13) : darker(L.skin, 0.3);
    const soft = darkSkin ? lighter(L.skin, 0.08) : darker(L.skin, 0.2);
    if (f.age >= 35) { s.set(exL, ey + 1, soft); s.set(exR, ey + 1, darkSkin ? lighter(skinSh, 0.06) : darker(skinSh, 0.15)); } // göz altı
    if (f.age >= 48 && hy0 + 2 < ey) { s.set(cx - 1, hy0 + 2, soft); s.set(cx, hy0 + 2, darker(L.skin, 0.1)); s.set(cx + 1, hy0 + 2, soft); } // alın çizgisi
    if (f.age >= 55 && ey + 2 <= hy1) { s.set(exL, ey + 2, line); s.set(exR, ey + 2, line); }   // ağız kenarı
    if (f.age >= 55 && hy1 - 1 > ey + 2) { s.set(hx0 + 1, hy1, darkSkin ? soft : darker(L.skin, 0.18)); s.set(hx1 - 1, hy1, darkSkin ? skinSh : darker(skinSh, 0.2)); } // çene hattı
    if (f.age >= 68) { s.set(hx0, ey + 1, line); s.set(hx1, ey + 2, darkSkin ? skinSh : darker(skinSh, 0.25)); }    // yanak çökmesi
  }
  if (f.sex === "male" && isGrown(f.stage) && f.stage !== "teen") {
    const hc = L.hair;
    if (L.facial === "mustache") s.hline(cx - 1, ey + 1, 3, hc); // ortada 3 px: göz altını kaplamaz (Y2)
    else if (L.facial === "beard") {
      // Y2: sakal yüzü çepeçevre sarmaz; yanak satırı (göz altı) açık kalır, göz hizasında favori yok
      for (let y = ey + 2; y <= hy1; y++)
        for (let x = hx0; x <= hx1; x++) if (!(x === cx && y === ey + 2)) s.set(x, y, x === hx1 ? darker(hc, 0.2) : hc);
      s.set(hx0, ey + 1, hc); s.set(hx1, ey + 1, darker(hc, 0.2));
      s.clear(hx0, hy1); s.clear(hx1, hy1);
      s.set(cx, ey + 2, darkSkin ? darker(L.skin, 0.1) : darker(L.skin, 0.35));
    } else if (L.facial === "stubble") {
      for (let y = ey + 1; y <= hy1; y++) for (let x = hx0 + 1; x < hx1; x++) if ((x + y) % 2 === 0) s.set(x, y, mix(L.skin, hc, 0.35));
    }
  }
  if (L.earrings && L.headwear !== "scarf") { s.set(hx0 - 1, ey + 1, L.earrings); s.set(hx1 + 1, ey + 1, darker(L.earrings, 0.2)); }
}

function paintHair(s: Sprite, f: Figure, hx0: number, hx1: number, hy0: number, hy1: number, ey: number): void {
  const L = f.look;
  const hc = L.hair, hs = darker(hc, 0.22), hh = lighter(hc, 0.16);
  const cx = Math.floor((hx0 + hx1) / 2);
  const hp = (x: number, y: number) => s.set(x, y, x >= hx1 ? hs : x <= hx0 + 1 && y <= hy0 ? hh : hc);
  const tex = (x: number, y: number) => s.set(x, y, (x + y) % 2 === 0 ? hc : hs);
  // orta yaşta şakaklar griye döner (saçın geri kalanından önce)
  const temple = f.age >= 42 && f.age < 70 ? mix(hc, hex("#c8c6c0"), Math.min(0.8, (f.age - 40) / 25)) : hc;
  const cap = (texture = false) => {
    const p = texture ? tex : hp;
    for (let x = hx0 + 1; x < hx1; x++) p(x, hy0 - 1);
    for (let y = hy0; y <= hy0 + 1; y++) for (let x = hx0; x <= hx1; x++) p(x, y);
    s.set(hx0, hy0 + 2, temple); s.set(hx1, hy0 + 2, darker(temple, 0.15));
  };

  const hw = L.headwear;
  if (hw === "scarf") {
    const g = L.headCloth;
    const c = (x: number, y: number) => { const v = patternColor(g, x, y); s.set(x, y, x >= hx1 ? darker(v, 0.15) : v); };
    for (let x = hx0; x <= hx1; x++) c(x, hy0 - 1);
    for (let y = hy0; y <= hy0 + 1; y++) for (let x = hx0 - 1; x <= hx1 + 1; x++) c(x, y);
    for (let y = hy0 + 2; y <= hy1; y++) { c(hx0 - 1, y); c(hx0, y); c(hx1, y); c(hx1 + 1, y); }
    for (let y = hy1 + 1; y <= hy1 + 2; y++) for (let x = hx0 - 1; x <= hx1 + 1; x++) c(x, y);
    return;
  }
  if (hw === "wrap" || hw === "gele") {
    const g = L.headCloth;
    const c = (x: number, y: number) => { const v = patternColor(g, x, y); s.set(x, y, x >= hx1 + 1 ? darker(v, 0.15) : v); };
    if (hw === "wrap") {
      for (let x = hx0; x <= hx1; x++) c(x, hy0 - 2);
      for (let y = hy0 - 1; y <= hy0 + 1; y++) for (let x = hx0 - 1; x <= hx1 + 1; x++) c(x, y);
      s.set(hx1, hy0 - 3, g.c2); s.set(hx1 + 1, hy0 - 3, darker(g.c2, 0.2));
    } else {
      const rows: [number, number, number][] = [
        [hy0 - 5, hx0 + 2, hx1 + 2], [hy0 - 4, hx0, hx1 + 3], [hy0 - 3, hx0 - 2, hx1 + 3],
        [hy0 - 2, hx0 - 2, hx1 + 2], [hy0 - 1, hx0 - 1, hx1 + 1], [hy0, hx0 - 1, hx1 + 1], [hy0 + 1, hx0 - 1, hx1 + 1],
      ];
      for (const [y, a, b] of rows) for (let x = a; x <= b; x++) {
        const v = (x - a) % 3 === 0 && y < hy0 ? darker(patternColor(g, x, y), 0.2) : patternColor(g, x, y);
        s.set(x, y, x >= b ? darker(v, 0.15) : v);
      }
    }
    return;
  }

  switch (L.hairStyle) {
    case "short": cap(); break;
    case "cropped":
      for (let x = hx0 + 1; x < hx1; x++) tex(x, hy0);
      tex(hx0, hy0 + 1); tex(hx1, hy0 + 1);
      break;
    case "coily":
      for (let x = hx0; x <= hx1; x++) tex(x, hy0 - 1);
      cap(true);
      break;
    case "bob":
      cap();
      for (let y = hy0 + 1; y <= ey + 1; y++) { hp(hx0 - 1, y); hp(hx1 + 1, y); hp(hx0, y); hp(hx1, y); }
      break;
    case "long":
      cap();
      for (let y = hy0 + 2; y <= ey; y++) { hp(hx0, y); hp(hx1, y); }
      for (let y = hy0 + 1; y <= hy1 + 4; y++) { hp(hx0 - 1, y); hp(hx1 + 1, y); }
      break;
    case "bun":
      cap();
      for (let y = hy0 - 3; y <= hy0 - 2; y++) for (let x = cx - 1; x <= cx + 1; x++) hp(x, y);
      break;
    case "ponytail":
      cap();
      for (let y = hy0; y <= hy0 + 5; y++) hp(hx1 + 1, y);
      s.set(hx1 + 1, hy0 + 1, hex("#d84a5a"));
      break;
    case "braids":
      cap(true);
      for (let y = hy0 + 1; y <= hy1 + 5; y++) {
        s.set(hx0 - 1, y, y % 2 === 0 ? hc : hs);
        s.set(hx1 + 1, y, y % 2 === 1 ? hc : hs);
      }
      break;
    case "puffs":
      cap(true);
      for (let y = hy0 - 2; y <= hy0; y++) for (let k = 0; k < 3; k++) { tex(hx0 - 2 + k, y); tex(hx1 + k, y); }
      break;
    case "bald":
      for (let y = hy0 + 2; y <= ey; y++) { hp(hx0, y); hp(hx1, y); }
      s.set(hx0 + 2, hy0, lighter(L.skin, 0.2));
      break;
    case "balding":
      for (let y = hy0 + 1; y <= ey; y++) { hp(hx0, y); hp(hx1, y); }
      for (let x = hx0 + 1; x < hx1; x += 2) hp(x, hy0);
      break;
  }

  if (hw === "kufi" || hw === "flatcap" || hw === "cap") {
    const g = L.headCloth;
    const c = (x: number, y: number, dk = 0) => { const v = darker(patternColor(g, x, y), dk); s.set(x, y, x >= hx1 ? darker(v, 0.15) : v); };
    if (hw === "kufi") {
      for (let x = hx0 + 1; x < hx1; x++) c(x, hy0 - 2);
      for (let y = hy0 - 1; y <= hy0; y++) for (let x = hx0; x <= hx1; x++) c(x, y);
    } else {
      for (let x = hx0 + 1; x <= hx1; x++) c(x, hy0 - 1);
      for (let x = hx0 - 1; x <= hx1 + 1; x++) c(x, hy0);
      for (let x = hx0; x <= hx1 + (hw === "cap" ? 2 : 1); x++) c(x, hy0 + 1, 0.25);
    }
  }
}

function babyHead(s: Sprite, b: Figure, x0: number, y0: number, size: number, sleeping: boolean): void {
  const L = b.look;
  for (let y = y0; y < y0 + size; y++) for (let x = x0; x < x0 + size; x++) s.set(x, y, x === x0 + size - 1 ? darker(L.skin, 0.15) : L.skin);
  s.clear(x0, y0); s.clear(x0 + size - 1, y0);
  for (let x = x0 + 1; x < x0 + size - 1; x++) s.set(x, y0, L.hair);
  const ey = y0 + Math.ceil(size / 2);
  const c = sleeping ? darker(L.skin, 0.35) : EYE;
  s.set(x0 + 1, ey, c);
  s.set(x0 + size - 2, ey, c);
}

function paintBabySitting(s: Sprite, f: Figure, cx: number, fy: number): void {
  const L = f.look;
  const g = L.top;
  for (let y = fy - 1; y <= fy; y++) for (let x = cx - 3; x <= cx + 3; x++) s.set(x, y, patternColor(g, x, y));
  s.set(cx - 3, fy, L.skin); s.set(cx + 3, fy, darker(L.skin, 0.15));
  for (let y = fy - 5; y <= fy - 2; y++) for (let x = cx - 2; x <= cx + 2; x++) s.set(x, y, x === cx + 2 ? darker(patternColor(g, x, y), 0.18) : patternColor(g, x, y));
  s.set(cx - 3, fy - 3, L.skin); s.set(cx + 3, fy - 3, darker(L.skin, 0.15));
  babyHead(s, f, cx - 2, fy - 10, 5, false);
}

function paintBabyLying(s: Sprite, f: Figure, cx: number, fy: number): void {
  const blanket = f.blanket ?? f.look.top;
  for (let y = fy - 2; y <= fy; y++) for (let x = cx - 1; x <= cx + 5; x++) s.set(x, y, y === fy ? darker(patternColor(blanket, x, y), 0.15) : patternColor(blanket, x, y));
  babyHead(s, f, cx - 5, fy - 3, 4, true);
}

function paintFrontCarry(
  s: Sprite, baby: Figure, sleeveG: Garment, L: Look, tx0: number, tx1: number, cx: number, torsoTop: number, armEnd: number, aw: number,
): void {
  const wrap = baby.blanket ?? baby.look.top;
  for (let y = torsoTop + 4; y <= torsoTop + 7; y++)
    for (let x = cx - 3; x <= cx + 3; x++) s.set(x, y, x === cx + 3 ? darker(patternColor(wrap, x, y), 0.15) : patternColor(wrap, x, y));
  babyHead(s, baby, cx - 3, torsoTop + 1, 4, true);
  const fy = armEnd + 1;
  for (let x = tx0 - aw + 1; x <= tx1 + aw - 1; x++) s.set(x, fy, patternColor(sleeveG, x, fy));
  s.set(cx + 2, fy, L.skin);
  s.set(cx + 3, fy, darker(L.skin, 0.15));
}

function paintBackCarry(s: Sprite, baby: Figure, L: Look, tx0: number, tx1: number, torsoTop: number): void {
  const wrap = baby.blanket ?? baby.look.top;
  // Bebek sırtta: başı omzun üstünden görünür, bez göğüste çapraz bağlanır.
  for (let y = torsoTop; y <= torsoTop + 6; y++) for (let x = tx1 + 1; x <= tx1 + 3; x++) s.set(x, y, patternColor(wrap, x, y));
  babyHead(s, baby, tx1, torsoTop - 3, 4, true);
  for (let x = tx0; x <= tx1; x++) {
    const y = torsoTop + 1 + Math.round(((x - tx0) / Math.max(1, tx1 - tx0)) * 4);
    s.set(x, y, patternColor(wrap, x, y));
    s.set(x, y + 1, darker(patternColor(wrap, x, y + 1), 0.15));
  }
  void L;
}

function paintHold(s: Sprite, hold: Hold, L: Look, tx0: number, tx1: number, cx: number, torsoBottom: number, aw: number): void {
  const hy = torsoBottom + 1;
  switch (hold) {
    case "book":
      s.rect(cx - 3, hy - 3, 3, 3, hex("#f1ead8"));
      s.rect(cx, hy - 3, 3, 3, hex("#e2d8c2"));
      s.set(cx - 2, hy - 2, hex("#8a8070")); s.set(cx + 1, hy - 2, hex("#8a8070"));
      s.hline(cx - 3, hy, 6, hex("#9a3a3a"));
      break;
    case "phone":
      s.rect(tx1 + aw - 1, hy - 3, 2, 3, hex("#25262e"));
      s.set(tx1 + aw - 1, hy - 3, hex("#6d8fc8"));
      break;
    case "glass":
      s.set(tx1 + aw, hy - 1, hex("#b5602a"));
      s.set(tx1 + aw, hy - 2, hex("#e2c8a0"));
      break;
    case "spoon":
      for (let y = hy - 5; y < hy; y++) s.set(tx1 + aw, y, hex("#8a6a48"));
      break;
    case "bag":
      s.rect(tx0 - aw - 2, hy + 1, 4, 4, hex("#3f6a8a"));
      s.set(tx0 - aw - 1, hy, hex("#3f6a8a"));
      s.set(tx0 - aw - 2, hy + 2, hex("#e85a3a")); s.set(tx0 - aw, hy + 1, hex("#4aa84a"));
      break;
    case "pestle": {
      // havan tokmağı: iki elle tutulur, yanda dikey
      const px = tx1 + aw + 1;
      for (let y = hy - 22; y < hy + 3; y++) s.set(px, y, y < hy - 20 ? hex("#c09870") : hex("#a07850"));
      s.set(px - 1, hy - 12, L.skin); s.set(px + 1, hy - 12, darker(L.skin, 0.15));
      s.set(px - 1, hy - 7, L.skin); s.set(px + 1, hy - 7, darker(L.skin, 0.15));
      break;
    }
    case "none":
      break;
  }
}
