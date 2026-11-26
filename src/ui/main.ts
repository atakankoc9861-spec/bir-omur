// Bir Ömür — ilk oynanabilir sürüm (MVP-0) arayüzü. Telefon dikey, tek el.
// Motor: src/engine (saf TS). Sahne: src/scene. Veri derlemede gömülür (scripts/build-oyna.mjs).
import data from "virtual:oyna-veri";
import { Game, drawBirth, fmtNum, fmtPct, srcName, type BirthDraw } from "../engine/game";
import type { GameData } from "../engine/gamedata";
import type { Entry, Tone, YearReport } from "../engine/gtypes";
import { Rng } from "../engine/rng";
import { suffix } from "../engine/grammar";
import { SceneDirector } from "../scene/director";
import { sceneStateFromLife } from "../scene/fromLife";
import type { Season, TimeOfDay } from "../scene/types";
import { SceneView } from "../scene/view";
import { fallbackRegionFor, profileOverride } from "./kit-esleme";

const D = data as GameData;
const KEY_CUR = "birOmur.mvp0.hayat";
const KEY_ARCH = "birOmur.mvp0.arsiv";

// ------------------------------------------------------------------ kayıt (localStorage, hatalara dayanıklı)

interface Save { seed: number; choices: string[]; refl: Record<string, string>; speed: Speed; age?: number }
interface ArchiveItem { seed: number; name: string; country: string; age: number; cause: string | null; sex: string; tones: Tone[]; word?: string; when: string }

const store = {
  get<T>(k: string): T | null {
    try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* kayıt yapılamadı; oyun sürer */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* yok say */ } },
};

// ------------------------------------------------------------------ yardımcılar

const $ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
const app = () => $("#app");
const TONE_COLOR: Record<Tone, string> = { notr: "#4a4656", iyi: "#6f9e5f", kotu: "#b97a3e", onemli: "#d9a94a", kayip: "#8d3346" };
const TONE_NAME: Record<Tone, string> = { notr: "sakin", iyi: "iyi", kotu: "zor", onemli: "dönüm noktası", kayip: "kayıp" };
const METERS: [keyof Game["s"]["meters"], string][] = [["health", "Sağlık"], ["happiness", "Mutluluk"], ["knowledge", "Bilgi"], ["relationships", "İlişkiler"]];
type Speed = 0 | 1 | 4;

// ------------------------------------------------------------------ ana ekran

function home() {
  stopTimer();
  const a = app();
  a.innerHTML = "";
  a.className = "screen home";
  const top = h("div", "home-top");
  top.append(h("h1", "", "Bir Ömür"), h("p", "lead", "Dünyanın bir yerinde, gerçek doğum oranlarıyla doğ. Bir ömrü sonuna kadar yaşa."));
  const total = D.births.list.reduce((s, c) => s + c.births, 0);
  top.append(h("p", "fine", `${D.births.yil} yılında dünyada yaklaşık ${fmtNum(total / 1e6)} milyon bebek doğacak; saniyede ortalama ${fmtNum(total / (365 * 24 * 3600))} bebek. (${srcName("wpp2024")}, projeksiyon)`));
  a.append(top);
  const arch = store.get<ArchiveItem[]>(KEY_ARCH) ?? [];
  if (arch.length) {
    const box = h("div", "archive");
    box.append(h("h2", "", "Yaşadığın hayatlar"));
    for (const it of arch.slice(-6).reverse()) {
      const row = h("div", "arch-row");
      row.append(h("b", "", it.name || "İsimsiz"), h("span", "", ` · ${it.country} · ${it.age} yaşında${it.cause ? ` · ${it.cause}` : ""}`));
      if (it.word) row.append(h("i", "", `“${it.word}”`));
      box.append(row);
    }
    a.append(box);
  }
  const bottom = h("div", "home-bottom");
  const cur = store.get<Save>(KEY_CUR);
  if (cur) {
    const b = h("button", "btn alt", "Kaldığın hayata devam et");
    b.onclick = () => resume(cur);
    bottom.append(b);
  }
  const born = h("button", "btn big", "Doğ");
  born.id = "dog";
  born.onclick = () => birthCard(newSeed());
  bottom.append(born);
  bottom.append(h("p", "fine", "Doğum yeri ve cinsiyet seçilemez. Puan yok, kazanmak yok."));
  a.append(bottom);
}

