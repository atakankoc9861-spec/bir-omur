// "dem" — Bir Ömür sohbet demosunun arayüzü. Tek dosyaya derlenir: prototype/sohbet-demo.html
import { Game, AYLAR, AY_YIL, xPreview, type ChatId, type Msg, type ActiveAsk, type MonthSummary, type Opt } from "./motor";
import { chatName, senderName, GROUPS, kalanlar, yerKisa, neden, durum } from "./icerik";
import { photo, kartResim, portre, simge, type PortreTarif } from "./gorsel";
import type { Raster } from "../scene";
import { hash } from "../scene/palette";

const app = document.getElementById("app")!;
const HIZ = Number(new URLSearchParams(location.search).get("hiz")) || 1;
let g: Game;
let screen: "kilit" | "liste" | "sohbet" | "gecis" | "son" = "kilit";
let cur: ChatId | null = null;
let timer = 0;
let lastRenderedId = 0;
const openVoices = new Set<number>();
const imgCache = new Map<string, string>();
let ipucuGosterildi = false;
let birakOnay = 0;

/* ---------- yardımcılar ---------- */
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl = (t: string) => esc(t).replace(/\n/g, "<br>");
function dataUrl(key: string, make: () => Raster): string {
  let u = imgCache.get(key);
  if (u) return u;
  const r = make();
  const c = document.createElement("canvas");
  c.width = r.w;
  c.height = r.h;
  c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(r.data), r.w, r.h), 0, 0);
  u = c.toDataURL();
  imgCache.set(key, u);
  return u;
}

function portreTarif(who: string): PortreTarif {
  const k = g.s.k;
  const sd = g.s.seed;
  const h = (n: number) => hash(sd, n) % 100;
  switch (who) {
    case "anne": return { sex: "female", age: 47, seed: hash(sd, 11), scarf: h(1) < 35 };
    case "baba": return { sex: "male", age: 51, seed: hash(sd, 12), mustache: h(2) < 55, glasses: h(3) < 30 };
    case "kardes": return { sex: k.kardes.sex, age: 12, seed: hash(sd, 13) };
    case "teyze": return { sex: "female", age: 44, seed: hash(sd, 14), scarf: h(4) < 45 };
    case "kanka": return { sex: k.kanka.sex, age: 18, seed: hash(sd, 15) };
    case "ilgi": return { sex: k.ilgi.sex, age: 18, seed: hash(sd, 16) };
    case "etut": return { sex: k.etut.sex, age: 18, seed: hash(sd, 17), glasses: h(5) < 50 };
    case "patron": return { sex: "male", age: 38, seed: hash(sd, 18), mustache: h(6) < 40 };
    case "rehber": return { sex: "female", age: 41, seed: hash(sd, 19), glasses: true };
    default: {
      const i = Number(who.slice(1));
      return { sex: k.sinif[i]?.sex ?? "male", age: 18, seed: hash(sd, 30 + i) };
    }
  }
}
function avatar(chat: ChatId | string, cls = "av"): string {
  const simgeler: Record<string, "aile" | "sinif" | "kurs" | "sonuc"> = { aile: "aile", sinif: "sinif", kurs: "kurs", sonuc: "sonuc" };
  const src = simgeler[chat] ? dataUrl("s:" + chat, () => simge(simgeler[chat])) : dataUrl(`p:${g.s.seed}:${chat}`, () => portre(portreTarif(chat)));
  return `<img class="${cls}" src="${src}" alt="">`;
}
const SENDER_COLORS = ["#ffb35c", "#7fd1c7", "#f08a9b", "#a7b4ff", "#c9e27a", "#f2c46d", "#d6a2f0", "#8fd0ff"];
const senderColor = (from: string) => SENDER_COLORS[hash(from.length * 31 + from.charCodeAt(0) + (from.charCodeAt(1) || 0)) % SENDER_COLORS.length];

