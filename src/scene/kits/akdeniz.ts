// Bölge kiti: Akdeniz ve Orta Doğu (ör. Türkiye, Yunanistan, Levant, Kuzey Afrika kıyısı).
// Mimari: sıvalı/badanalı duvar, panjur, kiremit ya da düz çatı + su deposu/güneş paneli, balkon.
// Ayrıntı ülke profilinden gelecek; bu kit ortak dokuyu verir.
import { Rng } from "../../engine/rng";
import { type RGB, darker, lighter, mix, desat, hex } from "../color";
import { LAMP_WARM, SCREEN_GLOW, FIRE, SKIN, hash } from "../palette";
import type { Garment, Look, HairStyle, Headwear, Facial, BottomKind, Pattern } from "../people";
import * as P from "../props";
import { noise2 } from "../raster";
import type { LightSource } from "../light";
import type { Activity, Place, SceneState } from "../types";
import {
  type BuildCtx, type Household, type LookInput, type RegionKit, type SceneBuild, type Slot,
  H, agedHair, drawSky, farColor, garment, hills, inSchoolClothes, isCold, pick, seaStrip, seatSlots, skinFor, windowView,
} from "./common";

const HAIR = H(["#1a1412", "#2a1e18", "#3a281c", "#4e3424", "#6a4a30", "#8a6a44"]);
const HAIR_W = [3, 4, 3, 2, 1, 0.4];

const TOPS_ADULT = H(["#2f4a6e", "#7a2e2e", "#e8e2d4", "#5a6a3a", "#c88a3a", "#4a4a52", "#8aa0b8", "#a84a3a", "#3a6a6a", "#d8c8a8", "#6a4a6a"]);
const TOPS_KID = H(["#d84a3a", "#3a7ad0", "#f0c030", "#4aa86a", "#e87aa0", "#7a5ad0", "#f08a3a", "#3ab0b0"]);
const BABY = H(["#f4e8c8", "#c8dcf0", "#f8d0d8", "#d0ecd8", "#f8ecb0"]);
const BOTTOMS = H(["#2a3448", "#3a4a6a", "#5a5048", "#8a7a60", "#2a2a2e", "#4a5a7a", "#6a5040"]);
const SKIRTS = H(["#4a3a5a", "#2a3a4a", "#7a4a3a", "#3a4a3a", "#5a4a40", "#8a6a5a"]);
const COATS = H(["#3a3430", "#4a3a2a", "#2a3440", "#5a4a3a", "#6a2a2a", "#3a4a3a"]);
const SCARVES = H(["#7a3a4a", "#3a4a6a", "#c8b8a0", "#5a6a4a", "#8a5a7a", "#e0d8c8", "#4a3a3a", "#b07a5a"]);
const SHOES = H(["#2a2220", "#4a3020", "#1e1e22", "#e8e4dc"]);

const WALLS = H(["#efe4cf", "#f1eee6", "#e8cf9e", "#cfe0e6", "#d4e4cf", "#f0d2b8", "#ecd3cf", "#e6dcc0"]);
const DADO = H(["#8fa58a", "#5f86a6", "#a8806a", "#7a8aa0"]);
const SOFAS = H(["#7a3a34", "#5a6a8a", "#8a7a5a", "#4a6a4a", "#6a4a5a", "#9a8a72"]);
const WOOD = H(["#8a5a34", "#6a4426", "#a8784a", "#5a3a24"]);
const FACADES = H(["#efe6d2", "#e8cf9e", "#d8b89a", "#f2ece0", "#cfd8d4", "#e6c8a8", "#d8a888", "#c8c0b0", "#ecd8b8"]);
const SHUTTERS = H(["#3a6a5a", "#3a5a8a", "#6a4a34", "#5a7a4a", "#8a4a34"]);
const CARS = H(["#d8d8d4", "#9a2a2a", "#2a3a5a", "#4a4a4e", "#e8e2d0", "#3a5a4a"]);

function kilim(rng: Rng): Garment {
  return garment(pick(rng, H(["#9a2e2a", "#7a3a2a", "#2a3a6a", "#8a5a2a"])), pick(rng, H(["#e8c878", "#d8d0c0", "#3a6a5a", "#1e2a4a"])), pick(rng, ["wax", "zigzag", "check"] as Pattern[]));
}

function clothes(c: RGB, q: number): RGB {
  return q <= 1 ? desat(c, 0.2) : q >= 5 ? lighter(c, 0.04) : c;
}

