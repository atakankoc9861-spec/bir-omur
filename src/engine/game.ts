// Bir Ömür — oyun motoru (MVP-0). Saf TypeScript, arayüzden bağımsız, tohumlu.
// Akış: drawBirth() → new Game() → her yıl step(); karar varsa choose(); ölünce summary().
// Kaynaklı veriler: gamedata.ts; kaynaksız ayarlar: denge.ts; olay metinleri: storylets.ts.
import { CAUSE_TR } from "./causes";
import { DENGE } from "./denge";
import type { CompactCountry, GameData, NamePool, TurRules, WorldEntry } from "./gamedata";
import { LT_YEARS, TODAY_YEAR } from "./gamedata";
import { type Grammar, TextMemory, cap, expandUnique, suffix } from "./grammar";
import type {
  Ctx, DecisionSpec, DecisionView, EduLevel, Entry, GPerson, LifeState, MeterKey, StatLine, Storylet, Tone, YearReport,
} from "./gtypes";
import { Rng } from "./rng";
import { CRITICAL, G, REFLECTIONS, STORYLETS, SYSTEM } from "./storylets";
import type { Sex } from "./types";

export type MortalityMode = "cohort" | "period";
export interface GameOptions {
  mortality?: MortalityMode;
  storylets?: Storylet<Game>[];
  /** YALNIZ test/denge betikleri için: çekilişi atla, bu ülkede doğ. Oyunda kullanılmaz (karar 8). */
  forceCountry?: string;
}

// ------------------------------------------------------------------ doğum çekilişi

export interface BirthDraw {
  seed: number;
  entry: WorldEntry;
  /** Dünyadaki doğumlar içindeki payı (0-1). */
  share: number;
  playable: boolean;
}

export function drawBirth(data: GameData, seed: number): BirthDraw {
  const rng = new Rng(seed ^ 0x2545f491);
  const list = data.births.list;
  const entry = rng.weighted(list, (c) => c.births);
  const total = list.reduce((a, c) => a + c.births, 0);
  return { seed, entry, share: entry.births / total, playable: !!data.countries[entry.iso3] };
}

// ------------------------------------------------------------------ yardımcılar

const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const fmtNum = (x: number) => Math.round(x).toLocaleString("tr-TR");
export const fmtPct = (x: number, d = 0) => `%${(x * 100).toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d })}`;
const fmtDec = (x: number, d = 1) => x.toLocaleString("tr-TR", { maximumFractionDigits: d, minimumFractionDigits: d });

function poisson(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng.next(); } while (p > L && k < 50);
  return k - 1;
}

function rowFor(year: number): number {
  let r = 0;
  for (let i = 0; i < LT_YEARS.length; i++) if (LT_YEARS[i] <= year) r = i;
  return r;
}

/** Dönem yaşam tablosundan ölüm olasılığı (BM WPP 2024). */
export function qxOf(c: CompactCountry, sex: Sex, age: number, year: number, mode: MortalityMode = "cohort"): number {
  const r = mode === "period" ? 0 : rowFor(year);
  if (age >= 100) {
    const e = sex === "female" ? c.lt.eOpenF[r] : c.lt.eOpenM[r];
    return clamp(1 / Math.max(0.5, e), 0, 1);
  }
  return (sex === "female" ? c.lt.female : c.lt.male)[r][Math.max(0, Math.floor(age))];
}

/** Yaşa göre doğurganlık, kadın başına yıllık doğum olasılığı (BM WPP 2024, 1000 kadında → oran). */
export function asfrOf(c: CompactCountry, age: number, year: number): number {
  const r = rowFor(year);
  for (let i = 0; i < c.asfr.groups.length; i++) {
    const [a, b] = c.asfr.groups[i];
    if (age >= a && age <= b) return c.asfr.rows[r][i] / 1000;
  }
  return 0;
}

const SRC: Record<string, string> = {
  wpp2024: "BM Nüfus Bölümü, World Population Prospects 2024",
  wdi: "Dünya Bankası, World Development Indicators",
  pip: "Dünya Bankası, Poverty and Inequality Platform",
  ghe2023: "DSÖ, Global Health Estimates (2019 dağılımı)",
};
export const srcName = (k: string) => k.split("+").map((x) => SRC[x] ?? x).join("; ");

// ------------------------------------------------------------------ oyun

/** Denge ölçümü için (yalnız betiklerde açılır). */
export let STATS: { n: number; sum: number; byAge: number[]; cnt: number[] } | null = null;
export function enableStats() { STATS = { n: 0, sum: 0, byAge: [], cnt: [] }; return STATS; }

interface Pending { spec: DecisionSpec<Game>; key: string; sl?: GStorylet; target: GPerson | null; vars: Record<string, string> }
export type GStorylet = Storylet<Game>;

export class Game implements Ctx {
  readonly s: LifeState;
  readonly rng: Rng;
  readonly autoRng: Rng;
  readonly mem = new TextMemory();
  readonly country: CompactCountry;
  readonly tur: TurRules | null;
  readonly isTur: boolean;
  readonly mode: MortalityMode;
  readonly storylets: GStorylet[];
  target: GPerson | null = null;
  vars: Record<string, string> = {};
  finished = false;
  readonly choices: string[] = [];
  private pending: Pending | null = null;
  private rep: YearReport | null = null;
  private nextId = 0;
  private readonly usedNames = new Set<string>();
  private refsNow: Set<string> = new Set();
  private yearTone: Tone = "notr";
  private decisionsThisYear = 0;