function preview(m: Msg): string {
  if (m.kind === "voice") return `🎤 Sesli mesaj (${dur(m.text)})`;
  if (m.kind === "photo") return "📷 Fotoğraf" + (m.text ? " · " + m.text : "");
  if (m.kind === "card") return "🖼️ " + m.text;
  if (m.kind === "result") return "📄 " + m.text.split("\n")[0];
  return m.text;
}
const dur = (t: string) => {
  const sec = Math.max(3, Math.round(t.length / 13));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};
const ticks = (m: Msg) => (m.from !== "me" ? "" : `<span class="tk ${m.tick === 3 ? "okundu" : ""}">✓✓</span>`);

function chatsSorted(): ChatId[] {
  const last = new Map<ChatId, number>();
  for (const m of g.s.msgs) last.set(m.chat, m.id);
  return [...last.keys()].sort((a, b) => last.get(b)! - last.get(a)!);
}
function akşamlar(): string {
  const max = g.budgetMax;
  let h = "";
  const b = g.s.budget;
  for (let i = 0; i < max; i++) {
    const kilit = g.s.yedek > 0 && i === max - 1;
    const c = kilit ? "kilit" : b >= i + 1 ? "dolu" : b >= i + 0.5 ? "yarim" : "";
    h += `<i class="bardak ${c}"></i>`;
  }
  return h;
}
function statusBar(): string {
  const last = g.s.msgs[g.s.msgs.length - 1];
  return `<div class="statu"><span>${last?.time ?? "07:12"}</span><span class="ay">${AYLAR[Math.min(11, g.s.month)]} ${AY_YIL(Math.min(11, g.s.month))}</span><span class="pil"><i></i></span></div>`;
}

/* ---------- kilit ekranı ---------- */
function kilit(): void {
  screen = "kilit";
  const k = g.s.k;
  app.innerHTML = `
  <div class="kilit">
    <div class="kilit-ust"><div class="saat">07:12</div><div class="gun">Pazartesi · Eylül</div></div>
    <div class="bildirimler">
      <div class="bil" style="animation-delay:.5s">${avatar("anne", "av kucuk")}<div><b>Annem</b><p>Günaydın ${k.me.sex === "female" ? "kızım" : "oğlum"}. Kahvaltı hazır…</p></div></div>
      <div class="bil" style="animation-delay:1.3s">${avatar("kanka", "av kucuk")}<div><b>${esc(k.kanka.ad)}</b><p>uyandın mı</p></div></div>
      <div class="bil" style="animation-delay:2.1s">${avatar("sinif", "av kucuk")}<div><b>12-C 🦅 SON SENE</b><p>7 yeni mesaj</p></div></div>
    </div>
    <div class="kilit-alt">
      <p class="kim">${esc(k.me.ad)} ${esc(k.soyad)} · 17 yaşında · İstanbul</p>
      <p class="son-sene">Son sene. Haziran'da sınav var.</p>
      <button id="ac" class="ac">Kilidi aç</button>
    </div>
  </div>`;
  document.getElementById("ac")!.onclick = () => {
    g.startMonth();
    // kilit ekranındaki üç bildirim gelmiş olsun
    for (let i = 0; i < 200 && new Set(g.s.msgs.map((m) => m.chat)).size < 3 && g.queue.length; i++) g.advance(200);
    liste();
    startClock();
  };
}