export const akdeniz: RegionKit = {
  id: "akdeniz",
  nameTr: "Akdeniz ve Orta Doğu",

  household(rng: Rng, set): Household {
    // Oranlar gorsel-ayar.ts'de (GEÇİCİ GÖRSEL AYAR, kaynaksız).
    return {
      skinBase: rng.weighted([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], (i) => set.skinWeights[i]),
      headCover: rng.chance(set.headCover.householdShare) ? set.headCover.inCovering : set.headCover.otherwise,
      traditional: rng.next() * set.traditionalDress,
    };
  },

  look(i: LookInput): Look {
    const { identity: id, outfit: o, sex, age, stage, household: hh, state: s, plan } = i;
    const fem = sex === "female";
    const q = s.income;
    const stageRng = new Rng(hash(id.int(0, 1e9), ["baby", "toddler", "child", "preteen", "teen", "adult", "elder"].indexOf(stage)));
    const skin = skinFor(hh.skinBase, id, SKIN);
    const hairBase = HAIR[id.weighted([0, 1, 2, 3, 4, 5], (k) => HAIR_W[k])];
    const hair = agedHair(hairBase, age, id);
    const cold = isCold(s.season, plan.weather);
    const grown = stage === "teen" || stage === "adult" || stage === "elder";

    let hairStyle: HairStyle = "short";
    if (stage === "child" || stage === "preteen") hairStyle = fem ? pick(stageRng, ["long", "ponytail", "bob", "bun"] as HairStyle[]) : "short";
    else if (stage === "teen" || stage === "adult") hairStyle = fem ? pick(stageRng, ["long", "bun", "bob", "ponytail", "long"] as HairStyle[]) : pick(stageRng, ["short", "short", "cropped"] as HairStyle[]);
    else if (stage === "elder") hairStyle = fem ? pick(stageRng, ["bun", "bob", "short"] as HairStyle[]) : stageRng.chance(0.45) ? "balding" : "short";

    const facialR = id.next();
    const facial: Facial = fem || !grown ? "none" : facialR < 0.3 ? "mustache" : facialR < 0.5 ? "beard" : facialR < 0.62 ? "stubble" : "none";

    let headwear: Headwear = "none";
    const coverP = stage === "teen" ? hh.headCover * 0.5 : hh.headCover;
    if (fem && grown && stageRng.next() < coverP) headwear = "scarf";
    else if (!fem && stage === "elder" && id.chance(0.35)) headwear = "flatcap";
    else if (!fem && stage === "teen" && o.chance(0.2)) headwear = "cap";
    const headCloth = headwear === "scarf"
      ? garment(pick(id, SCARVES), pick(o, SCARVES), o.chance(0.4) ? "floral" : "solid")
      : garment(pick(o, H(["#4a4a4a", "#5a4a3a", "#3a3a4a", "#2a4a7a", "#a83a2a"])), hex("#2a2a2a"), "check");

    let topC: RGB, topP: Pattern = "solid", bottomC: RGB, bottomKind: BottomKind = "trousers", sleeves: "short" | "long" = cold ? "long" : o.chance(0.3) ? "long" : "short";
    let outer: Garment | null = null;
    let bottomP: Pattern = "solid";
    if (stage === "baby" || stage === "toddler") {
      topC = pick(o, BABY); bottomC = topC;
      topP = o.chance(0.4) ? "stripesH" : "solid";
      if (stage === "toddler" && fem && o.chance(0.4)) bottomKind = "dress";
    } else if (inSchoolClothes(age, s, plan)) {
      topC = hex("#c8dcf0"); bottomC = hex("#2a3450"); sleeves = "long";
      bottomKind = fem && o.chance(0.6) ? "skirt" : "trousers";
      if (cold) outer = garment(hex("#2a3450"), hex("#2a3450"));
    } else if (!grown) {
      topC = pick(o, TOPS_KID); topP = pick(o, ["solid", "stripesH", "solid", "dots"] as Pattern[]);
      bottomC = pick(o, BOTTOMS);
      if (fem && o.chance(0.45)) { bottomKind = o.chance(0.5) ? "dress" : "skirt"; bottomC = pick(o, TOPS_KID); }
      else if (!cold && o.chance(0.6)) bottomKind = "shorts";
    } else {
      topC = pick(o, TOPS_ADULT);
      topP = fem ? pick(o, ["solid", "floral", "stripesH", "solid", "dots"] as Pattern[]) : pick(o, ["solid", "check", "stripesV", "solid"] as Pattern[]);
      bottomC = pick(o, BOTTOMS);
      if (fem) {
        const r = o.next();
        if (headwear === "scarf") { bottomKind = r < 0.55 ? "dress" : r < 0.85 ? "skirt" : "trousers"; bottomC = pick(o, SKIRTS); bottomP = o.chance(0.3) ? "floral" : "solid"; sleeves = "long"; }
        else if (stage === "elder") { bottomKind = r < 0.6 ? "skirt" : "trousers"; bottomC = pick(o, SKIRTS); bottomP = o.chance(0.4) ? "floral" : "solid"; }
        else { bottomKind = r < 0.5 ? "trousers" : r < 0.8 ? "skirt" : "dress"; if (bottomKind !== "trousers") bottomC = pick(o, SKIRTS); }
        if (bottomKind === "dress") { topC = bottomC; topP = bottomP; }
      }
      if (cold && o.chance(0.75)) outer = garment(pick(o, COATS), pick(o, COATS), o.chance(0.2) ? "check" : "solid");
      else if (!fem && q >= 4 && stage === "adult" && o.chance(0.3)) outer = garment(hex("#2a3048"), hex("#2a3048"));
      else if (stage === "elder" && o.chance(0.5)) outer = garment(pick(o, H(["#7a6a5a", "#5a4a4a", "#6a6a5a", "#8a5a4a"])), hex("#3a3a3a"), "stripesV");
    }
    const top = garment(clothes(topC, q), lighter(topC, 0.3), topP);
    const bottom = garment(clothes(bottomC, q), lighter(bottomC, 0.25), bottomP);
    if (bottomKind === "dress" && grown) { top.c1 = bottom.c1; top.pattern = bottom.pattern; top.c2 = bottom.c2; }

    return {
      skin, hair, hairStyle, facial, headwear, headCloth, top, sleeves, outer, bottomKind, bottom,
      shoes: grown ? pick(o, SHOES.slice(0, 3)) : pick(o, SHOES),
      glasses: (age > 48 && id.chance(0.45)) || (age > 9 && age < 48 && id.chance(0.1)),
      earrings: fem && headwear !== "scarf" && grown && id.chance(0.5) ? hex("#e0c060") : null,
    };
  },

  weatherWeights(season, urban, set) {
    switch (season) {
      case "winter": return { rain: 3, cloudy: 3, clear: 3, snow: urban ? set.winterSnow.urban : set.winterSnow.rural };
      case "spring": return { clear: 6, cloudy: 2, rain: 1.5 };
      case "summer": return { clear: 10, cloudy: 0.5 };
      case "autumn": return { clear: 5, cloudy: 3, rain: 2 };
    }
  },

  activities(place: Place, s: SceneState): Activity[] {
    if (place === "home") return ["rest", "meal", "chores"];
    const a: Activity[] = ["walk", "doorstep", "market"];
    if (s.age < 15 || s.family.some((m) => m.alive && m.age < 14 && m.role !== "pet")) a.push("play");
    return a;
  },

  petColor(rng) {
    return rng.chance(0.65)
      ? { kind: "cat", color: pick(rng, H(["#d08a3a", "#5a5a5a", "#e8e0d0", "#3a3030", "#a07a5a"])) }
      : { kind: "dog", color: pick(rng, H(["#c8a070", "#5a4030", "#e8dcc0", "#2a2a2a"])) };
  },

  build(ctx: BuildCtx, place: Place, activity: Activity): SceneBuild {
    return place === "home" ? interior(ctx, activity) : ctx.state.urban ? street(ctx, activity) : village(ctx, activity);
  },
};

// ======================================================================= İÇ MEKÂN

