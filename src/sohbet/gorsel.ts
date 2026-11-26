// Sohbetlerde gönderilen "fotoğraflar", kartlar ve piksel profil resimleri.
// Fotoğraflar yaşayan sahne motoruyla (src/scene) çizilir; kart ve notlar burada kodla çizilir.
import { Raster, renderStill, homeSeedFor, type SceneState, type ScenePlan, type Activity, type Place, type Season, type TimeOfDay, type SceneFamilyMember } from "../scene";
import { type RGB, hex, mix, darker, lighter } from "../scene/color";
import { hash, hashStr, SKIN, SKY } from "../scene/palette";
import { bayer } from "../scene/raster";
import type { Sex } from "./kadro";

const W = 160, H = 120;

interface SahneTarif { place: Place; activity: Activity; time: TimeOfDay; season: Season; age?: number; family?: (sex: Sex) => SceneFamilyMember[] }
const AILE = (): SceneFamilyMember[] => [
  { id: "anne", role: "mother", sex: "female", age: 47, alive: true, livesTogether: true },
  { id: "baba", role: "father", sex: "male", age: 50, alive: true, livesTogether: true },
  { id: "kardes", role: "sibling", sex: "female", age: 12, alive: true, livesTogether: true },
];
const SAHNE: Record<string, SahneTarif> = {
  kahvalti: { place: "home", activity: "meal", time: "day", season: "autumn" },
  sofra: { place: "home", activity: "meal", time: "night", season: "winter" },
  bayram: { place: "home", activity: "rest", time: "day", season: "spring" },
  sinavsabahi: { place: "outside", activity: "doorstep", time: "dawn", season: "summer" },
  oda: { place: "home", activity: "rest", time: "night", season: "winter", family: () => [] },
  sinif: {
    place: "outside", activity: "walk", time: "day", season: "spring",
    family: () => [0, 1, 2, 3].map((i) => ({ id: `s${i}`, role: "sibling" as const, sex: (i % 2 ? "male" : "female") as Sex, age: 17 + (i % 2), alive: true, livesTogether: true })),
  },
  cocukluk: {
    place: "outside", activity: "play", time: "day", season: "summer", age: 10,
    family: () => [{ id: "k", role: "sibling", sex: "male", age: 10, alive: true, livesTogether: true }],
  },
};

export function isSahne(id: string): boolean {
  return id in SAHNE;
}

export function photo(id: string, seed: number, sex: Sex): Raster {
  const t = SAHNE[id];
  if (t) {
    const st: SceneState = {
      lifeSeed: seed, region: "akdeniz", profile: "dogu-akdeniz", kitStatus: "tam", income: 3, urban: true,
      age: t.age ?? 17, sex, year: 2026, season: t.season, timeOfDay: t.time, family: t.family ? t.family(sex) : AILE(), place: t.place, health: 95,
    };
    const plan: ScenePlan = { place: t.place, activity: t.activity, weather: "clear", variant: hash(seed, hashStr(id)), homeSeed: homeSeedFor(st), signature: id };
    return renderStill(st, plan, 3);
  }
  const r = new Raster(W, H);
  if (id === "notlar" || id === "notlar2") notlar(r, seed + (id === "notlar2" ? 7 : 0), id === "notlar2");
  else deniz(r, seed);
  return r;
}

export function kartResim(id: string, seed: number): Raster {
  const r = new Raster(W, H);
  kart(r, id, seed);
  return r;
}