/* ---------- saat ---------- */
function startClock(): void {
  stopClock();
  timer = window.setInterval(() => {
    if (screen !== "liste" && screen !== "sohbet") return;
    const msgs = g.advance(140 * HIZ);
    if (msgs.length) onDelivered(msgs);
    else refreshTyping();
  }, 100);
}
function stopClock(): void {
  if (timer) clearInterval(timer);
  timer = 0;
}
let bannerAt = 0;
function onDelivered(msgs: Msg[]): void {
  const here = msgs.filter((m) => m.chat === cur);
  const away = msgs.filter((m) => m.chat !== cur && m.from !== "me");
  if (screen === "sohbet" && cur) {
    if (here.length) {
      g.openChat(cur);
      renderMessages();
    }
    renderHeader();
    renderReply();
  } else liste(false);
  if (away.length) banner(away[away.length - 1]);
  if (g.not) {
    toast(g.not);
    g.not = null;
    if (screen === "liste") liste(false);
  }
}
function refreshTyping(): void {
  if (screen === "sohbet" && cur) {
    renderHeader();
    const t = g.typing(cur);
    const el = document.getElementById("yaziyor");
    if (el) el.style.display = t ? "flex" : "none";
  } else if (screen === "liste") {
    for (const c of chatsSorted()) {
      const el = document.querySelector(`[data-c="${c}"] .on`);
      if (!el) continue;
      const t = g.typing(c);
      if (t && !el.classList.contains("yz")) {
        el.classList.add("yz");
        el.textContent = GROUPS.includes(c) ? `${senderName(g.s, t)} yazıyor…` : "yazıyor…";
      } else if (!t && el.classList.contains("yz")) liste(false);
    }
  }
}
function banner(m: Msg): void {
  const now = Date.now();
  let b = document.getElementById("banner");
  if (!b) {
    b = document.createElement("div");
    b.id = "banner";
    document.querySelector(".telefon")?.appendChild(b);
  }
  const grp = GROUPS.includes(m.chat) || m.chat === "kurs" || m.chat === "sonuc";
  b.innerHTML = `${avatar(m.chat === "aile" || m.chat === "sinif" || m.chat === "kurs" || m.chat === "sonuc" ? m.chat : m.from, "av kucuk")}<div><b>${esc(chatName(g.s, m.chat))}</b><p>${grp && m.from !== "sys" ? esc(senderName(g.s, m.from)) + ": " : ""}${esc(preview(m))}</p></div>`;
  b.className = "goster";
  b.onclick = () => ac(m.chat);
  if (now - bannerAt > 1500) navigator.vibrate?.(10);
  bannerAt = now;
  window.clearTimeout((b as any)._t);
  (b as any)._t = window.setTimeout(() => b!.classList.remove("goster"), 2600);
}

