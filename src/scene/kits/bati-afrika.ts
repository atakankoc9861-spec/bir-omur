// Bölge kiti: Batı Afrika (ör. Nijerya, Gana, Senegal, Fildişi Sahili, Mali, Burkina Faso).
// Mimari: boyalı beton blok ev + oluklu sac çatı + avlu duvarı (şehir); kerpiç (banco) ev,
// saman çatılı yuvarlak ambar, örme çit (köy). Gelir arttıkça iki katlı, balkonlu, kapılı ev.
// Yağmur mevsimi (yaz) ve harmattan pusu (kış) iklim olarak işlenir; kar yok.
import { Rng } from "../../engine/rng";
import { type RGB, darker, lighter, mix, desat, hex } from "../color";
import { LAMP_WARM, SCREEN_GLOW, FIRE, SKIN, hash } from "../palette";
import type { Garment, Look, HairStyle, Headwear, Facial, BottomKind, Pattern } from "../people";
import * as P from "../props";
import type { LightSource } from "../light";
import type { Activity, Place, SceneState } from "../types";
import {
  type BuildCtx, type Household, type LookInput, type RegionKit, type SceneBuild, type Slot,
  H, agedHair, drawSky, farColor, garment, inSchoolClothes, pick, seatSlots, settingsFor, skinFor, windowView,
} from "./common";

const HAIR = H(["#141010", "#1e1612", "#2a1e18"]);
const BRAID_EXT = H(["#141010", "#3a2218", "#5a2a24", "#6a3a20"]);

// Balmumu baskı (wax print) renkleri: canlı ama doygunluğu biraz kırılmış.
const WAX = H(["#2c3e8f", "#e0742a", "#f0c030", "#1f8a5b", "#b8337a", "#1a8a9a", "#c8302a", "#6a3a8a", "#e8a020", "#2a6a3a"]);
const TOPS = H(["#e8e4dc", "#3a5a9a", "#c8302a", "#2a7a5a", "#f0c030", "#5a5a62", "#8ab0d0", "#a84a6a", "#e88a3a"]);
const KID = H(["#e0402a", "#2a7ad0", "#f0c020", "#3aa860", "#e86aa0", "#8a5ad0", "#20b0b0"]);
const BABY = H(["#f4e8c8", "#c8dcf0", "#f8d0d8", "#d0ecd8", "#f8ecb0"]);
const BOTTOMS = H(["#2a3448", "#3a4a6a", "#4a4440", "#8a7a60", "#1e1e22", "#e8e4dc"]);
const ROBES = H(["#e8e4dc", "#8ab0d0", "#c8b890", "#3a5a8a", "#5a7a5a", "#d8c8e0", "#7a3a3a"]);
const SHOES = H(["#2a2220", "#4a3020", "#e8e4dc", "#c83a2a"]);

const WALLS_URBAN = H(["#cfe3c8", "#bcd8e8", "#efe2c4", "#d8cce0", "#f0d4b8", "#e8e8dc", "#f4e4a8"]);
const LOWER_URBAN = H(["#5a8a6a", "#3a6a9a", "#a87a4a", "#7a5a8a", "#c86a4a"]);
const MUD = H(["#b97a4e", "#a8683e", "#c08a5a", "#9a6038"]);
const CHAIRS = H(["#ece8e0", "#3a6ab0", "#c03a2a", "#2a8a4a"]);
const SOFAS = H(["#6a3a2a", "#3a3a4a", "#8a5a3a", "#5a2a3a", "#2a4a5a"]);
const FACADES = H(["#efe2c4", "#cfe3c8", "#bcd8e8", "#f0d4b8", "#e8e8dc", "#f4e4a8", "#e8c8d0", "#d8e0a8"]);

function wax(rng: Rng): Garment {
  const a = pick(rng, WAX);
  let b = pick(rng, WAX);
  if (b === a) b = hex("#f4ecd8");
  return garment(a, b, pick(rng, ["wax", "zigzag", "dots", "stripesV", "wax"] as Pattern[]));
}

const fade = (g: Garment, q: number): Garment => (q <= 1 ? { ...g, c1: desat(g.c1, 0.18), c2: desat(g.c2, 0.18) } : g);

