// Sohbet demosu motoru: saf TypeScript, DOM yok. Arayüz zamanı advance() ile ilerletir.
import { Rng } from "./rng";
import { kadroKur, type Kadro } from "./kadro";

export type ChatId = "aile" | "anne" | "baba" | "kardes" | "sinif" | "kanka" | "ilgi" | "etut" | "patron" | "rehber" | "kurs" | "sonuc";
export type Kind = "text" | "voice" | "photo" | "card" | "result" | "sys";

export interface Msg {
  id: number;
  chat: ChatId;
  from: string; // "me", "anne", "c0"...
  kind: Kind;
  text: string;
  media?: string;
  month: number;
  time: string;
  /** Benim mesajım: 2 = iletildi, 3 = okundu */
  tick?: 2 | 3;
  read: boolean;
}

export interface Fx {
  b?: Record<string, number>;
  st?: number;
  pa?: number;
  set?: Record<string, unknown>;
  run?: (s: S) => void;
}
export type Lines = string[] | ((s: S) => string[]);
export interface Opt {
  say: string | string[];
  fx?: Fx;
  then?: Lines;
  cost?: number;
  need?: (s: S) => boolean;
}
export interface Ask {
  opts: Opt[] | ((s: S) => Opt[]);
  /** Bağı etkilenen kişi; verilmezse sohbetin sahibi. */
  who?: string;
  unread?: number;
  seen?: number;
  unreadLine?: string;
  seenLine?: string;
  ignoreFx?: Fx;
}
export interface Beat {
  id: string;
  m: number;
  chat: ChatId;
  at: number;
  if?: (s: S) => boolean;
  lines: Lines;
  ask?: Ask;
  fx?: Fx;
  saat?: string;
  /** Bu soru cevaplanınca gelir (tepki). */
  after?: string;
  evenIfKus?: boolean;
  /** Önceki beatin hemen ardından gelsin (tepkiler). */
  hemen?: boolean;
  /** Ayın ortasındaki kriz: gelince ayrılmış son akşam açılır. */
  kriz?: boolean;
}

export interface ActiveAsk {
  beat: Beat;
  opts: Opt[];
  delivered: boolean;
  answered: boolean;
  seen: boolean;
  /** Aynı sohbete yeni soru gelince eskisi cezasız kapanır. */
  skipped?: boolean;
}

export interface Iz { ad: string; yon: 1 | -1 }

interface QItem { due: number; chat: ChatId; from: string; kind: Kind; text: string; media?: string; time: string; beat?: Beat; last?: boolean }

export const AYLAR = ["Eylül", "Ekim", "Kasım", "Aralık", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos"];
export const AY_YIL = (m: number) => (m < 4 ? 2026 : 2027);

export const OWNER: Partial<Record<ChatId, string>> = {
  aile: "anne", anne: "anne", baba: "baba", kardes: "kardes", kanka: "kanka", ilgi: "ilgi", etut: "etut", patron: "patron", rehber: "rehber", sinif: "sinif",
};
const KUS_ESIK: Record<string, number> = { kanka: 20, ilgi: 15, etut: 20, kardes: 22, patron: 15 };

export interface S {
  seed: number;
  rng: Rng;
  k: Kadro;
  month: number;
  budget: number;
  study: number;
  para: number;
  bond: Record<string, number>;
  f: Record<string, any>;
  kus: Record<string, number>; // kişi -> küstüğü ay
  msgs: Msg[];
  /** Grammar tekrar önleme: kullanılmış alternatifler */
  used: Set<string>;
  answered: number;
  ignored: Record<string, number>;
  monthLog: { ignoredWho: string[]; answeredWho: string[] };
  /** Krize ayrılmış akşam (kilitli). */
  yedek: number;
  /** Ay başındaki bağlar ve ders: "bu ay ne değişti" için. */
  snap: { bond: Record<string, number>; study: number };
  /** Geçen ayın kalan akşamları (uyku/yorgunluk). */
  lastLeftover: number;
  answeredBy: Record<string, number>;
}

export interface MonthSummary { month: number; title: string; lines: string[]; kind: "ay" | "sinav" }

let BEATS: Beat[] = [];
let MONTH_START: Record<number, (s: S) => void> = {};
let KUS_LINES: (s: S, who: string) => string[] = () => [];
let SUMMARY: (s: S, leftover: number) => string[] = () => [];
export function icerikYukle(b: Beat[], ms: Record<number, (s: S) => void>, kus: typeof KUS_LINES, sum: typeof SUMMARY): void {
  BEATS = b;
  MONTH_START = ms;
  KUS_LINES = kus;
  SUMMARY = sum;
}
export const tumBeatler = () => BEATS;

/* ---------- metin üretimi ---------- */

export function vars(s: S): Record<string, string> {
  const k = s.k;
  const kiz = k.me.sex === "female";
  const v: Record<string, string> = {
    ad: k.me.ad, soyad: k.soyad, anne: k.anne.ad, baba: k.baba.ad, kardes: k.kardes.ad, teyze: k.teyze.ad,
    kanka: k.kanka.ad, ilgi: k.ilgi.ad, etut: k.etut.ad, patron: k.patron.ad, rehber: k.rehber.ad,
    oglum: kiz ? "kızım" : "oğlum", aslanim: kiz ? "aslan kızım" : "aslanım", hitap: kiz ? "abla" : "abi",
    sehir: k.ilgiSehir, emoji: k.ilgiEmoji,
  };
  k.sinif.forEach((c, i) => (v[`c${i}`] = c.ad));
  for (const [key, val] of Object.entries(s.f)) if (typeof val === "string" || typeof val === "number") v[key] = String(val);
  return v;
}

/** {ad} değişken, {g:erkek|kız} oyuncunun cinsiyeti, [a|b|c] tekrar etmeyen seçim. */
export function x(s: S, t: string): string {
  const v = vars(s);
  t = t.replace(/\{g:([^|}]*)\|([^}]*)\}/g, (_, a, b) => (s.k.me.sex === "female" ? b : a));
  t = t.replace(/\{(\w+)\}/g, (m, key) => (key in v ? v[key] : m));
  t = t.replace(/\[([^\]]*\|[^\]]*)\]/g, (_, body: string) => {
    const alts = body.split("|");
    const fresh = alts.filter((a) => !s.used.has(body + "§" + a));
    const c = s.rng.pick(fresh.length ? fresh : alts);
    s.used.add(body + "§" + c);
    return c;
  });
  return t;
}