/* ---------- sohbet listesi ---------- */
function liste(full = true): void {
  screen = "liste";
  cur = null;
  const rows = chatsSorted()
    .map((c) => {
      const msgs = g.s.msgs.filter((m) => m.chat === c);
      const last = msgs[msgs.length - 1];
      const un = g.unread(c);
      const t = g.typing(c);
      const own = { kanka: "kanka", ilgi: "ilgi", etut: "etut", kardes: "kardes", patron: "patron" }[c as string];
      const sus = own && own in g.s.kus;
      const bekliyor = g.askFor(c);
      const onizleme = t
        ? `<span class="on yz">${GROUPS.includes(c) ? esc(senderName(g.s, t)) + " yazıyor…" : "yazıyor…"}</span>`
        : `<span class="on">${last.from === "me" ? ticks(last) + " " : GROUPS.includes(c) && last.from !== "sys" ? `<b>${esc(senderName(g.s, last.from))}:</b> ` : ""}${esc(preview(last).split("\n").join(" "))}</span>`;
      return `<div class="satir ${sus ? "sus" : ""}" data-c="${c}">
        ${avatar(c)}
        <div class="orta"><div class="ust"><b>${esc(chatName(g.s, c))}</b><span class="zaman ${un ? "vurgu" : ""}">${last.time}</span></div>
        <div class="alt">${onizleme}${c === "sinif" ? '<span class="sessiz">🔕</span>' : ""}${un ? `<span class="rozet ${c === "sinif" ? "gri" : ""}">${un}</span>` : bekliyor && !bekliyor.answered ? '<span class="nokta"></span>' : ""}</div></div>
      </div>`;
    })
    .join("");
  const bekleyen = g.asks.filter((a) => !a.answered).length;
  const ayAdi = AYLAR[Math.min(11, g.s.month + 1)];
  const sonAy = g.s.month >= 11;
  const html = `
  <div class="telefon">
    ${statusBar()}
    <button class="tutamac" id="tutamac" aria-label="Durum paneli"><i></i></button>
    <header class="uygulama"><div class="logo">dem<span>.</span></div>
      <button class="aksam" id="aksam"><span>bu ay</span>${akşamlar()}</button></header>
    <div class="liste">${rows}</div>
    <div class="bırak"><button id="birak" class="${!g.queue.length && (bekleyen === 0 || g.s.budget === 0) ? "nabiz" : ""}">${birakOnay > Date.now() ? `${bekleyen} sohbet cevap bekliyor. Yine de bırak?` : `Telefonu bırak <small>→ ${sonAy ? "yılın sonu" : ayAdi}</small>`}</button></div>
    ${!ipucuGosterildi ? `<div class="ipucu" id="ipucu"><b>Bu ay ${g.budgetMax} akşamın var.</b><br>Kısa cevap yarım akşam, sohbet bir akşam. Kilitli bardak önemli bir an için saklı.<br><small>Aşağı çek: durum paneli</small></div>` : ""}
  </div>`;
  if (full || !document.querySelector(".liste")) app.innerHTML = html;
  else {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const l = document.querySelector(".liste")!;
    const sc = l.scrollTop;
    l.innerHTML = tmp.querySelector(".liste")!.innerHTML;
    l.scrollTop = sc;
    document.querySelector(".statu")!.outerHTML = tmp.querySelector(".statu")!.outerHTML;
    document.getElementById("aksam")!.innerHTML = tmp.querySelector("#aksam")!.innerHTML;
    document.getElementById("birak")!.outerHTML = tmp.querySelector("#birak")!.outerHTML;
  }
  for (const el of document.querySelectorAll<HTMLElement>(".satir")) el.onclick = () => ac(el.dataset.c as ChatId);
  document.getElementById("birak")!.onclick = birak;
  document.getElementById("aksam")!.onclick = panelAc;
  document.getElementById("tutamac")!.onclick = panelAc;
  cekmeKur();
  const ip = document.getElementById("ipucu");
  if (ip) {
    ip.onclick = () => { ipucuGosterildi = true; ip.remove(); };
    window.setTimeout(() => { ipucuGosterildi = true; ip.classList.add("git"); }, 5200);
  }
}
/* ---------- durum paneli ---------- */
function panelAc(): void {
  if (document.getElementById("panel")) return;
  const d = durum(g.s, g.s.budget + g.s.yedek);
  const ok = (y: number) => (y > 0 ? '<b class="yukari">↑</b>' : y < 0 ? '<b class="asagi">↓</b>' : '<b class="sabit">·</b>');
  const el = document.createElement("div");
  el.id = "panel";
  el.innerHTML = `
    <div class="panel-ic">
      <div class="p-satir"><span>Akşamlar</span><div>${akşamlar()}</div></div>
      <p class="p-alt">${g.s.budget.toString().replace(".", ",")} akşam açık${g.s.yedek ? " · 1 akşam önemli bir an için ayrılmış" : ""}. Kalan akşamlar derse gider.</p>
      <div class="p-grid">
        <div><small>Ruh hâli</small><b>${d.ruh.puan}</b><p>${esc(d.ruh.anlam)}</p></div>
        <div><small>Uyku</small><b>${d.uyku.split(";")[0]}</b><p>${esc(d.uyku.split(";")[1] ?? "")}</p></div>
        <div><small>Bilgi (TYT net)</small><b>${d.net ? `${d.net.alt}–${d.net.ust}` : "—"}</b><p>${d.net ? esc(d.net.anlam) : "ilk deneme Kasım'da"}</p></div>
        <div><small>Cüzdan</small><p class="p-cuzdan">${esc(d.cuzdan)}</p></div>
      </div>
      <div class="p-hedef">
        <small>Hedef · ${esc(d.hedef)}</small>
        <div class="p-hedef-ust"><b>%${d.ihtimal}</b><span>${d.ihtimalAnlam}</span></div>
        <div class="p-bar"><i style="width:${d.ihtimal}%"></i></div>
        <p>Tahmini puan ${d.puan.alt}–${d.puan.ust}. Sınav günü stres, uyku ve şans da etkiler.</p>
        <p class="p-not">Tahmini, oyun içi: kurgu puan sistemi. Gerçek ÖSYM taban sıralamaları bu demoda kullanılmıyor.</p>
      </div>
      <small class="p-baslik">En yakın 5 kişi (bu ay)</small>
      ${d.yakinlar.map((y) => `<div class="p-kisi ${y.sustu ? "sus" : ""}">${avatar(y.who, "av kucuk")}<span>${esc(y.ad)}</span><div class="p-bag"><i style="width:${y.bag}%"></i></div>${y.sustu ? '<em>sustu</em>' : ok(y.yon)}</div>`).join("")}
      <small class="p-baslik">Bu ay ne değişti</small>
      <ul>${d.degisen.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <button id="panel-kapat">Kapat ⌃</button>
    </div>`;
  document.querySelector(".telefon")!.appendChild(el);
  requestAnimationFrame(() => el.classList.add("acik"));
  const kapat = () => { el.classList.remove("acik"); window.setTimeout(() => el.remove(), 300); };
  document.getElementById("panel-kapat")!.onclick = kapat;
  let y0 = 0;
  el.addEventListener("touchstart", (e) => (y0 = e.touches[0].clientY), { passive: true });
  el.addEventListener("touchend", (e) => { if (y0 - e.changedTouches[0].clientY > 60) kapat(); });
}
function cekmeKur(): void {
  const t = document.querySelector<HTMLElement>(".telefon");
  if (!t || (t as any)._cek) return;
  (t as any)._cek = 1;
  let y0 = -1;
  t.addEventListener("touchstart", (e) => { const y = e.touches[0].clientY; const l = t.querySelector(".liste"); y0 = y < 150 || (l && l.scrollTop <= 0) ? y : -1; }, { passive: true });
  t.addEventListener("touchend", (e) => { if (y0 >= 0 && e.changedTouches[0].clientY - y0 > 70) panelAc(); y0 = -1; });
}
function izGoster(): void {
  const iz = g.sonIz.filter((z) => z.ad !== "sinif" || true);
  const notu = g.not;
  g.not = null;
  if (!iz.length && !notu) return;
  const ad = (w: string) => (w === "anne" ? "Annen" : w === "baba" ? "Baban" : w === "sinif" ? "Sınıf" : senderName(g.s, w));
  const el = document.createElement("div");
  el.className = "iz";
  el.innerHTML = iz.map((z) => `<span class="${z.yon > 0 ? "yukari" : "asagi"}">${esc(ad(z.ad))} ${z.yon > 0 ? "↑" : "↓"}</span>`).join("") + (notu ? `<span class="not">${esc(notu)}</span>` : "");
  document.querySelector(".telefon")?.appendChild(el);
  window.setTimeout(() => el.classList.add("git"), 1900);
  window.setTimeout(() => el.remove(), 2400);
}

