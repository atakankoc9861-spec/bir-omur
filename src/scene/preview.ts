// Önizleme sayfası (prototype/sahne.html). Oyunun arayüzü değil; sahneyi telefonda denemek için.
// Aile üretici burada basit bir DEMO'dur, motorun yerine geçmez ve istatistik iddiası taşımaz.
import { Rng } from "../engine/rng";
import { SceneDirector } from "./director";
import { KITS } from "./kits";
import type { Place, RegionId, Season, SceneFamilyMember, SceneState, TimeOfDay } from "./types";
import { SceneView } from "./view";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const SEASON_TR: Record<Season, string> = { spring: "ilkbahar", summer: "yaz", autumn: "sonbahar", winter: "kış" };
const TIME_TR: Record<TimeOfDay, string> = { dawn: "şafak", day: "gündüz", dusk: "akşam", night: "gece" };
const WEATHER_TR = { clear: "açık", cloudy: "bulutlu", rain: "yağmurlu", snow: "karlı", haze: "harmattan pusu" } as const;
const ACT_TR = { rest: "dinlenme", meal: "yemek", chores: "ev işi / ders", walk: "yürüyüş", doorstep: "kapı önü", play: "oyun", market: "pazar" } as const;
const ROLE_TR: Record<string, string> = { mother: "anne", father: "baba", sibling: "kardeş", partner: "eş", child: "çocuk", pet: "evcil hayvan" };

/** DEMO aile: tohumdan, yaşa göre. */
function familyAt(seed: number, age: number): SceneFamilyMember[] {
  const r = new Rng(seed ^ 0x5bd1e995);
  const out: SceneFamilyMember[] = [];
  const add = (id: string, role: SceneFamilyMember["role"], sex: "female" | "male", memberAge: number, deathAge: number) => {
    if (memberAge >= 0) out.push({ id, role, sex, age: memberAge, alive: memberAge < deathAge });
  };
  const mom = r.int(19, 38), dad = mom + r.int(0, 8);
  add("anne", "mother", "female", age + mom, r.int(60, 96));
  add("baba", "father", "male", age + dad, r.int(55, 92));
  const sib = r.int(0, 3);
  for (let i = 0; i < sib; i++) add(`kardes${i}`, "sibling", r.chance(0.5) ? "female" : "male", age + r.int(-9, 8), r.int(60, 95));
  const married = r.chance(0.78) ? r.int(20, 34) : 999;
  const pDiff = r.int(-3, 7);
  const pSex = r.chance(0.5) ? "female" : "male";
  if (age >= married) add("es", "partner", pSex, age + pDiff, r.int(60, 95));
  const kids = married < 999 ? r.int(0, 4) : 0;
  for (let i = 0; i < kids; i++) add(`cocuk${i}`, "child", r.chance(0.5) ? "female" : "male", age - married - 1 - i * r.int(2, 3), 120);
  const petFrom = r.chance(0.45) ? r.int(3, 40) : 999;
  if (age >= petFrom && age < petFrom + 13) out.push({ id: "pet" + petFrom, role: "pet", sex: "female", age: age - petFrom, alive: true });
  return out;
}

let lifeSeed = (Math.random() * 1e9) | 0;
let director = new SceneDirector(lifeSeed);
let view: SceneView;
let playTimer: ReturnType<typeof setInterval> | null = null;
let lifeSex: "female" | "male" = "female";

function readState(): SceneState {
  const age = +$<HTMLInputElement>("age").value;
  const place = $<HTMLSelectElement>("place").value;
  return {
    lifeSeed,
    region: $<HTMLSelectElement>("region").value as RegionId,
    income: +$<HTMLSelectElement>("income").value as SceneState["income"],
    urban: $<HTMLSelectElement>("urban").value === "1",
    age,
    sex: lifeSex,
    year: 2026 - 40 + age,
    season: $<HTMLSelectElement>("season").value as Season,
    timeOfDay: $<HTMLSelectElement>("time").value as TimeOfDay,
    place: place === "auto" ? undefined : (place as Place),
    family: familyAt(lifeSeed, age),
    health: age > 86 ? 30 : 80,
  };
}

function whoText(age: number, sex: "female" | "male"): string {
  if (age < 2) return age < 1 ? "Bir bebek (1 yaşından küçük)" : "1 yaşında bir bebek";
  if (age < 13) return `${age} yaşında bir ${sex === "female" ? "kız" : "erkek"} çocuğu`;
  if (age < 18) return `${age} yaşında bir genç ${sex === "female" ? "kız" : "erkek"}`;
  return `${age} yaşında bir ${sex === "female" ? "kadın" : "erkek"}`;
}