/** Seçenek önizlemesi: rastgelelik ve tekrar sayacını tüketmez. */
export function xPreview(s: S, t: string): string {
  const v = vars(s);
  return t
    .replace(/\{g:([^|}]*)\|([^}]*)\}/g, (_, a, b) => (s.k.me.sex === "female" ? b : a))
    .replace(/\{(\w+)\}/g, (m, key) => (key in v ? v[key] : m))
    .replace(/\[([^\]]*\|[^\]]*)\]/g, (_, body: string) => body.split("|")[0]);
}

/* ---------- oyun ---------- */

export class Game {
  s: S;
  clock = 0;
  queue: QItem[] = [];
  asks: ActiveAsk[] = [];
  private nextId = 1;
  private waiting: Beat[] = [];
  ended = false;
  krizVar = false;
  /** Arayüz için: son olay notu ("yedek akşam açıldı") */
  not: string | null = null;
  /** Arayüz için: son eklenen mesajlar */
  onMsg: ((m: Msg) => void) | null = null;

  constructor(seed: number) {
    const rng = new Rng(seed);
    this.s = {
      seed, rng, k: kadroKur(rng), month: 0, budget: 4, study: 0, para: 0,
      bond: { anne: 70, baba: 65, kardes: 60, teyze: 60, kanka: 68, ilgi: 30, etut: 45, patron: 50, rehber: 50, sinif: 50 },
      f: {}, kus: {}, msgs: [], used: new Set(), answered: 0, ignored: {}, monthLog: { ignoredWho: [], answeredWho: [] },
      yedek: 0, snap: { bond: {}, study: 0 }, lastLeftover: 0, answeredBy: {},
    };
    // aile tipi ve hane: tekrar oynanabilirlik için
    this.s.f.aileTip = rng.chance(0.5) ? "muhafazakar" : "laik";
    this.s.f.ayriBaba = rng.chance(0.3) ? 1 : 0;
    this.s.f.krizTip = rng.chance(0.5) ? "is" : "tasinma";
    this.s.f.vr = rng.int(0, 1 << 20);
  }

  get budgetMax(): number {
    const f = this.s.f;
    let b = 4;
    if (f.is && this.s.month >= 2 && this.s.month <= 8) b -= 1;
    if (f.kampAy === this.s.month) b -= 1;
    return Math.max(1, b);
  }

  isKus(who: string): boolean {
    return who in this.s.kus;
  }

  private eligible(b: Beat): boolean {
    const own = OWNER[b.chat];
    if (own && this.isKus(own) && !b.evenIfKus) return false;
    return !b.if || b.if(this.s);
  }