function toast(t: string): void {
  if (document.getElementById("ipucu")) return; // ipucu okunurken üstüne yazma
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = t;
  document.querySelector(".telefon")?.appendChild(el);
  window.setTimeout(() => el.remove(), 2800);
}
function birak(): void {
  const bekleyen = g.asks.filter((a) => !a.answered).length;
  if (bekleyen > 0 && g.s.budget > 0 && birakOnay < Date.now()) {
    birakOnay = Date.now() + 3500;
    liste(false);
    window.setTimeout(() => screen === "liste" && liste(false), 3600);
    return;
  }
  birakOnay = 0;
  stopClock();
  gecis(g.endMonth());
}

/* ---------- sohbet ekranı ---------- */
function ac(c: ChatId): void {
  screen = "sohbet";
  cur = c;
  g.openChat(c);
  lastRenderedId = Math.max(0, ...g.s.msgs.filter((m) => m.chat === c).map((m) => m.id)) - 0;
  app.innerHTML = `
  <div class="telefon sohbet-ekran">
    ${statusBar()}
    <header class="sohbet-ust"><button class="geri" id="geri">‹</button>${avatar(c)}<div><b>${esc(chatName(g.s, c))}</b><small id="alt"></small></div></header>
    <div class="mesajlar" id="mesajlar"></div>
    <div class="cevap" id="cevap"></div>
  </div>`;
  document.getElementById("geri")!.onclick = () => liste();
  cekmeKur();
  renderHeader();
  renderReply();
  renderMessages(true);
}
function renderHeader(): void {
  const el = document.getElementById("alt");
  if (!el || !cur) return;
  const t = g.typing(cur);
  const own = { kanka: "kanka", ilgi: "ilgi", etut: "etut", kardes: "kardes", patron: "patron" }[cur as string];
  let txt: string;
  if (t) txt = GROUPS.includes(cur) ? `${senderName(g.s, t)} yazıyor…` : "yazıyor…";
  else if (cur === "aile") txt = `${senderName(g.s, "anne")}, ${senderName(g.s, "baba")}, ${senderName(g.s, "kardes")}, ${senderName(g.s, "teyze")}, Sen`;
  else if (cur === "sinif") txt = `${g.s.k.sinif.map((c) => c.ad).join(", ")}, ${g.s.k.kanka.ad}, Sen`;
  else if (cur === "kurs" || cur === "sonuc") txt = "Bilgilendirme hesabı";
  else if (own && own in g.s.kus) txt = `son görülme ${AYLAR[g.s.kus[own]]}`;
  else txt = "son görülme bugün";
  el.textContent = txt;
  el.className = t ? "yz" : "";
}
function bubble(m: Msg, prev: Msg | undefined): string {
  const mine = m.from === "me";
  const grp = GROUPS.includes(m.chat);
  const yeni = m.id > lastRenderedId ? " yeni" : "";
  if (m.kind === "sys") return `<div class="sistem${yeni}">${nl(m.text)}</div>`;
  const ad = grp && !mine && prev?.from !== m.from ? `<div class="gonderen" style="color:${senderColor(m.from)}">${esc(senderName(g.s, m.from))}</div>` : "";
  const sag = `<span class="mz">${m.time}${ticks(m)}</span>`;
  let ic = "";
  if (m.kind === "text") ic = `<span class="metin">${nl(m.text)}</span>${sag}`;
  else if (m.kind === "voice") {
    const bars = Array.from({ length: 28 }, (_, i) => `<i style="height:${4 + (hash(m.id, i) % 16)}px"></i>`).join("");
    const acik = openVoices.has(m.id);
    ic = `<div class="ses" data-v="${m.id}"><button class="oynat">${acik ? "❚❚" : "▶"}</button><div class="dalga ${acik ? "caliyor" : ""}">${bars}</div><span class="sure">${dur(m.text)}</span></div>${acik ? `<div class="dokum">“${esc(m.text)}”</div>` : `<div class="dokum-ipucu">dokun, dinle</div>`}${sag}`;
  } else if (m.kind === "photo") {
    const src = dataUrl(`f:${g.s.seed}:${m.media}`, () => photo(m.media!, g.s.seed + hash(m.media!.length), g.s.k.me.sex));
    ic = `<img class="foto" src="${src}" alt="">${m.text ? `<span class="metin">${nl(m.text)}</span>` : ""}${sag}`;
  } else if (m.kind === "card") {
    const src = dataUrl(`k:${m.media}`, () => kartResim(m.media!, 7));
    ic = `<div class="kart"><img class="foto" src="${src}" alt=""><span class="kart-yazi k-${m.media}">${esc(m.text)}</span></div>${sag}`;
  } else if (m.kind === "result") {
    const [bas, ...rest] = m.text.split("\n");
    ic = `<div class="sonuc"><small>${esc(bas)}</small><b>${nl(rest.join("\n"))}</b></div>${sag}`;
  }
  const ayrac = !prev || prev.month !== m.month ? `<div class="ayrac">${AYLAR[m.month]} ${AY_YIL(m.month)}</div>` : "";
  return `${ayrac}<div class="balon ${mine ? "ben" : "o"} k-${m.kind}${yeni}">${ad}${ic}</div>`;
}
function renderMessages(first = false): void {
  const box = document.getElementById("mesajlar");
  if (!box || !cur) return;
  const msgs = g.s.msgs.filter((m) => m.chat === cur);
  const nearBottom = first || box.scrollHeight - box.scrollTop - box.clientHeight < 300;
  box.innerHTML = msgs.map((m, i) => bubble(m, msgs[i - 1])).join("") + `<div class="balon o yaziyor" id="yaziyor" style="display:${g.typing(cur) ? "flex" : "none"}"><i></i><i></i><i></i></div>`;
  if (!first) lastRenderedId = Math.max(lastRenderedId, ...msgs.map((m) => m.id));
  if (first) lastRenderedId = Math.max(0, ...msgs.map((m) => m.id));
  for (const el of box.querySelectorAll<HTMLElement>(".ses")) {
    el.onclick = () => {
      const id = Number(el.dataset.v);
      if (openVoices.has(id)) openVoices.delete(id);
      else openVoices.add(id);
      renderMessages();
    };
  }
  if (nearBottom) {
    const dip = () => (box.scrollTop = box.scrollHeight);
    dip();
    requestAnimationFrame(dip);
    for (const im of box.querySelectorAll("img")) if (!(im as HTMLImageElement).complete) im.addEventListener("load", dip, { once: true });
  }
}
function optLabel(o: Opt): string {
  const says = Array.isArray(o.say) ? o.say : [o.say];
  return says
    .map((t) => (t.startsWith("#foto:") ? "📷 fotoğrafı gönder" : t.startsWith("~ ") ? "🎤 sesli anlat" : esc(xPreview(g.s, t))))
    .join(" <span class='ok'>+</span> ");
}
function renderReply(): void {
  const el = document.getElementById("cevap");
  if (!el || !cur) return;
  const a: ActiveAsk | null = g.askFor(cur);
  const own = { kanka: "kanka", ilgi: "ilgi", etut: "etut", kardes: "kardes", patron: "patron" }[cur as string];
  if (!a) {
    el.innerHTML = cur === "kurs" || cur === "sonuc" ? `<div class="kapali">Bu hesaba cevap yazılamaz</div>` : `<div class="kapali">${own && own in g.s.kus ? "Yazacak bir şey bulamıyorsun." : "Şu an cevap bekleyen bir şey yok."}</div>`;
    return;
  }
  const key = a.beat.id + ":" + g.s.budget + ":" + g.s.yedek;
  if (el.dataset.k === key) return;
  el.dataset.k = key;
  const box = document.getElementById("mesajlar");
  const dipteydi = box ? box.scrollHeight - box.scrollTop - box.clientHeight < 300 : false;
  requestAnimationFrame(() => { if (box && dipteydi) box.scrollTop = box.scrollHeight; });
  el.innerHTML =
    `<div class="secenekler">` +
    a.opts
      .map((o, i) => {
        const cost = g.costOf(o);
        const ok = g.canAfford(o);
        const bardak = cost === 0.5 ? "<i class='bardak yarim'></i>" : "<i class='bardak dolu'></i>".repeat(cost);
        return `<button class="secenek" data-i="${i}" ${ok ? "" : "disabled"}><span>${optLabel(o)}</span><em>${bardak}</em></button>`;
      })
      .join("") +
    (g.s.budget < 0.5 ? `<div class="vakit-yok">${g.s.yedek ? "Açık akşamın kalmadı. Ayırdığın son akşam önemli bir an için bekliyor." : "Bu ay başka akşamın kalmadı."}</div>` : "") +
    `</div>`;
  for (const b of el.querySelectorAll<HTMLButtonElement>(".secenek")) {
    b.onclick = () => {
      const once = g.s.budget;
      g.answer(a, Number(b.dataset.i));
      el.dataset.k = "";
      const harcanan = once - g.s.budget;
      izGoster();
      const ak = document.createElement("span");
      ak.className = "iz-aksam";
      ak.textContent = harcanan === 0.5 ? "½ akşam" : `${harcanan} akşam`;
      document.querySelector(".iz")?.appendChild(ak);
      const msgs = g.advance(0);
      renderMessages();
      renderReply();
      if (msgs.length) onDelivered(msgs);
    };
  }
}

