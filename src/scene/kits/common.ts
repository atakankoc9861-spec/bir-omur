// Bölge kitlerinin ortak arayüzü ve yardımcıları.
import type { Sex } from "../../engine/types";
import { Rng } from "../../engine/rng";
import { type RGB, darker, lighter, mix, hex } from "../color";
import type { LightSource } from "../light";
import type { Garment, Hold, Look, Pattern, Pose, Stage } from "../people";
import { type Raster, noise2 } from "../raster";
import { skyFor } from "../palette";
import type { Rect } from "../props";
import type { Activity, Place, RegionId, Season, SceneState, ScenePlan, TimeOfDay, Weather } from "../types";
import { DEFAULT_PROFILE, GORSEL_AYAR, type VisualSettings } from "../gorsel-ayar";

export function settingsFor(s: SceneState): VisualSettings {
  return GORSEL_AYAR[s.profile ?? DEFAULT_PROFILE[s.region]];
}

/** Sahnede bir insanın durabileceği yer. Kit üretir, sahne yönetmeni insanları yerleştirir. */
export interface Slot {
  x: number;
  /** Ayak satırı. */
  y: number;
  kind: "seat" | "floor" | "stand" | "work" | "study" | "play" | "extra";
  /** Yüksek = daha merkezde / önemli. Oyuncu karakteri önce seçer. */
  prio: number;
  hold?: Hold;
}

export interface SceneBuild {
  slots: Slot[];
  lights: LightSource[];
  /** İnsanların önüne düşen eşyalar (masa, ortak kap). Katman 4b. */
  foreground?: () => void;
  /** Evcil hayvan için yer. */
  petSpot?: { x: number; y: number };
  /** Kar/yağmur birikebilecek açık zemin alanı (dış mekân). */
  openGround?: Rect;
  /** Pencere iç alanları (yağmur pencerede de görünsün). */
  windows: Rect[];
}

export interface BuildCtx {
  r: Raster;
  state: SceneState;
  plan: ScenePlan;
  /** Ev kimliği tohumu: duvar rengi, zemin, mimari. Aynı evde yıllarca aynı kalır. */
  home: Rng;
  /** Bu sahneye özel tohum: dizilim, eşya, yoldan geçenler. */
  v: Rng;
  /** Vefat eden aile üyeleri (duvarda anı fotoğrafı için). */
  memorials: { skin: RGB; hair: RGB }[];
  /** Aile fotoğrafları için yaşayan üyelerden örnek renkler. */
  household: { skin: RGB; hair: RGB }[];
}

export interface LookInput {
  identity: Rng;
  outfit: Rng;
  sex: Sex;
  age: number;
  stage: Stage;
  role: string;
  household: Household;
  state: SceneState;
  plan: ScenePlan;
}

/** Hanede ortak özellikler (ten tabanı, giyim alışkanlığı). Hayat tohumundan ve gorsel-ayar.ts'den çıkar. */
export interface Household {
  skinBase: number;
  /** 0-1: kadınların başörtüsü/başa bez bağlama eğilimi (bölge kitinden, hane bazında). */
  headCover: number;
  /** 0-1: geleneksel kıyafet eğilimi. */
  traditional: number;
}

export interface RegionKit {
  id: RegionId;
  nameTr: string;
  household(rng: Rng, set: VisualSettings): Household;
  look(i: LookInput): Look;
  weatherWeights(season: Season, urban: boolean, set: VisualSettings): Partial<Record<Weather, number>>;
  build(ctx: BuildCtx, place: Place, activity: Activity): SceneBuild;
  /** Hangi etkinlikler bu mekânda mümkün. */
  activities(place: Place, state: SceneState): Activity[];
  petColor(rng: Rng): { kind: "cat" | "dog"; color: RGB };
}

// ------------------------------------------------------------ küçük yardımcılar

export const pick = <T>(rng: Rng, a: readonly T[]): T => a[Math.floor(rng.next() * a.length)];
export const H = (s: string[]): RGB[] => s.map(hex);
export const garment = (c1: RGB, c2: RGB, pattern: Pattern = "solid"): Garment => ({ c1, c2, pattern });

export function weightedKey<K extends string>(rng: Rng, w: Partial<Record<K, number>>): K {
  const keys = Object.keys(w) as K[];
  return rng.weighted(keys, (k) => w[k] ?? 0);
}

/** Saç rengi yaşla grileşir; başlangıç yaşı kişiye özgü. */
export function agedHair(base: RGB, age: number, identity: Rng): RGB {
  const start = 38 + identity.next() * 18;
  if (age <= start) return base;
  const t = Math.min(1, (age - start) / 28);
  return mix(base, t > 0.75 ? hex("#e4e2dc") : hex("#9c9a96"), Math.min(1, t * 1.15));
}

export function skinFor(base: number, identity: Rng, palette: RGB[]): RGB {
  const off = identity.weighted([-1, 0, 0, 1], () => 1);
  return palette[Math.max(0, Math.min(palette.length - 1, base + off))];
}

export function isCold(season: Season, weather: Weather): boolean {
  return season === "winter" || weather === "snow" || (season === "autumn" && weather === "rain");
}

/** Okul çağında, okul saatinde dışarıdaysa okul forması. */
export function inSchoolClothes(age: number, s: SceneState, p: ScenePlan): boolean {
  return age >= 6 && age <= 17 && s.timeOfDay === "day" && s.season !== "summer" && p.place === "outside" && p.activity === "walk";
}

// ------------------------------------------------------------ gökyüzü