function newSeed(): number {
  try { const u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] >>> 1; } catch { return (Math.random() * 2 ** 31) | 0; }
}

// ------------------------------------------------------------------ doğum kartı

function birthCard(seed: number) {
  stopTimer();
  const b: BirthDraw = drawBirth(D, seed);
  const a = app();
  a.innerHTML = "";
  a.className = "screen birth";
  const card = h("div", "card");
  card.append(h("div", "kicker", "Doğdun"));
  card.append(h("h1", "", b.entry.nameTr));
  card.append(h("p", "", `Dünyada doğan her 1000 bebekten yaklaşık ${fmtNum(b.share * 1000)} tanesi burada doğuyor (${fmtPct(b.share, b.share < 0.01 ? 2 : 1)}).`));
  if (!b.playable) {
    card.append(h("p", "notice", "Bu ülke henüz hazırlanıyor — tekrar doğ."));
    const facts: string[] = [];
    if (b.entry.e0f && b.entry.e0m) facts.push(`Beklenen ömür: kadın ${b.entry.e0f.toLocaleString("tr-TR")}, erkek ${b.entry.e0m.toLocaleString("tr-TR")} yıl (2023).`);
    if (b.entry.u5) facts.push(`Her 1000 bebekten yaklaşık ${fmtNum(b.entry.u5)} tanesi beş yaşını görmeden ölüyor (2023).`);
    for (const f of facts) card.append(h("p", "fine", f));
    card.append(h("p", "src", `Kaynak: ${srcName("wpp2024")}. Doğum payı: ${D.births.yil} projeksiyonu.`));
    a.append(card);
    const again = h("button", "btn big", "Tekrar doğ");
    again.id = "tekrar";
    again.onclick = () => birthCard(newSeed());
    const back = h("button", "btn alt", "Ana ekran");
    back.onclick = home;
    const bar = h("div", "home-bottom");
    bar.append(again, back);
    a.append(bar);
    return;
  }
  const g = new Game(D, seed);
  card.append(h("p", "big-line", `${g.s.sex === "female" ? "Kız" : "Erkek"} bebek · ${g.s.urban ? "şehirde" : "köyde"}${g.s.name ? ` · ${g.s.name}` : ""}`));
  card.append(h("p", "src", `Kaynak: ${srcName("wpp2024")}; doğum payı ${D.births.yil} projeksiyonu.`));
  if (!D.names[g.country.iso3]) card.append(h("p", "fine", "Bu ülke için kaynaklı bir isim listesi henüz yok; insanlar burada adlarıyla değil, sana yakınlıklarıyla anılacak."));
  a.append(card);
  const go = h("button", "btn big", "Yaşamaya başla");
  go.id = "basla";
  go.onclick = () => startPlay(g, { seed, choices: [], refl: {}, speed: 1 }, []);
  const bar = h("div", "home-bottom");
  bar.append(go);
  a.append(bar);
}

// ------------------------------------------------------------------ oyun ekranı

let timer: ReturnType<typeof setTimeout> | null = null;
let G: Game | null = null;
let save: Save | null = null;
let view: SceneView | null = null;
let director: SceneDirector | null = null;
let reflQueue: YearReport["reflection"][] = [];
let lastRep: YearReport | null = null;

function stopTimer() { if (timer) clearTimeout(timer); timer = null; }