/* ---------- ay geçişi ---------- */
function gecis(sum: MonthSummary): void {
  screen = "gecis";
  const sinav = sum.kind === "sinav";
  const img = sinav ? "" : `<img class="gecis-foto" src="${dataUrl(`f:${g.s.seed}:oda:${sum.month}`, () => photo("oda", g.s.seed + sum.month * 13, g.s.k.me.sex))}" alt="">`;
  const next = g.ended ? "Yılın sonu" : AYLAR[g.s.month];
  app.innerHTML = `
  <div class="gecis ${sinav ? "sinav" : ""}">
    ${img}
    <h1>${sinav ? "Sınav günü" : esc(sum.title)}</h1>
    <div class="gecis-satirlar">${sum.lines.map((l, i) => `<p style="animation-delay:${0.6 + i * (sinav ? 1.1 : 0.8)}s">${esc(l)}</p>`).join("")}</div>
    <button id="devam" style="animation-delay:${0.8 + sum.lines.length * (sinav ? 1.1 : 0.8)}s">${esc(next)} →</button>
  </div>`;
  document.getElementById("devam")!.onclick = () => {
    if (g.ended) return son();
    g.startMonth();
    g.advance(2400);
    liste();
    startClock();
  };
}

/* ---------- yıl sonu ---------- */
function son(): void {
  screen = "son";
  stopClock();
  const ks = kalanlar(g.s);
  const nereye = yerKisa(g.s);
  app.innerHTML = `
  <div class="son">
    <p class="son-ust">Ağustos ${AY_YIL(11)}</p>
    <h1>O yıldan kalanlar</h1>
    <p class="nereye">Eylülde: <b>${esc(nereye)}</b></p>
    <p class="neden">${esc(neden(g.s))}</p>
    <div class="kalanlar">${ks
      .map((k, i) => `<div class="kalan ${k.canli ? "" : "sustu"}" style="animation-delay:${0.4 + i * 0.35}s">${avatar(k.chat)}<div><b>${esc(k.ad)}</b><p>${esc(k.satir)}</p></div><span class="durum">${k.canli ? "canlı" : "sustu"}</span></div>`)
      .join("")}</div>
    <p class="kapanis">Bir yıl, bir telefona sığdı.</p>
    <button id="yeniden">Bir hayat daha</button>
    <p class="not">Bir Ömür · sohbet demosu · Türkiye, 18 yaş</p>
  </div>`;
  document.getElementById("yeniden")!.onclick = () => basla(Date.now() % 1e9);
}

function basla(seed: number): void {
  g = new Game(seed);
  openVoices.clear();
  imgCache.clear();
  birakOnay = 0;
  kilit();
}

// Test kancası: başsız tarayıcı otomatik oynatırken kullanır.
(window as any).__dem = { get g() { return g; }, liste, ac, birak, basla, panelAc };
const q = new URLSearchParams(location.search);
basla(Number(q.get("tohum")) || Date.now() % 1e9);