  startMonth(): void {
    const s = this.s;
    this.queue = [];
    this.asks = [];
    this.waiting = [];
    s.monthLog = { ignoredWho: [], answeredWho: [] };
    this.clock = 0;
    s.budget = this.budgetMax - 1;
    s.yedek = 1;
    s.snap = { bond: { ...s.bond }, study: s.study };
    MONTH_START[s.month]?.(s);
    const beats = BEATS.filter((b) => b.m === s.month && !b.after && this.eligible(b)).sort((a, b) => a.at - b.at);
    this.waiting = BEATS.filter((b) => b.m === s.month && b.after);
    this.krizVar = beats.some((b) => b.kriz);
    let t = 700;
    let prevEnd = t;
    for (const b of beats) {
      const start = b.hemen ? prevEnd + 700 : t;
      prevEnd = this.schedule(b, start);
      t = prevEnd + 2200 + s.rng.int(0, 2600);
    }
  }

  /** Beat satırlarını kuyruğa koyar; son mesajın zamanını döndürür. */
  private schedule(b: Beat, start: number): number {
    const s = this.s;
    if (b.fx) this.apply(b.fx);
    let raw = typeof b.lines === "function" ? b.lines(s) : b.lines;
    // "baba?:" yalnız aile grubunda; baba ayrı yaşıyorsa düşer. "baba:" ise özelden gelir.
    if (b.chat === "aile" && s.f.ayriBaba) {
      const ozel = raw.filter((l) => l.startsWith("baba: "));
      raw = raw.filter((l) => !l.startsWith("baba: ") && !l.startsWith("baba?: "));
      if (ozel.length) this.schedule({ id: b.id + "_babaozel", m: s.month, chat: "baba", at: b.at, lines: ozel, saat: b.saat }, start + 1500);
    }
    raw = raw.map((l) => (l.startsWith("baba?: ") ? "baba: " + l.slice(7) : l));
    const lines = raw.map((l) => this.parse(l));
    let t = start;
    let [hh, mm] = (b.saat ?? this.randomSaat(b.chat)).split(":").map(Number);
    lines.forEach((l, i) => {
      const time = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      this.queue.push({ due: t, chat: b.chat, from: l.from, kind: l.kind, text: l.text, media: l.media, time, beat: b, last: i === lines.length - 1 });
      t += 650 + Math.min(2600, l.text.length * 28) + (l.kind === "photo" || l.kind === "card" ? 600 : 0);
      if (s.rng.chance(0.3)) mm += 1;
      if (mm > 59) { mm = 0; hh = (hh + 1) % 24; }
    });
    if (lines.length === 0) this.activate(b);
    this.queue.sort((a, c) => a.due - c.due);
    return t;
  }

  private randomSaat(chat: ChatId): string {
    const r = this.s.rng;
    const h = chat === "aile" || chat === "anne" ? r.pick([7, 8, 12, 17, 19, 21]) : chat === "sinif" ? r.pick([16, 22, 23, 0, 1]) : chat === "patron" || chat === "rehber" || chat === "kurs" || chat === "sonuc" ? r.pick([9, 10, 11, 14]) : r.pick([18, 20, 21, 22, 23]);
    return `${h}:${r.int(0, 59)}`;
  }

  /** "kim: metin" satırını çözer. ~ sesli, #foto:id, #kart:id|yazı, #sonuc:id|yazı */
  private parse(line: string): { from: string; kind: Kind; text: string; media?: string } {
    const i = line.indexOf(": ");
    const from = line.slice(0, i);
    let body = line.slice(i + 2);
    if (body.startsWith("#foto:")) {
      const [id, ...cap] = body.slice(6).split(" ");
      return { from, kind: "photo", text: x(this.s, cap.join(" ")), media: id };
    }
    if (body.startsWith("#kart:") || body.startsWith("#sonuc:")) {
      const kart = body.startsWith("#kart:");
      const rest = body.slice(kart ? 6 : 7);
      const p = rest.indexOf("|");
      return { from, kind: kart ? "card" : "result", text: x(this.s, rest.slice(p + 1)), media: rest.slice(0, p) };
    }
    if (body.startsWith("~ ")) return { from, kind: "voice", text: x(this.s, body.slice(2)) };
    if (from === "sys") return { from, kind: "sys", text: x(this.s, body) };
    return { from, kind: "text", text: x(this.s, body) };
  }

  private yedekAc(not: string): void {
    if (this.s.yedek <= 0) return;
    this.s.budget += this.s.yedek;
    this.s.yedek = 0;
    this.not = not;
  }