function interior(ctx: BuildCtx, activity: Activity): SceneBuild {
  const { r, state: s, plan, home, v } = ctx;
  const q = s.income;
  const rural = !s.urban;
  const night = s.timeOfDay === "night";
  const slots: Slot[] = [];
  const lights: LightSource[] = [];
  const windows: P.Rect[] = [];

  // --- Ev kimliği (aynı evde yıllarca aynı)
  const wallKind: P.WallKind = rural && q <= 2 ? pick(home, ["plaster", "stone", "plaster"] as P.WallKind[]) : "paint";
  const wallC = wallKind === "stone" ? hex("#c8b8a0") : pick(home, WALLS);
  const lower = (rural || q <= 2) && home.chance(0.5) ? pick(home, DADO) : null;
  const floorKind: P.FloorKind = q >= 4 ? pick(home, ["wood", "terrazzo", "wood"] as P.FloorKind[]) : q === 3 ? pick(home, ["wood", "tile", "terrazzo"] as P.FloorKind[]) : rural ? pick(home, ["concrete", "tile"] as P.FloorKind[]) : pick(home, ["tile", "terrazzo", "concrete"] as P.FloorKind[]);
  const floorCols: Record<P.FloorKind, [RGB, RGB]> = {
    wood: [hex("#a8784a"), hex("#8a5a34")], tile: pick(home, [[hex("#b8674a"), hex("#a85a40")], [hex("#d8d2c4"), hex("#9a948a")], [hex("#c8b89a"), hex("#a89878")]] as [RGB, RGB][]),
    terrazzo: [hex("#c8c0b0"), hex("#8a8478")], concrete: [hex("#a29d94"), hex("#8a857c")], earth: [hex("#9a7a58"), hex("#8a6a48")],
  };
  const wood = pick(home, WOOD);
  const sofaC = pick(home, SOFAS);
  const winFrame = rural ? hex("#6a4a30") : q >= 3 ? hex("#f0f0ec") : pick(home, H(["#e8e4dc", "#6a4a30", "#3a5a7a"]));
  const curtain = q >= 2 ? garment(pick(home, H(["#d8c8a8", "#a85a4a", "#8aa0a8", "#e8dcc8", "#7a8a5a"])), hex("#f4f0e8"), home.chance(0.4) ? "floral" : "stripesV") : garment(hex("#e8e0d0"), hex("#c8b8a0"), "check");
  const homeSeed = plan.homeSeed;

  // 1) ZEMİN
  P.floorFill(r, 80, floorKind, floorCols[floorKind][0], floorCols[floorKind][1], homeSeed);
  // 2) BİNA (duvar, tavan, süpürgelik)
  P.wallFill(r, 0, 80, wallKind, wallC, lower, homeSeed);
  if (rural) { for (let x = 6; x < 160; x += 26) { P.box(r, x, 0, 6, 4, hex("#5a3a24"), false); } r.hline(0, 4, 160, hex("#4a2e1c")); }
  else if (q >= 3) { r.hline(0, 3, 160, lighter(wallC, 0.15)); r.hline(0, 4, 160, darker(wallC, 0.12)); }
  r.rect(0, 77, 160, 3, darker(lower ?? wallC, 0.3));
  r.hline(0, 77, 160, darker(lower ?? wallC, 0.15));

  // 3) İÇ MEKÂN / EŞYA ---- duvar bölgeleri: pencere, oturma, eşya (sıra sahneye göre değişir)
  type Zone = "window" | "seating" | "media";
  const order: Zone[] = (["window", "seating", "media"] as Zone[]).sort(() => v.next() - 0.5);
  const zx = [4, 56, 108];
  const zoneX = (z: Zone) => zx[order.indexOf(z)];
  const kitchen = activity === "chores";

  // pencere
  const wx = zoneX("window") + v.int(4, 10), wy = 16, ww = q >= 4 ? 34 : 28, wh = q >= 4 ? 36 : 30;
  const view = (rc: P.Rect) => windowView(r, rc, s, plan.weather, homeSeed, (rc2) => {
    if (rural) {
      const hc = farColor(hex("#6a8a5a"), s.timeOfDay, plan.weather);
      for (let x = rc2.x; x < rc2.x + rc2.w; x++) { const t = Math.round(Math.sin(x / 6 + homeSeed) * 2); r.vline(x, rc2.y + rc2.h - 10 + t, 10 - t, hc); }
      for (let k = 0; k < 3; k++) r.ellipse(rc2.x + 4 + k * 9, rc2.y + rc2.h - 9, 3, 2, darker(hc, 0.15));
    } else {
      const bc = farColor(pick(new Rng(homeSeed), FACADES), s.timeOfDay, plan.weather);
      r.rect(rc2.x, rc2.y + 8, rc2.w, rc2.h - 8, bc);
      for (let y = rc2.y + 10; y < rc2.y + rc2.h - 2; y += 6) for (let x = rc2.x + 2; x < rc2.x + rc2.w - 2; x += 5) {
        const lit = night && ((x * 3 + y) % 7) < 3;
        r.rect(x, y, 3, 3, lit ? hex("#f8d890") : darker(bc, 0.25));
      }
      r.rect(rc2.x + 3, rc2.y + 5, 5, 3, farColor(hex("#e0e0e0"), s.timeOfDay, plan.weather));
    }
  });
  P.windowFrame(r, wx, wy, ww, wh, { frame: winFrame, curtain, shutters: null, grille: false, arched: rural && home.chance(0.3), sill: lighter(wallC, 0.1) }, view);
  windows.push({ x: wx + 2, y: wy + 2, w: ww - 4, h: wh - 4 });
  if (rural || q <= 2 || v.chance(0.4)) {
    P.plantPot(r, wx + 2, wy + wh, rural || q <= 2 ? hex("#b8b8b0") : hex("#b8674a"), hex("#4a7a3a"), "flower", pick(v, H(["#e03a3a", "#f07aa0", "#f0f0f0"])));
    if (v.chance(0.5)) P.plantPot(r, wx + ww - 9, wy + wh, hex("#b8674a"), hex("#5a8a4a"), "bush", hex("#ffffff"));
  }
  if (!rural && q >= 3) P.radiator(r, wx + 4, 76, ww - 8);
  const winLightC = s.timeOfDay === "day" ? hex("#fff4e0") : s.timeOfDay === "night" ? hex("#3a4a80") : hex("#ffb890");
  lights.push({ x: wx + ww / 2, y: wy + wh + 6, radius: 56, color: winLightC, strength: night ? 0.08 : 0.28, squashY: 0.7 });

  // duvar süsleri (oturma bölgesinin üstü)
  const sx = zoneX("seating");
  const deco = v.int(0, 3);
  // S1: duvar süsü pencereye (perde dahil) ve kenara taşmaz
  const fits = (x: number, w: number) => x >= 2 && x + w <= 158 && (x + w < wx - 7 || x > wx + ww + 7);
  const wallPics = () => {
    let px = sx + 6;
    for (const m of ctx.memorials.slice(0, 2)) { if (fits(px - 1, 8)) P.portrait(r, px, 30, m.skin, m.hair, true); px += 10; }
    if (deco === 0) { if (fits(px + 3, 22)) P.framePicture(r, px + 4, 26, 20, 12, hex("#a87a3a"), (rc) => P.landscapeArt(r, rc, hex("#a8c8d8"), hex("#6a8a4a"))); }
    else if (deco === 1) { for (const m of ctx.household.slice(0, 3)) { if (fits(px - 1, 8)) P.portrait(r, px, 28, m.skin, m.hair, false); px += 9; } if (fits(px + 5, 7)) P.wallClock(r, px + 8, 32, hex("#8a6a4a")); }
    else if (deco === 2) { if (fits(px + 7, 7)) P.wallClock(r, px + 10, 26, hex("#3a3a3a")); if (q <= 3 && fits(px + 22, 7)) P.calendar(r, px + 22, 30, hex("#b83a2a")); }
    else if (fits(px + 1, 16)) { P.framePicture(r, px + 2, 24, 14, 16, hex("#3a3a3a"), (rc) => { r.rect(rc.x, rc.y, rc.w, rc.h, hex("#e8dcc8")); r.ellipse(rc.x + 7, rc.y + 8, 4, 5, hex("#b8674a")); r.hline(rc.x + 2, rc.y + 13, 10, hex("#3a5a7a")); }); }
  };

  // eşya bölgesi
  const mx = zoneX("media");
  let screenRc: P.Rect | null = null;
  let stoveAt: { x: number; y: number } | null = null;
  const winter = s.season === "winter";
  if (kitchen) {
    P.kitchenCounter(r, mx - 2, 88, 48, pick(home, H(["#e8e2d4", "#8a6a4a", "#a8b8b0"])), hex("#d8d0c4"), pick(home, H(["#e8f0f0", "#f0e8d8", "#d8e4e8"])));
    P.shelfWithItems(r, mx + 2, 46, 40, wood, H(["#c8c8c0", "#b8674a", "#3a6a8a", "#e8e0d0"]), "jars", v.int(0, 9));
    slots.push({ x: mx + 22, y: 98, kind: "work", prio: 2, hold: "spoon" });
  } else if (winter && (rural || q <= 2)) {
    stoveAt = P.woodStove(r, mx + 4, 90, 4);
    P.shelfWithItems(r, mx + 22, 50, 24, wood, H(["#c87a3a", "#d8d0c0", "#3a6a8a"]), "bowls", v.int(0, 9));
    P.cabinet(r, mx + 22, 88, 22, 12, wood);
    screenRc = P.screen(r, mx + 25, 76, P.tvKindFor(s.year), wood, night || v.chance(0.3), false);
  } else if (q >= 4 && v.chance(0.6)) {
    if (v.chance(0.5)) P.glassCabinet(r, mx + 4, 88, 26, 44, wood, H(["#f0f0ec", "#d8c8a0", "#a8c8d8"]));
    else { P.box(r, mx + 4, 44, 26, 44, wood); for (let y = 52; y < 88; y += 9) P.shelfWithItems(r, mx + 5, y, 24, darker(wood, 0.1), H(["#7a2e2e", "#2f4a6e", "#d8c8a8", "#3a6a3a", "#c88a3a"]), "books", y); }
    P.cabinet(r, mx + 32, 88, 14, 10, wood);
    P.plantPot(r, mx + 34, 78, hex("#e8e4dc"), hex("#3a7a4a"), "tall", 0);
  } else {
    const top = P.cabinet(r, mx + 2, 88, 40, 12, wood);
    const kind = P.tvKindFor(s.year);
    screenRc = P.screen(r, mx + (kind === "flat" ? 9 : 12), top, kind, wood, night || v.chance(0.35), q >= 4);
    if (q <= 3 && kind !== "flat") r.rect(mx + 10, top - 1, 22, 1, hex("#f4f0e8")); // dantel örtü
    if (v.chance(0.5)) P.fruitBowl(r, mx + 34, top - 1);
  }
  if (screenRc && night) lights.push({ x: screenRc.x + screenRc.w / 2, y: screenRc.y + 6, radius: 34, color: SCREEN_GLOW, strength: 0.45 });
  if (stoveAt) lights.push({ x: stoveAt.x, y: stoveAt.y, radius: 40, color: FIRE, strength: 0.55 });

  // oturma bölgesi
  wallPics();
  const floorSit = (rural && q <= 2) || (q <= 2 && v.chance(0.25));
  if (activity === "meal") {
    // yemek: masa ya da sofra ortada, oturma bölgesi arkada kalır
    if (floorSit || (rural && v.chance(0.5))) {
      P.floorSeating(r, sx, 88, 48, kilim(home), garment(pick(home, SOFAS), hex("#e8dcc0"), "solid"));
      P.rug(r, 44, 94, 72, 16, kilim(home), hex("#5a2a20"));
      for (const x of [62, 80, 98]) slots.push({ x, y: 100, kind: "floor", prio: 3 - Math.abs(x - 80) / 20 });
      slots.push({ x: 46, y: 108, kind: "floor", prio: 1.5 }, { x: 114, y: 108, kind: "floor", prio: 1.4 });
      return finish(() => { const t = P.lowTable(r, 60, 106, 40, wood); P.sharedBowl(r, 80, t.y + 1, hex("#e8e4dc"), hex("#d8a040")); P.teaSet(r, 66, t.y + 1); });
    }
    P.sofa(r, sx, 88, 48, sofaC, q <= 3 ? garment(hex("#f4f0e8"), hex("#e0d8c8"), "dots") : null, darker(wood, 0.2), q >= 3);
    for (const x of [64, 80, 96]) { P.chair(r, x - 4, 104, wood, false); }
    for (const x of [64, 80, 96]) slots.push({ x, y: 104, kind: "seat", prio: 3 - Math.abs(x - 80) / 20 });
    slots.push({ x: 44, y: 110, kind: "stand", prio: 1 }, { x: 120, y: 108, kind: "seat", prio: 1.2 });
    P.chair(r, 116, 108, wood, false);
    return finish(() => {
      const cloth = q <= 2 ? garment(hex("#e8e0d0"), hex("#c84a3a"), "check") : garment(hex("#f4f0e8"), hex("#e0d8c8"), "dots");
      const t = P.table(r, 54, 112, 52, 16, wood, cloth);
      P.sharedBowl(r, 80, t.y - 1, hex("#f0ece4"), hex("#c86a3a"));
      P.teaSet(r, 62, t.y);
      if (v.chance(0.6)) { r.rect(92, t.y - 4, 6, 3, hex("#d8a868")); r.hline(92, t.y - 4, 6, hex("#e8c088")); } // ekmek
    });
  }

  if (floorSit) {
    const seats = P.floorSeating(r, sx - 2, 88, 52, kilim(home), garment(pick(home, SOFAS), hex("#e8dcc0"), v.chance(0.5) ? "solid" : "embroidered"));
    slots.push(...seats.map((x, i) => ({ x, y: 88, kind: "floor" as const, prio: 3 - i * 0.2 })));
  } else {
    const seats = P.sofa(r, sx, 88, 48, sofaC, q <= 3 ? garment(hex("#f4f0e8"), hex("#e0d8c8"), "dots") : garment(lighter(sofaC, 0.2), sofaC, "solid"), darker(wood, 0.2), q >= 3);
    slots.push(...seatSlots(seats, 90, 3));
    if (q >= 4) { const fl = P.floorLamp(r, sx + 50, 90, hex("#e8d8b0"), night); if (night) lights.push({ x: fl.x, y: fl.y, radius: 50, color: LAMP_WARM, strength: 0.8 }); }
  }
  if (q >= 2) P.rug(r, 40, 96, 80, 18, kilim(home), q >= 4 ? hex("#3a2a2a") : hex("#5a2a20"));
  else P.rug(r, 50, 98, 60, 12, garment(hex("#c8a878"), hex("#a8805a"), "stripesH"), hex("#8a6a4a"));
  if (!floorSit && v.chance(0.5)) P.lowTable(r, sx + 14, 100, 20, wood);

  if (activity === "chores") {
    P.chair(r, 76, 104, wood, false);
    slots.push({ x: 80, y: 104, kind: "study", prio: 2.5, hold: "book" });
  }
  for (const [x, y] of [[60, 108], [100, 110], [128, 104], [36, 106]] as [number, number][]) slots.push({ x, y, kind: "play", prio: 1 });
  slots.push({ x: 132, y: 100, kind: "stand", prio: 0.8 }, { x: 30, y: 102, kind: "stand", prio: 0.6 });

  return finish(activity === "chores" ? () => { P.table(r, 70, 110, 22, 12, wood, null); r.rect(74, 97, 6, 1, hex("#f0ece0")); } : undefined);

  function finish(fg?: () => void): SceneBuild {
    // tavan lambası
    const bulbX = 80 + v.int(-10, 10);
    if (q <= 2) { r.vline(bulbX, 0, 10, hex("#3a3a3a")); r.rect(bulbX - 1, 10, 3, 3, night ? hex("#fff0c0") : hex("#e8e4d8")); if (night) r.glow(bulbX - 1, 10, 3, 3); }
    else { r.rect(bulbX - 6, 4, 13, 2, hex("#e8e4dc")); r.rect(bulbX - 4, 6, 9, 3, night ? hex("#fff4d8") : hex("#f4f0e8")); if (night) r.glow(bulbX - 4, 6, 9, 3); }
    if (night) lights.push({ x: bulbX, y: 14, radius: 125, color: LAMP_WARM, strength: q <= 2 ? 0.68 : 0.75 });
    return { slots, lights, windows, foreground: fg, petSpot: { x: 20 + v.int(0, 110), y: 116 } };
  }
}