  constructor(readonly data: GameData, readonly seed: number, opts: GameOptions = {}) {
    const iso = opts.forceCountry ?? drawBirth(data, seed).entry.iso3;
    const c = data.countries[iso];
    if (!c) throw new Error(`Bu ülke henüz oynanabilir değil: ${iso}`);
    this.country = c;
    this.isTur = c.iso3 === "TUR";
    this.tur = this.isTur ? data.tur : null;
    this.mode = opts.mortality ?? "cohort";
    this.storylets = opts.storylets ?? STORYLETS;
    this.rng = new Rng(seed ^ 0x9e3779b9);
    this.autoRng = new Rng(seed ^ 0x85ebca6b);
    const r = this.rng;

    const pMale = c.srb.v / (100 + c.srb.v);
    const sex: Sex = r.chance(pMale) ? "male" : "female";
    const urban = r.chance(c.urban?.v ?? 0.5);
    const quint = (r.int(1, 5)) as 1 | 2 | 3 | 4 | 5;
    const decile = (quint - 1) * 2 + r.int(0, 1);

    this.s = {
      seed, name: "", sex, birthYear: TODAY_YEAR, countryIso3: c.iso3, iso3: c.iso3, urban, incomeQuintile: quint, age: 0, alive: true,
      meters: { health: 80 + r.int(-6, 6), happiness: 70, knowledge: 5, relationships: 60 },
      budget: { cash: 0, debt: 0, annualIncome: 0, annualExpenses: 0 },
      people: [], events: [], givenName: null, surname: null, familyDecile: decile, edu: "none", inSchool: false, student: "none",
      leftHome: false,
      job: { working: false, formal: false, decile, startYear: null, formalYears: 0, retired: false, unemployedUntil: 0 },
      flags: new Set(), counts: {}, lastSeen: {}, wantKids: null, yearTones: [], reflections: [], criticalCount: 0, log: [],
    };

    // Aile: annenin yaşı yaşa göre doğurganlıktan (BM WPP 2024, 2026); baba: denge ayarı.
    const groups = c.asfr.groups, row = c.asfr.rows[0];
    const gi = r.weighted(groups.map((_, i) => i), (i) => row[i] * (groups[i][1] - groups[i][0] + 1));
    const [ga, gb] = groups[gi];
    const motherAge = clamp(r.int(ga, Math.min(gb, 49)), 14, 49);
    const fatherAge = Math.max(motherAge, 16) + r.int(DENGE.fatherAgeGap[0], DENGE.fatherAgeGap[1]);
    this.s.surname = this.pickSurname();
    this.addPerson("mother", "female", TODAY_YEAR - motherAge, { bond: 80 });
    this.addPerson("father", "male", TODAY_YEAR - fatherAge, { bond: 70 });
    // Önceki kardeşler: annenin bugüne kadarki yaşlarında beklenen doğum sayısı (ASFR toplamı) → Poisson.
    let lambda = 0;
    for (let a = 12; a < motherAge; a++) lambda += asfrOf(c, a, TODAY_YEAR);
    const nOlder = Math.min(DENGE.maxOlderSiblings, poisson(r, lambda));
    const used = new Set<number>();
    for (let i = 0; i < nOlder; i++) {
      let a = r.int(15, Math.max(15, motherAge - 1));
      for (let k = 0; k < 10 && used.has(a); k++) a = r.int(15, Math.max(15, motherAge - 1));
      used.add(a);
      const sibAge = motherAge - a;
      if (sibAge <= 0) continue;
      this.addPerson("sibling", r.chance(pMale) ? "male" : "female", TODAY_YEAR - sibAge, { bond: 55 + r.int(0, 20) });
    }
    this.s.givenName = this.pickGiven(sex, TODAY_YEAR);
    this.s.name = this.fullName();
  }

  // ---------------------------------------------------------------- Ctx

  get age() { return this.s.age; }
  get year() { return this.s.birthYear + this.s.age; }
  get cash() { return this.s.budget.cash; }
  get income() { return Math.max(1, this.s.budget.annualIncome || this.householdIncome()); }
  alive(role?: GPerson["role"]) { return this.s.people.filter((p) => p.alive && (!role || p.role === role)); }
  mother() { return this.s.people.find((p) => p.role === "mother" && p.alive) ?? null; }
  father() { return this.s.people.find((p) => p.role === "father" && p.alive) ?? null; }
  partner() { return this.s.people.find((p) => p.role === "partner" && p.alive) ?? null; }
  friend() { return this.s.people.find((p) => p.role === "friend" && p.alive) ?? null; }
  has(f: string) { return this.s.flags.has(f); }
  flag(f: string, on = true) { if (on) this.s.flags.add(f); else this.s.flags.delete(f); }
  meter(k: MeterKey, d: number) {
    this.s.meters[k] = clamp(this.s.meters[k] + d, 0, 100);
    if (this.rep) {
      const last = this.lastEntry();
      if (last) last.fx = { ...last.fx, [k]: (last.fx?.[k] ?? 0) + d };
    }
  }
  money(d: number) {
    this.s.budget.cash += d;
    const last = this.lastEntry();
    if (last && d !== 0) last.fx = { ...last.fx, money: (last.fx?.money ?? 0) + d };
  }
  cost(kind: keyof typeof DENGE.cost) { return Math.round(this.income * DENGE.cost[kind]); }
  canAfford(x: number, creditYears = 0) { return this.cash + this.income * creditYears >= x; }
  bond(p: GPerson | null, d: number) { if (p) p.bond = clamp(p.bond + d, 0, 100); }
  money$(x: number) { return `${fmtNum(x)} $`; }