/* ---------- notlar ---------- */
function notlar(r: Raster, seed: number, dagınık: boolean): void {
  const paper = hex(dagınık ? "#efe6d6" : "#f3ecdf");
  r.rect(0, 0, W, H, hex("#3a3036"));
  // hafif eğik kağıt
  for (let y = 4; y < H - 2; y++) {
    const off = Math.round((y - 60) * (dagınık ? 0.06 : 0.03));
    r.rect(10 + off, y, W - 20, 1, paper);
  }
  const ink = hex(dagınık ? "#6a3fa0" : "#23408e");
  const line = hex("#b9c8e6");
  for (let y = 16; y < H - 6; y += 9) {
    const off = Math.round((y - 60) * (dagınık ? 0.06 : 0.03));
    r.hline(12 + off, y, W - 24, line);
    // el yazısı: kelime biçimli karalamalar
    let x = 30 + off;
    let n = 0;
    while (x < W - 22 + off && n < 9) {
      const len = 4 + (hash(seed, y, n) % 12);
      for (let i = 0; i < len; i++) {
        const h = hash(seed, y, n, i) % 5;
        r.set(x + i, y - 2 - (h > 2 ? 1 : 0), ink);
        if (h === 0) r.set(x + i, y - 4, ink);
        if (dagınık && h === 4) r.set(x + i, y - 1, ink);
      }
      x += len + 3;
      n++;
    }
  }
  r.vline(26 + 0, 6, H - 10, hex("#d98080"));
  // küçük çizim: eğik düzlem ve kutu (fizik)
  const bx = 112, by = 92;
  r.line(bx - 26, by, bx + 10, by, ink);
  r.line(bx - 26, by, bx + 10, by - 22, ink);
  r.line(bx + 10, by, bx + 10, by - 22, ink);
  r.rect(bx - 10, by - 16, 6, 5, ink);
  r.line(bx - 7, by - 13, bx - 7, by - 4, hex("#c0392b"));
  if (dagınık) {
    // kenarda yıldız karalaması
    const cx = 18, cy = 100;
    r.line(cx - 4, cy, cx + 4, cy, ink);
    r.line(cx, cy - 4, cx, cy + 4, ink);
    r.line(cx - 3, cy - 3, cx + 3, cy + 3, ink);
    r.line(cx - 3, cy + 3, cx + 3, cy - 3, ink);
  }
}

/* ---------- Moda'dan deniz ---------- */
function deniz(r: Raster, seed: number): void {
  r.gradV(0, 0, W, 62, SKY.dusk, 10);
  // güneş
  r.ellipse(118, 58, 9, 9, hex("#ffcf7a"));
  // karşı kıyı silueti: kubbeler ve ince kuleler
  const sil = hex("#3d2c4f");
  r.rect(0, 54, W, 8, sil);
  for (const [x, rad] of [[30, 6], [52, 4], [74, 7], [96, 3]] as const) {
    r.ellipse(x, 54, rad, Math.round(rad * 0.8), sil);
    r.rect(x - rad - 3, 40, 1, 14, sil);
    r.rect(x + rad + 3, 42, 1, 12, sil);
  }
  // deniz
  for (let y = 62; y < H; y++) {
    const t = (y - 62) / (H - 62);
    const base = mix(hex("#7a4a78"), hex("#1f2a4f"), t);
    for (let x = 0; x < W; x++) {
      const glint = Math.abs(x - 118) < 14 - t * 6 && bayer(x, y) < 0.35 - t * 0.2 && (x + y * 3 + seed) % 5 === 0;
      r.set(x, y, glint ? hex("#ffd59a") : (x * 7 + y * 13 + seed) % 23 === 0 ? lighter(base, 0.25) : base);
    }
  }
  // vapur
  const vx = 40 + (seed % 30), vy = 70;
  r.rect(vx, vy, 34, 5, hex("#f2efe8"));
  r.rect(vx + 3, vy - 4, 26, 4, hex("#e8e2d6"));
  r.rect(vx + 15, vy - 9, 4, 5, hex("#2b2b2b"));
  r.rect(vx + 15, vy - 9, 4, 1, hex("#c94b3c"));
  for (let i = 0; i < 6; i++) r.set(vx + 5 + i * 4, vy - 2, hex("#ffd27a"));
  r.rect(vx - 2, vy + 5, 38, 1, hex("#cfd6e4"));
  // ön planda korkuluk
  const rail = hex("#1a1420");
  r.rect(0, 104, W, 2, rail);
  for (let x = 4; x < W; x += 14) r.rect(x, 104, 2, 16, rail);
  // iki çay bardağı
  for (const cx of [62, 80]) {
    r.rect(cx, 96, 6, 8, hex("#a8321e"));
    r.rect(cx, 96, 6, 1, hex("#f0c9a0"));
    r.rect(cx - 1, 104, 8, 1, hex("#d8d0c0"));
  }
}