export const batiAfrika: RegionKit = {
  id: "bati-afrika",
  nameTr: "Batı Afrika",

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
    const grown = stage === "teen" || stage === "adult" || stage === "elder";
    const hairBase = pick(id, HAIR);
    let hair = agedHair(hairBase, age, id);

    let hairStyle: HairStyle = "cropped";
    if (stage === "toddler") hairStyle = fem ? pick(stageRng, ["puffs", "cropped", "braids"] as HairStyle[]) : "cropped";
    else if (stage === "child" || stage === "preteen") hairStyle = fem ? pick(stageRng, ["braids", "puffs", "cropped", "braids"] as HairStyle[]) : "cropped";
    else if (stage === "teen" || stage === "adult") hairStyle = fem ? pick(stageRng, ["braids", "braids", "coily", "bun", "long"] as HairStyle[]) : pick(stageRng, ["cropped", "cropped", "coily"] as HairStyle[]);
    else if (stage === "elder") hairStyle = fem ? pick(stageRng, ["cropped", "coily"] as HairStyle[]) : stageRng.chance(0.3) ? "balding" : "cropped";
    if (hairStyle === "braids" && grown && stage !== "elder" && id.chance(0.4)) hair = pick(id, BRAID_EXT);

    const fr = id.next();
    const facial: Facial = fem || !grown || stage === "teen" ? "none" : fr < 0.25 ? "beard" : fr < 0.35 ? "mustache" : fr < 0.5 ? "stubble" : "none";

    const trad = hh.traditional * 0.6 + o.next() * 0.4;
    let headwear: Headwear = "none";
    if (fem && (stage === "adult" || stage === "elder")) {
      if (stageRng.next() < hh.headCover * 0.6) headwear = "scarf";
      else if (o.next() < 0.25 + trad * 0.4) headwear = trad > 0.75 && o.chance(0.5) ? "gele" : "wrap";
    } else if (!fem && grown && stage !== "teen" && o.chance(0.15 + trad * 0.4)) headwear = "kufi";
    const headCloth = headwear === "kufi" ? garment(pick(o, H(["#e8e4dc", "#3a3a5a", "#7a2a3a", "#c8b890"])), pick(o, WAX), "embroidered") : fade(wax(o), q);

    let top: Garment, bottom: Garment, bottomKind: BottomKind = "trousers";
    let sleeves: "short" | "long" = plan.weather === "haze" && s.timeOfDay !== "day" ? "long" : o.chance(0.25) ? "long" : "short";
    let outer: Garment | null = null;
    if (stage === "baby" || stage === "toddler") {
      top = garment(pick(o, BABY), pick(o, KID), o.chance(0.4) ? "dots" : "solid");
      bottom = top;
      if (stage === "toddler" && fem && o.chance(0.5)) bottomKind = "dress";
    } else if (inSchoolClothes(age, s, plan)) {
      const uni = pick(new Rng(plan.homeSeed), [[hex("#e8e4d4"), hex("#8a7a50")], [hex("#d8e4f0"), hex("#2a3a6a")], [hex("#f0e8c8"), hex("#2a6a3a")], [hex("#e8d8a8"), hex("#6a5030")]] as [RGB, RGB][]);
      top = garment(uni[0], uni[0]); bottom = garment(uni[1], uni[1]);
      bottomKind = fem ? "skirt" : age < 12 ? "shorts" : "trousers";
      if (fem && age < 12 && o.chance(0.5)) { bottomKind = "dress"; bottom = garment(uni[1], uni[1]); }
    } else if (!grown) {
      top = garment(pick(o, KID), pick(o, TOPS), pick(o, ["solid", "stripesH", "solid"] as Pattern[]));
      bottom = garment(pick(o, BOTTOMS), hex("#e8e4dc"));
      if (fem && o.chance(0.5)) { bottomKind = "dress"; bottom = o.chance(0.5) ? wax(o) : garment(pick(o, KID), pick(o, KID), "dots"); }
      else bottomKind = o.chance(0.6) ? "shorts" : "trousers";
    } else if (fem) {
      const r = o.next();
      if (r < 0.35 + trad * 0.4) {
        // Takım: aynı kumaştan üst ve uzun etek (wrapper)
        const w = wax(o);
        top = w; bottom = w; bottomKind = "dress";
      } else if (r < 0.8) {
        top = o.chance(0.5) ? wax(o) : garment(pick(o, TOPS), pick(o, WAX));
        bottom = wax(o); bottomKind = "skirt";
      } else {
        top = garment(pick(o, TOPS), pick(o, WAX), o.chance(0.3) ? "stripesH" : "solid");
        bottom = garment(pick(o, BOTTOMS), hex("#e8e4dc")); bottomKind = "trousers";
      }
    } else {
      const r = o.next();
      if (r < 0.2 + trad * 0.45) {
        // Boubou / kaftan: uzun üst
        const c = pick(o, ROBES);
        top = garment(c, darker(c, 0.25), "embroidered"); bottom = top; bottomKind = "robe";
        sleeves = "long";
      } else if (r < 0.45 + trad * 0.3) {
        const w = wax(o); top = w; bottom = garment(pick(o, BOTTOMS), hex("#e8e4dc"));
      } else {
        top = garment(pick(o, TOPS), pick(o, WAX), pick(o, ["solid", "check", "stripesV", "solid"] as Pattern[]));
        bottom = garment(pick(o, BOTTOMS), hex("#e8e4dc"));
        if (stage === "adult" && q >= 4 && o.chance(0.2)) outer = garment(hex("#2a3048"), hex("#2a3048"));
      }
    }
    if (plan.weather === "haze" && grown && o.chance(0.3)) outer = garment(pick(o, H(["#5a4a3a", "#3a4a5a", "#6a2a2a"])), hex("#3a3a3a"));

    return {
      skin, hair, hairStyle, facial, headwear, headCloth,
      top: fade(top, q), sleeves, outer, bottomKind, bottom: fade(bottom, q),
      shoes: pick(o, SHOES),
      glasses: (age > 50 && id.chance(0.3)) || (age > 9 && age < 50 && id.chance(0.06)),
      earrings: fem && headwear !== "scarf" && (grown || stage === "preteen") && id.chance(0.6) ? hex("#e0c060") : null,
    };
  },

  weatherWeights(season) {
    // yaz = yağmur mevsimi, kış = harmattan (kuru, tozlu), ilkbahar = sıcak kurak, sonbahar = yağmur sonrası
    switch (season) {
      case "summer": return { rain: 5, cloudy: 3, clear: 2 };
      case "winter": return { haze: 6, clear: 3 };
      case "spring": return { clear: 7, haze: 1.5, cloudy: 1 };
      case "autumn": return { clear: 5, cloudy: 2, rain: 2 };
    }
  },

  activities(place: Place, s: SceneState): Activity[] {
    if (place === "home") return ["rest", "meal", "chores"];
    const a: Activity[] = ["walk", "doorstep", "market"];
    if (s.age < 15 || s.family.some((m) => m.alive && m.age < 14 && m.role !== "pet")) a.push("play");
    return a;
  },

  petColor(rng) {
    return rng.chance(0.55)
      ? { kind: "dog", color: pick(rng, H(["#c8a070", "#e8dcc0", "#8a6a4a", "#2a2a2a"])) }
      : { kind: "cat", color: pick(rng, H(["#d08a3a", "#5a5a5a", "#e8e0d0"])) };
  },

  build(ctx: BuildCtx, place: Place, activity: Activity): SceneBuild {
    if (place === "home") return interior(ctx, activity);
    return ctx.state.urban ? street(ctx, activity) : compound(ctx, activity);
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
  const set = settingsFor(s);
  const mudHouse = rural && q <= set.ruralMudHouseMaxIncome;
  const electric = !rural || q >= 3 || home.chance(set.ruralLowIncomeElectricity);

  const wallC = mudHouse ? pick(home, MUD) : pick(home, WALLS_URBAN);
  const lower = mudHouse ? (home.chance(0.5) ? darker(wallC, 0.15) : null) : home.chance(0.6) ? pick(home, LOWER_URBAN) : null;
  const floorKind: P.FloorKind = mudHouse ? (q >= 2 && home.chance(0.5) ? "concrete" : "earth") : q >= 4 ? pick(home, ["tile", "terrazzo"] as P.FloorKind[]) : q === 3 ? pick(home, ["tile", "concrete"] as P.FloorKind[]) : "concrete";
  const floorCols: Record<P.FloorKind, [RGB, RGB]> = {
    earth: [hex("#9a6a44"), hex("#8a5a38")], concrete: [hex("#8e8a84"), hex("#7a766e")],
    tile: pick(home, [[hex("#d8d4cc"), hex("#b8b0a4")], [hex("#c8b8a0"), hex("#a89878")], [hex("#e0dcd4"), hex("#8a9aa8")]] as [RGB, RGB][]),
    terrazzo: [hex("#d0c8b8"), hex("#8a8478")], wood: [hex("#a8784a"), hex("#8a5a34")],
  };
  const wood = pick(home, H(["#7a5030", "#5a3a24", "#9a6a40"]));
  const fabric = wax(home);
  const homeSeed = plan.homeSeed;

  // 1) ZEMİN
  P.floorFill(r, 80, floorKind, floorCols[floorKind][0], floorCols[floorKind][1], homeSeed);
  // 2) BİNA
  P.wallFill(r, 0, 80, mudHouse ? "mud" : "paint", wallC, lower, homeSeed);
  if (mudHouse) {
    // çatı kirişleri ve sac/saman tavan
    r.rect(0, 0, 160, 5, home.chance(0.5) ? hex("#8a8a88") : hex("#b89a5a"));
    for (let x = 0; x < 160; x += 8) r.vline(x, 0, 5, darker(r.get(x, 1), 0.2));
    r.hline(0, 5, 160, hex("#4a3020"));
  } else r.hline(0, 3, 160, darker(wallC, 0.1));
  r.rect(0, 77, 160, 3, darker(lower ?? wallC, 0.3));

  // 3) EŞYA
  type Zone = "window" | "seating" | "media";
  const order: Zone[] = (["window", "seating", "media"] as Zone[]).sort(() => v.next() - 0.5);
  const zx = [4, 56, 108];
  const zoneX = (z: Zone) => zx[order.indexOf(z)];

  // pencere (köyde küçük, metal kanatlı; şehirde demir parmaklıklı ve perdeli)
  const wx = zoneX("window") + v.int(4, 10), wy = mudHouse ? 22 : 16;
  const ww = mudHouse ? 20 : q >= 4 ? 34 : 28, wh = mudHouse ? 20 : q >= 4 ? 36 : 28;
  const view = (rc: P.Rect) => windowView(r, rc, s, plan.weather, homeSeed, (rc2) => {
    const fc = farColor(hex("#4a6a3a"), s.timeOfDay, plan.weather);
    if (rural) {
      r.rect(rc2.x, rc2.y + rc2.h - 5, rc2.w, 5, farColor(hex("#a8704a"), s.timeOfDay, plan.weather));
      r.ellipse(rc2.x + rc2.w - 6, rc2.y + rc2.h - 7, 5, 2, fc);
      r.vline(rc2.x + rc2.w - 6, rc2.y + rc2.h - 5, 1, darker(fc, 0.3));
    } else {
      const bc = farColor(pick(new Rng(homeSeed), FACADES), s.timeOfDay, plan.weather);
      r.rect(rc2.x, rc2.y + rc2.h - 12, rc2.w, 12, bc);
      for (let x = rc2.x; x < rc2.x + rc2.w; x++) r.set(x, rc2.y + rc2.h - 13 - (x % 4 === 0 ? 1 : 0), farColor(hex("#9a9a98"), s.timeOfDay, plan.weather));
      r.line(rc2.x, rc2.y + 6, rc2.x + rc2.w, rc2.y + 9, hex("#2a2a2a"));
      if (night) for (let x = rc2.x + 2; x < rc2.x + rc2.w - 2; x += 6) if (x % 12 < 6) { r.rect(x, rc2.y + rc2.h - 9, 3, 3, hex("#f8d890")); }
    }
  });
  const curtain = mudHouse ? null : garment(pick(home, H(["#e8dcc8", "#c84a4a", "#3a6a9a", "#f0e0a0", "#8a4a8a"])), hex("#f4f0e8"), home.chance(0.5) ? "floral" : "solid");
  P.windowFrame(r, wx, wy, ww, wh, { frame: mudHouse ? hex("#3a5a7a") : hex("#e8e8e4"), curtain, shutters: mudHouse ? hex("#3a6a8a") : null, grille: !mudHouse, arched: false, sill: darker(wallC, 0.1) }, view);
  windows.push({ x: wx + 2, y: wy + 2, w: ww - 4, h: wh - 4 });
  const winLightC = s.timeOfDay === "day" ? hex("#fff0d0") : s.timeOfDay === "night" ? hex("#3a4a80") : hex("#ffb080");
  lights.push({ x: wx + ww / 2, y: wy + wh + 6, radius: 56, color: winLightC, strength: night ? 0.08 : 0.3, squashY: 0.7 });

  // duvar süsleri: aile fotoğrafları (özenle asılmış), takvim, saat
  const sx = zoneX("seating");
  // S1: duvar süsü pencereye (perde/kanat dahil) ve sahne kenarına taşmaz
  const winL = wx - (mudHouse ? 10 : 6), winR = wx + ww + (mudHouse ? 10 : 6);
  const fits = (x: number, w: number) => x >= 2 && x + w <= 158 && (x + w < winL || x > winR);
  let px = sx + 4;
  for (const m of ctx.memorials.slice(0, 2)) { if (fits(px - 1, 8)) P.portrait(r, px, 28, m.skin, m.hair, true); px += 10; }
  for (const m of ctx.household.slice(0, v.int(1, 3))) { if (fits(px - 1, 8)) P.portrait(r, px, 26 + (px % 3), m.skin, m.hair, false); px += 9; }
  if (v.chance(0.6) && fits(px + 4, 7)) P.calendar(r, px + 4, 26, pick(v, H(["#2a6a3a", "#c8302a", "#2a4a8a"])));
  if (v.chance(0.5) && fits(px + 15, 7)) P.wallClock(r, px + 18, 30, hex("#3a3a3a"));

  // eşya bölgesi
  const mx = zoneX("media");
  let screenRc: P.Rect | null = null;
  let fireAt: { x: number; y: number } | null = null;
  if (activity === "chores") {
    if (mudHouse || q <= 2) {
      fireAt = P.coalPot(r, mx + 22, 96, hex("#9aa0a4"));
      P.clayPot(r, mx + 2, 90, hex("#a05a34"));
      P.shelfWithItems(r, mx + 2, 52, 40, wood, H(["#f0c030", "#d03a3a", "#3a7ac0", "#f0f0e8", "#2a8a4a"]), "bowls", v.int(0, 9));
      slots.push({ x: mx + 38, y: 100, kind: "work", prio: 2, hold: "spoon" });
    } else {
      P.kitchenCounter(r, mx - 2, 88, 48, hex("#e8e4dc"), hex("#c8c0b0"), hex("#e8f0f0"));
      P.shelfWithItems(r, mx + 2, 46, 40, wood, H(["#f0c030", "#d03a3a", "#3a7ac0", "#f0f0e8"]), "bowls", v.int(0, 9));
      slots.push({ x: mx + 22, y: 98, kind: "work", prio: 2, hold: "spoon" });
    }
  } else if (q >= 4) {
    P.glassCabinet(r, mx + 2, 88, 22, 42, wood, H(["#f0f0ec", "#e0c060", "#a8c8d8", "#d08aa0"]));
    const top = P.cabinet(r, mx + 26, 88, 20, 10, wood);
    screenRc = P.screen(r, mx + 25, top, P.tvKindFor(s.year), wood, night || v.chance(0.4), false);
    P.acUnit(r, mx + 14, 10);
  } else if (mudHouse && q <= 1) {
    P.clayPot(r, mx + 4, 90, hex("#a05a34"));
    P.shelfWithItems(r, mx + 2, 50, 42, wood, H(["#f0c030", "#d03a3a", "#3a7ac0", "#f0f0e8", "#2a8a4a"]), "bowls", v.int(0, 9));
    P.screen(r, mx + 22, 50 - 3, "radio", wood, false, false);
    P.stool(r, mx + 26, 90, wood);
  } else {
    const top = P.cabinet(r, mx + 2, 88, 40, 12, wood);
    if (electric) screenRc = P.screen(r, mx + 9, top, P.tvKindFor(s.year), wood, night || v.chance(0.35), false);
    else P.screen(r, mx + 14, top, "radio", wood, false, false);
    r.rect(mx + 4, top - 1, 36, 1, hex("#f4f0e8")); // örtü
    P.clayPot(r, mx + 32, top, hex("#a05a34"));
  }
  if (screenRc && night) lights.push({ x: screenRc.x + screenRc.w / 2, y: screenRc.y + 6, radius: 34, color: SCREEN_GLOW, strength: 0.45 });
  if (fireAt) lights.push({ x: fireAt.x, y: fireAt.y, radius: 36, color: FIRE, strength: 0.6 });
  if (!rural && q >= 2 && q <= 3) P.standingFan(r, (mx + 48) % 150, 90);
  if (!rural && q >= 2 && q <= 3) P.ceilingFan(r, 80, 10); // varlıklı evde klima var

  // oturma
  const plastic = q <= 3 && v.chance(0.7);
  if (activity === "meal") {
    if (q <= 2 || (rural && v.chance(0.6))) {
      // ortak kaptan yemek: hasır üzerinde, etrafında oturulur
      P.wovenMat(r, 30, 96, 100, 18, hex("#c8a868"), pick(home, H(["#b83a2a", "#2a6a4a", "#3a4a8a"])));
      P.stool(r, sx + 8, 88, wood);
      for (const x of [62, 80, 98]) slots.push({ x, y: 101, kind: "floor", prio: 3 - Math.abs(x - 80) / 20 });
      slots.push({ x: 42, y: 110, kind: "floor", prio: 1.5 }, { x: 118, y: 110, kind: "floor", prio: 1.4 }, { x: sx + 12, y: 88, kind: "seat", prio: 1 });
      return finish(() => { P.sharedBowl(r, 80, 108, hex("#e8e4dc"), hex("#e0a030")); P.sharedBowl(r, 98, 110, hex("#f0c030"), hex("#7a5a2a")); r.rect(60, 108, 4, 2, hex("#e8dcc0")); });
    }
    for (const x of [64, 80, 96]) P.chair(r, x - 4, 104, plastic ? pick(home, CHAIRS) : wood, plastic);
    for (const x of [64, 80, 96]) slots.push({ x, y: 104, kind: "seat", prio: 3 - Math.abs(x - 80) / 20 });
    slots.push({ x: 120, y: 108, kind: "stand", prio: 1.2 }, { x: 40, y: 110, kind: "stand", prio: 1 });
    return finish(() => {
      const t = P.table(r, 54, 112, 52, 16, wood, fabric);
      P.sharedBowl(r, 74, t.y - 1, hex("#f0ece4"), hex("#d0702a"));
      P.sharedBowl(r, 90, t.y - 1, hex("#e8e4dc"), hex("#f0f0e0"));
    });
  }

  if (mudHouse && q <= 2) {
    P.wovenMat(r, sx - 4, 88, 56, 10, hex("#c8a868"), fabric.c1);
    P.stool(r, sx + 2, 88, wood); P.stool(r, sx + 38, 88, wood);
    slots.push({ x: sx + 6, y: 88, kind: "seat", prio: 3 }, { x: sx + 42, y: 88, kind: "seat", prio: 2.6 }, { x: sx + 24, y: 94, kind: "floor", prio: 2.4 });
  } else if (q <= 2 || plastic) {
    for (const dx of [0, 14, 28]) P.chair(r, sx + 6 + dx, 90, plastic ? pick(home, CHAIRS) : wood, plastic);
    slots.push(...seatSlots([sx + 10, sx + 24, sx + 38], 90, 3));
  } else {
    const seats = P.sofa(r, sx, 88, 48, pick(home, SOFAS), garment(hex("#f4f0e8"), hex("#e0d8c8"), "dots"), darker(wood, 0.2), true);
    slots.push(...seatSlots(seats, 90, 3));
  }
  if (!mudHouse || q >= 2) P.rug(r, 40, 98, 80, 14, q >= 3 ? wax(home) : garment(hex("#c8a868"), fabric.c1, "stripesH"), darker(fabric.c1, 0.3));
  if (activity === "chores") { P.stool(r, 76, 106, wood); slots.push({ x: 80, y: 106, kind: "study", prio: 2.5, hold: "book" }); }
  for (const [x, y] of [[60, 108], [100, 110], [128, 104], [34, 106]] as [number, number][]) slots.push({ x, y, kind: "play", prio: 1 });
  slots.push({ x: 132, y: 100, kind: "stand", prio: 0.8 }, { x: 28, y: 102, kind: "stand", prio: 0.6 });
  return finish();

  function finish(fg?: () => void): SceneBuild {
    if (electric) {
      const bx = 80 + v.int(-20, 20);
      r.vline(bx, 0, 8, hex("#3a3a3a"));
      r.rect(bx - 1, 8, 3, 3, night ? hex("#f0f8ff") : hex("#e8e4d8"));
      if (night) { r.glow(bx - 1, 8, 3, 3); lights.push({ x: bx, y: 12, radius: 120, color: q >= 3 ? LAMP_WARM : hex("#fff2dc"), strength: 0.72 }); }
    } else {
      // elektrik yoksa: fener ya da güneş enerjili lamba
      const lt = P.lantern(r, zoneX("media") + 40, 92, night || s.timeOfDay === "dusk");
      if (night || s.timeOfDay === "dusk") lights.push({ x: lt.x, y: lt.y, radius: 62, color: LAMP_WARM, strength: 0.9 });
    }
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
  const base = 86;
  const paved = q >= 3 || v.chance(0.4);

  // 1) ZEMİN
  drawSky(r, { x: 0, y: 0, w: 160, h: base }, s.timeOfDay, plan.weather, plan.variant);
  const far = farColor(hex("#5a7a4a"), s.timeOfDay, plan.weather);
  for (let i = 0; i < 6; i++) P.tree(r, 10 + i * 28 + v.int(-6, 6), base - 14, "palm", far, far, 0.6);
  const earth = plan.weather === "rain" ? hex("#9a5a3a") : hex("#b8704a");
  for (let y = base; y < 120; y++) for (let x = 0; x < 160; x++) {
    const n = ((x * 13 + y * 7) ^ (x * y)) % 13;
    r.set(x, y, n === 0 ? darker(earth, 0.12) : n === 1 ? lighter(earth, 0.08) : earth);
  }
  if (paved) {
    // S5: asfalt 104'ten başlar; insan yerleri (en çok 103) yol kenarında kalır
    r.rect(0, 104, 160, 16, hex("#4e4c4c"));
    r.dither(0, 104, 160, 16, hex("#5a5858"), 0.2);
    r.hline(0, 104, 160, hex("#8a8680"));
  }
  // açık kanal (yağmur suyu gideri)
  r.rect(0, 97, 160, 2, hex("#6a6460")); r.hline(0, 99, 160, hex("#4a4440"));

  // 2) BİNA: avlu duvarları, evler, dükkân kulübesi
  let x = -v.int(0, 10);
  const gates: number[] = [];
  while (x < 160) {
    const w = v.int(34, 52);
    const two = q >= 4 ? v.chance(0.7) : v.chance(0.25);
    const fc = pick(v, FACADES);
    const hTop = base - (two ? 40 : 26);
    // ev (avlu duvarının arkasında)
    r.rect(x + 3, hTop, w - 6, base - hTop, fc);
    r.vline(x + w - 4, hTop, base - hTop, darker(fc, 0.2));
    const roofC = q >= 4 && v.chance(0.5) ? hex("#8a3a2a") : v.chance(0.6) ? hex("#a8aaa8") : hex("#a8683a");
    for (let j = 0; j < 5; j++) { const ind = (4 - j) * 2; for (let i = x + ind; i < x + w - ind; i++) r.set(i, hTop - 5 + j, (i % 3 === 0) ? darker(roofC, 0.2) : roofC); }
    const wins = two ? [hTop + 4, hTop + 18] : [hTop + 4];
    for (const wy of wins) for (let wx = x + 7; wx < x + w - 10; wx += 12) {
      const lit = night && v.chance(0.5);
      r.rect(wx, wy, 6, 6, lit ? hex("#f8e0a0") : hex("#3a4450"));
      if (lit) r.glow(wx, wy, 6, 6);
      for (let k = wx + 1; k < wx + 6; k += 2) r.vline(k, wy, 6, hex("#2a2a2a"));
    }
    if (two && v.chance(0.6)) { r.hline(x + 5, hTop + 13, w - 10, hex("#e8e8e4")); for (let i = x + 5; i < x + w - 5; i += 3) r.vline(i, hTop + 11, 2, hex("#e8e8e4")); }
    if (v.chance(0.4)) P.waterTank(r, x + w - 14, hTop - 5, hex("#2a2a2e"));
    if (v.chance(0.3)) P.satelliteDish(r, x + 8, hTop - 3);
    // avlu duvarı + kapı
    const wallC = lighter(pick(v, FACADES), 0.05);
    r.rect(x, base - 14, w, 14, wallC);
    r.hline(x, base - 15, w, darker(wallC, 0.2));
    r.dither(x, base - 4, w, 4, hex("#a8704a"), 0.4); // toprak sıçraması
    const gx = x + Math.floor(w / 2) - 6;
    const gc = pick(v, H(["#2a4a6a", "#6a2a2a", "#2a5a3a", "#3a3a3a"]));
    r.rect(gx, base - 15, 12, 15, gc);
    for (let k = gx + 1; k < gx + 12; k += 2) r.vline(k, base - 14, 13, darker(gc, 0.25));
    r.vline(gx + 6, base - 15, 15, darker(gc, 0.4));
    gates.push(gx + 6);
    x += w;
  }
  // dükkân kulübesi (kiosk)
  const kx = v.int(8, 120);
  const kc = pick(v, H(["#e8c030", "#2a7a4a", "#c83a2a", "#2a5a9a"]));
  P.box(r, kx, base - 22, 22, 22, kc, true);
  r.rect(kx + 2, base - 18, 18, 9, night ? hex("#f0d890") : hex("#3a3430"));
  if (night) { r.glow(kx + 2, base - 18, 18, 9); lights.push({ x: kx + 11, y: base, radius: 30, color: LAMP_WARM, strength: 0.7 }); }
  P.shelfWithItems(r, kx + 3, base - 10, 16, hex("#8a6a4a"), H(["#f0f0e8", "#e04a2a", "#3a7ac0", "#f0c030"]), "jars", v.int(0, 9));
  r.rect(kx - 2, base - 24, 26, 2, darker(kc, 0.3));
  // elektrik direği ve teller
  const poleX = v.int(30, 130);
  P.powerPole(r, poleX, base + 10, poleX < 80 ? 159 : 0);

  // 3) EŞYA
  const leaf = s.season === "spring" ? hex("#5a7a3a") : hex("#3a7a3a");
  const tx = (kx + 50 + v.int(0, 40)) % 150 + 5;
  P.tree(r, tx, base + 8, pick(v, ["mango", "neem"] as P.TreeKind[]), plan.weather === "haze" ? mix(leaf, hex("#a8a070"), 0.3) : leaf, hex("#5a4a3a"), 1.1);
  if (paved && v.chance(0.7)) P.car(r, v.int(0, 120), 120, pick(v, H(["#e8e4dc", "#e8c030", "#2a3a5a", "#9a2a2a", "#4a4a4e"])), s.year - v.int(0, 20));
  if (v.chance(0.7)) P.motorbike(r, v.int(0, 140), 112, pick(v, H(["#c83a2a", "#2a2a2a", "#2a5a9a"])));
  if (!paved && v.chance(0.5)) for (let i = 0; i < 3; i++) P.chicken(r, v.int(4, 150), v.int(104, 118), pick(v, H(["#e8e0d0", "#a8603a", "#3a2a2a"])));
  if (night || s.timeOfDay === "dusk") {
    const lamp = P.streetLamp(r, (poleX + 70) % 150, base + 10, true);
    lights.push({ x: lamp.x, y: lamp.y, radius: 44, color: hex("#fff0c8"), strength: 0.85 });
  }

  const pFront = paved ? 95 : 106;
  if (activity === "doorstep") {
    // Y1: ortaya en yakın kapı; bank (kapı -24) ve sandalye (+13) sahne içinde kalmalı
    const g = Math.max(46, Math.min(128, gates.reduce((a, b) => (Math.abs(b - 80) < Math.abs(a - 80) ? b : a), 80)));
    P.bench(r, g - 24, base + 6, 18, hex("#6a4a30"));
    P.chair(r, g + 9, base + 7, pick(v, CHAIRS), true);
    slots.push({ x: g - 18, y: base + 6, kind: "seat", prio: 3 }, { x: g - 9, y: base + 6, kind: "seat", prio: 2.8 }, { x: g + 13, y: base + 7, kind: "seat", prio: 2.6 });
    slots.push({ x: g + 30, y: pFront + 4, kind: "play", prio: 1.5 }, { x: g - 40, y: pFront + 2, kind: "stand", prio: 1 });
  } else if (activity === "market") {
    const stX = v.int(20, 100);
    P.stall(r, stX, base + 12, hex("#8a6a4a"), garment(pick(v, WAX), hex("#f0ece0"), "stripesV"), H(["#e04a2a", "#f08a2a", "#6ab04a", "#e8d8b0", "#c8302a"]));
    slots.push({ x: stX + 13, y: base + 4, kind: "extra", prio: 0 });
    slots.push({ x: stX + 6, y: pFront + 6, kind: "stand", prio: 3, hold: "bag" }, { x: stX + 22, y: pFront + 7, kind: "stand", prio: 2 }, { x: stX + 36, y: pFront + 5, kind: "stand", prio: 1.5 }, { x: stX - 10, y: pFront + 6, kind: "stand", prio: 1 });
  } else if (activity === "play") {
    const bx = v.int(50, 110);
    P.ball(r, bx, pFront + 6);
    slots.push({ x: bx - 14, y: pFront + 6, kind: "play", prio: 3 }, { x: bx + 14, y: pFront + 5, kind: "play", prio: 2.5 }, { x: bx + 28, y: pFront + 3, kind: "play", prio: 2 }, { x: 16, y: base + 6, kind: "stand", prio: 1.2 });
  } else {
    const cx0 = v.int(40, 90);
    [0, 12, 24, -12, 36].forEach((dx, i) => slots.push({ x: cx0 + dx, y: pFront + 6 - (i % 2), kind: "stand", prio: 3 - i * 0.4, hold: i === 0 && v.chance(0.2) ? "phone" : "none" }));
  }
  for (let i = 0; i < 3; i++) slots.push({ x: v.int(6, 154), y: base + 6 + v.int(0, 3), kind: "extra", prio: 0 });
  return { slots, lights, windows: [], openGround: { x: 0, y: base, w: 160, h: 34 }, petSpot: { x: v.int(10, 140), y: 116 } };
}

// ======================================================================= KÖY AVLUSU

function compound(ctx: BuildCtx, activity: Activity): SceneBuild {
  const { r, state: s, plan, home, v } = ctx;
  const q = s.income;
  const night = s.timeOfDay === "night";
  const slots: Slot[] = [];
  const lights: LightSource[] = [];
  const horizon = 66;
  const wet = s.season === "summer" || s.season === "autumn";

  // 1) ZEMİN: geniş ufuk, uzak ağaçlar, laterit toprak
  drawSky(r, { x: 0, y: 0, w: 160, h: horizon }, s.timeOfDay, plan.weather, plan.variant);
  const farT = farColor(wet ? hex("#3a6a3a") : hex("#6a6a3a"), s.timeOfDay, plan.weather);
  r.rect(0, horizon - 3, 160, 3, farT);
  for (let i = 0; i < 7; i++) { const tx = v.int(0, 160); r.ellipse(tx, horizon - 6, v.int(4, 8), 3, farT); r.vline(tx, horizon - 4, 3, darker(farT, 0.2)); }
  const bbx = v.chance(0.5) ? v.int(4, 14) : v.int(146, 156);
  if (v.chance(0.6)) P.tree(r, bbx, horizon, "baobab", farColor(hex("#4a6a3a"), s.timeOfDay, plan.weather), farColor(hex("#8a7a6a"), s.timeOfDay, plan.weather), 0.45);
  const soil = wet ? hex("#a86040") : hex("#c08058");
  for (let y = horizon; y < 120; y++) for (let x = 0; x < 160; x++) {
    const n = ((x * 11 + y * 5) ^ (x * y)) % 15;
    let c = n === 0 ? darker(soil, 0.12) : n === 1 ? lighter(soil, 0.08) : soil;
    if (wet && ((x * 7 + y * 3) % 29) < 2 && y > horizon + 4) c = hex("#5a8a3a");
    r.set(x, y, c);
  }
  // tarla (yağmur mevsiminde yeşil, kurakta saman rengi)
  for (let x = 0; x < 160; x += 2) { const h = wet ? 6 : 3; r.vline(x, horizon - h + 1, h, wet ? hex("#4a7a2a") : hex("#c8a860")); }

  // 2) BİNA: kerpiç ev, yuvarlak ambar, örme çit
  const hx = home.int(10, 36);
  const metal = q >= 2 ? home.chance(0.7) : home.chance(0.35);
  const mud = pick(home, MUD);
  const plastered = q >= 3;
  const wallC = plastered ? pick(home, FACADES) : mud;
  const hTop = 58, hb = 88, hw = 58;
  for (let y = hTop; y < hb; y++) for (let x = hx; x < hx + hw; x++) {
    let c = wallC;
    if (!plastered && ((x >> 2) + (y >> 1)) % 7 === 0) c = darker(c, 0.07);
    r.set(x, y, x === hx + hw - 1 ? darker(c, 0.2) : c);
  }
  r.dither(hx, hb - 4, hw, 4, darker(wallC, 0.2), 0.4);
  if (metal) { for (let j = 0; j < 6; j++) for (let x = hx - 3; x < hx + hw + 3; x++) r.set(x, hTop - 6 + j, x % 3 === 0 ? hex("#8a8c8c") : j < 2 ? hex("#b8baba") : hex("#a2a4a4")); r.hline(hx - 3, hTop, hw + 6, hex("#5a5c5c")); }
  else for (let j = 0; j < 9; j++) { const ind = Math.max(0, 6 - j); for (let x = hx - 4 + ind; x < hx + hw + 4 - ind; x++) r.set(x, hTop - 8 + j, (x + j) % 3 === 0 ? hex("#a8884a") : hex("#c8a860")); }
  const dX = hx + home.int(10, 34);
  P.door(r, dX, hb, 11, 18, hex("#3a4a6a"), q <= 2 ? wax(home) : null);
  const winX = dX > hx + 26 ? hx + 6 : hx + hw - 16;
  const lit = night && q >= 2;
  r.rect(winX, hTop + 8, 9, 8, lit ? hex("#f8d890") : hex("#2a3440"));
  if (lit) { r.glow(winX, hTop + 8, 9, 8); }
  P.box(r, winX - 4, hTop + 8, 3, 8, hex("#3a6a8a"), false);
  if (q >= 3 && home.chance(0.6)) P.solarPanel(r, hx + hw - 16, hTop - 10);
  // yuvarlak ambar / mutfak kulübesi
  const gx = hx + hw + 10 + home.int(0, 14);
  if (gx < 150) {
    r.rect(gx, 70, 18, 18, mud);
    r.vline(gx + 17, 70, 18, darker(mud, 0.2));
    for (let j = 0; j < 12; j++) { const w2 = Math.round(2 + j * 1.3); for (let x = gx + 9 - w2; x <= gx + 9 + w2; x++) r.set(x, 58 + j, (x + j) % 3 === 0 ? hex("#a8884a") : hex("#c8a860")); }
    r.rect(gx + 6, 78, 6, 10, hex("#2a2026"));
  }
  // örme çit (secco)
  const fenceStart = Math.min(158, (gx < 150 ? gx + 20 : hx + hw + 4));
  for (let x = fenceStart; x < 160; x++) { r.vline(x, 76, 12, x % 2 ? hex("#c8a860") : hex("#a8884a")); }
  for (let x = 0; x < hx - 4; x++) { r.vline(x, 76, 12, x % 2 ? hex("#c8a860") : hex("#a8884a")); }
  r.hline(0, 80, hx - 4, hex("#7a5a3a")); r.hline(fenceStart, 80, 160 - fenceStart, hex("#7a5a3a"));

  // 3) EŞYA: gölge ağacı, havan, hayvanlar, ateş
  const tx = home.int(90, 140);
  P.tree(r, tx, 95, pick(home, ["mango", "neem"] as P.TreeKind[]), wet ? hex("#3a7a3a") : hex("#5a7a3a"), hex("#5a4a3a"), 1.2);
  if (v.chance(0.7)) for (let i = 0; i < v.int(2, 5); i++) P.chicken(r, v.int(4, 150), v.int(98, 118), pick(v, H(["#e8e0d0", "#a8603a", "#3a2a2a", "#c87a3a"])));
  if (v.chance(0.5)) P.goat(r, v.int(4, 140), v.int(104, 116), pick(v, H(["#e8e0d0", "#5a4030", "#a8805a", "#2a2a2a"])));
  if (night || s.timeOfDay === "dusk" || activity === "chores") {
    const f = P.coalPot(r, dX - 20 > 4 ? dX - 20 : dX + 20, 100, hex("#3a3a3a"));
    lights.push({ x: f.x, y: f.y, radius: 44, color: FIRE, strength: night ? 0.9 : 0.4 });
  }
  if (night && q >= 2) lights.push({ x: winX + 4, y: hb + 4, radius: 28, color: LAMP_WARM, strength: 0.6 });

  const pFront = 108;
  let fg: (() => void) | undefined;
  if (activity === "doorstep" || activity === "rest") {
    P.bench(r, tx - 26, 104, 22, hex("#6a4a30"));
    P.stool(r, tx + 4, 106, hex("#6a4a30"));
    slots.push({ x: tx - 20, y: 104, kind: "seat", prio: 3 }, { x: tx - 9, y: 104, kind: "seat", prio: 2.8 }, { x: tx + 8, y: 106, kind: "seat", prio: 2.6 });
    slots.push({ x: 40, y: pFront + 4, kind: "play", prio: 1.5 }, { x: 60, y: pFront + 8, kind: "play", prio: 1.2 }, { x: dX + 4, y: hb + 4, kind: "stand", prio: 1 });
  } else if (activity === "market" || activity === "chores") {
    // havanda dövme (günlük iş) ya da küçük tezgâh
    if (activity === "chores" || v.chance(0.5)) {
      fg = () => P.mortar(r, 80, 114, hex("#7a5030"));
      slots.push({ x: 72, y: 112, kind: "work", prio: 3, hold: "pestle" });
      slots.push({ x: 96, y: 110, kind: "floor", prio: 2 }, { x: 48, y: 106, kind: "stand", prio: 1.6 }, { x: 116, y: 112, kind: "play", prio: 1.2 });
    } else {
      const stX = v.int(10, 90);
      P.stall(r, stX, 104, hex("#8a6a4a"), garment(pick(v, WAX), hex("#f0ece0"), "stripesV"), H(["#e04a2a", "#f08a2a", "#6ab04a", "#e8d8b0"]));
      slots.push({ x: stX + 13, y: 96, kind: "extra", prio: 0 }, { x: stX + 6, y: pFront + 4, kind: "stand", prio: 3, hold: "bag" }, { x: stX + 22, y: pFront + 5, kind: "stand", prio: 2 }, { x: stX + 36, y: pFront + 3, kind: "stand", prio: 1 });
    }
  } else if (activity === "play") {
    const bx = v.int(40, 100);
    P.ball(r, bx, pFront + 4);
    slots.push({ x: bx - 14, y: pFront + 4, kind: "play", prio: 3 }, { x: bx + 12, y: pFront + 2, kind: "play", prio: 2.5 }, { x: bx + 26, y: pFront + 7, kind: "play", prio: 2 }, { x: tx - 12, y: 104, kind: "stand", prio: 1.5 });
  } else {
    const cx0 = 60 + v.int(0, 30);
    [0, 12, -12, 24, -24].forEach((dx, i) => slots.push({ x: cx0 + dx, y: pFront + (i % 2), kind: "stand", prio: 3 - i * 0.4 }));
  }
  slots.push({ x: v.int(110, 150), y: 92, kind: "extra", prio: 0 });
  return { slots, lights, windows: [], foreground: fg, openGround: { x: 0, y: horizon, w: 160, h: 54 }, petSpot: { x: v.int(10, 140), y: 116 } };
}