  addPerson(role: GPerson["role"], sex: Sex, birthYear: number, extra: Partial<GPerson> = {}): GPerson {
    const p: GPerson = { id: `p${this.nextId++}`, name: "", sex, birthYear, role, alive: true, bond: 60, ...extra };
    if (role !== "pet" && !extra.name) p.name = this.pickGiven(sex, birthYear) ?? "";
    this.s.people.push(p);
    return p;
  }

  private lastEntry(): Entry | undefined {
    const e = this.rep?.entries;
    return e && e.length ? e[e.length - 1] : undefined;
  }

  /** Bir kişinin metindeki adı: "annen Ayşe", isim yoksa "annen". */
  phrase(p: GPerson): string {
    const rel = this.relWord(p);
    return p.name ? `${rel} ${p.name}` : rel;
  }
  nameOf(p: GPerson): string { return p.name || this.relWord(p); }

  relWord(p: GPerson): string {
    const pAge = this.year - p.birthYear;
    switch (p.role) {
      case "mother": return "annen";
      case "father": return "baban";
      case "sibling": {
        const older = pAge > this.s.age;
        if (p.sex === "female") return older ? "ablan" : "kız kardeşin";
        return older ? "ağabeyin" : "erkek kardeşin";
      }
      case "partner": return p.married ? "eşin" : "sevgilin";
      case "ex": return "eski sevgilin";
      case "child": return p.sex === "female" ? "kızın" : "oğlun";
      case "friend": return "en yakın arkadaşın";
      case "pet": return p.name ? p.name : "köpeğin";
    }
  }

  /** İsim, akrabalık sözcüğü ve sayılar çıkarılmış cümle kalıbı (Kalite O5: yalnız ismi değişen tekrar). */
  private patternOf(t: string): string {
    let x = t.toLocaleLowerCase("tr");
    const names = this.s.people.map((p) => p.name).filter(Boolean).concat(this.s.givenName ? [this.s.givenName] : []);
    for (const n of names.sort((a, b) => b.length - a.length)) x = x.split(n.toLocaleLowerCase("tr")).join("□");
    x = x.replace(/(annen|baban|ablan|ağabeyin|kız kardeşin|erkek kardeşin|eşin|sevgilin|eski sevgilin|kızın|oğlun|en yakın arkadaşın|büyüklerinden biri|evdeki büyüklerden biri|yakınlarından biri|bir arkadaşın)\p{L}*/gu, "□");
    return x.replace(/\d+/g, "#").replace(/(□\s*)+/g, "□ ");
  }
  private readonly patterns = new Set<string>();

  say(text: string | string[], tone: Tone, opt: { stat?: StatLine | null; important?: boolean; key?: string; refs?: GPerson[]; about?: string; allowPatternRepeat?: boolean } = {}): boolean {
    if (!this.rep) return false;
    const texts = Array.isArray(text) ? text : [text];
    const vars = { ...this.baseVars(), ...this.vars };
    let out: string | null = null;
    const order = texts.map((_, i) => i).sort(() => this.rng.next() - 0.5);
    for (const i of [...order, ...order]) {
      const o = expandUnique(texts[i], G as Grammar, vars, this.rng, this.mem);
      if (!o) continue;
      if (opt.allowPatternRepeat || !this.patterns.has(this.patternOf(o))) { out = o; break; }
    }
    if (!out) return false;
    this.patterns.add(this.patternOf(out));
    const refs = new Set<string>(this.refsNow);
    for (const p of opt.refs ?? []) refs.add(p.id);
    const e: Entry = { age: this.s.age, year: this.year, key: opt.key ?? "olay", text: out, tone, refs: [...refs], important: opt.important };
    if (opt.stat) e.stat = opt.stat;
    if (opt.about) e.about = opt.about;
    this.rep.entries.push(e);
    this.s.log.push(e);
    this.s.events.push({ age: e.age, year: e.year, key: e.key, text: e.text, source: e.stat?.kaynak });
    this.bumpTone(tone);
    return true;
  }

  private bumpTone(t: Tone) {
    const rank: Record<Tone, number> = { notr: 0, iyi: 1, kotu: 2, onemli: 3, kayip: 4 };
    if (rank[t] > rank[this.yearTone]) this.yearTone = t;
  }