/* ---------- teyze kartları ---------- */
function gul(r: Raster, x: number, y: number, c: RGB): void {
  r.ellipse(x, y, 4, 3, c);
  r.set(x - 1, y - 1, darker(c, 0.35));
  r.set(x + 1, y, darker(c, 0.35));
  r.set(x, y + 1, darker(c, 0.25));
  r.set(x - 2, y - 2, lighter(c, 0.3));
}
function yaprak(r: Raster, x: number, y: number, dir: number): void {
  const g = hex("#2f7a3a");
  for (let i = 0; i < 5; i++) r.hline(x + (dir > 0 ? 0 : -i), y + i - 2, i < 3 ? i + 1 : 5 - i, g);
}
function kart(r: Raster, id: string, seed: number): void {
  const bg: Record<string, string[]> = {
    cuma: ["#0f3b2c", "#1d5c40", "#0c2c21"],
    bayram: ["#f6c9d4", "#f9e1e6", "#eeb2c2"],
    sinav: ["#16224a", "#2a3d7a", "#121b3a"],
    tebrik: ["#5a2a0c", "#a0581e", "#3f1d08"],
    gunaydin: ["#f7d79b", "#fbe9c6", "#f2c46d"],
  };
  const stops = (bg[id] ?? bg.cuma).map(hex);
  r.gradV(0, 0, W, H, stops, 10);
  // ışıltı
  for (let i = 0; i < 40; i++) {
    const x = hash(seed, i, 1) % W, y = hash(seed, i, 2) % 70;
    const c = id === "bayram" ? hex("#ffffff") : hex("#ffe08a");
    r.set(x, y, c);
    if (i % 4 === 0) { r.set(x - 1, y, c); r.set(x + 1, y, c); r.set(x, y - 1, c); r.set(x, y + 1, c); }
  }
  // altın çerçeve
  const gold = hex("#e6b54a");
  r.rect(4, 4, W - 8, 1, gold); r.rect(4, H - 5, W - 8, 1, gold); r.rect(4, 4, 1, H - 8, gold); r.rect(W - 5, 4, 1, H - 8, gold);
  r.rect(6, 6, W - 12, 1, darker(gold, 0.3)); r.rect(6, H - 7, W - 12, 1, darker(gold, 0.3));
  // buket
  const cols = id === "gunaydin" ? ["#ffd23f", "#f9a03f", "#fff1a8"] : id === "bayram" ? ["#e0567a", "#f08aa4", "#c93d63", "#ffb3c6"] : id === "sinav" ? ["#e8e8f4", "#d64561", "#f5f0e0"] : ["#d6283f", "#b51d33", "#ef4d62"];
  const cx = 80, cy = 96;
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI;
    const x = Math.round(cx + Math.cos(a) * 22 * (0.6 + (i % 2) * 0.4));
    const y = Math.round(cy - Math.sin(a) * 12 - (i % 3) * 3);
    r.line(x, y + 3, cx, cy + 14, hex("#3f8a46"));
    yaprak(r, x + (i % 2 ? 3 : -3), y + 6, i % 2 ? 1 : -1);
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI;
    const x = Math.round(cx + Math.cos(a) * 22 * (0.6 + (i % 2) * 0.4));
    const y = Math.round(cy - Math.sin(a) * 12 - (i % 3) * 3);
    gul(r, x, y, hex(cols[i % cols.length]));
  }
  // kurdele
  r.rect(cx - 5, cy + 10, 10, 3, gold);
  r.line(cx - 5, cy + 13, cx - 9, cy + 19, gold);
  r.line(cx + 5, cy + 13, cx + 9, cy + 19, gold);
}

/* ---------- profil resimleri (24x24) ---------- */
export interface PortreTarif { sex: Sex; age: number; seed: number; scarf?: boolean; glasses?: boolean; mustache?: boolean }