function actText(age: number, act: keyof typeof ACT_TR, home: boolean): string {
  if (age < 4) {
    const small: Partial<Record<keyof typeof ACT_TR, string>> = { rest: "ailesiyle evde", meal: "aile sofrasında", chores: "büyükler ev işindeyken", walk: "ailesiyle yürüyüşte", doorstep: "ailesiyle kapı önünde", play: "ailesiyle dışarıda", market: "ailesiyle pazarda" };
    return small[act] ?? ACT_TR[act];
  }
  if (act === "chores" && home && age < 18) return "ders / ev işi";
  return ACT_TR[act];
}

/** S7: tuvali ekran genişliğine sığan en büyük TAM SAYI katında büyüt (pikseller eşit kalsın). */
function fitCanvas(): void {
  const c = $<HTMLCanvasElement>("scene");
  const k = Math.max(1, Math.floor(Math.min(window.innerWidth, 640) / 160));
  c.style.width = `${160 * k}px`;
  c.style.height = `${120 * k}px`;
}

function draw(): void {
  const s = readState();
  const t0 = performance.now();
  const sc = director.compose(s, { marker: $<HTMLInputElement>("marker").checked });
  view.showRendered(sc);
  view.lastRenderMs = performance.now() - t0;
  const plan = sc.plan;
  $("ageVal").textContent = String(s.age);
  const fam = s.family.filter((m) => m.alive && m.role !== "pet").map((m) => `${ROLE_TR[m.role]} ${Math.floor(m.age)}`).join(", ");
  const lost = s.family.filter((m) => !m.alive).map((m) => ROLE_TR[m.role]).join(", ");
  $("caption").textContent =
    `${whoText(s.age, s.sex)} · ${KITS[s.region].nameTr}, ${s.urban ? "şehir" : "köy"} · gelir ${s.income}/5 · ` +
    `${SEASON_TR[s.season]} ${TIME_TR[s.timeOfDay]}, ${WEATHER_TR[plan.weather]} · ${plan.place === "home" ? "evde" : "dışarıda"}: ${actText(s.age, plan.activity, plan.place === "home")}`;
  $("family").textContent = (fam ? `Yanında olabilecekler: ${fam}` : "") + (lost ? ` · Kaybedilen: ${lost}` : "");
  $("meta").textContent = `hazırlama ${view.lastRenderMs.toFixed(1)} ms (görsel tekrar kontrolü dahil) · bu hayatta ${director.history.length} farklı sahne · imza ${plan.signature}`;
}

function randomMoment(): void {
  const r = new Rng((Math.random() * 1e9) | 0);
  const set = (id: string, v: string | number) => ($<HTMLInputElement>(id).value = String(v));
  set("region", r.chance(0.5) ? "akdeniz" : "bati-afrika");
  set("income", r.int(1, 5));
  set("urban", r.chance(0.55) ? "1" : "0");
  set("age", r.int(0, 92));
  set("season", ["spring", "summer", "autumn", "winter"][r.int(0, 3)]);
  set("time", ["dawn", "day", "day", "dusk", "night"][r.int(0, 4)]);
  set("place", "auto");
  draw();
}

function newLife(): void {
  lifeSeed = (Math.random() * 1e9) | 0;
  lifeSex = Math.random() < 0.5 ? "female" : "male";
  director = new SceneDirector(lifeSeed);
  $<HTMLInputElement>("age").value = "0";
  draw();
}

function togglePlay(): void {
  const btn = $("play");
  if (playTimer) { clearInterval(playTimer); playTimer = null; btn.textContent = "▶ Hayatı oynat"; return; }
  btn.textContent = "❚❚ Durdur";
  const seasons: Season[] = ["spring", "summer", "autumn", "winter"];
  const times: TimeOfDay[] = ["day", "dusk", "day", "night", "dawn"];
  playTimer = setInterval(() => {
    const a = $<HTMLInputElement>("age");
    const next = +a.value + 1;
    if (next > 95) { togglePlay(); return; }
    a.value = String(next);
    $<HTMLSelectElement>("season").value = seasons[next % 4];
    $<HTMLSelectElement>("time").value = times[next % times.length];
    // gelir hayat boyunca biraz oynar (demo)
    if (next === 18 || next === 30 || next === 55) {
      const inc = $<HTMLSelectElement>("income");
      inc.value = String(Math.max(1, Math.min(5, +inc.value + (Math.random() < 0.6 ? 1 : -1))));
    }
    if (next === 19) $<HTMLSelectElement>("urban").value = Math.random() < 0.6 ? "1" : $<HTMLSelectElement>("urban").value;
    draw();
  }, 1300);
}

window.addEventListener("DOMContentLoaded", () => {
  view = new SceneView($<HTMLCanvasElement>("scene"));
  fitCanvas();
  window.addEventListener("resize", fitCanvas);
  for (const id of ["region", "income", "urban", "season", "time", "place", "marker"]) $(id).addEventListener("change", draw);
  $("age").addEventListener("input", draw);
  $("random").addEventListener("click", randomMoment);
  $("newlife").addEventListener("click", newLife);
  $("play").addEventListener("click", togglePlay);
  randomMoment();
});