// ======================================================================= ŞEHİR SOKAĞI

function street(ctx: BuildCtx, activity: Activity): SceneBuild {
  const { r, state: s, plan, home, v } = ctx;
  const q = s.income;
  const night = s.timeOfDay === "night";
  const slots: Slot[] = [];
  const lights: LightSource[] = [];
  const base = 84;
  const hasRoad = v.chance(0.5);
  const square = !hasRoad && v.chance(0.5); // meydan / küçük park

  // 1) ZEMİN: gökyüzü, uzak kent, kaldırım
  drawSky(r, { x: 0, y: 0, w: 160, h: base }, s.timeOfDay, plan.weather, plan.variant);
  const far = farColor(hex("#9aa0a8"), s.timeOfDay, plan.weather);
  const fr = new Rng(plan.homeSeed);
  for (let x = 0; x < 160;) { const w = fr.int(8, 18), h = fr.int(10, 30); r.rect(x, base - 20 - h, w, h + 20, x % 2 ? far : darker(far, 0.05)); x += w; }
  if (fr.chance(0.5)) hills(r, base - 40, 18, farColor(hex("#6a7a6a"), s.timeOfDay, plan.weather), plan.homeSeed % 10);
  // kaldırım taşı
  const pave = pick(home, H(["#b8b0a2", "#a8a49c", "#c8bca8"]));
  for (let y = base; y < 120; y++) for (let x = 0; x < 160; x++) {
    const row = Math.floor((y - base) / 4), off = row % 2 ? 3 : 0;
    let c = (x + off) % 7 === 0 || (y - base) % 4 === 0 ? darker(pave, 0.14) : pave;
    if (plan.weather === "snow" && noise2(x, y, 3) < 0.7) c = mix(c, hex("#eef2f6"), 0.8);
    if (((x * 7 + y * 13) % 31) === 0) c = lighter(c, 0.08);
    r.set(x, y, c);
  }
  if (hasRoad) {
    r.rect(0, 106, 160, 14, hex("#4a4a4e"));
    r.hline(0, 105, 160, hex("#d8d4cc")); r.hline(0, 106, 160, hex("#8a8a88"));
    for (let x = 4; x < 160; x += 16) r.hline(x, 114, 7, hex("#d8d4c0"));
  }

  // 2) BİNA: apartman sırası
  const doors: number[] = [];
  let x = -v.int(0, 14);
  const old = q <= 2 || home.chance(0.3);
  while (x < 160) {
    const w = v.int(30, 46);
    const floors = old ? v.int(2, 3) : v.int(3, 5);
    const fh = 13;
    const top = base - floors * fh - 6;
    const fc = pick(v, FACADES);
    r.rect(x, top, w, base - top, fc);
    for (let j = top; j < base; j++) for (let i = x; i < x + w; i++) if (noise2(i, j, 5) < 0.06) r.set(i, j, darker(fc, 0.06));
    r.vline(x + w - 1, top, base - top, darker(fc, 0.2));
    r.vline(x, top, base - top, lighter(fc, 0.08));
    // çatı
    if (old && v.chance(0.6)) {
      for (let j = 0; j < 5; j++) r.hline(x - 2 + j, top - 5 + j, w + 4 - j * 2, plan.weather === "snow" && j < 3 ? hex("#eef2f6") : j % 2 ? hex("#a8503a") : hex("#b8603a"));
    } else {
      r.rect(x - 1, top - 2, w + 2, 2, darker(fc, 0.25));
      if (v.chance(0.6)) P.waterTank(r, x + 4, top - 2, hex("#d8d8d0"));
      if (v.chance(0.5)) P.solarHeater(r, x + w - 18, top - 2);
      if (v.chance(0.5)) P.satelliteDish(r, x + w / 2, top - 5);
    }
    const sh = pick(v, SHUTTERS);
    const cols = Math.max(2, Math.floor((w - 6) / 10));
    for (let f = 1; f < floors; f++) {
      const fy = base - (f + 1) * fh + 2;
      for (let c = 0; c < cols; c++) {
        const wx = x + 5 + Math.round(((w - 10) / cols) * c);
        const lit = night && v.chance(0.55);
        r.rect(wx, fy, 5, 8, lit ? hex("#f8d890") : darker(fc, 0.45));
        if (lit) r.glow(wx, fy, 5, 8);
        else r.set(wx + 1, fy + 1, lighter(darker(fc, 0.45), 0.25));
        if (old) { r.vline(wx - 2, fy, 8, sh); r.vline(wx - 1, fy, 8, darker(sh, 0.15)); r.vline(wx + 5, fy, 8, sh); r.vline(wx + 6, fy, 8, darker(sh, 0.2)); }
        else r.rect(wx - 1, fy - 1, 7, 1, lighter(fc, 0.2));
        r.hline(wx - 1, fy + 8, 7, lighter(fc, 0.15));
      }
      if (v.chance(0.35)) {
        r.hline(x + 2, fy + 9, w - 4, darker(fc, 0.5));
        for (let bx = x + 2; bx < x + w - 2; bx += 2) r.vline(bx, fy + 6, 3, darker(fc, 0.45));
        if (v.chance(0.5)) P.laundryLine(r, x + 3, x + w - 3, fy + 2, H(["#e8e4dc", "#c84a3a", "#3a6ab0", "#f0c040"]));
        else if (v.chance(0.5)) P.plantPot(r, x + 4, fy + 9, hex("#b8674a"), hex("#4a7a3a"), "flower", hex("#e83a5a"));
      }
      if (!old && v.chance(0.3)) P.box(r, x + w - 9, fy + 3, 6, 4, hex("#e8e8e4"), false);
    }
    // zemin kat: dükkân ya da kapı
    const gy = base - fh;
    if (v.chance(0.55)) {
      r.rect(x + 3, gy + 3, w - 6, fh - 3, night ? hex("#e8c888") : hex("#5a6a74"));
      if (night) r.glow(x + 3, gy + 3, w - 6, fh - 3);
      else r.dither(x + 3, gy + 3, w - 6, fh - 3, hex("#8aa0aa"), 0.3);
      const aw = garment(pick(v, H(["#b83a2a", "#2a6a4a", "#2a4a7a", "#c8a030"])), hex("#f0ece0"), "stripesV");
      P.clothRect(r, x + 1, gy, w - 2, 3, aw, false);
      for (let i = x + 1; i < x + w - 1; i += 2) r.set(i, gy + 3, aw.c1);
      if (night) lights.push({ x: x + w / 2, y: base + 2, radius: 26, color: LAMP_WARM, strength: 0.6, squashY: 0.5 });
    } else {
      const dx = x + Math.floor(w / 2) - 4;
      P.door(r, dx, base, 9, 12, pick(v, H(["#5a3a24", "#3a4a5a", "#6a2a2a", "#2a4a3a"])), null);
      r.rect(dx - 2, base, 13, 1, darker(pave, 0.25));
      doors.push(dx + 4);
    }
    x += w;
  }
  if (doors.length === 0) doors.push(60);

  if (square) {
    // çimen yatakları, ağaçlar, bank: mahalle meydanı
    const grass = s.season === "summer" ? hex("#8a9a4a") : s.season === "winter" ? hex("#6a7a4a") : hex("#5a8a3a");
    for (const gx of [8, 92]) {
      r.rect(gx, 100, 60, 8, grass); r.dither(gx, 100, 60, 8, lighter(grass, 0.15), 0.25);
      r.hline(gx, 99, 60, hex("#d8d0c0")); r.hline(gx, 108, 60, hex("#a8a094"));
      if (s.season === "spring" || s.season === "summer") for (let k = 0; k < 8; k++) r.set(gx + 4 + k * 7, 102 + (k % 3), pick(v, H(["#e83a3a", "#f0d040", "#f0f0f0", "#e87ab0"])));
    }
    P.tree(r, 30, 104, s.season === "winter" ? "bare" : "cypress", hex("#3a5a3a"), hex("#5a4a3a"), 0.9);
    P.tree(r, 126, 104, s.season === "winter" ? "bare" : "olive", hex("#6a8a5a"), hex("#6a5a4a"), 1.2);
  }

  // 3) EŞYA: ağaç, lamba, araç
  const treeX = v.int(10, 140);
  const foliage = s.season === "autumn" ? hex("#c88a3a") : s.season === "summer" ? hex("#4a7a3a") : hex("#5a8a44");
  r.rect(treeX - 3, base + 6, 9, 2, darker(pave, 0.3));
  if (s.season === "winter") P.tree(r, treeX, base + 6, "bare", 0, hex("#6a5444"), 1.3);
  else P.tree(r, treeX, base + 6, "plane", foliage, hex("#8a7a64"), 1.2, s.season === "spring" && v.chance(0.4) ? hex("#f0c8d8") : null);
  const lampX = (treeX + 60 + v.int(0, 30)) % 150 + 4;
  const lamp = P.streetLamp(r, lampX, base + 8, night || s.timeOfDay === "dusk");
  if (night || s.timeOfDay === "dusk") lights.push({ x: lamp.x, y: lamp.y, radius: 46, color: hex("#ffe0a0"), strength: 0.9 });
  if (hasRoad) {
    if (v.chance(0.8)) P.car(r, v.int(0, 120), 118, pick(v, CARS), s.year - v.int(0, 15));
    if (v.chance(0.4)) P.motorbike(r, v.int(0, 140), 112, pick(v, CARS));
  }
  if (v.chance(0.7)) P.cat(r, doors[0] + 6, base + 3, pick(v, H(["#d08a3a", "#5a5a5a", "#e8e0d0", "#3a3030"])), true);

  // insanlar için yerler
  const pFront = hasRoad ? 102 : 110;
  if (activity === "doorstep") {
    // Y1: kenara yakın kapı seçilmez; sandalyeler (kapı -10/+12) sahne içinde kalmalı
    const d = doors.find((x) => x >= 30 && x <= 128) ?? 30 + v.int(0, 98);
    for (const dx of [-10, 12]) { P.chair(r, d + dx - 4, base + 8, pick(v, H(["#8a5a34", "#e8e4dc", "#3a6a8a"])), v.chance(0.4)); slots.push({ x: d + dx, y: base + 8, kind: "seat", prio: 3, hold: v.chance(0.6) ? "glass" : "none" }); }
    slots.push({ x: d + 28, y: pFront, kind: "play", prio: 1.5 }, { x: d - 26, y: pFront - 2, kind: "stand", prio: 1 }, { x: d + 44, y: pFront, kind: "play", prio: 1 });
  } else if (activity === "market") {
    const stX = v.int(20, 100);
    P.stall(r, stX, base + 10, hex("#8a6a4a"), garment(hex("#e8e0d0"), hex("#b83a2a"), "stripesV"), H(["#e04a2a", "#f0b030", "#6ab04a", "#8a3a8a", "#f08a2a"]));
    slots.push({ x: stX + 13, y: base + 2, kind: "extra", prio: 0 });
    slots.push({ x: stX + 6, y: pFront, kind: "stand", prio: 3, hold: "bag" }, { x: stX + 22, y: pFront + 1, kind: "stand", prio: 2 }, { x: stX + 36, y: pFront - 1, kind: "stand", prio: 1.5 }, { x: stX - 10, y: pFront, kind: "stand", prio: 1 });
  } else if (activity === "play") {
    const bx = v.int(50, 110);
    P.ball(r, bx, pFront);
    slots.push({ x: bx - 14, y: pFront, kind: "play", prio: 3 }, { x: bx + 14, y: pFront - 1, kind: "play", prio: 2.5 }, { x: bx + 30, y: pFront - 3, kind: "play", prio: 2 });
    P.bench(r, 12, base + 9, 22, hex("#6a5a4a"));
    slots.push({ x: 18, y: base + 9, kind: "seat", prio: 1.5 }, { x: 28, y: base + 9, kind: "seat", prio: 1.4 }, { x: 140, y: pFront - 2, kind: "stand", prio: 1 });
  } else {
    const cx0 = v.int(40, 90);
    [0, 12, 24, -12, 36].forEach((dx, i) => slots.push({ x: cx0 + dx, y: pFront - (i % 2), kind: "stand", prio: 3 - i * 0.4, hold: i === 1 && v.chance(0.3) ? "bag" : "none" }));
  }
  for (let i = 0; i < 3; i++) slots.push({ x: v.int(6, 154), y: base + 4 + v.int(0, 3), kind: "extra", prio: 0 });

  return { slots, lights, windows: [], openGround: { x: 0, y: base, w: 160, h: 36 }, petSpot: { x: v.int(10, 140), y: pFront + 2 } };
}