  private activate(b: Beat): void {
    if (!b.ask) return;
    for (const o of this.asks) if (o.beat.chat === b.chat && !o.answered) { o.answered = true; o.skipped = true; }
    const opts = (typeof b.ask.opts === "function" ? b.ask.opts(this.s) : b.ask.opts).filter((o) => !o.need || o.need(this.s));
    if (opts.length === 0) return;
    this.asks.push({ beat: b, opts, delivered: true, answered: false, seen: false });
  }

  /** Zamanı ilerletir, vakti gelen mesajları teslim eder. */
  advance(dt: number): Msg[] {
    this.clock += dt;
    const out: Msg[] = [];
    while (this.queue.length && this.queue[0].due <= this.clock) out.push(this.deliver(this.queue.shift()!));
    // krizsiz ayda: bütün mesajlar gelince ayrılmış akşam açılır
    if (!this.queue.length && this.s.yedek > 0 && !this.krizVar) this.yedekAc("Ay sakin geçti, bir akşamın daha var.");
    return out;
  }

  private deliver(q: QItem): Msg {
    const s = this.s;
    const m: Msg = { id: this.nextId++, chat: q.chat, from: q.from, kind: q.kind, text: q.text, media: q.media, month: s.month, time: q.time, read: q.from === "me" };
    if (q.from === "me") m.tick = 2;
    else for (const o of s.msgs) if (o.chat === q.chat && o.from === "me") o.tick = 3;
    s.msgs.push(m);
    if (q.last && q.beat && !q.beat.after) this.activate(q.beat);
    if (q.last && q.beat?.kriz) this.yedekAc("Bir akşamı buna ayırmıştın.");
    this.onMsg?.(m);
    return m;
  }

  /** Bir sohbette yazıyor göstergesi gerekiyor mu? */
  typing(chat: ChatId): string | null {
    const n = this.queue[0];
    if (!n || n.chat !== chat || n.from === "me" || n.from === "sys" || n.due - this.clock > 2400) return null;
    return n.from;
  }

  nextDue(): number | null {
    return this.queue.length ? this.queue[0].due - this.clock : null;
  }

  openChat(chat: ChatId): void {
    for (const m of this.s.msgs) if (m.chat === chat) m.read = true;
    for (const a of this.asks) if (a.beat.chat === chat && !a.answered) a.seen = true;
  }

  askFor(chat: ChatId): ActiveAsk | null {
    return this.asks.find((a) => a.beat.chat === chat && !a.answered) ?? null;
  }

  /** Kısa/rutin cevap yarım akşam; zaman alan ya da uzun cevap tam akşam. */
  costOf(o: Opt): number {
    if (o.cost !== undefined) return o.cost;
    const says = Array.isArray(o.say) ? o.say : [o.say];
    if (says.length > 1 || says.some((t) => t.startsWith("#foto:") || t.startsWith("~ "))) return 1;
    if ((o.fx?.st ?? 0) < 0) return 1;
    return xPreview(this.s, says[0]).length <= 24 ? 0.5 : 1;
  }

  canAfford(o: Opt): boolean {
    return this.s.budget >= this.costOf(o) - 1e-9;
  }

  /** Son cevabın izi (kim ↑/↓) */
  sonIz: Iz[] = [];

  answer(a: ActiveAsk, idx: number): void {
    const s = this.s;
    const o = a.opts[idx];
    if (a.answered || !this.canAfford(o)) return;
    a.answered = true;
    s.budget = Math.max(0, s.budget - this.costOf(o));
    s.answered++;
    const who = a.beat.ask?.who ?? OWNER[a.beat.chat] ?? a.beat.chat;
    s.monthLog.answeredWho.push(who);
    s.answeredBy[who] = (s.answeredBy[who] ?? 0) + 1;
    const once = { ...s.bond };
    s.f["cevap_" + a.beat.id] = idx + 1;
    const says = Array.isArray(o.say) ? o.say : [o.say];
    const [hh, mm] = this.lastTime(a.beat.chat);
    let t = this.clock;
    for (const line of says) {
      const p = this.parse("me: " + line);
      this.queue.push({ due: t, chat: a.beat.chat, from: "me", kind: p.kind, text: p.text, media: p.media, time: `${hh}:${mm}` });
      t += 500;
    }
    if (o.fx) this.apply(o.fx);
    this.sonIz = Object.keys(s.bond).filter((k) => Math.abs(s.bond[k] - (once[k] ?? 0)) >= 3).map((k) => ({ ad: k, yon: s.bond[k] > (once[k] ?? 0) ? 1 : -1 }));
    const then = o.then ? (typeof o.then === "function" ? o.then(s) : o.then) : [];
    if (then.length) {
      const b: Beat = { id: a.beat.id + "_then", m: s.month, chat: a.beat.chat, at: 0, lines: then, saat: `${hh}:${mm}` };
      this.schedule(b, t + 1300);
    }
    this.queue.sort((p, q) => p.due - q.due);
    const after = this.waiting.filter((b) => b.after === a.beat.id && this.eligible(b));
    let at = this.queue.length ? this.queue[this.queue.length - 1].due + 2500 : this.clock + 2500;
    for (const b of after) at = this.schedule(b, at) + 2000;
    // tepki beatleri cevap verilmeden de açılabilsin diye bekleyenlerden çıkar
    this.waiting = this.waiting.filter((b) => !after.includes(b));
  }

