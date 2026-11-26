// Örnek sahne PNG'leri üretir: docs/gorsel-ornekler/
// Çalıştır: npm run sahne:ornek
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { Raster } from "../src/scene/raster";
import { renderStill, renderScene } from "../src/scene/render";
import { KITS } from "../src/scene/kits";
import { drawFigure, stageOf } from "../src/scene/people";
import { Rng } from "../src/engine/rng";
import { SceneDirector, homeSeedFor } from "../src/scene/director";
import type { Activity, Place, SceneFamilyMember, SceneState, ScenePlan, Weather } from "../src/scene/types";

const OUT = "docs/gorsel-ornekler";
mkdirSync(OUT, { recursive: true });

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Uint8Array): number { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), Buffer.from(data)]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
/** RGBA tamponunu tam sayı katında büyütüp PNG yapar. */
export function toPng(data: Uint8ClampedArray, w: number, h: number, scale: number): Buffer {
  const W = w * scale, Hh = h * scale;
  const raw = Buffer.alloc((W * 3 + 1) * Hh);
  for (let y = 0; y < Hh; y++) {
    const row = y * (W * 3 + 1);
    raw[row] = 0;
    const sy = Math.floor(y / scale);
    for (let x = 0; x < W; x++) {
      const i = (sy * w + Math.floor(x / scale)) * 4;
      raw[row + 1 + x * 3] = data[i]; raw[row + 2 + x * 3] = data[i + 1]; raw[row + 3 + x * 3] = data[i + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(Hh, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array())]);
}

const fam = (id: string, role: SceneFamilyMember["role"], sex: "female" | "male", age: number, alive = true): SceneFamilyMember => ({ id, role, sex, age, alive });

function plan(s: SceneState, place: Place, activity: Activity, weather: Weather, variant: number): ScenePlan {
  return { place, activity, weather, variant, homeSeed: homeSeedFor(s), signature: "" };
}

interface Sample { name: string; s: SceneState; p: ScenePlan }
const S = (o: Partial<SceneState> & Pick<SceneState, "region">): SceneState => ({
  lifeSeed: 11, income: 3, urban: true, age: 30, sex: "female", year: 2026, season: "spring", timeOfDay: "day", family: [], ...o,
});

const samples: Sample[] = [];
const add = (name: string, s: SceneState, place: Place, a: Activity, w: Weather, v = 1) => samples.push({ name, s, p: plan(s, place, a, w, v) });

// Akdeniz
add("01-akdeniz-sehir-ev-cocuk-sonbahar-gunduz", S({ region: "akdeniz", lifeSeed: 101, income: 3, age: 8, sex: "female", season: "autumn",
  family: [fam("m", "mother", "female", 36), fam("f", "father", "male", 39), fam("b", "sibling", "male", 1), fam("c", "pet", "female", 3)] }), "home", "rest", "clear", 5);
add("02-akdeniz-koy-ev-yasli-kis-gece", S({ region: "akdeniz", lifeSeed: 202, income: 1, urban: false, age: 74, sex: "male", season: "winter", timeOfDay: "night", year: 2041,
  family: [fam("w", "partner", "female", 71), fam("s", "sibling", "male", 70, false)] }), "home", "rest", "snow", 9);
add("03-akdeniz-sehir-sokak-anne-bebek-ilkbahar-aksam", S({ region: "akdeniz", lifeSeed: 303, income: 2, age: 29, sex: "female", timeOfDay: "dusk",
  family: [fam("h", "partner", "male", 32), fam("k", "child", "female", 0.6)] }), "outside", "walk", "clear", 3);
add("04-akdeniz-koy-dis-cocuk-oyun-yaz", S({ region: "akdeniz", lifeSeed: 404, income: 2, urban: false, age: 10, sex: "male", season: "summer",
  family: [fam("m", "mother", "female", 38), fam("f", "father", "male", 42), fam("s", "sibling", "female", 7)] }), "outside", "play", "clear", 4);
add("05-akdeniz-sehir-ev-yemek-varlikli-aksam", S({ region: "akdeniz", lifeSeed: 505, income: 5, age: 45, sex: "male", timeOfDay: "dusk", season: "winter",
  family: [fam("w", "partner", "female", 43), fam("a", "child", "female", 15), fam("b", "child", "male", 11)] }), "home", "meal", "rain", 6);
// Batı Afrika
add("06-batiafrika-sehir-ev-yemek-gece", S({ region: "bati-afrika", lifeSeed: 606, income: 2, age: 34, sex: "male", timeOfDay: "night", season: "summer",
  family: [fam("w", "partner", "female", 31), fam("a", "child", "male", 9), fam("b", "child", "female", 6), fam("c", "child", "female", 3)] }), "home", "meal", "rain", 2);
add("07-batiafrika-koy-avlu-harmattan-anne-bebek", S({ region: "bati-afrika", lifeSeed: 707, income: 1, urban: false, age: 26, sex: "female", season: "winter",
  family: [fam("h", "partner", "male", 30), fam("k", "child", "male", 0.9), fam("g", "mother", "female", 52, true)].map((m) => (m.role === "mother" ? { ...m, livesTogether: true } : m)) }), "outside", "chores", "haze", 7);
add("08-batiafrika-sehir-ev-genc-varlikli-gunduz", S({ region: "bati-afrika", lifeSeed: 808, income: 4, age: 16, sex: "female", season: "spring",
  family: [fam("m", "mother", "female", 44), fam("f", "father", "male", 50), fam("d", "pet", "male", 4)] }), "home", "rest", "clear", 8);
add("09-batiafrika-sehir-sokak-yagmur-aksam", S({ region: "bati-afrika", lifeSeed: 909, income: 3, age: 41, sex: "male", season: "summer", timeOfDay: "dusk",
  family: [fam("w", "partner", "female", 38), fam("a", "child", "female", 12)] }), "outside", "market", "rain", 11);
add("10-batiafrika-koy-ev-gece-fener", S({ region: "bati-afrika", lifeSeed: 1010, income: 1, urban: false, age: 66, sex: "female", season: "autumn", timeOfDay: "night",
  family: [fam("h", "partner", "male", 70, false), fam("g", "child", "male", 40, true), fam("n", "child", "female", 12)].map((m) => ({ ...m, livesTogether: m.alive })) }), "home", "rest", "clear", 12);

add("11-akdeniz-koy-dis-kar-kapi-onu-sabah", S({ region: "akdeniz", lifeSeed: 1111, income: 2, urban: false, age: 68, sex: "female", season: "winter", timeOfDay: "dawn", year: 1998,
  family: [fam("h", "partner", "male", 72), fam("t", "child", "male", 40, true)] }), "outside", "doorstep", "snow", 13);

let totalMs = 0;
for (const smp of samples) {
  const t0 = performance.now();
  const r = renderStill(smp.s, smp.p);
  totalMs += performance.now() - t0;
  writeFileSync(`${OUT}/${smp.name}.png`, toPng(r.data, r.w, r.h, 4));
}

// Bir hayat boyunca (aynı tohum): yaş şeridi — yaşlanma ve tekrar etmeme kontrolü
for (const region of ["akdeniz", "bati-afrika"] as const) {
  const ages = [0, 3, 7, 12, 17, 24, 33, 45, 58, 70, 82, 90];
  const cols = 4, rows = 3;
  const sheet = new Raster(160 * cols + (cols - 1) * 2, 120 * rows + (rows - 1) * 2);
  sheet.rect(0, 0, sheet.w, sheet.h, 0x101014);
  const dir = new SceneDirector(4242);
  const seasons = ["spring", "summer", "autumn", "winter"] as const;
  const times = ["day", "dusk", "day", "night", "dawn", "day"] as const;
  ages.forEach((age, k) => {
    const year = 1990 + age;
    const fam2: SceneFamilyMember[] = [
      fam("mom", "mother", "female", 27 + age, age < 66), fam("dad", "father", "male", 30 + age, age < 55),
      fam("sis", "sibling", "female", age - 3, true), fam("p", "partner", "male", age - 1, age >= 24),
      fam("k1", "child", "female", age - 27, age >= 27), fam("k2", "child", "male", age - 31, age >= 31),
    ].filter((m) => m.age >= 0 && (m.role !== "partner" || age >= 24));
    const s: SceneState = {
      lifeSeed: 4242, region, income: age < 24 ? 2 : age < 50 ? 3 : 4, urban: age >= 17 || region === "akdeniz", age, sex: "female", year,
      season: seasons[k % 4], timeOfDay: times[k % times.length], family: fam2, health: age > 85 ? 30 : 80,
    };
    const sc = dir.compose(s);
    const p = sc.plan;
    const ox = (k % cols) * 162, oy = Math.floor(k / cols) * 122;
    for (let y = 0; y < 120; y++) for (let x = 0; x < 160; x++) sheet.set(ox + x, oy + y, sc.base.get(x, y));
    console.log(region, age, p.signature);
  });
  writeFileSync(`${OUT}/hayat-seridi-${region}.png`, toPng(sheet.data, sheet.w, sheet.h, 2));
}

// Yaş okunurluğu şeridi (O2): aynı kişi 20-85 yaş, başörtülü ve başı açık, iki bölge
{
  const ages = [20, 30, 40, 50, 60, 70, 80, 88];
  const rows = [["akdeniz", "scarf"], ["akdeniz", "none"], ["bati-afrika", "wrap"], ["bati-afrika", "none"]] as const;
  const sheet = new Raster(ages.length * 20 + 4, rows.length * 44 + 4);
  sheet.rect(0, 0, sheet.w, sheet.h, 0xe8e2d6);
  rows.forEach(([region, hw], ri) => ages.forEach((age, k) => {
    const s = S({ region, age });
    const look = KITS[region].look({ identity: new Rng(42 + ri), outfit: new Rng(7), sex: "female", age, stage: stageOf(age), role: "self",
      household: { skinBase: region === "akdeniz" ? 3 : 7, headCover: 0, traditional: 0.3 }, state: s, plan: plan(s, "home", "rest", "clear", 1) });
    look.headwear = hw;
    if (hw !== "none") look.headCloth = { c1: 0x5a6a8a, c2: 0x8a9ab8, pattern: "solid" };
    drawFigure(sheet, { look, stage: stageOf(age), sex: "female", age, pose: age >= 80 ? "cane" : "stand" }, 12 + k * 20, 44 + ri * 44);
  }));
  writeFileSync(`${OUT}/yas-seridi-kadin.png`, toPng(sheet.data, sheet.w, sheet.h, 5));
}
// Y2: koyu tenli yaşlı erkekler (ten basamağı 7-9, ak saç/sakal, başlıklı/başlıksız) yakın çekim
{
  const cols: [number, number, "beard" | "mustache" | "none", "none" | "kufi"][] = [
    [7, 62, "beard", "none"], [8, 70, "beard", "kufi"], [9, 76, "beard", "none"], [9, 84, "mustache", "kufi"], [9, 88, "beard", "none"], [8, 80, "none", "none"],
  ];
  const sheet = new Raster(cols.length * 22 + 4, 48);
  sheet.rect(0, 0, sheet.w, sheet.h, 0xd8cfc0);
  cols.forEach(([tone, age, facial, hw], k) => {
    const s = S({ region: "bati-afrika", age });
    const look = KITS["bati-afrika"].look({ identity: new Rng(100 + k), outfit: new Rng(9 + k), sex: "male", age, stage: "elder", role: "self",
      household: { skinBase: tone, headCover: 0, traditional: 0.8 }, state: s, plan: plan(s, "outside", "walk", "clear", 1) });
    look.facial = facial; look.headwear = hw; look.hairStyle = "cropped";
    drawFigure(sheet, { look, stage: "elder", sex: "male", age, pose: age >= 80 ? "cane" : "stand" }, 13 + k * 22, 44);
  });
  writeFileSync(`${OUT}/yasli-erkek-koyu-ten.png`, toPng(sheet.data, sheet.w, sheet.h, 6));
}
// Oyuncu işareti açıkken (deneme; varsayılan kapalı)
{
  const smp = samples[8];
  const r = renderStill(smp.s, smp.p, 0, { marker: true });
  writeFileSync(`${OUT}/12-oyuncu-isareti-acik.png`, toPng(r.data, r.w, r.h, 4));
}

console.log(`${samples.length} sahne, ortalama ${(totalMs / samples.length).toFixed(1)} ms/sahne (Node, masaüstü)`);
