// Sahne yönetmeni: her yıl için bir sahne planı seçer ve aynı hayatta aynı sahnenin
// tekrar etmemesini garanti eder. Kurallar: docs/stil-rehberi.md "Çeşitlilik kuralları".
//
// İki katmanlı tekrar kontrolü (Kalite denetimi O1):
//  1. İmza: mekân + etkinlik + hava + saat + mevsim + yaş evresi + gelir + yerleşim + dizilim sınıfı.
//  2. Görüntü: çizilen kare 40x30 küçük resme indirilir; bu hayatta daha önce gösterilen
//     her kareyle karşılaştırılır. Farklı piksel oranı eşiğin altındaysa aday reddedilir.
import { Rng } from "../engine/rng";
import { canGoOutside } from "./cast";
import { KITS } from "./kits";
import { settingsFor, weightedKey, pick } from "./kits/common";
import { stageOf } from "./people";
import { hash } from "./palette";
import type { Raster } from "./raster";
import { type RenderOptions, type RenderedScene, renderScene } from "./render";
import type { Activity, Place, SceneState, ScenePlan } from "./types";

/** Aynı "sahne sınıfı" içinde kaç farklı dizilim sayılır. */
export const LAYOUT_CLASSES = 8;
/** Bir aday kabul edilmek için önceki her kareden en az bu oranda farklı olmalı. */
export const MIN_VISUAL_DIFF = 0.14;
/** Görsel olarak farklı aday ararken en fazla kaç deneme çizilir. */
export const MAX_VISUAL_TRIES = 5;
/** Bu tabanın altında kalan aday kabul edilmez; nadiren gereken ek deneme sayısı. */
export const HARD_FLOOR_DIFF = 0.09;
export const EXTRA_TRIES = 3;

const REGION_IDX = { akdeniz: 1, "bati-afrika": 2 } as const;

export function homeSeedFor(s: SceneState): number {
  return hash(s.lifeSeed, s.income, s.urban ? 1 : 0, REGION_IDX[s.region]);
}

export function signatureOf(s: SceneState, p: Omit<ScenePlan, "signature">): string {
  return [p.place, p.activity, p.weather, s.timeOfDay, s.season, stageOf(s.age), s.income, s.urban ? "u" : "r", p.variant % LAYOUT_CLASSES].join("|");
}

// ------------------------------------------------------------ görüntü benzerliği

const TW = 40, TH = 30, CELL = 4;

/** Kareyi 40x30 küçük resme indirir (4x4 ortalama). Kayıtta da saklanabilir: 3,6 KB. */
export function thumbnail(r: Raster): Uint8Array {
  const t = new Uint8Array(TW * TH * 3);
  const d = r.data;
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < TW; x++) {
      let rr = 0, gg = 0, bb = 0;
      for (let dy = 0; dy < CELL; dy++) {
        let i = ((y * CELL + dy) * r.w + x * CELL) * 4;
        for (let dx = 0; dx < CELL; dx++, i += 4) { rr += d[i]; gg += d[i + 1]; bb += d[i + 2]; }
      }
      const o = (y * TW + x) * 3;
      t[o] = rr >> 4; t[o + 1] = gg >> 4; t[o + 2] = bb >> 4;
    }
  return t;
}

/**
 * İki küçük resim arasında belirgin farklı piksel oranı (0-1).
 * stopAt verilirse oran ona ulaşınca sayım durur (erken çıkış): sonuç en az stopAt'tir
 * ama tam değer değildir. Farklı karelerin çoğu ilk %30'da eşiği geçer (Kalite Y3).
 */
export function visualDiff(a: Uint8Array, b: Uint8Array, stopAt = 1): number {
  const cells = a.length / 3;
  const limit = Math.ceil(stopAt * cells);
  let n = 0;
  for (let i = 0; i < a.length; i += 3) {
    const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
    if (d > 48 && ++n >= limit) return n / cells;
  }
  return n / cells;
}

export class SceneDirector {
  private readonly seen = new Set<string>();
  private readonly thumbs: Uint8Array[] = [];
  private lastActivity: Activity | null = null;
  private lastPlace: Place | null = null;
  private calls = 0;

  constructor(readonly lifeSeed: number, seen: Iterable<string> = []) {
    for (const s of seen) this.seen.add(s);
  }