export function portre(p: PortreTarif): Raster {
  const r = new Raster(24, 24);
  const h = (n: number) => hash(p.seed, n);
  const bgs = ["#f2b880", "#9fc6b8", "#c7a8d8", "#e89c8c", "#a9bde0", "#e6cf8a", "#b5d39a"];
  r.rect(0, 0, 24, 24, hex(bgs[h(1) % bgs.length]));
  const skin = SKIN[1 + (h(2) % 4)];
  const old = p.age >= 45;
  const hairCols = ["#2a1a12", "#3b2416", "#5a3a22", "#1c1414", "#6b4a2a"];
  let hair = hex(hairCols[h(3) % hairCols.length]);
  if (old) hair = mix(hair, hex("#9a9490"), p.age >= 55 ? 0.55 : 0.25);
  const shirts = ["#3d5a80", "#c0504d", "#4e8a5b", "#6b4c9a", "#d8893a", "#2f3e46", "#b8476a"];
  const shirt = hex(shirts[h(4) % shirts.length]);
  // omuzlar
  r.ellipse(12, 24, 10, 6, shirt);
  r.rect(10, 16, 4, 3, darker(skin, 0.12));
  // baş
  r.ellipse(12, 11, 5, 6, skin);
  r.set(17, 11, darker(skin, 0.15));
  if (p.scarf) {
    const sc = hex(["#7a5c8e", "#5b7f9e", "#b0606f", "#d7b46a"][h(5) % 4]);
    r.rect(6, 3, 12, 3, sc); r.rect(5, 5, 3, 13, sc); r.rect(16, 5, 3, 13, sc); r.rect(7, 2, 10, 2, sc);
    r.rect(7, 17, 10, 3, sc);
  } else if (p.sex === "female") {
    r.rect(7, 4, 10, 3, hair); r.rect(6, 6, 2, 12 - (h(6) % 3) * 3, hair); r.rect(16, 6, 2, 12 - (h(6) % 3) * 3, hair); r.rect(8, 3, 8, 1, hair);
    if (h(6) % 3 === 2) { r.ellipse(12, 2, 2, 2, hair); }
  } else {
    r.rect(7, 4, 10, 3, hair); r.rect(7, 6, 1, 3, hair); r.rect(16, 6, 1, 3, hair); r.rect(8, 3, 8, 1, hair);
    if (p.age >= 50 && h(7) % 2) r.rect(9, 4, 6, 1, skin);
  }
  // yüz
  const eye = hex("#24181a");
  r.set(10, 11, eye); r.set(14, 11, eye);
  r.rect(11, 14, 3, 1, darker(skin, 0.3));
  r.set(9, 13, mix(skin, hex("#e88a8a"), 0.35)); r.set(15, 13, mix(skin, hex("#e88a8a"), 0.35));
  if (p.glasses) { const g = hex("#2b2b2b"); r.rect(9, 10, 3, 1, g); r.rect(13, 10, 3, 1, g); r.rect(9, 12, 3, 1, g); r.rect(13, 12, 3, 1, g); r.set(12, 11, g); }
  if (p.mustache) r.rect(10, 13, 5, 1, hair);
  return r;
}

/** Grup ve sistem simgeleri (24x24). */
export function simge(id: "aile" | "sinif" | "kurs" | "sonuc"): Raster {
  const r = new Raster(24, 24);
  if (id === "aile") {
    r.rect(0, 0, 24, 24, hex("#f4c27a"));
    r.rect(6, 11, 12, 9, hex("#fff3e0"));
    for (let i = 0; i < 7; i++) r.hline(12 - i - 1, 5 + i, i * 2 + 2, hex("#c0503a"));
    r.rect(10, 14, 4, 6, hex("#7a4a2a"));
    r.rect(15, 13, 2, 2, hex("#ffd27a"));
    r.rect(7, 13, 2, 2, hex("#ffd27a"));
  } else if (id === "sinif") {
    r.rect(0, 0, 24, 24, hex("#8fb3d9"));
    r.rect(3, 5, 18, 12, hex("#7a5230"));
    r.rect(4, 6, 16, 10, hex("#2f5d46"));
    r.hline(6, 9, 6, hex("#e8efe8")); r.hline(6, 12, 9, hex("#e8efe8")); r.hline(14, 9, 3, hex("#e8efe8"));
    r.rect(8, 17, 1, 4, hex("#7a5230")); r.rect(15, 17, 1, 4, hex("#7a5230"));
  } else if (id === "kurs") {
    r.rect(0, 0, 24, 24, hex("#d9d2c5"));
    r.rect(4, 7, 8, 11, hex("#f8f4ec")); r.rect(12, 7, 8, 11, hex("#f8f4ec"));
    r.vline(12, 7, 11, hex("#8a7a66"));
    for (let y = 9; y < 17; y += 2) { r.hline(5, y, 6, hex("#9aa8c8")); r.hline(13, y, 6, hex("#9aa8c8")); }
  } else {
    r.rect(0, 0, 24, 24, hex("#2c3e66"));
    r.rect(4, 7, 16, 11, hex("#f4efe4"));
    r.line(4, 7, 12, 13, hex("#b8ad98")); r.line(20, 7, 12, 13, hex("#b8ad98"));
    r.ellipse(12, 13, 2, 2, hex("#c0392b"));
  }
  return r;
}