  /** Her metinde kullanılabilen değişkenler (canlı kişiler). */
  private baseVars(): Record<string, string> {
    const v: Record<string, string> = {};
    const m = this.mother(), f = this.father(), pa = this.partner(), fr = this.friend();
    v.ben = this.s.givenName ?? "sen";
    v.ulke = this.country.nameTr;
    v.yer = this.s.urban ? "şehir" : "köy";
    v.yas = String(this.s.age);
    v.yil = String(this.year);
    v.cocukluk = this.s.sex === "female" ? "kız" : "oğlan";
    // Kişi yoksa (ölmüş ya da hiç olmamış) metin yine okunur kalsın: yedek ifadeler.
    v.anne = m ? this.phrase(m) : "büyüklerinden biri"; v.anneAd = m ? this.nameOf(m) : "büyüklerinden biri";
    v.baba = f ? this.phrase(f) : "evdeki büyüklerden biri"; v.babaAd = f ? this.nameOf(f) : "evdeki büyüklerden biri";
    v.es = pa ? this.phrase(pa) : "yakınlarından biri"; v.esAd = pa ? this.nameOf(pa) : "yakınlarından biri";
    v.arkadas = fr ? this.phrase(fr) : "bir arkadaşın"; v.arkadasAd = fr ? this.nameOf(fr) : "bir arkadaşın";
    v.kardes = "bir arkadaşın"; v.kardesAd = "bir arkadaşın";
    const sib = this.alive("sibling");
    if (sib.length) {
      const sb = sib[Math.floor(this.rng.next() * sib.length)];
      v.kardes = this.phrase(sb); v.kardesAd = this.nameOf(sb);
    }
    const kids = this.alive("child");
    if (kids.length) {
      const k = kids[Math.floor(this.rng.next() * kids.length)];
      v.cocuk = this.phrase(k); v.cocukAd = this.nameOf(k); v.cocukYas = String(this.year - k.birthYear);
    }
    if (this.target) { v.kisi = this.phrase(this.target); v.kisiAd = this.nameOf(this.target); v.kisiYas = String(this.year - this.target.birthYear); }
    return v;
  }

  // ---------------------------------------------------------------- isimler

  private poolsFor(sex: Sex, birthYear: number): NamePool | null {
    const n = this.data.names[this.country.iso3];
    if (!n) return null;
    const ps = n.pools.filter((p) => p.sex === sex);
    if (!ps.length) return null;
    const inRange = ps.filter((p) => p.from <= birthYear && (p.to === null || birthYear < p.to));
    if (inRange.length) return inRange[inRange.length - 1];
    const before = ps.filter((p) => p.from <= birthYear).sort((a, b) => b.from - a.from);
    if (before.length) return before[0];
    return [...ps].sort((a, b) => a.from - b.from)[0];
  }

  /** Bu hayatta kullanılmamış bir ad; havuz biterse null (kişi rolüyle anılır). */
  pickGiven(sex: Sex, birthYear: number): string | null {
    const pool = this.poolsFor(sex, birthYear);
    if (!pool) return null;
    // Kelime düzeyinde: "Ali" kullanıldıysa "Ali Asaf" da çıkmaz (aynı hayatta iki "Ali" olmasın).
    const free = pool.names.filter((x) => !x.split(/\s+/).some((w) => this.usedNames.has(w)));
    if (!free.length) return null;
    const nm = free[Math.floor(this.rng.next() * free.length)];
    for (const w of nm.split(/\s+/)) this.usedNames.add(w);
    return nm;
  }

  private pickSurname(): string | null {
    const n = this.data.names[this.country.iso3];
    if (!n || !n.surnames.length) return null;
    return n.surnames[Math.floor(this.rng.next() * n.surnames.length)];
  }

  fullName(): string {
    const g = this.s.givenName, sn = this.s.surname;
    if (!g) return "";
    if (!sn) return g;
    return this.country.iso3 === "CHN" ? `${sn} ${g}` : `${g} ${sn}`;
  }

  // ---------------------------------------------------------------- ekonomi

  /** Ondalık d'nin kişi başı yıllık geliri: GSYH × 10 × ondalık payı (yöntem: tahmin, devir notu). */
  baseIncome(d: number): number {
    const inc = this.country.income;
    if (!inc) return 5000;
    return inc.gdp * 10 * inc.shares[clamp(Math.round(d), 0, 9)];
  }
  medianIncome(): number { return (this.baseIncome(4) + this.baseIncome(5)) / 2; }

  householdIncome(): number {
    const s = this.s;
    if (!s.leftHome) return this.baseIncome(s.familyDecile);
    const j = s.job;
    let own = 0;
    if (j.working) own = this.year < j.unemployedUntil ? this.baseIncome(j.decile) * 0.3 : this.baseIncome(j.decile);
    else if (j.retired) own = this.baseIncome(j.decile) * (j.formal ? DENGE.pensionShare.formal : DENGE.pensionShare.informal);
    const pa = this.partner();
    const pInc = pa && pa.works ? this.baseIncome(pa.decile ?? j.decile) : 0;
    let hh = Math.max(own, pInc) + DENGE.partnerIncomeBoost * Math.min(own, pInc);
    if (hh <= 0) hh = this.baseIncome(Math.max(0, j.decile - 3)) * 0.35;
    return hh;
  }

  private currentDecile(): number {
    const s = this.s;
    if (!s.leftHome) return s.familyDecile;
    const pa = this.partner();
    if (s.job.working || s.job.retired) return pa?.works ? Math.max(s.job.decile, pa.decile ?? 0) : s.job.decile;
    return pa?.works ? (pa.decile ?? s.job.decile) : Math.max(0, s.job.decile - 3);
  }

  // ---------------------------------------------------------------- yıl döngüsü

  get pendingDecision(): DecisionView | null { return this.rep?.decision ?? null; }