  /** Kayıt dosyası için: görülen sahne imzaları. */
  get history(): string[] {
    return [...this.seen];
  }

  has(sig: string): boolean {
    return this.seen.has(sig);
  }

  /**
   * Daha önce gösterilen karelere en küçük görsel fark (hiç kare yoksa 1).
   * Eşiği geçen karşılaştırmalar erken kesilir; eşiğin altındaki değerler tamdır.
   */
  minDiffTo(t: Uint8Array): number {
    let m = 1;
    for (let i = this.thumbs.length - 1; i >= 0; i--) m = Math.min(m, visualDiff(t, this.thumbs[i], MIN_VISUAL_DIFF));
    return m;
  }

  /** İmzası görülmemiş bir aday plan önerir (kaydetmez). */
  private propose(s: SceneState, salt: number): ScenePlan {
    const kit = KITS[s.region];
    const rng = new Rng(hash(this.lifeSeed, s.age, s.year, salt, this.seen.size, this.calls));
    const homeSeed = homeSeedFor(s);
    const outsideOk = canGoOutside(s); // K1: küçük çocuğun yanında aile büyüğü yoksa dışarı çıkılmaz
    const frail = (s.health ?? 100) < 35;
    let last: ScenePlan | null = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      let place: Place = s.place ?? (frail ? (rng.chance(0.85) ? "home" : "outside")
        : this.lastPlace === "home" ? (rng.chance(0.6) ? "outside" : "home") : rng.chance(0.7) ? "home" : "outside");
      if (!outsideOk) place = "home";
      let acts = kit.activities(place, s);
      if (acts.length > 1 && attempt < 30) acts = acts.filter((a) => a !== this.lastActivity);
      const activity = pick(rng, acts);
      const weather = weightedKey(rng, kit.weatherWeights(s.season, s.urban, settingsFor(s)));
      const variant = rng.int(0, 2_000_000_000);
      const base = { place, activity, weather, variant, homeSeed };
      const signature = signatureOf(s, base);
      last = { ...base, signature };
      if (!this.seen.has(signature)) return last;
    }
    // Olası kombinasyonlar tükendiyse imzaya sıra numarası eklenir; dizilim yine farklıdır.
    return { ...last!, signature: `${last!.signature}#${this.seen.size}` };
  }

  private commit(p: ScenePlan, thumb?: Uint8Array): void {
    this.seen.add(p.signature);
    if (thumb) this.thumbs.push(thumb);
    this.lastActivity = p.activity;
    this.lastPlace = p.place;
  }

  /** Sadece plan (çizmeden). Görsel benzerlik kontrolü YAPILMAZ; oyunda compose kullanılır. */
  plan(s: SceneState, salt = 0): ScenePlan {
    this.calls++;
    const p = this.propose(s, salt);
    this.commit(p);
    return p;
  }

  /**
   * Plan + çizim. Önceki karelerden en az MIN_VISUAL_DIFF kadar farklı ilk aday seçilir;
   * hiçbiri geçmezse en farklı olan alınır. Aday başına bir çizim (~1 ms masaüstü), en çok 5 aday.
   */
  compose(s: SceneState, opts: RenderOptions = {}): RenderedScene {
    this.calls++;
    let best: { sc: RenderedScene; t: Uint8Array; d: number } | null = null;
    const tried = new Set<string>();
    for (let k = 0; k < MAX_VISUAL_TRIES + EXTRA_TRIES; k++) {
      if (k >= MAX_VISUAL_TRIES && best && best.d >= HARD_FLOOR_DIFF) break;
      const p = this.propose(s, k * 7919 + 1);
      if (tried.has(p.signature)) continue;
      tried.add(p.signature);
      // işaretsiz kare üzerinden karşılaştır (işaret açık/kapalı sonucu değiştirmesin)
      const sc = renderScene(s, p);
      const t = thumbnail(sc.base);
      const d = this.minDiffTo(t);
      if (!best || d > best.d) best = { sc, t, d };
      if (d >= MIN_VISUAL_DIFF) break;
    }
    this.commit(best!.sc.plan, best!.t);
    return opts.marker ? renderScene(s, best!.sc.plan, opts) : best!.sc;
  }
}