export function drawSky(r: Raster, rc: Rect, t: TimeOfDay, w: Weather, seed: number, full = true): void {
  r.gradV(rc.x, rc.y, rc.w, rc.h, skyFor(t, w), Math.max(3, Math.floor(rc.h / 6)));
  const rng = new Rng(seed);
  if (t === "night" && (w === "clear" || w === "haze")) {
    const n = Math.floor((rc.w * rc.h) / 90);
    for (let i = 0; i < n; i++) {
      const x = rc.x + rng.int(0, rc.w - 1), y = rc.y + rng.int(0, Math.floor(rc.h * 0.8));
      r.set(x, y, rng.chance(0.2) ? hex("#fff6d8") : hex("#8a96c0"));
    }
  }
  if (!full) return;
  // güneş / ay
  if (w === "clear" || w === "haze") {
    const sx = rc.x + Math.floor(rc.w * (t === "dawn" ? 0.15 : t === "dusk" ? 0.82 : 0.7));
    const sy = rc.y + (t === "day" ? 10 : t === "night" ? 12 : Math.floor(rc.h * 0.7));
    if (t === "night") {
      r.ellipse(sx, sy, 3, 3, hex("#f2ecd2"));
      r.set(sx + 1, sy - 1, hex("#d8d2b8")); r.set(sx - 1, sy + 1, hex("#d8d2b8"));
    } else {
      const c = t === "day" ? hex("#fff6d0") : hex("#ffd890");
      if (w === "haze") r.ellipse(sx, sy, 4, 4, mix(c, hex("#f0e0c0"), 0.4));
      else { r.ellipse(sx, sy, 5, 5, mix(c, skyFor(t, w)[1], 0.6)); r.ellipse(sx, sy, 3, 3, c); }
    }
  }
  // bulutlar
  const clouds = w === "clear" ? rng.int(1, 3) : w === "haze" ? 0 : rng.int(4, 7);
  // S3: kapalı havada bulut da kapalı gökyüzü renginde (akşamda pembe değil)
  const cc = w !== "clear"
    ? (t === "night" ? hex("#1e2234") : lighter(skyFor(t, w)[1], 0.12))
    : t === "night" ? hex("#2a3150") : t === "day" ? hex("#f4f8fa") : mix(hex("#f0b8a0"), skyFor(t, w)[1], 0.3);
  for (let i = 0; i < clouds; i++) {
    const x = rc.x + rng.int(-10, rc.w), y = rc.y + rng.int(4, Math.floor(rc.h * 0.55));
    const w2 = rng.int(8, 18);
    r.ellipse(x, y, w2, 2, cc);
    r.ellipse(x + rng.int(-4, 4), y - 2, Math.floor(w2 * 0.6), 2, lighter(cc, 0.1));
    r.hline(x - w2 + 2, y + 2, w2 * 2 - 3, darker(cc, 0.1));
  }
  r.glow(rc.x, rc.y, rc.w, rc.h);
}

/** Uzak tepeler (katmanlı, puslu). */
export function hills(r: Raster, y: number, h: number, c: RGB, seed: number, roughness = 1): void {
  for (let x = 0; x < r.w; x++) {
    const v = Math.sin(x / (17 * roughness) + seed) * 0.5 + Math.sin(x / (7 * roughness) + seed * 2) * 0.25 + noise2(x >> 2, 0, seed) * 0.25;
    const top = Math.round(y + h * (0.5 - v * 0.6));
    r.vline(x, top, y + h - top + 1, c);
    r.set(x, top, lighter(c, 0.08));
  }
}

export function seaStrip(r: Raster, y: number, h: number, c: RGB, t: TimeOfDay): void {
  for (let j = 0; j < h; j++) for (let x = 0; x < r.w; x++) {
    const sparkle = noise2(x, j, 7) < 0.04 && t !== "night";
    r.set(x, y + j, sparkle ? lighter(c, 0.4) : j % 3 === 0 ? lighter(c, 0.06) : c);
  }
  r.hline(0, y, r.w, lighter(c, 0.25));
}

/** Pencereden görünen dış dünya: gökyüzü + uzak siluet. */
export function windowView(r: Raster, rc: Rect, s: SceneState, w: Weather, seed: number, silhouette: (rc: Rect) => void): void {
  drawSky(r, rc, s.timeOfDay, w, seed, false);
  silhouette(rc);
  if (w === "rain") for (let i = 0; i < rc.w * rc.h / 18; i++) {
    const x = rc.x + (i * 7) % rc.w, y = rc.y + (i * 13) % (rc.h - 2);
    const c = mix(hex("#9aaab8"), r.get(x, y) >>> 0, 0.3);
    r.set(x, y, c); r.set(x, y + 1, c);
  }
  if (w === "snow") for (let i = 0; i < rc.w * rc.h / 14; i++) r.set(rc.x + (i * 11) % rc.w, rc.y + (i * 17) % rc.h, hex("#ffffff"));
}

/** Gün saatine göre siluet rengi (uzak binalar/tepeler). */
export function farColor(base: RGB, t: TimeOfDay, w: Weather): RGB {
  const tint = t === "night" ? hex("#141a34") : t === "dusk" ? hex("#7a4a6a") : t === "dawn" ? hex("#8a7a9a") : hex("#a8c4d8");
  let c = mix(base, tint, t === "night" ? 0.7 : 0.45);
  if (w === "haze") c = mix(c, hex("#d8c8a0"), 0.5);
  if (w === "rain" || w === "cloudy" || w === "snow") c = mix(c, hex("#9aa4ac"), 0.4);
  return c;
}

export function seatSlots(xs: number[], y: number, prio: number): Slot[] {
  return xs.map((x, i) => ({ x, y, kind: "seat" as const, prio: prio - Math.abs(i - (xs.length - 1) / 2) }));
}

export type { Pose };