  step(): YearReport {
    if (this.finished) throw new Error("hayat bitti");
    if (this.pending) throw new Error("önce karar ver");
    const rep: YearReport = { age: this.s.age, year: this.year, entries: [], montage: this.s.age < 18 && !this.has("mezun"), died: false };
    this.rep = rep;
    this.yearTone = "notr";
    this.decisionsThisYear = 0;
    this.s.budget.annualIncome = this.householdIncome();

    if (this.s.age === 0) this.run(SYSTEM.birth);
    this.familyYear();
    // Anlatı olayları (kararlardan önce: bekleyen bir kararın kişisini değiştirmesinler)
    const max = rep.montage ? DENGE.eventsPerYear.child : DENGE.eventsPerYear.adult;
    let n = 0;
    for (let tries = 0; tries < 4 && n < max; tries++) {
      const sl = this.drawStorylet(false);
      if (!sl) break;
      if (this.run(sl)) n++;
    }
    // Hayat sistemleri ve kritik anlar (çocukluk montajı)
    for (const sl of SYSTEM.yearly) if (!this.pending && this.eligible(sl)) this.run(sl);
    for (const sl of CRITICAL) if (!this.pending && this.eligible(sl)) { if (this.run(sl)) this.s.criticalCount++; }
    // Yetişkinlikte karar anı
    if (!this.pending && !rep.montage && this.rng.chance(DENGE.adultDecisionChance)) {
      const sl = this.drawStorylet(true);
      if (sl) this.run(sl);
    }
    const refl = REFLECTIONS.find((x) => x.age === this.s.age);
    if (refl) {
      rep.reflection = { age: refl.age, question: refl.question, options: refl.options };
      this.s.reflections.push({ age: refl.age, question: refl.question, answer: null });
    }
    if (rep.decision) {
      // Karar sorusu yılın son satırı olsun
      const i = rep.entries.findIndex((e) => e.key.endsWith(":soru"));
      if (i >= 0) rep.entries.push(...rep.entries.splice(i, 1));
    }
    if (!this.pending) this.endYear();
    return rep;
  }

  answerReflection(age: number, answer: string) {
    const r = this.s.reflections.find((x) => x.age === age);
    if (r) r.answer = answer;
  }

  choose(optionId: string): YearReport {
    const p = this.pending;
    if (!p || !this.rep) throw new Error("bekleyen karar yok");
    const opt = p.spec.options.find((o) => o.id === optionId);
    if (!opt) throw new Error(`seçenek yok: ${optionId}`);
    if (opt.locked) throw new Error(`seçenek kilitli: ${optionId}`);
    this.choices.push(optionId);
    this.pending = null;
    this.rep.decision = undefined;
    this.target = p.target;
    this.vars = { ...p.vars };
    this.setRefs(p.target);
    if (opt.cost) this.money(-opt.cost);
    const res = opt.effect(this);
    if (res) {
      const o = { key: `${p.key}:${opt.id}`, important: opt.important ?? p.spec.critical };
      // Aynı karar ikinci kez geldiyse ve sonuç metinleri tükendiyse: sade, yıla bağlı bir satır.
      if (!this.say(res, opt.tone ?? "notr", o)) this.say(`${this.year}: bu kez de "${opt.label.toLocaleLowerCase("tr")}" dedin.`, opt.tone ?? "notr", { ...o, allowPatternRepeat: true });
    }
    if (opt.cost) { const l = this.lastEntry(); if (l) l.fx = { ...l.fx, money: (l.fx?.money ?? 0) - opt.cost }; }
    this.target = null;
    this.vars = {};
    this.refsNow = new Set();
    this.endYear();
    return this.rep;
  }

  /** Otomatik oynatma: kilitsiz seçeneklerden rastgele (ayrı tohumlu üreteç). */
  autoChoose(): string {
    const d = this.rep?.decision;
    if (!d) throw new Error("bekleyen karar yok");
    const ok = d.options.filter((o) => !o.locked);
    // Olağan yol (ilk seçenek) biraz daha sık: denge ayarı, oyuncu davranışı verisi yok.
    if (this.autoRng.chance(DENGE.autoFirstOption)) return ok[0].id;
    return ok[Math.floor(this.autoRng.next() * ok.length)].id;
  }

  private setRefs(p: GPerson | null) {
    this.refsNow = new Set(p ? [p.id] : []);
  }

  eligible(sl: GStorylet): boolean {
    const s = this.s;
    if (s.age < sl.ages[0] || s.age > sl.ages[1]) return false;
    if (sl.countries && !sl.countries.includes(this.country.iso3)) return false;
    const times = s.counts[sl.id] ?? 0;
    if (times >= (sl.max ?? 1)) return false;
    if (sl.cooldown && s.lastSeen[sl.id] !== undefined && s.age - s.lastSeen[sl.id] < sl.cooldown) return false;
    this.target = null;
    if (sl.when && !sl.when(this)) return false;
    return true;
  }

  private drawStorylet(withChoice: boolean): GStorylet | null {
    const cands: GStorylet[] = [];
    const w: number[] = [];
    for (const sl of this.storylets) {
      if (!!sl.choice !== withChoice) continue;
      if (this.rep?.entries.some((e) => e.key === sl.id)) continue;
      if (!this.eligible(sl)) continue;
      const wt = typeof sl.weight === "function" ? sl.weight(this) : (sl.weight ?? 1);
      if (wt > 0) { cands.push(sl); w.push(wt); }
    }
    if (!cands.length) return null;
    const i = this.rng.weighted(cands.map((_, k) => k), (k) => w[k]);
    return cands[i];
  }