  private lastTime(chat: ChatId): [string, string] {
    const last = [...this.s.msgs].reverse().find((m) => m.chat === chat);
    const [h, m] = (last?.time ?? "21:00").split(":").map(Number);
    const mm = Math.min(59, m + 1 + this.s.rng.int(0, 3));
    return [String(h).padStart(2, "0"), String(mm).padStart(2, "0")];
  }

  apply(fx: Fx): void {
    const s = this.s;
    for (const [k, d] of Object.entries(fx.b ?? {})) s.bond[k] = Math.max(0, Math.min(100, (s.bond[k] ?? 50) + d));
    if (fx.st) s.study = Math.max(0, s.study + fx.st);
    if (fx.pa) s.para = Math.max(0, s.para + fx.pa);
    if (fx.set) Object.assign(s.f, fx.set);
    fx.run?.(s);
  }

  /** Tüm kuyruğu anında teslim et (ay kapanırken ya da testte). */
  flush(): Msg[] {
    return this.advance(1e12);
  }

  /** Ayı kapatır: cevapsızlar, küsmeler, ders; özeti döndürür. */
  endMonth(): MonthSummary {
    const s = this.s;
    this.flush();
    for (const a of this.asks) {
      if (a.answered) continue;
      if (!a.beat.ask) continue;
      const ask = a.beat.ask!;
      const who = ask.who ?? OWNER[a.beat.chat] ?? a.beat.chat;
      const d = a.seen ? ask.seen ?? -12 : ask.unread ?? -8;
      s.bond[who] = Math.max(0, (s.bond[who] ?? 50) + d);
      s.ignored[who] = (s.ignored[who] ?? 0) + 1;
      if (who === "ilgi") s.f.ilgiIhmal = { m: s.month, seen: a.seen };
      if (d <= -4) s.monthLog.ignoredWho.push(who);
      if (ask.ignoreFx) this.apply(ask.ignoreFx);
      const late = a.seen ? ask.seenLine : ask.unreadLine;
      if (late) {
        const b: Beat = { id: a.beat.id + "_late", m: s.month, chat: a.beat.chat, at: 1, lines: [late], saat: `23:${s.rng.int(30, 58)}` };
        this.schedule(b, this.clock);
      }
    }
    // Hiç teslim edilmemiş sorular da (beklemede kalan tepkiler) yok sayılır
    this.waiting = [];
    // küsmeler
    for (const [who, esik] of Object.entries(KUS_ESIK)) {
      if (this.isKus(who) || (s.bond[who] ?? 50) >= esik) continue;
      if (who === "ilgi" && !s.f.ilgiTanisti) continue;
      s.kus[who] = s.month;
      const lines = KUS_LINES(s, who);
      if (lines.length) {
        const chat = (Object.keys(OWNER) as ChatId[]).find((c) => OWNER[c] === who && c !== "aile")!;
        this.schedule({ id: "kus_" + who, m: s.month, chat, at: 1, lines, saat: `23:${s.rng.int(40, 59)}` }, this.clock);
      }
    }
    this.flush();
    const leftover = s.budget + s.yedek;
    s.lastLeftover = leftover;
    if (s.month <= 9) s.study += leftover + 1.5;
    const sum: MonthSummary = { month: s.month, title: AYLAR[s.month], lines: SUMMARY(s, leftover), kind: s.month === 9 ? "sinav" : "ay" };
    s.month++;
    if (s.month >= 12) this.ended = true;
    this.asks = [];
    return sum;
  }

  /** Okunmamış mesaj sayısı */
  unread(chat: ChatId): number {
    let n = 0;
    for (const m of this.s.msgs) if (m.chat === chat && !m.read) n++;
    return n;
  }
}