function startPlay(g: Game, s: Save, restoredReports: YearReport[]) {
  stopTimer();
  G = g; save = s;
  if (!restoredReports.length) lastRep = null;
  director = new SceneDirector(g.seed);
  reflQueue = [];
  const a = app();
  a.innerHTML = "";
  a.className = "screen play";
  const stage = h("div", "stage");
  const cv = h("canvas");
  cv.id = "scene";
  stage.append(cv);
  a.append(stage);
  try { view = new SceneView(cv); fitCanvas(); } catch { view = null; stage.remove(); }

  const status = h("div", "status");
  status.innerHTML = `<div class="who"><b id="who"></b><span id="when"></span></div><div class="meters" id="meters"></div><div class="money" id="money"></div>`;
  a.append(status);
  const feed = h("div", "feed");
  feed.id = "feed";
  a.append(feed);
  const dec = h("div", "decision hidden");
  dec.id = "decision";
  a.append(dec);
  const ctl = h("div", "controls");
  for (const [sp, label] of [[0, "❚❚"], [1, "1×"], [4, "4×"]] as [Speed, string][]) {
    const b = h("button", "spd", label);
    b.dataset.speed = String(sp);
    b.setAttribute("aria-label", sp === 0 ? "Duraklat" : `${sp} kat hız`);
    b.onclick = () => setSpeed(sp);
    ctl.append(b);
  }
  const quit = h("button", "spd quit", "⌂");
  quit.setAttribute("aria-label", "Ana ekran");
  quit.onclick = () => { stopTimer(); home(); };
  ctl.append(quit);
  a.append(ctl);

  for (const r of restoredReports.slice(-3)) renderYear(r, true);
  if (lastRep && lastRep.decision && !g.finished) showDecision(lastRep);
  updateStatus();
  setSpeed(s.speed ?? 1);
  if (!restoredReports.length) tick();
}

function fitCanvas() {
  const c = $("#scene") as HTMLCanvasElement | null;
  if (!c) return;
  const k = Math.max(1, Math.floor(Math.min(window.innerWidth, 640) / 160));
  c.style.width = `${160 * k}px`;
  c.style.height = `${120 * k}px`;
}
window.addEventListener("resize", fitCanvas);

function setSpeed(sp: Speed) {
  if (!save) return;
  save.speed = sp;
  for (const b of document.querySelectorAll<HTMLButtonElement>(".spd[data-speed]")) b.classList.toggle("on", +b.dataset.speed! === sp);
  persist();
  stopTimer();
  if (sp > 0) schedule();
}

function delay(): number {
  const sp = save?.speed ?? 1;
  const montage = lastRep?.montage ?? true;
  const lines = lastRep?.entries.length ?? 1;
  const base = montage ? 1500 : 2600;
  const ms = base + Math.min(4, lines) * 450;
  return sp === 4 ? ms / 4 : ms;
}

function schedule() {
  stopTimer();
  if (!G || G.finished || (save?.speed ?? 0) === 0) return;
  if (blocked()) return;
  timer = setTimeout(tick, delay());
}

function blocked(): boolean {
  const r = document.getElementById("refl");
  return !!G?.pendingDecision || !!(r && !r.classList.contains("hidden"));
}

function tick() {
  if (!G || G.finished || blocked()) return;
  const rep = G.step();
  lastRep = rep;
  renderYear(rep, false);
  updateStatus();
  persist();
  if (rep.reflection) reflQueue.push(rep.reflection);
  if (rep.decision) { showDecision(rep); return; }
  afterYear();
}

function afterYear() {
  if (!G) return;
  if (G.finished) { finishLife(); return; }
  if (reflQueue.length) { showReflection(reflQueue.shift()!); return; }
  schedule();
}

function sceneFor(rep: YearReport) {
  if (!view || !director || !G) return;
  try {
    const r = new Rng((G.seed ^ (rep.age * 7919)) >>> 0);
    const seasons: Season[] = ["spring", "summer", "autumn", "winter"];
    const times: TimeOfDay[] = ["day", "day", "dusk", "dawn", "night"];
    const life = { ...G.s, age: rep.age };
    const st = sceneStateFromLife(life, { year: rep.year, season: seasons[r.int(0, 3)], timeOfDay: times[r.int(0, 4)], fallbackRegion: fallbackRegionFor(G.country.iso3) });
    const byId = new Map(G.s.people.map((p) => [p.id, p]));
    st.family = st.family
      .filter((m) => m.role !== "ex" && m.age >= 0)
      .map((m) => { const p = byId.get(m.id); return p && p.livesTogether !== undefined ? { ...m, livesTogether: p.livesTogether } : m; });
    const pr = profileOverride(G.country.iso3);
    if (pr) st.profile = pr;
    view.showRendered(director.compose(st));
  } catch (e) {
    console.warn("sahne çizilemedi", e);
  }
}