  /** Bir olayı çalıştırır. Metin üretilemezse (tekrar) etkisi de uygulanmaz. */
  run(sl: GStorylet): boolean {
    this.target = sl.pickPerson ? sl.pickPerson(this) : null;
    if (sl.pickPerson && !this.target) return false;
    this.setRefs(this.target);
    this.vars = {};
    if (sl.prep) sl.prep(this);
    let ok = true;
    if (sl.text) {
      ok = this.say(sl.text, sl.tone, { key: sl.id, important: sl.important, stat: sl.stat ? sl.stat(this) : null });
      if (!ok && !sl.choice) { this.target = null; return false; }
    }
    this.s.counts[sl.id] = (this.s.counts[sl.id] ?? 0) + 1;
    this.s.lastSeen[sl.id] = this.s.age;
    if (sl.fx) sl.fx(this);
    if (sl.choice && !this.pending) {
      const spec = sl.choice(this);
      if (spec) this.openDecision(spec, sl.id, sl);
    }
    this.target = null; this.vars = {}; this.refsNow = new Set();
    return ok;
  }

  /** Sistemlerin (okul, askerlik...) karar açması için. */
  openDecision(spec: DecisionSpec<Game>, key: string, sl?: GStorylet) {
    if (!this.rep || this.pending) return;
    const vars = { ...this.baseVars(), ...this.vars };
    const prompt = expandUnique(spec.prompt, G as Grammar, vars, this.rng, this.mem);
    if (!prompt) return;
    const view: DecisionView = {
      key,
      prompt,
      critical: spec.critical,
      stat: spec.stat ?? undefined,
      options: spec.options.map((o) => ({ id: o.id, label: cap(o.label), cost: o.cost, locked: o.locked ?? null })),
    };
    // Kilitsiz seçenek yoksa karar açılmaz (oyuncu sıkışmasın).
    if (!view.options.some((o) => !o.locked)) return;
    this.pending = { spec, key, sl, target: this.target, vars: { ...this.vars } };
    this.rep.decision = view;
    this.decisionsThisYear++;
    const e: Entry = { age: this.s.age, year: this.year, key: `${key}:soru`, text: prompt, tone: "notr", refs: [...this.refsNow] };
    if (spec.stat) e.stat = spec.stat;
    this.rep.entries.push(e);
    this.s.log.push(e);
  }

  // ---------------------------------------------------------------- aile

  private familyYear() {
    const c = this.country;
    const famMult = DENGE.incomeMortality[Math.floor(this.s.familyDecile / 2)];
    for (const p of [...this.s.people]) {
      if (!p.alive) continue;
      const age = this.year - p.birthYear;
      if (age < 0) continue;
      let q: number;
      if (p.role === "pet") q = age < 8 ? 0.03 : 0.12 + (age - 8) * 0.06; // denge ayarı: evcil hayvan ömrü (kaynak yok)
      else {
        const mult = p.role === "mother" || p.role === "father" || p.role === "sibling" ? famMult : DENGE.incomeMortality[this.s.incomeQuintile - 1];
        q = qxOf(c, p.sex, age, this.year, this.mode) * mult;
      }
      if (this.s.age === 0 && (p.role === "mother" || p.role === "father")) continue; // doğum kartında ebeveyn ölümü yok
      if (this.rng.chance(q)) this.personDies(p, age);
    }
    // Annenin yeni çocukları (küçük kardeşler)
    const m = this.mother();
    if (m && this.s.age > 0 && !this.s.leftHome) {
      const ma = this.year - m.birthYear;
      if (ma <= 49 && this.rng.chance(asfrOf(c, ma, this.year))) {
        const sex: Sex = this.rng.chance(c.srb.v / (100 + c.srb.v)) ? "male" : "female";
        const sib = this.addPerson("sibling", sex, this.year, { bond: 60 });
        this.target = sib;
        this.setRefs(sib);
        this.say(SYSTEM.texts.siblingBorn, "iyi", { key: "kardes-dogdu", important: true });
        this.meter("relationships", 2);
        this.target = null;
        this.refsNow = new Set();
      }
    }
    // Oyuncunun çocukları
    const pa = this.partner();
    if (pa && (pa.married || this.has("birlikte"))) {
      const woman = this.s.sex === "female" ? this.s.age : this.year - pa.birthYear;
      const want = this.s.wantKids ? DENGE.wantKids[this.s.wantKids] : 1;
      const p = asfrOf(c, woman, this.year) * DENGE.partneredFertilityBoost * want;
      if (woman >= 15 && this.rng.chance(clamp(p, 0, 0.6))) {
        const sex: Sex = this.rng.chance(c.srb.v / (100 + c.srb.v)) ? "male" : "female";
        const kid = this.addPerson("child", sex, this.year, { bond: 85, livesTogether: true });
        this.target = kid;
        this.setRefs(kid);
        const first = this.s.people.filter((x) => x.role === "child").length === 1;
        this.say(first ? SYSTEM.texts.firstChild : SYSTEM.texts.childBorn, "onemli", { key: "cocuk-dogdu", important: true });
        this.meter("happiness", DENGE.fx.big);
        this.meter("relationships", DENGE.fx.mid);
        this.target = null;
        this.refsNow = new Set();
      }
    }
  }

