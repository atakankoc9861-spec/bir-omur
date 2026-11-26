// Sahneyi katman sırasıyla birleştirir:
// 1 zemin → 2 bina → 3 iç mekân/eşya (kit) → 4 insanlar → 4b ön eşya → 5 hava/mevsim → 6 ışık.
import { Rng } from "../engine/rng";
import { type RGB, hex, mix, lighter } from "./color";
import { applyLighting } from "./light";
import { KITS } from "./kits";
import type { BuildCtx, LookInput, RegionKit, SceneBuild, Slot } from "./kits/common";
import { AMBIENT_IN, AMBIENT_OUT, hash, hashStr } from "./palette";
import { type Figure, type Look, type Pose, drawFigure, ensureHeadContrast, isGrown, stageOf } from "./people";
import { GUARDIAN_MIN_AGE, NEEDS_GUARDIAN_UNDER, guardians, livesWithPlayer } from "./cast";
import { settingsFor } from "./kits/common";
import * as P from "./props";
import { Raster } from "./raster";
import type { SceneFamilyMember, SceneState, ScenePlan } from "./types";

export const SCENE_W = 160;
export const SCENE_H = 120;

export interface RenderedScene {
  /** Işıklandırılmış, parçacıksız sabit kare. */
  base: Raster;
  plan: ScenePlan;
  build: SceneBuild;
  state: SceneState;
  /** Sahnede kim nerede (test ve albüm için). */
  actors: PlacedInfo[];
}

export interface PlacedInfo {
  id: string;
  self: boolean;
  /** Aile üyesi mi (yoldan geçen/satıcı değil). */
  family: boolean;
  age: number;
  x: number;
  y: number;
  /** Kucakta/sırtta taşınıyorsa taşıyanın kimliği. */
  carriedBy: string | null;
}

export interface RenderOptions {
  out?: Raster;
  /** Oyuncunun başının üstünde ince işaret. Varsayılan KAPALI (Atakan'a soruldu). */
  marker?: boolean;
}

interface Actor {
  id: string;
  self: boolean;
  role: SceneFamilyMember["role"] | "self" | "neighbor";
  sex: "female" | "male";
  age: number;
}

export { livesWithPlayer };

const isGuardianAge = (a: { age: number }) => a.age >= GUARDIAN_MIN_AGE;