function renderYear(rep: YearReport, restoring: boolean) {
  const feed = $("#feed");
  if (!feed) return;
  if (!restoring) sceneFor(rep);
  const block = h("div", "year");
  block.append(h("div", "year-h", `${rep.age} yaş · ${rep.year}`));
  for (const e of rep.entries) {
    if (e.key.endsWith(":soru")) continue;
    block.append(entryEl(e));
  }
  if (block.childElementCount > 1) feed.append(block);
  while (feed.childElementCount > 25) feed.firstElementChild?.remove();
  scrollFeed();
}

/** Akışı en alta kaydır (karar paneli açılıp akışı daraltınca da). */
function scrollFeed() {
  const f = document.getElementById("feed");
  if (!f) return;
  f.scrollTop = f.scrollHeight;
  requestAnimationFrame(() => { f.scrollTop = f.scrollHeight; });
}

function entryEl(e: Entry): HTMLElement {
  const d = h("div", `entry t-${e.tone}`);
  d.append(h("p", "", e.text));
  if (e.fx) {
    const fx = h("div", "fx");
    const names: Record<string, string> = { health: "sağlık", happiness: "mutluluk", knowledge: "bilgi", relationships: "ilişkiler", money: "$" };
    for (const [k, v] of Object.entries(e.fx)) {
      if (!v || Math.abs(v) < 1) continue;
      const t = k === "money" ? `${v > 0 ? "+" : "−"}${fmtNum(Math.abs(v))} $` : `${names[k]} ${v > 0 ? "+" : "−"}${Math.round(Math.abs(v))}`;
      fx.append(h("span", v > 0 ? "up" : "down", t));
    }
    if (fx.childElementCount) d.append(fx);
  }
  if (e.stat) {
    const st = h("div", "stat");
    st.append(h("span", "", e.stat.text));
    st.append(h("small", "", ` Kaynak: ${e.stat.kaynak}`));
    d.append(st);
  }
  return d;
}

function updateStatus() {
  if (!G) return;
  const s = G.s;
  const age = lastRep?.age ?? 0;
  $("#who").textContent = s.name || (s.sex === "female" ? "Bir kız" : "Bir oğlan");
  $("#when").textContent = ` · ${age} yaş · ${G.country.nameTr} · ${s.urban ? "şehir" : "köy"}`;
  const m = $("#meters");
  m.innerHTML = "";
  for (const [k, label] of METERS) {
    const v = Math.round(s.meters[k]);
    const row = h("div", "meter");
    row.append(h("span", "", label));
    const bar = h("i");
    const fill = h("b");
    fill.style.width = `${v}%`;
    bar.append(fill);
    row.append(bar);
    m.append(row);
  }
  const inc = s.budget.annualIncome;
  const rel = inc / G.medianIncome();
  const relTxt = rel < 0.75 ? "ülke ortancasının altında" : rel > 1.33 ? "ülke ortancasının üstünde" : "ülke ortancası civarında";
  const cash = s.budget.cash;
  const who = s.leftHome ? "Hanen" : "Ailen";
  const purse = !s.leftHome ? "" : ` · ${cash >= 0 ? `birikim ${fmtNum(cash)} $` : `borç ${fmtNum(-cash)} $`}`;
  $("#money").textContent = `${who}: kişi başı yılda ~${fmtNum(inc)} $ (${relTxt})${purse}`;
  $("#money").title = "Dolar: satın alma gücü paritesiyle (2021 uluslararası $). Gelir: kişi başı GSYH × ülkenin gelir/tüketim ondalık payı (Dünya Bankası WDI + PIP). Bu bir tahmindir.";
}

function showDecision(rep: YearReport) {
  const d = rep.decision!;
  const box = $("#decision");
  box.innerHTML = "";
  box.classList.remove("hidden");
  if (d.critical) box.append(h("div", "kicker", "Kritik an"));
  box.append(h("p", "prompt", d.prompt));
  if (d.stat) {
    const st = h("div", "stat");
    st.append(h("span", "", d.stat.text), h("small", "", ` Kaynak: ${d.stat.kaynak}`));
    box.append(st);
  }
  const opts = h("div", "opts");
  for (const o of d.options) {
    const b = h("button", "opt");
    b.append(h("span", "", o.label));
    if (o.cost) b.append(h("small", "", `Bedeli ~${fmtNum(o.cost)} $`));
    if (o.locked) { b.disabled = true; b.append(h("small", "lock", o.locked)); }
    b.onclick = () => pickOption(o.id);
    opts.append(b);
  }
  box.append(opts);
  scrollFeed();
  stopTimer();
}