  causeFor(sex: Sex, age: number): string {
    const cs = this.country.causes;
    if (!cs) return "?";
    const gi = Math.max(0, cs.ageGroups.findIndex(([a, b]) => age >= a && age <= b));
    const shares = (sex === "female" ? cs.female : cs.male)[gi];
    const i = this.rng.weighted(shares.map((_, k) => k), (k) => shares[k]);
    return cs.codes[i];
  }

  private personDies(p: GPerson, age: number) {
    p.alive = false;
    p.deathYear = this.year;
    p.deathAge = age;
    if (p.role !== "pet") p.deathCause = this.causeFor(p.sex, age);
    const wasHome = p.livesTogether;
    p.livesTogether = false;
    this.target = p;
    this.refsNow = new Set();
    this.vars = { neden: p.deathCause ? CAUSE_TR[p.deathCause] ?? "" : "", olumYas: String(age) };
    const close = ["mother", "father", "partner", "child", "sibling", "friend"].includes(p.role);
    const home = wasHome === true || ((p.role === "mother" || p.role === "father" || p.role === "sibling") && !this.s.leftHome) || (p.role === "partner" && !!p.married);
    const t = p.role === "pet" ? SYSTEM.texts.petDies : p.role === "child" ? SYSTEM.texts.childDies : home ? [...SYSTEM.texts.personDies, ...SYSTEM.texts.personDiesHome] : SYSTEM.texts.personDies;
    if (!this.say(t, "kayip", { key: `olum:${p.role}`, important: close, about: p.id })) {
      // Metin tükendiyse bile ölüm kayda geçer (sade cümle, yıl ile benzersiz).
      this.say(`#kisi.cap# ${this.year} yılında, ${age} yaşında öldü.`, "kayip", { key: `olum:${p.role}`, important: close, about: p.id, allowPatternRepeat: true });
    }
    const hit = Math.round(p.bond / (p.role === "child" || p.role === "partner" ? 3 : 6));
    this.meter("happiness", -hit);
    this.meter("relationships", -Math.round(hit / 2));
    if (p.role === "partner") { this.flag("dul"); this.flag("birlikte", false); }
    this.target = null;
    this.vars = {};
  }

  // ---------------------------------------------------------------- yıl sonu

  private endYear() {
    const s = this.s;
    const r = this.rng;
    // Göstergeler: tabana doğru yavaşça
    const healthBase = DENGE.healthBaseline(s.age) + (this.has("sigara") ? -8 : 0) + (this.has("hareketli") ? 4 : 0) + (this.has("kontrol") ? 2 : 0);
    // Taban yaşla kayar; gösterge kaymayı hemen izler, olay etkileri ise yavaşça söner.
    s.meters.health += DENGE.healthBaseline(s.age) - DENGE.healthBaseline(Math.max(0, s.age - 1));
    s.meters.health = clamp(s.meters.health + (healthBase - s.meters.health) * DENGE.meterReversion + r.int(-2, 2), 1, 100);
    const close = this.alive().filter((p) => p.role !== "ex").map((p) => p.bond).sort((a, b) => b - a).slice(0, 3);
    const relBase = 25 + (close.length ? close.reduce((a, b) => a + b, 0) / close.length : 0) * 0.6;
    s.meters.relationships = clamp(s.meters.relationships + (relBase - s.meters.relationships) * DENGE.meterReversion, 0, 100);
    s.meters.happiness = clamp(s.meters.happiness + (62 - s.meters.happiness) * DENGE.meterReversion * 0.7, 0, 100);
    if (s.inSchool) this.meter("knowledge", s.student === "tertiary" ? 4 : 3);
    else if (s.age > 75) s.meters.knowledge = clamp(s.meters.knowledge - 0.5, 0, 100);
    // Kişiler: bağ zamanla gevşer, arkadaş uzaklaşabilir
    for (const p of this.alive()) {
      if (p.role === "friend" && r.chance(DENGE.friendDrift)) p.bond = clamp(p.bond - 6, 0, 100);
      if (p.role === "sibling" && s.leftHome) p.bond = clamp(p.bond - 0.5, 0, 100);
    }
    // Bütçe
    const inc = this.householdIncome();
    s.budget.annualIncome = inc;
    const q = Math.floor(this.currentDecile() / 2) as 0 | 1 | 2 | 3 | 4;
    s.incomeQuintile = (q + 1) as 1 | 2 | 3 | 4 | 5;
    let exp = inc * DENGE.spendShare[q];
    if (s.leftHome) exp += inc * DENGE.childCostShare * this.alive("child").filter((k) => this.year - k.birthYear < 20).length;
    if (s.leftHome && this.has("ev-sahibi")) exp -= inc * 0.08; // denge ayarı: kira yok
    s.budget.annualExpenses = exp;
    if (s.leftHome) {
      // Borçluyken hane kısar: gelirin bir kısmı borca gider (denge ayarı).
      if (s.budget.cash < 0) { exp = Math.min(exp, inc * DENGE.debtSpendShare); s.budget.annualExpenses = exp; this.flag("borclandi"); }
      s.budget.cash += inc - exp;
      s.budget.cash *= s.budget.cash < 0 ? 1 + DENGE.debtInterest : 1 + DENGE.savingsReturn;
      // Borç geliri çok aşamaz: alacaklılar daha fazla vermez, fazlası yapılandırılır/silinir.
      s.budget.cash = Math.max(s.budget.cash, -inc * DENGE.maxDebtYears);
      s.budget.debt = Math.max(0, -s.budget.cash);
      if (s.budget.cash < -inc) s.meters.happiness = clamp(s.meters.happiness - 3, 0, 100);
    } else {
      // Çocukken bütçe ailenin; aile birikimi gelirin küçük bir payı olarak birikir.
      s.budget.cash = Math.max(s.budget.cash, 0) + (inc - exp) * 0.5;
    }
    if (s.job.working && s.job.formal) s.job.formalYears++;
    // Ölüm: BM qx × gelir × sağlık sapması (denge.ts)
    const dev = s.meters.health - DENGE.healthBaseline(s.age) + DENGE.healthDevCenter;
    // 15 yaş altında ölüm yalnız BM qx × gelir: çocukluk olayları ölüm oranını kaydırmasın (BM 5 yaş altı ölümüyle uyum).
    const hm = s.age < 15 ? 1 : clamp(Math.exp(-dev / DENGE.healthMortalityScale), DENGE.healthMortalityClamp[0], DENGE.healthMortalityClamp[1]);
    if (STATS) { STATS.n++; STATS.sum += hm * (this.has("sigara") ? 1.15 : 1) * DENGE.incomeMortality[s.incomeQuintile - 1]; STATS.byAge[Math.min(9, Math.floor(s.age / 10))] = (STATS.byAge[Math.min(9, Math.floor(s.age / 10))] ?? 0) + hm; STATS.cnt[Math.min(9, Math.floor(s.age / 10))] = (STATS.cnt[Math.min(9, Math.floor(s.age / 10))] ?? 0) + 1; }
    const qx = qxOf(this.country, s.sex, s.age, this.year, this.mode) * DENGE.incomeMortality[s.incomeQuintile - 1] * hm * (this.has("sigara") ? 1.15 : 1);
    s.yearTones.push(this.yearTone);
    if (r.chance(clamp(qx, 0, 1))) {
      this.die();
      return;
    }
    s.age++;
  }