function presentActors(s: SceneState, plan: ScenePlan, rng: Rng): Actor[] {
  const self: Actor = { id: "self", self: true, role: "self", sex: s.sex, age: s.age };
  const others = s.family.filter((m) => m.alive && m.role !== "pet" && m.role !== "ex");
  let list = others.filter((m) => (m.role === "friend" ? plan.place === "outside" && rng.chance(0.35) : livesWithPlayer(m, s.age, s.lifeSeed)));
  const order = { partner: 0, child: 1, mother: 2, father: 3, sibling: 4, friend: 5 } as Record<string, number>;
  list.sort((a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || a.age - b.age);
  if (plan.place === "outside") {
    list = list.filter((m) => m.age < 2 || rng.chance(plan.activity === "walk" ? 0.75 : 0.55));
    if (plan.activity === "play") list.sort((a, b) => a.age - b.age);
  }
  const max = plan.place === "home" ? 6 : 5;
  list = list.slice(0, max);
  // K1: dışarıda 6 yaş altı biri varsa aileden bir büyük mutlaka yanında
  if (plan.place === "outside") {
    const young = s.age < NEEDS_GUARDIAN_UNDER || list.some((m) => m.age < NEEDS_GUARDIAN_UNDER);
    const hasGuard = () => isGuardianAge(s) || list.some((m) => isGuardianAge(m) && m.role !== "friend");
    if (young && !hasGuard()) {
      const g = guardians(s)[0];
      if (g) list = [g, ...list].slice(0, max);
    }
    if (!hasGuard()) list = list.filter((m) => m.age >= NEEDS_GUARDIAN_UNDER);
  }
  return [self, ...list.map((m) => ({ id: m.id, self: false, role: m.role, sex: m.sex, age: m.age }))];
}

function kindScore(a: Actor, slot: Slot, s: SceneState, indoor: boolean): number {
  const st = stageOf(a.age);
  const k = slot.kind;
  if (a.self && (s.health ?? 100) < 35) return k === "seat" ? 8 : k === "floor" ? 5 : -5;
  const table: Record<string, Partial<Record<Slot["kind"], number>>> = {
    adult: { seat: 3, stand: 2.5, work: 3.2, floor: 2.6, study: 1.2, play: 0.2 },
    elder: { seat: 4.5, floor: 2.8, stand: 1.5, work: 1.2, study: 0.8, play: 0 },
    teen: { seat: 2.6, stand: 2.8, work: 2, floor: 2.4, study: 3, play: indoor ? 0.8 : 2.4 },
    preteen: { play: 3.4, study: 3.2, floor: 2.6, stand: 2.2, seat: 1.6, work: 0 },
    child: { play: 3.6, study: a.age >= 6 ? 3 : 0, floor: 2.6, stand: 2, seat: 1.5, work: 0 },
    toddler: { play: 3.6, floor: 3, stand: 1.4, seat: 0.8 },
    baby: { play: 2, floor: 2.2 },
  };
  return table[st]?.[k] ?? -1;
}

function poseFor(a: Actor, slot: Slot, indoor: boolean, frail: boolean, rng: Rng): Pose {
  const st = stageOf(a.age);
  if (st === "baby") return a.age < 0.8 ? "lie" : "sit";
  switch (slot.kind) {
    case "seat": case "study": return "sit";
    case "floor": return "sitFloor";
    case "play": return indoor && rng.chance(0.6) ? "sitFloor" : "stand";
    default:
      if (frail && a.age >= 45) return "cane";
      return st === "elder" && rng.chance(a.age >= 80 ? 0.85 : a.age >= 70 ? 0.6 : 0.15) ? "cane" : "stand";
  }
}

/** Kitin görünüşü + başörtüsü/başlık ile ten arasında kontrast garantisi (Kalite Y4). */
function lookOf(kit: RegionKit, i: LookInput): Look {
  return ensureHeadContrast(kit.look(i));
}

function lookInput(a: Actor, s: SceneState, plan: ScenePlan, household: ReturnType<RegionKit["household"]>): LookInput {
  const idSeed = hash(s.lifeSeed, hashStr(a.id));
  return {
    identity: new Rng(idSeed),
    outfit: new Rng(hash(idSeed, plan.variant, s.age)),
    sex: a.sex, age: a.age, stage: stageOf(a.age), role: a.role, household, state: s, plan,
  };
}

export function renderScene(s: SceneState, plan: ScenePlan, opts: RenderOptions = {}): RenderedScene {
  const kit = KITS[s.region];
  const set = settingsFor(s);
  const r = opts.out ?? new Raster(SCENE_W, SCENE_H);
  r.emissive.fill(0);
  const v = new Rng(plan.variant);
  const household = kit.household(new Rng(hash(s.lifeSeed, 77)), set);
  const actors = presentActors(s, plan, new Rng(hash(plan.variant, 3)));

  // aile fotoğrafları için renkler
  const colorsOf = (m: SceneFamilyMember) => {
    const l = lookOf(kit, lookInput({ id: m.id, self: false, role: m.role, sex: m.sex, age: m.age }, s, plan, household));
    return { skin: l.skin, hair: l.hair };
  };
  const ctx: BuildCtx = {
    r, state: s, plan, home: new Rng(plan.homeSeed), v,
    memorials: s.family.filter((m) => !m.alive && m.role !== "pet" && m.role !== "ex" && m.role !== "friend").map(colorsOf),
    household: s.family.filter((m) => m.alive && m.role !== "pet").slice(0, 3).map(colorsOf),
  };

  // Katman 1-3: kit
  const build = kit.build(ctx, plan.place, plan.activity);
  const indoor = plan.place === "home";
  // Zemindeki hava izi (ıslaklık, birikinti, kar) zeminin parçasıdır: insanlardan önce.
  weatherGround(r, plan, build);

  // Katman 4: insanlar
  const { draw: placed, carried } = placeActors(r, actors, build.slots, s, plan, kit, household, indoor, v);
  // yoldan geçenler / satıcı: arka planda, biraz soluk, kimsenin üstüne binmeden (S4)
  if (!indoor) {
    for (const sl of build.slots.filter((x) => x.kind === "extra" && x.x >= 8 && x.x <= 152)) {
      if (!v.chance(sl.y < 100 ? 0.5 : 0.35)) continue;
      if (placed.some((p) => Math.abs(p.x - sl.x) < 11 && Math.abs(p.y - sl.y) < 14)) continue;
      const age = v.int(14, 76);
      const nb: Actor = { id: `n${v.int(0, 1e9)}`, self: false, role: "neighbor", sex: v.chance(0.5) ? "female" : "male", age };
      const hh = kit.household(new Rng(v.int(0, 1e9)), set);
      const look = lookOf(kit, lookInput(nb, s, plan, hh));
      placed.push({ fig: { look, stage: stageOf(age), sex: nb.sex, age, pose: "stand" }, x: sl.x, y: sl.y, info: { id: nb.id, self: false, family: false, age, x: sl.x, y: sl.y, carriedBy: null }, background: true });
    }
  }
  placed.sort((a, b) => a.y - b.y || a.x - b.x);
  const fadeTo = s.timeOfDay === "night" ? hex("#2a3048") : hex("#a8b0b8");
  let selfTop: { x: number; y: number } | null = null;
  for (const p of placed) {
    const top = drawFigure(r, p.fig, p.x, p.y, p.background ? { color: fadeTo, t: 0.22 } : undefined);
    if (p.info.self || p.carriesSelf) selfTop = { x: p.x, y: top };
  }
  // evcil hayvan
  const pet = s.family.find((m) => m.role === "pet" && m.alive);
  if (pet && build.petSpot) {
    const pc = kit.petColor(new Rng(hash(s.lifeSeed, hashStr(pet.id))));
    if (pc.kind === "cat") P.cat(r, build.petSpot.x, build.petSpot.y, pc.color, v.chance(0.5));
    else P.dog(r, build.petSpot.x, build.petSpot.y, pc.color);
  }

  // Katman 4b: ön eşya
  build.foreground?.();

  // Katman 5: hava ve mevsim (atmosfer: pus). Yağan parçacıklar drawParticles ile.
  weatherAir(r, s, plan);

  // Katman 6: ışık
  const amb = (indoor ? AMBIENT_IN : AMBIENT_OUT)[s.timeOfDay];
  const wf = plan.weather === "rain" ? 0.8 : plan.weather === "cloudy" || plan.weather === "snow" ? 0.9 : 1;
  const ambient: [number, number, number] = plan.weather === "haze" ? [amb[0] * 1.0, amb[1] * 0.95, amb[2] * 0.84] : [amb[0] * wf, amb[1] * wf, amb[2] * wf * (plan.weather === "rain" ? 1.05 : 1)];
  applyLighting(r, ambient, build.lights);

  // İsteğe bağlı oyuncu işareti (ışıktan sonra, hep okunur)
  if (opts.marker && selfTop) drawMarker(r, selfTop.x, selfTop.y);

  return { base: r, plan, build, state: s, actors: [...placed.map((p) => p.info), ...carried] };
}

/** Oyuncu işareti: başın 2 piksel üstünde küçük, ince bir ok. */
function drawMarker(r: Raster, x: number, top: number): void {
  const c = hex("#ffe27a"), o = hex("#2a1e14");
  const y = Math.max(2, top - 5);
  // 5x3 aşağı bakan ok + koyu kontur: her arka planda okunur ama göze batmaz
  for (let dx = -3; dx <= 3; dx++) r.set(x + dx, y - 1, o);
  r.set(x - 3, y, o); r.set(x + 3, y, o); r.set(x - 2, y + 1, o); r.set(x + 2, y + 1, o); r.set(x - 1, y + 2, o); r.set(x + 1, y + 2, o); r.set(x, y + 3, o);
  r.hline(x - 2, y, 5, c);
  r.hline(x - 1, y + 1, 3, c);
  r.set(x, y + 2, c);
}

interface Placed {
  fig: Figure;
  x: number;
  y: number;
  info: PlacedInfo;
  background?: boolean;
  carriesSelf?: boolean;
}

function placeActors(r: Raster, actors: Actor[], slots: Slot[], s: SceneState, plan: ScenePlan, kit: RegionKit, household: ReturnType<RegionKit["household"]>, indoor: boolean, v: Rng): { draw: Placed[]; carried: PlacedInfo[] } {
  const carried: PlacedInfo[] = [];
  // Y1: sahne dışına taşan yuva hiç kullanılmaz (figür yarı genişliği ~7 px)
  const inView = (sl: Slot) => sl.x >= 8 && sl.x <= 152 && sl.y >= 40 && sl.y <= 119;
  const free = slots.filter((x) => x.kind !== "extra" && inView(x));
  const extras = slots.filter((x) => x.kind === "extra" && inView(x));
  const placed: Placed[] = [];
  const frail = (s.health ?? 100) < 35;
  const babies = actors.filter((a) => a.age < 2);
  const rest = actors.filter((a) => a.age >= 2);
  const figOf = (a: Actor, pose: Pose, hold: Figure["hold"]): Figure => {
    const look = lookOf(kit, lookInput(a, s, plan, household));
    const f: Figure = { look, stage: stageOf(a.age), sex: a.sex, age: a.age, pose, hold };
    if (a.self && frail && (pose === "sit" || pose === "sitFloor")) f.blanket = { c1: hex("#8a6a8a"), c2: hex("#e8dcc8"), pattern: "check" };
    return f;
  };
  const crowd = (sl: Slot) => placed.reduce((pen, p) => pen + (Math.abs(p.x - sl.x) < 9 && Math.abs(p.y - sl.y) < 12 ? -2.5 : 0), 0);
  const nearGuard = (sl: Slot) => {
    const g = placed.filter((p) => p.info.family && isGuardianAge(p.info));
    return g.length ? -Math.min(...g.map((p) => Math.abs(p.x - sl.x) + Math.abs(p.y - sl.y))) / 12 : 0;
  };
  /** Oyuncu hiçbir yuvaya sığmazsa: boş yuva, yoksa yan yuva, yoksa önde yeni yer (K2). */
  const forcedSlot = (): Slot => {
    const pool = free.length ? free : extras;
    if (pool.length) {
      let bi = 0, bs = -Infinity;
      pool.forEach((sl, i) => { const sc = sl.prio + crowd(sl); if (sc > bs) { bs = sc; bi = i; } });
      return pool.splice(bi, 1)[0];
    }
    const front = Math.min(114, Math.max(100, ...slots.map((x) => x.y)));
    let x = 80;
    while (placed.some((p) => Math.abs(p.x - x) < 10) && x < 150) x += 12;
    return { x, y: front, kind: "stand", prio: 0 };
  };

  // Dışarıda önce büyükler (küçükler onların yanına yerleşsin); evde önce oyuncu.
  const order = indoor
    ? [...rest].sort((a, b) => (a.self ? -1 : b.self ? 1 : 0))
    : [...rest].sort((a, b) => (isGuardianAge(b) ? 1 : 0) - (isGuardianAge(a) ? 1 : 0) || (a.self ? -1 : b.self ? 1 : 0) || b.age - a.age);
  for (const a of order) {
    let best = -1, bestScore = -Infinity;
    free.forEach((sl, i) => {
      let sc = kindScore(a, sl, s, indoor) + sl.prio * (a.self ? 0.9 : 0.35) + v.next() * 0.3 + crowd(sl);
      if (!indoor && a.age < NEEDS_GUARDIAN_UNDER) sc += nearGuard(sl);
      if (sc > bestScore) { bestScore = sc; best = i; }
    });
    let sl: Slot;
    if (best >= 0 && kindScore(a, free[best], s, indoor) >= 0) sl = free.splice(best, 1)[0];
    else if (a.self) sl = forcedSlot();
    else continue;
    const pose = poseFor(a, sl, indoor, a.self && frail, v);
    let hold = sl.hold ?? "none";
    if (sl.kind === "study") hold = "book";
    if (hold === "none" && isGrown(stageOf(a.age)) && s.year >= 2012 && a.age < 60 && v.chance(0.12)) hold = "phone";
    if (!isGrown(stageOf(a.age)) && (hold === "glass" || hold === "spoon" || hold === "pestle")) hold = "none";
    if (pose === "cane") hold = "none";
    placed.push({ fig: figOf(a, pose, hold), x: sl.x, y: sl.y, info: { id: a.id, self: a.self, family: true, age: a.age, x: sl.x, y: sl.y, carriedBy: null } });
  }

  // Bebekler: tercihen anne, sonra herhangi bir aile büyüğünün kucağında. Dışarıda daima kucakta.
  const canCarry = (p: Placed) => p.info.family && p.info.age >= GUARDIAN_MIN_AGE && !p.fig.carry && p.fig.pose !== "cane";
  for (const b of babies) {
    const look = lookOf(kit, lookInput(b, s, plan, household));
    const baby: Figure = { look, stage: "baby", sex: b.sex, age: b.age, pose: b.age < 0.8 ? "lie" : "sit", blanket: { c1: look.top.c1, c2: hex("#ffffff"), pattern: "dots" } };
    const pool = placed.filter(canCarry);
    const prefer = pool.filter((p) => p.fig.hold !== "pestle" && p.fig.hold !== "spoon");
    const c = prefer.find((p) => p.fig.sex === "female") ?? prefer[0] ?? (!indoor ? pool[0] : undefined);
    if (c && (!indoor || b.age < 1.2 || v.chance(0.5))) {
      c.fig.carry = { baby, back: c.fig.pose === "stand" && s.region === "bati-afrika" && v.chance(0.6) };
      c.fig.hold = "none";
      if (b.id === "self") c.carriesSelf = true;
      carried.push({ id: b.id, self: b.id === "self", family: true, age: b.age, x: c.x, y: c.y, carriedBy: c.info.id });
      continue;
    }
    // yerde/beşikte: en yakın aile büyüğünün yanına
    let i = -1, bs = -Infinity;
    free.forEach((sl, k) => { if (sl.kind !== "play" && sl.kind !== "floor") return; const sc = nearGuard(sl) + crowd(sl); if (sc > bs) { bs = sc; i = k; } });
    let sl: Slot | null = i >= 0 ? free.splice(i, 1)[0] : null;
    if (!sl && b.id === "self") sl = forcedSlot();
    if (!sl) continue;
    const info: PlacedInfo = { id: b.id, self: b.id === "self", family: true, age: b.age, x: sl.x, y: sl.y, carriedBy: null };
    if (indoor && baby.pose === "lie" && s.region === "akdeniz") {
      P.crib(r, sl.x - 9, sl.y, hex("#a8784a"));
      placed.push({ fig: baby, x: sl.x, y: sl.y - 5, info });
    } else {
      if (baby.pose === "lie") P.wovenMat(r, sl.x - 8, sl.y - 2, 18, 4, hex("#c8a868"), hex("#b83a2a"));
      placed.push({ fig: baby, x: sl.x, y: sl.y, info });
    }
  }
  return { draw: placed, carried };
}

// ------------------------------------------------------------------ Hava

function weatherAir(r: Raster, s: SceneState, plan: ScenePlan): void {
  if (plan.weather === "haze") {
    // derinliğe göre pus: uzak daha soluk
    const hc = s.timeOfDay === "night" ? hex("#2a2420") : hex("#d8c49a");
    for (let y = 0; y < r.h; y++) {
      const t = plan.place === "home" ? 0.06 : y < 90 ? 0.22 : 0.1;
      for (let x = 0; x < r.w; x++) if (!r.emissive[y * r.w + x]) r.set(x, y, mix(r.get(x, y), hc, t));
    }
  }
}

function weatherGround(r: Raster, plan: ScenePlan, b: SceneBuild): void {
  const g = b.openGround;
  if (!g) return;
  if (plan.weather === "rain") {
    // ıslak zemin ve su birikintileri (gökyüzünü yansıtır)
    r.tint(g.x, g.y, g.w, g.h, hex("#2a3444"), 0.12);
    const pr = new Rng(hash(plan.variant, 9));
    for (let i = 0; i < 5; i++) {
      const px = pr.int(0, 150), py = pr.int(g.y + 8, g.y + g.h - 3), pw = pr.int(5, 12);
      for (let k = 0; k < pw; k++) { r.set(px + k, py, lighter(r.get(px + k, py), 0.25)); if (k > 1 && k < pw - 2) r.set(px + k, py + 1, lighter(r.get(px + k, py + 1), 0.15)); }
    }
  }
  // Kar: kit zemini ve çatıları zaten karlı çizer (bkz. kitler), burada ek işlem yok.
}

/** Hareketli parçacıklar (yağmur, kar, toz). Her karede sabit karenin kopyasına çizilir. */
export function drawParticles(r: Raster, scene: RenderedScene, frame: number): void {
  const { plan, state: s, build } = scene;
  const night = s.timeOfDay === "night";
  const areas = plan.place === "home" ? build.windows : [{ x: 0, y: 0, w: r.w, h: r.h }];
  if (areas.length === 0) return;
  const n = plan.weather === "rain" ? 70 : plan.weather === "snow" ? 55 : plan.weather === "haze" ? 14 : 0;
  for (const a of areas) {
    const count = Math.ceil((n * (a.w * a.h)) / (r.w * r.h));
    for (let i = 0; i < count; i++) {
      const sx = (i * 9301 + 49297) % 233280 / 233280;
      const sy = (i * 4271 + 1237) % 7919 / 7919;
      if (plan.weather === "rain") {
        const y = a.y + Math.floor((sy * a.h + frame * 5) % a.h);
        const x = a.x + Math.floor((sx * a.w - frame * 1 + a.w * 10) % a.w);
        const c: RGB = night ? hex("#5a6a8a") : hex("#c8d4e0");
        r.set(x, y, c); r.set(x, y + 1, mix(c, r.get(x, y + 1), 0.4)); r.set(x - 1, y + 2, mix(c, r.get(x - 1, y + 2), 0.6));
      } else if (plan.weather === "snow") {
        const y = a.y + Math.floor((sy * a.h + frame * 0.8) % a.h);
        const x = a.x + Math.floor((sx * a.w + Math.sin(frame / 8 + i) * 2 + a.w) % a.w);
        r.set(x, y, night ? hex("#b8c0d8") : hex("#ffffff"));
      } else if (plan.weather === "haze") {
        const y = a.y + Math.floor((sy * a.h + Math.sin(frame / 20 + i) * 3 + a.h) % a.h);
        const x = a.x + Math.floor((sx * a.w + frame * 0.3) % a.w);
        r.set(x, y, mix(r.get(x, y), hex("#f0e0b8"), 0.6));
      }
    }
  }
}

/** Tek çağrıda: plan + çizim + ilk kare parçacıkları. PNG/test için. */
export function renderStill(s: SceneState, plan: ScenePlan, frame = 0, opts: RenderOptions = {}): Raster {
  const sc = renderScene(s, plan, opts);
  drawParticles(sc.base, sc, frame);
  return sc.base;
}