function pickOption(id: string) {
  if (!G || !save) return;
  const before = lastRep!.entries.length;
  const rep = G.choose(id);
  save.choices.push(id);
  $("#decision").classList.add("hidden");
  // Kararın sonucunu son yıl bloğuna ekle
  const feed = $("#feed");
  let block = feed.lastElementChild as HTMLElement | null;
  if (!block || !block.classList.contains("year")) { block = h("div", "year"); block.append(h("div", "year-h", `${rep.age} yaş · ${rep.year}`)); feed.append(block); }
  for (const e of rep.entries.slice(before)) if (!e.key.endsWith(":soru")) block.append(entryEl(e));
  scrollFeed();
  updateStatus();
  persist();
  afterYear();
}

function showReflection(r: NonNullable<YearReport["reflection"]>) {
  let m = document.getElementById("refl");
  if (!m) { m = h("div", "modal"); m.id = "refl"; app().append(m); }
  m.innerHTML = "";
  m.classList.remove("hidden");
  const card = h("div", "card");
  card.append(h("div", "kicker", `Bir an dur · ${r.age} yaş`));
  card.append(h("p", "prompt", r.question));
  for (const o of r.options) {
    const b = h("button", "opt", o);
    b.onclick = () => {
      G?.answerReflection(r.age, o);
      if (save) { save.refl[String(r.age)] = o; persist(); }
      m!.classList.add("hidden");
      afterYear();
    };
    card.append(b);
  }
  m.append(card);
  stopTimer();
}

function persist() {
  if (!save || !G) return;
  save.age = lastRep?.age ?? 0;
  if (G.finished) store.del(KEY_CUR);
  else store.set(KEY_CUR, save);
}

/** Kayıttan devam: aynı tohum + aynı seçimler = aynı hayat (motor tohumlu). */
function resume(s: Save) {
  try {
    const g = new Game(D, s.seed);
    const reps: YearReport[] = [];
    let i = 0;
    lastRep = null;
    while (!g.finished) {
      if (g.pendingDecision) {
        if (i >= s.choices.length) break;
        g.choose(s.choices[i++]);
        continue;
      }
      if (lastRep && lastRep.age >= (s.age ?? 0) && i >= s.choices.length) break;
      const r = g.step();
      reps.push(r); lastRep = r;
      if (r.reflection && s.refl[String(r.reflection.age)]) g.answerReflection(r.reflection.age, s.refl[String(r.reflection.age)]);
    }
    startPlay(g, s, reps);
    if (lastRep) sceneFor(lastRep);
    if (g.finished) finishLife();
  } catch (e) {
    console.warn("kayıt okunamadı", e);
    store.del(KEY_CUR);
    home();
  }
}

// ------------------------------------------------------------------ hayatın sonu

function finishLife() {
  stopTimer();
  if (!G) return;
  const g = G;
  store.del(KEY_CUR);
  const btn = h("button", "btn big", "Hayatının özeti");
  btn.id = "ozet";
  btn.onclick = () => summary(g);
  const dec = $("#decision");
  dec.innerHTML = "";
  dec.classList.remove("hidden");
  dec.append(btn);
}