  private die() {
    const s = this.s;
    const code = this.causeFor(s.sex, s.age);
    s.alive = false;
    s.deathAge = s.age;
    s.deathYear = this.year;
    s.deathCauseCode = code;
    s.causeOfDeath = CAUSE_TR[code] ?? code;
    this.vars = { neden: s.causeOfDeath };
    this.target = null;
    this.refsNow = new Set();
    const t = s.age < 5 ? SYSTEM.texts.dieInfant : s.age < 18 ? SYSTEM.texts.dieYoung : SYSTEM.texts.dieAdult;
    this.say(t, "kayip", { key: "olum:ben", important: true, stat: this.causeStat(code, s.sex, s.age), about: "ben", allowPatternRepeat: true });
    s.yearTones[s.yearTones.length - 1] = "kayip";
    this.finished = true;
    if (this.rep) this.rep.died = true;
  }

  causeStat(code: string, sex: Sex, age: number): StatLine | null {
    const cs = this.country.causes;
    if (!cs) return null;
    const gi = Math.max(0, cs.ageGroups.findIndex(([a, b]) => age >= a && age <= b));
    const share = (sex === "female" ? cs.female : cs.male)[gi][cs.codes.indexOf(code)];
    const [a, b] = cs.ageGroups[gi];
    const grp = b >= 200 ? `${a} yaş ve üstü` : `${a}-${b} yaş`;
    return {
      text: `${suffix(this.country.nameTr, "de")} ${grp} ${sex === "female" ? "kadın" : "erkek"} ölümleri içinde bu nedenin payı ${fmtPct(share, share < 0.1 ? 1 : 0)} (${cs.yil}).`,
      kaynak: srcName("ghe2023"),
    };
  }

  // ---------------------------------------------------------------- özet

  summary() {
    const s = this.s;
    return {
      name: s.name,
      sex: s.sex,
      country: this.country.nameTr,
      iso3: this.country.iso3,
      urban: s.urban,
      birthYear: s.birthYear,
      deathYear: s.deathYear ?? null,
      age: s.deathAge ?? s.age,
      cause: s.causeOfDeath ?? null,
      causeStat: s.deathCauseCode ? this.causeStat(s.deathCauseCode, s.sex, s.deathAge ?? s.age) : null,
      e0: s.sex === "female" ? this.country.e0.female : this.country.e0.male,
      moments: s.log.filter((e) => e.important && !e.key.endsWith(":soru")),
      tones: s.yearTones,
      people: s.people.filter((p) => p.role !== "pet" || p.name).map((p) => ({ role: p.role, phrase: this.phraseAtDeath(p), alive: p.alive, deathAge: p.deathAge ?? null, cause: p.deathCause ? CAUSE_TR[p.deathCause] : null, sex: p.sex, birthYear: p.birthYear })),
      reflections: s.reflections,
      edu: s.edu as EduLevel,
      meters: { ...s.meters },
    };
  }

  private phraseAtDeath(p: GPerson): string {
    const w = this.relWord(p);
    return cap(p.name ? `${w} ${p.name}` : w);
  }

  // ---------------------------------------------------------------- yardımcılar (olaylar için)

  /** Sayıyı Türkçe biçimle. */
  num(x: number, d = 0) { return d ? fmtDec(x, d) : fmtNum(x); }
  pct(x: number, d = 0) { return fmtPct(x, d); }
  src(k: string) { return srcName(k); }
}