// ======================================================================= KÖY / KASABA

function village(ctx: BuildCtx, activity: Activity): SceneBuild {
  const { r, state: s, plan, home, v } = ctx;
  const night = s.timeOfDay === "night";
  const slots: Slot[] = [];
  const lights: LightSource[] = [];
  const horizon = 70;

  // 1) ZEMİN: gökyüzü, tepeler, deniz, toprak
  drawSky(r, { x: 0, y: 0, w: 160, h: horizon }, s.timeOfDay, plan.weather, plan.variant);
  const coast = home.chance(0.45);
  hills(r, horizon - 22, 16, farColor(hex("#7a8a7a"), s.timeOfDay, plan.weather), plan.homeSeed % 7, 1.2);
  if (coast) seaStrip(r, horizon - 8, 8, farColor(hex("#3a7aa0"), s.timeOfDay, plan.weather), s.timeOfDay);
  else hills(r, horizon - 12, 12, farColor(hex("#6a8050"), s.timeOfDay, plan.weather), plan.homeSeed % 5 + 3, 0.8);
  const snow = plan.weather === "snow";
  const groundC = snow ? hex("#e6eaf0") : s.season === "summer" ? hex("#c8a868") : s.season === "autumn" ? hex("#a88a58") : s.season === "winter" ? hex("#8a8a5a") : hex("#8aa858");
  for (let y = horizon; y < 120; y++) for (let x = 0; x < 160; x++) {
    const n = ((x * 13 + y * 7) ^ (x * y)) % 17;
    r.set(x, y, n === 0 ? darker(groundC, snow ? 0.08 : 0.15) : n === 1 ? lighter(groundC, 0.1) : groundC);
  }
  // patika
  for (let y = 92; y < 120; y++) { const w = 10 + (y - 92); const cx = 96 + Math.round((y - 92) * 0.5); r.rect(cx - w / 2, y, w, 1, mix(hex("#c8b494"), groundC, snow ? 0.7 : 0.3)); }

  // 2) BİNA: taş ya da badanalı ev, kiremit çatı
  const stone = home.chance(0.5);
  const hx = home.int(14, 40), hw = 64, hTop = 52, hb = 88;
  const wallC = stone ? hex("#c4b49a") : hex("#f0ece2");
  r.rect(hx, hTop, hw, hb - hTop, wallC);
  for (let y = hTop; y < hb; y++) for (let x = hx; x < hx + hw; x++) {
    if (stone) { const row = Math.floor(y / 5), o = row % 2 ? 4 : 0; if (y % 5 === 0 || (x + o) % 9 === 0) r.set(x, y, darker(wallC, 0.18)); }
    else if (((x * 7 + y * 3) % 23) === 0) r.set(x, y, darker(wallC, 0.05));
  }
  if (!stone && home.chance(0.6)) r.rect(hx, hb - 5, hw, 5, hex("#5f86a6"));
  r.vline(hx + hw - 1, hTop, hb - hTop, darker(wallC, 0.2));
  for (let j = 0; j < 9; j++) { const ind = (8 - j) * 2; r.hline(hx - 4 + ind, hTop - 9 + j, hw + 8 - ind * 2, j % 2 ? hex("#a8503a") : hex("#b8603a")); }
  r.hline(hx - 4, hTop, hw + 8, hex("#7a3a2a"));
  if (snow) for (let j = 0; j < 4; j++) { const ind = (8 - j) * 2; r.hline(hx - 4 + ind, hTop - 9 + j, hw + 8 - ind * 2, j === 3 ? hex("#cfd6e0") : hex("#eef2f6")); }
  const sh = pick(home, SHUTTERS);
  const dX = hx + home.int(8, 40);
  P.door(r, dX, hb, 11, 18, darker(sh, 0.1), null);
  const winX = dX > hx + 30 ? hx + 8 : hx + hw - 20;
  const lit = night;
  r.rect(winX, hTop + 10, 10, 10, lit ? hex("#f8d890") : hex("#2a3440"));
  if (lit) { r.glow(winX, hTop + 10, 10, 10); lights.push({ x: winX + 5, y: hb + 4, radius: 34, color: LAMP_WARM, strength: 0.7 }); }
  r.vline(winX + 5, hTop + 10, 10, darker(sh, 0.3));
  P.box(r, winX - 5, hTop + 10, 4, 10, sh, false); P.box(r, winX + 11, hTop + 10, 4, 10, sh, false);
  P.plantPot(r, winX + 2, hTop + 21, hex("#b8b8b0"), hex("#4a7a3a"), "flower", hex("#e03a3a"));
  if (home.chance(0.5)) P.solarHeater(r, hx + hw - 20, hTop - 6);
  // asma / sundurma
  if (s.season !== "winter" && v.chance(0.5)) { r.hline(dX - 8, hTop + 4, 28, hex("#6a4a30")); r.dither(dX - 8, hTop - 1, 28, 6, s.season === "autumn" ? hex("#b88a3a") : hex("#4a7a34"), 0.6); }
  // alçak taş duvar
  for (let x = 0; x < 160; x++) if (x < hx - 4 || x > hx + hw + 4) { r.rect(x, hb - 7, 1, 7, (x % 6 === 0) ? darker(hex("#b8a888"), 0.2) : hex("#b8a888")); }
  r.hline(0, hb - 8, hx - 4, hex("#c8b898")); r.hline(hx + hw + 5, hb - 8, 160, hex("#c8b898"));

  // 3) EŞYA: zeytin ağacı, tavuklar, ip
  const tx = hx + hw + 18 + v.int(0, 20);
  const leaf = s.season === "winter" ? hex("#5a7050") : hex("#6a8a5a");
  P.tree(r, Math.min(150, tx), hb + 4, "olive", leaf, hex("#6a5a4a"), 1.1);
  if (s.season === "summer" && v.chance(0.6)) P.laundryLine(r, hx + hw + 2, Math.min(158, tx - 4), hTop + 14, H(["#f0ece4", "#3a6ab0", "#e8c040", "#c84a3a"]));
  if (v.chance(0.7)) for (let i = 0; i < v.int(2, 4); i++) P.chicken(r, v.int(4, 150), v.int(100, 118), pick(v, H(["#e8e0d0", "#a8603a", "#3a2a2a"])));
  if (v.chance(0.4)) P.cat(r, dX + 14, hb + 1, pick(v, H(["#d08a3a", "#5a5a5a"])), true);

  const pFront = 108;
  if (activity === "doorstep" || activity === "rest") {
    P.bench(r, dX + 14, hb + 4, 22, hex("#6a4a30"));
    slots.push({ x: dX + 19, y: hb + 4, kind: "seat", prio: 3, hold: v.chance(0.5) ? "glass" : "none" }, { x: dX + 30, y: hb + 4, kind: "seat", prio: 2.8 });
    slots.push({ x: dX - 6, y: hb + 3, kind: "stand", prio: 1.5 }, { x: 60, y: pFront, kind: "play", prio: 1.2 }, { x: 120, y: pFront + 4, kind: "play", prio: 1 });
  } else if (activity === "market") {
    const stX = v.int(10, 90);
    P.stall(r, stX, 104, hex("#8a6a4a"), garment(hex("#e8e0d0"), hex("#3a6a4a"), "stripesV"), H(["#e04a2a", "#6ab04a", "#f0b030", "#5a3a8a"]));
    slots.push({ x: stX + 13, y: 96, kind: "extra", prio: 0 }, { x: stX + 6, y: pFront + 4, kind: "stand", prio: 3, hold: "bag" }, { x: stX + 22, y: pFront + 5, kind: "stand", prio: 2 }, { x: stX + 36, y: pFront + 3, kind: "stand", prio: 1 });
  } else if (activity === "play") {
    const bx = v.int(50, 110);
    P.ball(r, bx, pFront + 2);
    slots.push({ x: bx - 14, y: pFront + 2, kind: "play", prio: 3 }, { x: bx + 12, y: pFront, kind: "play", prio: 2.5 }, { x: bx + 26, y: pFront + 6, kind: "play", prio: 2 }, { x: dX + 4, y: hb + 3, kind: "stand", prio: 1.5 });
  } else {
    const cx0 = 70 + v.int(0, 30);
    [0, 12, -12, 24, -24].forEach((dx, i) => slots.push({ x: cx0 + dx, y: pFront + (i % 2), kind: "stand", prio: 3 - i * 0.4 }));
  }
  slots.push({ x: v.int(110, 150), y: 92, kind: "extra", prio: 0 });
  return { slots, lights, windows: [], openGround: { x: 0, y: horizon, w: 160, h: 50 }, petSpot: { x: v.int(10, 140), y: 116 } };
}