function summary(g: Game) {
  const s = g.summary();
  const a = app();
  a.innerHTML = "";
  a.className = "screen end";
  const card = h("div", "card");
  card.append(h("div", "kicker", "Bir ömür"));
  card.append(h("h1", "", s.name || (s.sex === "female" ? "Bir kız" : "Bir oğlan")));
  card.append(h("p", "big-line", `${s.birthYear} – ${s.deathYear ?? "?"} · ${s.country} · ${s.age} yıl`));
  if (s.cause) card.append(h("p", "", `Ölüm nedeni: ${s.cause}.`));
  if (s.causeStat) { const st = h("div", "stat"); st.append(h("span", "", s.causeStat.text), h("small", "", ` Kaynak: ${s.causeStat.kaynak}`)); card.append(st); }
  card.append(h("p", "fine", `${suffix(s.country, "de")} bugün doğan bir ${s.sex === "female" ? "kızın" : "oğlanın"} beklenen ömrü ${s.e0.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} yıl (BM WPP 2024, 2026 dönem tablosu).`));
  a.append(card);

  const map = h("div", "card");
  map.append(h("h2", "", "Yaşam haritası"));
  const grid = h("div", "grid");
  const info = h("p", "fine", "Bir kareye dokun.");
  s.tones.forEach((t, i) => {
    const sq = h("i");
    sq.style.background = TONE_COLOR[t];
    sq.title = `${i} yaş`;
    sq.onclick = () => {
      const es = g.s.log.filter((e) => e.age === i && !e.key.endsWith(":soru"));
      info.textContent = `${i} yaş (${s.birthYear + i}): ${es.length ? es[0].text : "Sakin bir yıl."}`;
    };
    grid.append(sq);
  });
  map.append(grid, info);
  const legend = h("div", "legend");
  for (const t of ["iyi", "onemli", "kotu", "kayip", "notr"] as Tone[]) { const l = h("span"); const dot = h("i"); dot.style.background = TONE_COLOR[t]; l.append(dot, document.createTextNode(TONE_NAME[t])); legend.append(l); }
  map.append(legend);
  a.append(map);

  const mom = h("div", "card");
  mom.append(h("h2", "", "Önemli anlar"));
  const ul = h("ul", "moments");
  for (const e of s.moments.slice(0, 40)) { const li = h("li"); li.append(h("b", "", `${e.age} · `), document.createTextNode(e.text)); ul.append(li); }
  mom.append(ul);
  a.append(mom);

  const ppl = h("div", "card");
  ppl.append(h("h2", "", "Hayatındaki insanlar"));
  const pl = h("ul", "moments");
  for (const p of s.people) {
    if (p.role === "pet") continue;
    const li = h("li");
    li.textContent = `${p.phrase}${p.alive ? " — hayatta" : ` — ${p.deathAge} yaşında öldü${p.cause ? ` (${p.cause})` : ""}`}`;
    pl.append(li);
  }
  ppl.append(pl);
  a.append(ppl);

  const answered = s.reflections.filter((r) => r.answer);
  if (answered.length) {
    const rf = h("div", "card");
    rf.append(h("h2", "", "Yansımaların"));
    for (const r of answered) rf.append(h("p", "fine", `${r.age} yaş — ${r.question} → ${r.answer}`));
    a.append(rf);
  }

  const last = h("div", "card");
  last.append(h("h2", "", "Son söz"));
  const ta = h("textarea");
  ta.placeholder = "Bu insana bir şey söylemek ister misin?";
  ta.maxLength = 280;
  last.append(ta);
  a.append(last);

  const bar = h("div", "home-bottom");
  const again = h("button", "btn big", "Yeniden doğ");
  again.id = "yeniden";
  const record = () => {
    const arch = store.get<ArchiveItem[]>(KEY_ARCH) ?? [];
    if (!arch.some((x) => x.seed === g.seed)) {
      arch.push({ seed: g.seed, name: s.name, country: s.country, age: s.age, cause: s.cause, sex: s.sex, tones: s.tones, word: ta.value.trim() || undefined, when: new Date().toISOString().slice(0, 10) });
      store.set(KEY_ARCH, arch.slice(-50));
    }
  };
  again.onclick = () => { record(); birthCard(newSeed()); };
  const back = h("button", "btn alt", "Ana ekran");
  back.onclick = () => { record(); home(); };
  bar.append(again, back);
  a.append(bar);
  window.scrollTo(0, 0);
}

// ------------------------------------------------------------------ test kancası (başsız tarayıcı denemesi için)

declare global { interface Window { __birOmur?: unknown } }
window.__birOmur = {
  /** Otomatik karar ver (yalnız deneme için). */
  auto: () => { if (G?.pendingDecision) pickOption(G.autoChoose()); else { const r = document.getElementById("refl"); if (r && !r.classList.contains("hidden")) (r.querySelector("button.opt") as HTMLButtonElement | null)?.click(); } },
  state: () => ({ finished: G?.finished ?? null, age: lastRep?.age ?? null, country: G?.country.iso3 ?? null, pending: !!G?.pendingDecision }),
  tick: () => tick(),
};

window.addEventListener("DOMContentLoaded", home);
