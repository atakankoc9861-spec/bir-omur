// Olaylar (storylet), kritik anlar, hayat sistemleri ve yansıma soruları.
// Metinlerin hepsi bu proje için yazıldı; orijinal oyundan metin yok.
// Rakam içeren her satırın kaynağı StatLine.kaynak alanında; kaynaksız ayarlar denge.ts'de.
import { DENGE } from "./denge";
import type { Game, GStorylet } from "./game";
import type { DecisionSpec, GPerson, OptionSpec, StatLine } from "./gtypes";
import type { Sex } from "./types";
import { suffix } from "./grammar";

type S = GStorylet;
type O = OptionSpec<Game>;
type D = DecisionSpec<Game>;

const F = DENGE.fx;
const pick = <T>(c: Game, a: readonly T[]): T => a[Math.floor(c.rng.next() * a.length)];
const yasOf = (c: Game, p: GPerson) => c.year - p.birthYear;

// ------------------------------------------------------------------ gramer

export const G: Record<string, readonly string[]> = {
  zaman: ["O yıl", "Bir gün", "Bir akşam", "Bir sabah", "Yılın sonuna doğru", "Bir pazar günü", "Havaların ısındığı günlerde", "Soğuk bir günde", "Yaz başında", "Bir bayram sabahı", "Okulların kapandığı hafta", "Yağmurlu bir öğleden sonra"],
  mevsim: ["ilkbahar", "yaz", "sonbahar", "kış"],
  vakit: ["sabahında", "akşamında", "gecesinde", "öğleden sonrasında"],
  sessizce: ["sessizce", "usulca", "kimseye bir şey demeden", "yavaş yavaş"],
  sicak: ["sıcacık", "yumuşak", "güven veren", "tanıdık"],
  koku: ["ekmek", "sabun", "yağmur sonrası toprak", "kızarmış soğan", "çay", "kül ve odun"],
  ses: ["bir radyonun cızırtısı", "uzaktan bir köpek havlaması", "komşu çocukların bağırışları", "tencere kapağının tıkırtısı", "yağmurun damdaki sesi", "bir motorun homurtusu"],
  hatira: ["Bunu yıllar sonra bile hatırlayacaksın.", "Bu an aklında kalıyor.", "Kimse fark etmese de senin için önemli bir gün bu.", "Küçük bir şey ama içinde bir yer ediniyor.", "O günün ışığı bile aklında kalıyor."],
  iyiHis: ["İçin ısınıyor.", "Bir süre gülümseyerek dolaşıyorsun.", "O gece rahat uyuyorsun.", "Kendini hafif hissediyorsun.", "Uzun zamandır böyle iyi hissetmemiştin."],
  agirHis: ["Göğsüne bir ağırlık çöküyor.", "Bir süre kimseyle konuşmak istemiyorsun.", "Geceleri uykun kaçıyor.", "Bir şeyler eksik kalmış gibi."],
  yorgun: ["yorgun ama memnun", "biraz bitkin", "omuzları düşmüş", "yüzünde yorgun bir gülümsemeyle"],
  kucukSey: ["bir avuç leblebi", "kâğıttan bir kuş", "renkli bir taş", "tahta bir kaşık", "eski bir kalem", "bir parça şeker"],
};

// ------------------------------------------------------------------ yardımcılar

function statU5(c: Game): StatLine {
  const u5 = c.country.under5.v;
  return { text: `${suffix(c.country.nameTr, "de")} doğan her 1000 bebekten yaklaşık ${c.num(u5)} tanesi beş yaşını görmeden ölüyor (${c.country.under5.yil} projeksiyonu).`, kaynak: c.src("wpp2024") };
}

function eduRate(c: Game, k: "primary" | "secondary" | "tertiary"): number | null {
  const e = c.country.edu[k];
  return e ? Math.min(0.995, e.v) : null;
}

function schoolStat(c: Game, k: "primary" | "secondary" | "tertiary"): StatLine | null {
  const e = c.country.edu[k];
  if (!e) return null;
  const ad = { primary: "", secondary: "ortaöğretim için", tertiary: "yükseköğretim için" }[k];
  const yer = suffix(c.country.nameTr, "de");
  const txt = k === "primary"
    ? `${yer} ilkokul çağındaki çocuklarda okula kayıt oranı ${c.pct(e.v)} (${e.yil}).`
    : `${yer} ${ad} brüt okullaşma oranı ${c.pct(e.v)} (${e.yil}; brüt oran yaş dışı öğrencileri de sayar, 100'ü geçebilir).`;
  return { text: txt, kaynak: c.src(e.kaynak) + " (UNESCO UIS kaynaklı)" };
}

function tfr(c: Game): number {
  const row = c.country.asfr.rows[0];
  return c.country.asfr.groups.reduce((s, [a, b], i) => s + (row[i] * (b - a + 1)) / 1000, 0);
}

function famMoney(c: Game): number {
  return c.baseIncome(c.s.familyDecile);
}

function familyPoor(c: Game) { return c.s.familyDecile <= 2; }

function schoolRule(c: Game) {
  const t = c.tur;
  if (!t) return null;
  return t.education.find((d) => d.from <= c.year && (d.to === null || c.year < d.to)) ?? null;
}

function startAge(c: Game) { return schoolRule(c)?.startAge ?? DENGE.schoolStartAge; }
function secondaryEnd(c: Game) { return schoolRule(c)?.endAge ?? DENGE.secondaryEndAge; }

function newFriend(c: Game, bond: number): GPerson {
  const sex: Sex = c.rng.chance(0.8) ? c.s.sex : c.s.sex === "female" ? "male" : "female"; // denge ayarı
  return c.addPerson("friend", sex, c.year - c.age + c.rng.int(-1, 1), { bond });
}

function startJob(c: Game) {
  const s = c.s;
  const eb = DENGE.mobility.edu[s.edu];
  s.job.decile = Math.max(0, Math.min(9, s.familyDecile + eb + c.rng.int(-DENGE.mobility.spread, DENGE.mobility.spread)));
  const w = c.tur?.womenEmployment;
  const pWork = s.sex === "female" ? (w ? w.female : DENGE.womenWorkShare) : w?.male ?? DENGE.menWorkShare;
  s.job.working = c.rng.chance(c.has("calismak-istiyor") ? Math.min(0.97, pWork + 0.25) : pWork);
  s.job.formal = s.job.working && c.rng.chance(Math.min(0.95, 0.15 + s.job.decile * 0.08 + (s.edu === "tertiary" ? 0.25 : s.edu === "secondary" ? 0.1 : 0))); // denge ayarı
  s.job.startYear = c.year;
}

function jobWord(c: Game): string {
  const d = c.s.job.decile;
  const u = c.s.urban;
  if (!c.s.job.working) return "ev ve bakım işleri";
  if (c.s.edu === "tertiary" && d >= 6) return pick(c, ["bir hastanede", "bir okulda", "bir büroda", "bir mühendislik firmasında", "bir laboratuvarda"]);
  if (!u) return pick(c, ["tarlada", "hayvanların başında", "köyün tek dükkânında", "bir inşaatta", "yakındaki kasabada bir atölyede"]);
  if (d <= 3) return pick(c, ["bir şantiyede", "pazarda bir tezgâhta", "bir atölyede", "evlere temizliğe giderek", "bir lokantanın mutfağında", "motosikletle paket taşıyarak"]);
  return pick(c, ["bir fabrikada", "bir mağazada", "bir depoda", "bir dükkânda", "bir otobüs firmasında", "bir bankanın şubesinde"]);
}

// ------------------------------------------------------------------ sistem metinleri

const T = {
  siblingBorn: [
    "Evde yeni bir ses var: #kisi.cap# doğdu. #anne.cap# yorgun ama gülümsüyor.",
    "#kisi.cap# dünyaya geldi. Artık evdeki en küçük sen değilsin.",
    "Bir gece evde koşuşturma oldu; sabah #kisi# vardı.",
  ],
  firstChild: [
    "#kisi.cap# doğdu. İlk kez kucağına aldığında ellerinin titrediğini fark ediyorsun.",
    "İlk çocuğun #kisiAd# dünyaya geldi. Bütün hayatın bir gecede yer değiştiriyor.",
  ],
  childBorn: [
    "#kisi.cap# doğdu. Ev biraz daha kalabalık, biraz daha gürültülü.",
    "Bir çocuğun daha oldu: #kisiAd.cap#. Büyükler küçüğü kucaklamak için sıraya giriyor.",
    "#kisiAd.cap# aramıza katıldı. Bu sefer daha az korkuyorsun, daha çok seviniyorsun.",
  ],
  personDies: [
    "#kisi.cap# #olumYas# yaşında hayatını kaybetti. Nedeni #neden#.",
    "#kisi.cap# öldü. #olumYas# yaşındaydı; doktorlar #neden# dedi. #agirHis.cap#",
    "Telefon gece çaldı: #kisi# #olumYas# yaşında, #neden# yüzünden hayatını kaybetmiş.",
    "#kisi.in.cap# ölüm haberi bir sabah geldi. #olumYas# yaşındaydı; nedeni #neden#.",
    "#kisiAd.cap# #olumYas# yaşında, #neden# nedeniyle aramızdan ayrıldı. Ona son söylediğin şeyi hatırlamaya çalışıyorsun.",
    "Cenazede herkes #kisiAd.in# bir huyunu anlattı. #olumYas# yaşındaydı; #neden# almıştı onu.",
    "#kisi.cap# artık yok. #olumYas# yaşındaydı. Nedenini sordular, #neden# dedin; asıl söylemek istediğin başka şeydi.",
  ],
  personDiesHome: [
    "#kisiAd.cap# artık yok. #olumYas# yaşında, #neden# yüzünden. Evde sesi eksik.",
    "#kisi.cap# #olumYas# yaşında, #neden# nedeniyle evde, aranızda öldü. Odasının kapısını bir süre kimse açmadı.",
    "#kisiAd.cap# #olumYas# yaşında, #neden# yüzünden öldü. Sofrada onun yeri günlerce boş kaldı.",
  ],
  childDies: [
    "#kisi.cap# #olumYas# yaşında öldü. Nedeni #neden#. Hiçbir kelime bunu anlatmıyor.",
    "#kisiAd.cap# #olumYas# yaşındayken #neden# yüzünden kaybettin. Ev bir daha eskisi gibi olmayacak.",
  ],
  petDies: ["#kisiAd.cap# yaşlandı ve bir sabah uyanmadı. Bahçede ona küçük bir yer açıyorsun.", "#kisiAd.cap# öldü. Kapının önünde seni bekleyen kimse yok artık."],
  dieInfant: [
    "Hayatın çok kısa sürdü. #yas.cap# yaşını göremeden, #neden# nedeniyle öldün.",
    "Daha çok küçükken, #neden# nedeniyle hayatını kaybettin. Ailen seni hiç unutmayacak.",
  ],
  dieYoung: ["#yas.cap# yaşında, #neden# nedeniyle hayatını kaybettin. Önünde uzun bir yol vardı."],
  dieAdult: [
    "#yas.cap# yaşında, #neden# nedeniyle hayatını kaybettin.",
    "#yas.cap# yaşında öldün. Nedeni #neden#.",
  ],
};

// ------------------------------------------------------------------ doğum

const birth: S = {
  id: "dogum",
  ages: [0, 0],
  tone: "onemli",
  important: true,
  prep: (c) => {
    c.vars.cins = c.s.sex === "female" ? "bir kız" : "bir erkek";
  },
  text: [
    "#yil.cap# yılında #ulke.de#, bir #yer.de# #cins# bebek olarak dünyaya geldin.",
    "#yil.cap#. #ulke.cap#, bir #yer#. #cins.cap# bebek olarak doğdun.",
  ],
  stat: (c) => statU5(c),
  fx: (c) => {
    const m = c.mother(), f = c.father();
    c.vars.anneYas = m ? String(yasOf(c, m)) : "";
    c.vars.babaYas = f ? String(yasOf(c, f)) : "";
    const sibs = c.alive("sibling").length;
    c.vars.kardesler = sibs === 0 ? "İlk çocuksun." : sibs === 1 ? "Evde bir kardeşin var." : `Evde ${sibs} kardeşin var.`;
    const inc = c.baseIncome(c.s.familyDecile);
    const rel = inc / c.medianIncome();
    c.vars.gelir = rel < 0.6 ? "Ailenin geliri bu ülkedeki çoğu ailenin altında." : rel > 1.6 ? "Ailen bu ülkedeki çoğu aileden rahat." : "Ailenin geliri bu ülkede ortalarda bir yerde.";
    c.say(["#anne.cap# #anneYas#, #baba# #babaYas# yaşında. #kardesler.cap# #gelir#"], "notr", { key: "aile", refs: [m, f].filter(Boolean) as GPerson[], stat: lifeStat(c) });
    if (c.s.givenName) c.say(["Adını #ben# koydular.", "Sana #ben# adını verdiler."], "notr", { key: "ad" });
  },
};

function lifeStat(c: Game): StatLine {
  const e = c.country.e0;
  return { text: `${suffix(c.country.nameTr, "de")} bugün doğan bir kızın beklenen ömrü ${c.num(e.female, 1)}, bir oğlanınki ${c.num(e.male, 1)} yıl (${e.yil} projeksiyonu, dönem yaşam tablosu).`, kaynak: c.src("wpp2024") };
}

// ------------------------------------------------------------------ hayat sistemleri (sıra önemli: kararsızlar önce)

const schoolStart: S = {
  id: "okul-basla",
  ages: [5, 8],
  tone: "onemli",
  important: true,
  when: (c) => c.age === startAge(c) && !c.has("okul-karar"),
  fx: (c) => {
    c.flag("okul-karar");
    const r = eduRate(c, "primary") ?? 0.9;
    const p = Math.min(0.995, r * DENGE.schoolIncomeMult[Math.floor(c.s.familyDecile / 2)]);
    if (c.rng.chance(p)) {
      c.s.inSchool = true; c.s.student = "primary";
      c.say(["#zaman.cap#, #anne# elini tutup seni okula götürdü. Çantan sırtına biraz büyük geliyor.", "Okul başladı. Sıranın tahtasına birinin kazıdığı harflere bakıyorsun.", "İlk gün okulun kapısında ağladın mı, yoksa koşarak mı girdin? Herkes başka anlatıyor."], "onemli", { key: "okul-ilk", important: true, stat: schoolStat(c, "primary") });
    } else {
      c.flag("okulsuz");
      c.say(["Yaşıtların okula başladı; sen evdesin. #anne.cap#, 'Bu yıl olmaz,' dedi.", "Okul uzak, para dar. Sen evde kalıp küçüklere bakıyorsun."], "kotu", { key: "okul-yok", important: true, stat: schoolStat(c, "primary") });
    }
  },
};

const schoolProgress: S = {
  id: "okul-ilerle",
  ages: [10, 26],
  max: 99,
  tone: "notr",
  when: (c) => c.s.inSchool,
  fx: (c) => {
    const s = c.s;
    const turRule = schoolRule(c);
    if (s.student === "primary" && c.age >= DENGE.primaryEndAge && !turRule) {
      s.edu = "primary";
      const r = eduRate(c, "secondary") ?? 0.8;
      const pr = eduRate(c, "primary") ?? 0.95;
      const p = Math.min(0.995, (r / Math.max(pr, 0.3)) * DENGE.schoolIncomeMult[Math.floor(s.familyDecile / 2)]);
      if (c.rng.chance(p)) { s.student = "secondary"; c.say(["İlkokul bitti. Yeni okulun koridorları daha uzun, öğretmenleri daha ciddi.", "Daha büyük bir okula geçtin. Defterlerin kalınlaştı."], "iyi", { key: "orta", stat: schoolStat(c, "secondary") }); }
      else { s.inSchool = false; s.student = "none"; c.flag("okul-birakti"); c.say(["İlkokuldan sonra okul bitti senin için. Artık evin ve işin bir parçasısın.", "Diploman elinde, ama sonraki okul yok. #baba.cap# 'Yeter bu kadar,' diyor."], "kotu", { key: "orta-yok", important: true, stat: schoolStat(c, "secondary") }); }
    } else if (s.student === "primary" && turRule && c.age >= 10) {
      s.student = "secondary"; s.edu = "primary";
    } else if (s.student === "secondary" && c.age >= secondaryEnd(c)) {
      s.edu = "secondary"; s.inSchool = false; s.student = "none";
      c.say(["Liseyi bitirdin. Okul bahçesinden son kez çıkarken arkana bakıyorsun.", "Ortaöğretim bitti. Fotoğrafta herkes gülüyor, sen biraz da korkuyorsun."], "onemli", { key: "lise-bitti", important: true });
    } else if (s.student === "tertiary" && c.has("uni-bas") && c.age - (s.counts["uni-yil"] ?? c.age) >= DENGE.universityYears) {
      s.edu = "tertiary"; s.inSchool = false; s.student = "none"; c.flag("uni-bitti");
      c.say(["Üniversiteyi bitirdin. Kep atılırken #anne# en önde alkışlıyor.", "Diplomanı aldın. Dört yıl hem çok uzun hem bir göz açıp kapama gibi geldi."], "onemli", { key: "uni-bitti", important: true });
      c.meter("knowledge", F.mid);
    }
  },
};

const jobStart: S = {
  id: "is-basla",
  ages: [14, 40],
  tone: "onemli",
  important: true,
  when: (c) => !c.s.inSchool && !c.s.job.working && !c.s.job.retired && !c.has("is-karar") && (c.has("mezun") || c.age >= 20 || ((c.has("okul-birakti") || c.has("okulsuz")) && c.age >= 14)),
  fx: (c) => {
    c.flag("is-karar");
    startJob(c);
    c.vars.is = jobWord(c);
    const w = c.tur?.womenEmployment;
    if (c.s.job.working) {
      c.say(["İlk kazancın #is# geldi. Parayı eline aldığında bir süre bakıyorsun.", "Çalışmaya başladın: #is.cap#. İlk hafta akşamları ayakların zonkluyor.", "Artık #is# çalışıyorsun. Eve getirdiğin ilk parayla #anne.e# bir şey alıyorsun."], "onemli", { key: "ilk-is", important: true });
      c.meter("happiness", 3);
    } else {
      const stat = c.s.sex === "female" && w && c.tur?.careTimeMinutes
        ? { text: `Türkiye'de 15 yaş üstü kadınlarda istihdam oranı ${c.pct(w.female, 1)} (${w.yil}). Kadınlar günde ortalama ${Math.floor(c.tur.careTimeMinutes.v / 60)} saat ${c.tur.careTimeMinutes.v % 60} dakikayı hane ve aile bakımına ayırıyor (${c.tur.careTimeMinutes.yil}).`, kaynak: "TÜİK İşgücü İstatistikleri 2024; TÜİK Zaman Kullanım Araştırması 2014-2015 (content/countries/TUR.json)" }
        : null;
      c.say(["Ücretli bir işin yok. Günlerin evin işleriyle, başkalarının bakımıyla doluyor; kimse buna iş demese de.", "İş aradın, olmadı. Şimdilik evde, ailenin işlerine yardım ediyorsun."], "notr", { key: "is-yok", important: true, stat });
    }
  },
};

const leaveHome: S = {
  id: "evden-cik",
  ages: [18, 40],
  tone: "onemli",
  important: true,
  when: (c) => !c.s.leftHome && !c.s.inSchool && (c.age >= 30 || c.rng.chance(c.s.job.working ? 0.18 : 0.06)), // denge ayarı
  fx: (c) => {
    c.s.leftHome = true;
    c.say(["Kendi evine çıktın. Küçük bir oda, eğreti bir masa, ama kapının anahtarı senin.", "Ailenin evinden ayrıldın. İlk gece sessizlik çok geliyor.", "Eşyalarını iki çantaya sığdırıp yola çıktın. #anne.cap# kapıda uzun süre el sallıyor."], "onemli", { key: "evden-cikis", important: true });
    for (const p of c.alive()) if (p.role === "mother" || p.role === "father" || p.role === "sibling") p.livesTogether = false;
  },
};

function militaryRule(c: Game) {
  const t = c.tur;
  if (!t) return null;
  return t.military.find((d) => d.from <= c.year && (d.to === null || c.year < d.to)) ?? null;
}

const military: S = {
  id: "askerlik",
  ages: [20, 41],
  tone: "onemli",
  countries: ["TUR"],
  when: (c) => c.s.sex === "male" && !c.has("askerlik-tamam") && !c.s.inSchool && !!militaryRule(c),
  choice: (c): D | null => {
    const r = militaryRule(c)!;
    const ops: O[] = [];
    const away = (ay: number) => (cc: Game) => {
      cc.flag("askerlik-tamam");
      cc.meter("happiness", -F.small);
      cc.meter("relationships", -F.small);
      cc.meter("health", 2);
      cc.money(-cc.income * (ay / 12) * 0.5);
      cc.vars.ay = String(ay);
      return ["#ay.cap# ay askerlik yaptın. Döndüğünde sokaklar aynı, sen biraz farklısın.", "Asker uğurlamasında #anne# ağladı. #ay.cap# ay sonra kapıda yine o vardı."];
    };
    if (r.er) ops.push({ id: "er", label: `Er olarak git (${r.er} ay)`, effect: away(r.er), tone: "onemli", important: true });
    if (r.yedekSubay && c.s.edu === "tertiary") ops.push({ id: "yedeksubay", label: `Yedek subay olarak git (${r.yedekSubay} ay, maaşlı)`, effect: (cc) => { cc.flag("askerlik-tamam"); cc.meter("knowledge", 2); cc.vars.ay = String(r.yedekSubay); return ["#ay.cap# ay yedek subay olarak görev yaptın. Bir bölüğün sorumluluğunu taşımak seni şaşırtacak kadar yordu."]; }, tone: "onemli", important: true });
    if (r.bedelliAy) {
      const cost = c.cost("bedelli");
      ops.push({ id: "bedelli", label: `Bedelli askerlik (${r.bedelliAy} ay temel eğitim)`, cost, locked: c.canAfford(cost) ? null : "Bedeli karşılayacak birikimin yok.", effect: (cc) => { cc.flag("askerlik-tamam"); cc.vars.ay = String(r.bedelliAy); return ["Bedelini ödedin, #ay# ay temel eğitimle askerliği bitirdin. Birikimin eridi ama işin yerinde duruyor."]; }, tone: "notr", important: true });
    }
    if (!ops.length) return null;
    const ret = c.tur?.conscientiousObjection === false ? " Vicdani ret yasal olarak tanınmıyor; alternatif sivil hizmet yok." : "";
    return {
      prompt: "Askerlik vakti geldi. Celp kâğıdı masanın üstünde duruyor.",
      options: ops,
      critical: true,
      stat: { text: `${c.year} kuralına göre: er olarak ${r.er ?? "?"} ay${r.yedekSubay ? `, yedek subay ${r.yedekSubay} ay` : ""}${r.bedelliAy ? `; bedelli askerlikte ${r.bedelliAy} ay temel eğitim` : ""}. Yükümlülük ${r.ageRange ? `${r.ageRange[0]}-${r.ageRange[1]}` : "20"} yaş arası erkekleri kapsar.${ret}`, kaynak: "7179 sayılı Askeralma Kanunu (content/countries/TUR.json)" },
    };
  },
};

function unionMean(c: Game, sex: Sex) {
  const f = c.tur?.firstMarriageAge;
  return f ? (sex === "female" ? f.female : f.male) : DENGE.firstUnionMeanAge[sex];
}

function minUnionAge(c: Game) {
  const legal = c.tur?.marriageLegal.find((d) => d.from <= c.year && (d.to === null || c.year < d.to));
  return Math.max(DENGE.unionMinAge, legal ? Math.max(legal.kadin, legal.erkek) : 0);
}

function marriageStat(c: Game): StatLine | null {
  const f = c.tur?.firstMarriageAge;
  if (!f) return null;
  return { text: `Türkiye'de ilk evlenme yaşı ortalaması ${f.yil}'te kadınlarda ${c.num(f.female, 1)}, erkeklerde ${c.num(f.male, 1)}.`, kaynak: "TÜİK Evlenme ve Boşanma İstatistikleri 2024 (content/countries/TUR.json)" };
}

const meet: S = {
  id: "tanisma",
  ages: [16, 70],
  max: 6,
  cooldown: 2,
  tone: "iyi",
  when: (c) => !c.partner() && c.age >= minUnionAge(c) && !c.has("yalniz-secim-" + Math.floor(c.age / 5)) &&
    c.rng.chance(DENGE.unionPeak * Math.exp(-(((c.age - unionMean(c, c.s.sex)) / 7) ** 2)) * (c.has("dul") ? 0.4 : 1) + 0.01),
  choice: (c): D => {
    const sex: Sex = c.s.sex === "female" ? "male" : "female";
    const gap = c.rng.int(DENGE.partnerAgeGap[0], DENGE.partnerAgeGap[1]) * (c.s.sex === "male" ? 1 : -1);
    const by = c.year - c.age - gap;
    // Kişi henüz eklenmedi: adı karar metninde geçsin diye geçici ad seçilir.
    const name = c.pickGiven(sex, by);
    c.vars.yeni = name ?? (sex === "female" ? "bir kadın" : "bir erkek");
    c.vars.nerede = pick(c, ["bir düğünde", "iş yerinde", "bir arkadaşının evinde", "otobüs durağında", "pazarda", "bir kursta", "bir yakınının cenazesinde", "telefondaki bir uygulamada"]);
    return {
      prompt: "#nerede.cap# #yeni# ile tanıştın. Konuşurken saatin nasıl geçtiğini anlamadın.",
      stat: marriageStat(c),
      options: [
        { id: "devam", label: "Görüşmeye devam et", effect: (cc) => { const p = cc.addPerson("partner", sex, by, { name: name ?? "", bond: 62, decile: Math.max(0, Math.min(9, cc.s.job.decile + cc.rng.int(-2, 2))) }); p.works = cc.rng.chance(sex === "female" ? (cc.tur?.womenEmployment?.female ?? DENGE.womenWorkShare) : (cc.tur?.womenEmployment?.male ?? DENGE.menWorkShare)); cc.target = p; cc.meter("happiness", F.mid); return ["#yeni.cap# ile buluşmalar sıklaştı. Telefonu her çaldığında kalbin hızlanıyor."]; }, tone: "iyi", important: true },
        { id: "arkadas", label: "Arkadaş olarak kal", effect: (cc) => { cc.meter("relationships", 2); return ["#yeni.cap# ile arkadaş kaldınız. Bazen bunun doğru olup olmadığını düşünüyorsun."]; } },
        { id: "yalniz", label: "Şimdilik kendi yolunda kal", effect: (cc) => { cc.flag("yalniz-secim-" + Math.floor(cc.age / 5)); cc.meter("happiness", 1); return ["Kendine zaman tanımaya karar verdin. Yalnızlık bazen bir oda dolusu sessizlik, bazen bir nefes."]; } },
      ],
    };
  },
};

const marry: S = {
  id: "evlilik",
  ages: [18, 75],
  max: 3,
  cooldown: 2,
  tone: "onemli",
  when: (c) => { const p = c.partner(); return !!p && !p.married && c.rng.chance(0.6); },
  pickPerson: (c) => c.partner(),
  choice: (c): D => {
    const wed = c.cost("wedding");
    const simple = Math.round(wed * 0.15);
    const marryFx = (cc: Game, big: boolean) => {
      const p = cc.partner()!;
      p.married = true; p.livesTogether = true; p.bond = Math.min(100, p.bond + 10);
      cc.flag("evli"); cc.flag("birlikte");
      cc.s.leftHome = true;
      for (const x of cc.alive()) if (x.role === "mother" || x.role === "father" || x.role === "sibling") x.livesTogether = false;
      cc.meter("happiness", big ? F.big : F.mid);
      return big ? ["Düğün sabaha kadar sürdü. #kisiAd.cap# ile artık evlisiniz; ayakların şişmiş, yüzün gülüyor.", "Kalabalık bir düğünle evlendiniz. Takılar, müzik, uykusuz bir gece."] : ["#kisiAd.cap# ile sade bir nikâhla evlendiniz. Akşam iki kişilik bir sofrada oturdunuz.", "Birkaç yakınla, gösterişsiz bir törenle evlendiniz. Ne eksik ne fazla."];
    };
    return {
      prompt: "#kisiAd.cap# ile bir süredir birliktesiniz. Evlilik konusu açıldı.",
      stat: marriageStat(c),
      options: [
        { id: "dugun", label: "Düğünle evlen", cost: wed, locked: c.canAfford(wed, 0.5) ? null : "Düğün masrafını şu an karşılayamazsınız.", effect: (cc) => marryFx(cc, true), tone: "onemli", important: true },
        { id: "nikah", label: "Sade bir nikâh", cost: simple, effect: (cc) => marryFx(cc, false), tone: "onemli", important: true },
        { id: "bekle", label: "Biraz daha bekle", effect: (cc) => { cc.bond(cc.partner(), -3); return ["Acele etmemeye karar verdiniz. #kisiAd.cap# bunu anlayışla karşıladı, ama bir süre suskun kaldı."]; } },
        { id: "ayril", label: "Yollarınızı ayır", effect: (cc) => { const p = cc.partner()!; p.role = "ex"; p.livesTogether = false; cc.meter("happiness", -F.mid); return ["#kisiAd.cap# ile ayrıldınız. Bazı akşamlar telefonu elinde, yazmadan bekliyorsun."]; }, tone: "kotu", important: true },
      ],
    };
  },
};

const kidsTalk: S = {
  id: "cocuk-istegi",
  ages: [20, 44],
  max: 3,
  cooldown: 4,
  tone: "notr",
  when: (c) => { const p = c.partner(); if (!p || !p.married) return false; const wa = c.s.sex === "female" ? c.age : yasOf(c, p); return wa <= 42 && (c.s.wantKids === null || c.s.wantKids === "later"); },
  pickPerson: (c) => c.partner(),
  choice: (c): D => ({
    prompt: "Bir akşam #kisiAd# sordu: 'Çocuk istiyor muyuz?'",
    stat: { text: `${suffix(c.country.nameTr, "de")} bugün kadın başına ortalama ${c.num(tfr(c), 2)} çocuk doğuyor (${c.country.e0.yil}, yaşa göre doğurganlıktan).`, kaynak: c.src("wpp2024") },
    options: [
      { id: "evet", label: "Evet, istiyoruz", effect: (cc) => { cc.s.wantKids = "yes"; cc.bond(cc.partner(), 4); return ["Kararı verdiniz. #kisiAd.cap# o gece uzun süre tavana bakıp gülümsedi."]; } },
      { id: "sonra", label: "Biraz daha bekleyelim", effect: (cc) => { cc.s.wantKids = "later"; return ["Şimdilik beklemeye karar verdiniz. Önce biraz yerleşmek istiyorsunuz."]; } },
      { id: "hayir", label: "Çocuk istemiyoruz", effect: (cc) => { cc.s.wantKids = "no"; return ["Çocuksuz bir hayat seçtiniz. Akrabalar sormaya devam edecek; siz kararınızdan eminsiniz."]; } },
    ],
  }),
};

/** Türkiye emeklilik yaşı: TUR.json emeklilik.donemler (5510 s.K.) — 2008 sonrası ilk sigortalılar için
 *  şartların tamamlandığı yıla göre kademeli yaş (baskaSart metni, oyunda_kullanilabilir: true). */
function turRetireAge(c: Game, completeYear: number): number | null {
  const t = c.tur;
  if (!t || !t.retirement.length) return null;
  const start = c.s.job.startYear ?? c.year;
  const rule = t.retirement.find((d) => d.from <= start && (d.to === null || start < d.to));
  if (!rule) return null;
  const f = c.s.sex === "female";
  // Kademeli yaş TUR.json baskaSart metninden okunur (gamedata.retirementSteps); yoksa dönemin sabit yaşı.
  let k = f ? rule.yasKadin : rule.yasErkek;
  for (const [y, kf, km] of rule.steps) if (completeYear >= y) k = f ? kf : km;
  return k;
}

function lastStep(c: Game): string {
  const st = c.tur?.retirement.find((d) => d.steps.length)?.steps;
  if (!st?.length) return "";
  const [y, kf, km] = st[st.length - 1];
  return kf === km ? ` (${y} yılından itibaren ${kf})` : ` (${y} yılından itibaren kadın ${kf}, erkek ${km})`;
}

const retire: S = {
  id: "emeklilik",
  ages: [50, 85],
  tone: "onemli",
  important: true,
  when: (c) => {
    const j = c.s.job;
    if (!j.working || j.retired) return false;
    if (c.isTur && j.formal) {
      const a = turRetireAge(c, c.year);
      const prim = c.tur?.retirement.find((d) => d.from <= (j.startYear ?? c.year) && (d.to === null || (j.startYear ?? c.year) < d.to))?.primGun ?? null;
      return a !== null && j.formalYears >= (prim ? prim / 360 : 20) && c.age >= a; // prim günü TUR.json'dan; yılda 360 gün varsayımı (denge)
    }
    if (c.isTur) return c.age >= DENGE.retireAgeRange[1] || (c.age >= DENGE.retireAgeRange[0] && c.s.meters.health < 40); // kayıt dışı çalışan: emekli maaşı yok
    return c.age >= DENGE.retireAgeRange[0] && (c.age >= DENGE.retireAgeRange[1] || c.s.meters.health < 40);
  },
  fx: (c) => {
    c.s.job.working = false; c.s.job.retired = true;
    const turRule = c.isTur && c.s.job.formal;
    c.say(turRule ? ["Emekli oldun. Son gün iş arkadaşların küçük bir pasta aldı.", "Emeklilik dilekçen onaylandı. Sabah alarmı kurmadan uyandığın ilk gün tuhaf geçti."] : ["Çalışmayı bıraktın. Ellerin bir süre ne yapacağını bilemedi.", "Artık işe gitmiyorsun. Günler daha uzun, maaş daha kısa."], "onemli", {
      key: "emekli", important: true,
      stat: turRule ? { text: `2008 sonrası ilk kez sigortalı olanlarda emeklilik için ${c.tur?.retirement.find((d) => d.primGun)?.primGun ?? "belirli"} gün prim ve şartların tamamlandığı yıla göre kademeli yaş şartı var${lastStep(c)}.`, kaynak: "5510 sayılı Kanun (content/countries/TUR.json)" } : null,
    });
    c.meter("happiness", 2);
  },
};

const turExam = (c: Game) => c.tur?.exams.find((e) => e.from <= c.year && (e.to === null || c.year < e.to) && e.yas === 17) ?? null;

// ------------------------------------------------------------------ çocukluk kritik anları (montaj)

const critical: S[] = [
  {
    id: "k-oyun", ages: [3, 3], tone: "notr", important: true,
    choice: () => ({
      prompt: "Üç yaşındasın. Bir öğleden sonra büyükler işle meşgul, sen bir köşede kendi başınasın.",
      critical: true,
      options: [
        { id: "merak", label: "Bir şeyin içini açıp ne olduğuna bak", effect: (c) => { c.meter("knowledge", F.small); c.meter("happiness", 1); return ["Eski bir saatin kapağını açtın. Çarkları görünce soluğun kesildi. #anne.cap# kızmadı, güldü."]; } },
        { id: "yakin", label: "Büyüklerin yanına sokul", effect: (c) => { c.meter("relationships", F.small); c.bond(c.mother(), 4); return ["#anne.cap# iş yaparken yanına oturdun, onun mırıldandığı şarkıyı sen de mırıldandın."]; } },
        { id: "kos", label: "Dışarıda öteki çocuklarla koş", effect: (c) => { c.meter("health", F.small); c.meter("happiness", 2); return ["Dizini sıyırdın, ağlamadın. Akşam üstün başın toz içinde eve döndün."]; } },
      ],
    }),
  },
  {
    id: "k-okul", ages: [6, 9], tone: "notr", important: true,
    when: (c) => c.has("okul-karar") && c.age === Math.max(6, startAge(c) + (c.has("okulsuz") ? 2 : 0)),
    choice: (c) => c.s.inSchool ? {
      prompt: "Okulun ilk haftaları. Öğretmen bir soru soruyor, sınıf susuyor.",
      critical: true,
      options: [
        { id: "parmak", label: "Parmak kaldır", effect: (cc) => { cc.meter("knowledge", F.small); cc.flag("cesur"); return ["Cevabın yarısı yanlıştı, ama öğretmen 'Aferin, denedin,' dedi. O günden beri en ön sıradasın."]; } },
        { id: "hayal", label: "Pencereden dışarı bak, hayal kur", effect: (cc) => { cc.meter("happiness", F.small); return ["Pencereden bir kuşun yuvasına taşıdığı çöpleri saydın. Defterinin kenarı resimlerle doldu."]; } },
        { id: "yanindaki", label: "Yanındaki çocuğa fısılda", effect: (cc) => { cc.meter("relationships", F.small); return ["Sıra arkadaşına cevabı fısıldadın. İkiniz de ceza aldınız ve ikiniz de güldünüz."]; } },
      ],
    } : {
      prompt: "Yaşıtların okuldan dönerken önlükleriyle geçiyor. Sen kapının önündesin.",
      critical: true,
      options: [
        { id: "iste", label: "Okula gitmek istediğini söyle", effect: (cc) => {
          const r = eduRate(cc, "primary") ?? 0.9;
          if (cc.rng.chance(Math.min(0.9, r))) { cc.s.inSchool = true; cc.s.student = "primary"; cc.flag("okulsuz", false); cc.s.familyDecile = Math.max(0, cc.s.familyDecile); cc.meter("knowledge", F.small); return ["Günlerce ısrar ettin. Sonunda #baba# seni okula yazdırdı; ev işleri akşama kaldı."]; }
          cc.meter("happiness", -F.small); return ["İstedin ama olmadı: okul uzak, yol masrafı çok. #anne.cap# 'Seneye,' dedi, seneye de olmadı."];
        } },
        { id: "yardim", label: "Evde ve işte yardıma devam et", effect: (cc) => { cc.meter("relationships", F.small); cc.money(famMoney(cc) * 0.05); return ["Sabahları suyu taşıyan, akşamları küçükleri uyutan sensin. Büyükler sana güveniyor."]; } },
        { id: "harf", label: "Okula giden komşu çocuğundan harf öğren", effect: (cc) => { cc.meter("knowledge", F.mid); cc.flag("kendi-ogrendi"); return ["Komşunun kızı her akşam sana o gün öğrendiklerini gösteriyor. Adını yazabiliyorsun artık."]; } },
      ],
    },
  },
  {
    id: "k-arkadas", ages: [8, 8], tone: "iyi", important: true,
    choice: (c) => {
      c.vars.nerede = c.s.inSchool ? "Sınıfa" : "Mahalleye";
      return {
        prompt: "#nerede.cap# yeni bir çocuk geldi. Herkes ona uzaktan bakıyor; o da yalnız oturuyor.",
        critical: true,
        options: [
          { id: "yanina", label: "Yanına git, yiyeceğini paylaş", effect: (cc) => { const f = newFriend(cc, 75); cc.target = f; cc.meter("relationships", F.mid); return ["Yanına oturup #kucukSey# uzattın. Adı #kisiAd#. O günden sonra hep beraber yürüdünüz."]; }, tone: "iyi", important: true },
          { id: "izle", label: "Uzaktan izle", effect: (cc) => { cc.flag("utangac"); return ["Birkaç gün uzaktan izledin. Sonra o da kendine başka arkadaşlar buldu."]; } },
          { id: "grup", label: "Kendi arkadaşlarınla kal", effect: (cc) => { cc.meter("relationships", 2); return ["Eski arkadaşlarınla oyununa devam ettin. Yeni çocuk bir süre sonra başka bir gruba karıştı."]; } },
        ],
      };
    },
  },
  {
    id: "k-hobi", ages: [10, 10], tone: "notr", important: true,
    choice: (c) => {
      const fam = famMoney(c);
      const sp = Math.round(fam * DENGE.cost.hobby), art = Math.round(fam * DENGE.cost.hobby * 1.5);
      const poor = c.s.familyDecile <= 1, mid = c.s.familyDecile <= 2;
      return {
        prompt: "On yaşındasın. Boş zamanında içini en çok ne kıpırdatıyor?",
        critical: true,
        options: [
          { id: "spor", label: "Bir spora başlamak", cost: sp, locked: poor ? "Ailenin buna ayıracak parası yok." : null, effect: (cc) => { cc.flag("hareketli"); cc.meter("health", F.mid); return ["Antrenmanlardan eve çamur içinde dönüyorsun. #baba.cap# maçlarına gelmeye başladı."]; } },
          { id: "sanat", label: "Müzik ya da resim", cost: art, locked: mid ? "Ders ve malzeme parası ailenin bütçesini aşıyor." : null, effect: (cc) => { cc.flag("sanat"); cc.meter("happiness", F.mid); return ["Eline aldığın ilk enstrümandan çıkan ses berbattı. Bırakmadın."]; } },
          { id: "kitap", label: "Bulduğun her şeyi okumak", effect: (cc) => { cc.flag("okur"); cc.meter("knowledge", F.mid); return ["Eline geçen her kâğıdı okuyorsun: eski gazeteler, ilaç prospektüsleri, ödünç kitaplar."]; } },
          { id: "yardim", label: "Ailenin işine yardım etmek", effect: (cc) => { cc.meter("relationships", F.small); cc.money(fam * 0.05); cc.flag("yardimci"); return ["Okul dışında #baba.in# ya da #anne.in# yanındasın. Para saymayı herkesten önce öğrendin."]; } },
        ],
      };
    },
  },
  {
    id: "k-ergen", ages: [13, 13], tone: "notr", important: true,
    choice: (c) => {
      if (c.s.familyDecile <= 3) {
        const opts: O[] = [
          { id: "calis-oku", label: "Okuldan sonra çalış", effect: (cc) => { cc.meter("health", -2); cc.meter("happiness", -2); cc.money(famMoney(cc) * 0.08); cc.flag("calismak-istiyor"); return ["Okuldan çıkınca bir dükkâna koşuyorsun. Ödevleri gece, mutfak masasında yapıyorsun."]; } },
          { id: "oku", label: "Sadece okula odaklan", locked: c.s.inSchool ? null : "Okula gitmiyorsun.", effect: (cc) => { cc.meter("knowledge", F.mid); cc.bond(cc.father(), -3); cc.meter("relationships", -2); return ["Ders çalışmayı seçtin. Evde kimse bir şey demiyor ama bakışlar ağır."]; } },
          { id: "birak", label: c.s.inSchool ? "Okulu bırakıp tam gün çalış" : "Tam gün çalışmaya başla", effect: (cc) => { cc.s.inSchool = false; cc.s.student = "none"; cc.flag("okul-birakti"); cc.meter("knowledge", -2); cc.money(famMoney(cc) * 0.2); cc.bond(cc.mother(), 3); return ["Artık sabahları okula değil, işe gidiyorsun. Evdeki tencere biraz daha dolu."]; }, tone: "kotu", important: true },
        ];
        return { prompt: "Evde para yetmiyor. Kimse açıkça söylemiyor ama herkes biliyor.", critical: true, options: opts };
      }
      const cost = Math.round(famMoney(c) * DENGE.cost.tutoring);
      return {
        prompt: "Ailen senin için büyük planlar yapıyor: özel ders, kurs, daha çok çalışma.",
        critical: true,
        options: [
          { id: "kabul", label: "Kabul et", cost, effect: (cc) => { cc.meter("knowledge", F.mid); cc.meter("happiness", -3); cc.flag("ozel-ders"); return ["Hafta sonların derslerle doldu. Notların yükseliyor, arkadaşlarınla daha az görüşüyorsun."]; } },
          { id: "kendi", label: "Kendi başına çalışacağını söyle", effect: (cc) => { cc.meter("knowledge", 2); cc.meter("happiness", 2); return ["Kendi düzenini kurdun. Bazen başarıyorsun, bazen saatlerce telefona bakıyorsun."]; } },
          { id: "baska", label: "Başka bir şeye yönel", effect: (cc) => { cc.meter("happiness", F.small); cc.bond(cc.mother(), -3); return ["Ders yerine kendi ilgini seçtin. Ailen hayal kırıklığını saklamaya çalışıyor."]; } },
        ],
      };
    },
  },
  {
    id: "k-ilk", ages: [15, 15], tone: "notr", important: true,
    choice: (c) => c.rng.chance(0.5) ? {
      prompt: "Bir akşam arkadaşların arasında biri sana sigara uzattı. Herkes sana bakıyor.",
      critical: true,
      options: [
        { id: "iç", label: "Bir nefes çek, ne olacak", effect: (cc) => { cc.flag("sigara"); cc.meter("relationships", 2); return ["Öksürdün, herkes güldü. Bir hafta sonra ikinciyi kendin istedin."]; }, tone: "kotu" },
        { id: "hayir", label: "Hayır de", effect: (cc) => { cc.meter("happiness", 1); return ["'Ben içmiyorum,' dedin. Kimse üstelemedi; şaşırdın."]; } },
        { id: "uzaklas", label: "O gruptan uzaklaş", effect: (cc) => { cc.meter("relationships", -3); cc.meter("health", 1); return ["Bir süre yalnız yürüdün. Sonra kendine başka bir yol buldun."]; } },
      ],
    } : {
      prompt: "Biri aklından çıkmıyor. Yanından geçerken sesin titriyor.",
      critical: true,
      options: [
        { id: "acil", label: "Duygularını söyle", effect: (cc) => {
          if (cc.rng.chance(0.55)) { const sex: Sex = cc.s.sex === "female" ? "male" : "female"; const ex = cc.addPerson("ex", sex, cc.year - cc.age + cc.rng.int(-1, 1), { bond: 50 }); cc.target = ex; cc.meter("happiness", F.mid); return ["#kisiAd.cap# de seni düşünüyormuş. Birkaç ay boyunca dünya çok parlaktı; sonra yaz bitti, siz de bittiniz."]; }
          cc.meter("happiness", -F.small); return ["Söyledin. Karşılık gelmedi. Yine de içinde bir şey hafifledi."];
        }, important: true },
        { id: "sakla", label: "İçinde tut, bir deftere yaz", effect: (cc) => { cc.meter("knowledge", 1); return ["Defterin yarısı ona yazılmış ama ona hiç gösterilmemiş cümlelerle doldu."]; } },
        { id: "arkadas", label: "En yakın arkadaşına anlat", locked: c.friend() ? null : "Anlatabileceğin kimse yok.", effect: (cc) => { cc.bond(cc.friend(), 8); return ["#arkadas.cap# gece yarısına kadar seni dinledi. Asıl o gece ne kadar yakın olduğunuzu anladın."]; } },
      ],
    },
  },
  {
    id: "k-sinav", ages: [17, 17], tone: "onemli", important: true,
    choice: (c) => {
      if (!c.s.inSchool || c.s.student !== "secondary") {
        return {
          prompt: "On yedi yaşındasın. Yaşıtlarının bir kısmı sınavlara hazırlanıyor; senin günlerin başka geçiyor.",
          critical: true,
          options: [
            { id: "zanaat", label: "Bir ustanın yanında zanaat öğren", effect: (cc) => { cc.flag("usta"); cc.meter("knowledge", F.small); cc.s.familyDecile = Math.min(9, cc.s.familyDecile + 1); return ["Ustanın atölyesinde ilk ay sadece süpürdün. Sonra eline ilk aleti verdi."]; } },
            { id: "sehir", label: c.s.urban ? "Daha büyük bir şehirde iş ara" : "Şehre gidip iş ara", cost: c.cost("move"), locked: c.canAfford(c.cost("move")) ? null : "Yol parası bile yok.", effect: (cc) => { cc.s.urban = true; cc.s.leftHome = true; cc.flag("goc"); cc.meter("happiness", -2); cc.s.familyDecile = Math.min(9, cc.s.familyDecile + 1); return ["Bir çantayla otobüse bindin. Şehrin ışıkları ilk gece hem korkuttu hem büyüledi."]; }, tone: "onemli", important: true },
            { id: "aile", label: "Ailenin işinde kal", effect: (cc) => { cc.meter("relationships", F.small); return ["Ailenin yanında kalmayı seçtin. Her yüzü, her yolu tanıyorsun; bu bir güven."]; } },
          ],
        };
      }
      const ex = c.isTur ? turExam(c) : null;
      c.vars.sinav = ex ? ex.ad : "üniversite giriş sınavı";
      const cost = Math.round(famMoney(c) * DENGE.cost.tutoring);
      const admit = (bonus: number) => (cc: Game) => {
        const t = eduRate(cc, "tertiary") ?? 0.3, sc = eduRate(cc, "secondary") ?? 0.8;
        const p = Math.min(0.9, Math.max(0.03, Math.min(0.85, t / Math.max(sc, 0.3)) * DENGE.schoolIncomeMult[Math.floor(cc.s.familyDecile / 2)] + bonus + (cc.s.meters.knowledge - 50) / 250));
        if (cc.rng.chance(p)) { cc.flag("kazandi"); return ["Sonuçlar açıklandı: kazandın. #anne.cap# komşulara haber vermek için kapıya koştu.", "Adını listede gördüğünde ekranı üç kez yeniledin. Kazanmışsın."]; }
        return ["Sonuçlar açıklandı. Yetmedi. Bir süre kimseyle konuşmak istemedin.", "Puanın tutmadı. #baba.cap# omzuna dokundu, bir şey demedi."];
      };
      return {
        prompt: "#sinav.cap# yaklaşıyor. Masanın üstünde deneme kitapları, kafanın içinde gürültü.",
        critical: true,
        stat: ex ? { text: `Türkiye'de üniversiteye giriş ${ex.ad} ile (${ex.from} yılından beri).`, kaynak: "ÖSYM / YÖK mevzuatı (content/countries/TUR.json)" } : schoolStat(c, "tertiary"),
        options: [
          { id: "gece", label: "Gece gündüz çalış", effect: (cc) => { cc.meter("health", -4); cc.meter("knowledge", F.mid); return admit(0.12)(cc); } },
          { id: "denge", label: "Dengeli çalış", effect: (cc) => { cc.meter("knowledge", F.small); return admit(0.04)(cc); } },
          { id: "dershane", label: "Kursa / özel derse git", cost, locked: c.s.familyDecile <= 2 ? "Ailenin kurs parası yok." : null, effect: (cc) => { cc.meter("knowledge", F.mid); cc.meter("happiness", -2); return admit(0.16)(cc); } },
          { id: "birak", label: "Sınavı boşver, çalışmaya başla", effect: (cc) => { cc.flag("calismak-istiyor"); cc.meter("happiness", 2); return ["Sınava girmedin. İçinde bir yer hep 'ya girseydim' diye soracak, ama cebinde paran var."]; } },
        ],
      };
    },
  },
  {
    id: "k-mezun", ages: [18, 19], tone: "onemli", important: true,
    when: (c) => !c.has("mezun") && !c.s.inSchool,
    choice: (c) => {
      const ops: O[] = [];
      if (c.has("kazandi")) {
        const mv = c.cost("move");
        ops.push({ id: "uni", label: "Üniversiteye git", cost: mv, locked: c.canAfford(mv, 1) ? null : "Yol, yurt ve kira masrafını karşılayamıyorsun.", effect: (cc) => { cc.flag("mezun"); cc.flag("uni-bas"); cc.s.counts["uni-yil"] = cc.age; cc.s.inSchool = true; cc.s.student = "tertiary"; cc.s.leftHome = true; cc.s.urban = true; for (const x of cc.alive()) if (x.role === "mother" || x.role === "father" || x.role === "sibling") x.livesTogether = false; cc.meter("knowledge", F.small); return ["Yurt odasında üç yatak, bir pencere var. Valizini açarken #anne.in# koyduğu kurabiyeleri buldun."]; }, tone: "onemli", important: true });
      }
      ops.push({ id: "is", label: "İş aramaya başla", effect: (cc) => { cc.flag("mezun"); cc.flag("calismak-istiyor"); return ["İlanlara bakıyorsun, tanıdıklara soruyorsun. Okul bitti; şimdi ne olacak?"]; } });
      if (!c.s.urban) ops.push({ id: "sehir", label: "Şehre göç et", cost: c.cost("move"), locked: c.canAfford(c.cost("move")) ? null : "Yol parası yok.", effect: (cc) => { cc.flag("mezun"); cc.s.urban = true; cc.s.leftHome = true; cc.flag("goc"); return ["Köyden ayrılan otobüste camdan dışarı baktın. Tanıdık tepeler bir bir geride kaldı."]; }, tone: "onemli", important: true });
      if (!c.has("kazandi") && c.s.edu === "secondary") ops.push({ id: "tekrar", label: "Bir yıl daha hazırlan", effect: (cc) => { cc.flag("mezun"); cc.meter("knowledge", F.small); if (cc.rng.chance(0.35)) { cc.flag("kazandi"); cc.flag("ikinci-sans"); return ["Bir yıl daha çalıştın ve bu sefer oldu: kazandın. Bir sonraki eylülde okula başlayacaksın."]; } return ["Bir yıl daha çalıştın. Yine olmadı. Bu kez başka bir yola bakma zamanı."]; } });
      return { prompt: "Okul hayatının sonu geldi. Önünde birkaç yol var ve hepsi bir şeyden vazgeçmek demek.", critical: true, options: ops };
    },
  },
];

// İkinci şans: bir yıl hazırlanıp kazananlar ertesi yıl üniversiteye başlar.
const lateUni: S = {
  id: "uni-gec",
  ages: [19, 30],
  tone: "onemli",
  important: true,
  when: (c) => c.has("kazandi") && c.has("mezun") && !c.has("uni-bas") && !c.s.job.working && c.has("ikinci-sans"),
  fx: (c) => {
    c.flag("uni-bas"); c.s.counts["uni-yil"] = c.age; c.s.inSchool = true; c.s.student = "tertiary"; c.s.leftHome = true; c.s.urban = true;
    c.flag("is-karar", false);
    c.say(["Sonunda üniversiteye başladın. Sınıftakilerden biraz büyüksün; bunu fark eden tek kişi sensin."], "onemli", { key: "uni-gec", important: true });
  },
};

// ------------------------------------------------------------------ anlatı olayları (karar yok)

/** Yası tutulan yakınlar: anne, baba, kardeş, eş, çocuk, en yakın arkadaş; ölümünden 1-6 yıl sonra. */
const mourned = (c: Game) => c.s.people.filter((p) => !p.alive && ["mother", "father", "sibling", "partner", "child", "friend"].includes(p.role) && p.deathYear !== undefined && c.year - p.deathYear >= 1 && c.year - p.deathYear <= 6 && p.bond >= 50);

const kin = (c: Game, roles: GPerson["role"][]) => {
  const l = c.alive().filter((p) => roles.includes(p.role));
  return l.length ? pick(c, l) : null;
};

const narrative: S[] = [
  { id: "ilk-adim", ages: [1, 1], tone: "iyi", important: true, text: ["İlk adımlarını attın. #anne.cap# ellerini çırparak seni çağırdı, sen ona doğru sendeledin.", "#zaman.cap#, masanın kenarını bırakıp üç adım attın. Evdeki herkes alkışladı."], fx: (c) => c.meter("happiness", 2) },
  { id: "ilk-kelime", ages: [1, 2], tone: "iyi", text: ["İlk kelimen çıktı. Herkes kendi adını söylediğini iddia ediyor.", "Bir sabah ilk kelimeni söyledin. #anne.cap# bunu bütün akrabalara tek tek anlattı."], fx: (c) => c.meter("relationships", 2) },
  { id: "bebek-hasta", ages: [0, 4], tone: "kotu", weight: (c) => 0.6 + c.country.under5.v / 40, max: 2, cooldown: 2, text: ["Ateşlendin. İki gece boyunca #anne# başından ayrılmadı.", "Uzun süren bir ishal seni çok zayıflattı. Ailen seni kucakta sağlık ocağına taşıdı.", "Öksürük nöbetleri haftalarca sürdü. Sonunda geçti; ama evde herkes korktu."], stat: statU5, fx: (c) => { c.meter("health", -F.mid); c.bond(c.mother(), 3); } },
  { id: "oyuncak", ages: [2, 5], tone: "iyi", text: ["En sevdiğin oyuncak #kucukSey#. Onu kimseye vermiyorsun.", "#baba.cap# eski bir tahtadan sana bir araba yonttu. Tekerlekleri dönmüyor, umurunda değil.", "Bir bez bebek bütün geceler koynunda. Kulağı çoktan kopmuş."], fx: (c) => c.meter("happiness", 2) },
  { id: "kardes-kavga", ages: [4, 14], tone: "notr", max: 2, cooldown: 4, pickPerson: (c) => kin(c, ["sibling"]), text: ["#kisi.cap# ile aynı şey için kavga ettiniz. Akşama barışmıştınız bile.", "#kisiAd.cap# senin defterini yırttı, sen de onun ayakkabısını sakladın. Ceza ikinize de çıktı.", "#kisi.cap# seni mahalledeki büyük çocuklardan korudu. Bunu hiç unutmadın."], fx: (c) => { c.bond(c.target, 4); } },
  { id: "kar-yagmur", ages: [3, 12], tone: "iyi", text: ["#zaman.cap# hava birden değişti. Sokaktaki bütün çocuklar dışarıya döküldü.", "Bütün gün yağmur yağdı. Pencereden damlaların yarışını izledin, hep aynı damla kazandı.", "Burnunda #koku# kokusu, kulağında #ses#. Sıradan bir gün; ama aklında kalacak."], fx: (c) => c.meter("happiness", 2) },
  { id: "tasinma-cocuk", ages: [3, 14], tone: "notr", weight: 0.5, text: ["Ailen başka bir eve taşındı. Eski evin duvarına adını kazıdın.", "Eşyalar bir kamyonetin arkasına yüklendi. Yeni mahallede ilk gün kimseyi tanımıyorsun."], fx: (c) => { c.meter("relationships", -2); c.meter("happiness", -1); } },
  { id: "ogretmen", ages: [7, 15], tone: "iyi", when: (c) => c.s.inSchool, text: ["Bir öğretmenin yazdığın şeyi sınıfa okudu. Yanakların yandı ama içten içe uçtun.", "Öğretmenin seni teneffüste yanına çağırıp 'Sende bir şey var,' dedi. Ne olduğunu sormadın."], fx: (c) => c.meter("knowledge", F.small) },
  { id: "bisiklet", ages: [6, 12], tone: "iyi", when: (c) => c.s.familyDecile >= 2, text: ["Bisiklet sürmeyi öğrendin. #kardes.cap# arkandan tutuyordu, bir ara bıraktığını fark etmedin.", "Biri sana eski bir bisiklet verdi. Zinciri hep çıkıyor, sen hep takıyorsun."], fx: (c) => { c.meter("health", 2); c.meter("happiness", 2); } },
  { id: "elektrik", ages: [4, 14], tone: "notr", text: ["Akşam ışıklar gitti. Mum ışığında herkes birbirine eski hikâyeler anlattı.", "Bir gece bütün aile aynı odada uyudu; dışarıda fırtına vardı ve kimse korkmuyormuş gibi yaptı."], fx: (c) => c.meter("relationships", 2) },
  { id: "bayram", ages: [4, 13], tone: "iyi", max: 2, cooldown: 3, text: ["Bir bayram günü yeni giysilerini giydin. Bütün gün kirletmemeye çalıştın, olmadı.", "Bayram sofrası kalabalıktı. Büyükler konuştu, çocuklar masanın altında kendi dünyasını kurdu."], fx: (c) => { c.meter("happiness", 3); c.meter("relationships", 2); } },
  { id: "ayna", ages: [12, 15], tone: "notr", text: ["Aynada kendine uzun uzun bakıyorsun. Yüzün değişiyor; sesin de.", "Bir sabah eski giysilerinin hiçbirinin olmadığını fark ettin. Bir anda büyümüşsün."] },
  { id: "arkadas-buldu", ages: [11, 16], tone: "iyi", important: true, when: (c) => !c.friend(), text: ["Bir yaz #kisiAd# ile tanıştın. Konuşmaya başladığınızda gece oldu.", "Aynı otobüsü bekleyen bir çocukla her sabah selamlaşıyordun. Bir gün konuştunuz ve bitmedi. Adı #kisiAd#."], prep: (c) => { const f = newFriend(c, 70); c.target = f; c.vars.kisiAd = f.name || "o"; }, fx: (c) => c.meter("relationships", F.mid) },
  { id: "arkadas-tasindi", ages: [10, 30], tone: "kotu", weight: 0.4, pickPerson: (c) => c.friend(), text: ["#kisi.cap# başka bir şehre taşındı. İlk aylar her hafta konuştunuz, sonra seyrekleşti.", "#kisiAd.cap# ile aranız soğudu. Kimse bir şey yapmadı; hayat araya girdi."], fx: (c) => { c.bond(c.target, -20); c.meter("relationships", -F.small); } },
  { id: "dede-nene", ages: [4, 12], tone: "notr", text: ["Büyüklerinden biri sana çocukluğundan bir hikâye anlattı. Hikâyede herkes yoksul ama herkes güçlüydü.", "Yaşlı bir akraba seni dizine oturtup sana eski bir şarkı öğretti."], fx: (c) => c.meter("knowledge", 1) },
  { id: "ilk-maas-harca", ages: [16, 30], tone: "iyi", when: (c) => c.s.job.working, text: ["İlk kez kendi paranla kendine bir şey aldın. Pahalı değildi, ama seçen sendin."], fx: (c) => c.meter("happiness", 2) },
  { id: "terfi", ages: [24, 60], max: 3, cooldown: 5, tone: "iyi", when: (c) => c.s.job.working && c.year >= c.s.job.unemployedUntil, weight: (c) => (c.s.edu === "tertiary" ? 1.4 : 0.8), text: ["İşte sorumluluğun arttı, maaşın da. Akşam eve biraz daha geç dönüyorsun.", "Patronun seni odasına çağırdı. Korktun; terfi çıktı.", "Yıllardır yaptığın işi artık başkalarına öğretiyorsun. Maaş bordrosu da bunu fark etmiş."], fx: (c) => { c.s.job.decile = Math.min(9, c.s.job.decile + 1); c.meter("happiness", F.small); } },
  { id: "is-kaybi", ages: [20, 62], max: 2, cooldown: 8, tone: "kotu", important: true, when: (c) => c.s.job.working && c.year >= c.s.job.unemployedUntil, weight: (c) => (c.s.job.formal ? 0.5 : 1.0), text: ["İş yeri kapandı. Son maaşı da tam alamadın.", "Bir sabah işe gittiğinde kapıda bir liste vardı. Adın listedeydi.", "Çalıştığın yer küçülmeye gitti. 'Seni çok seviyoruz ama' diye başlayan bir cümle duydun."], fx: (c) => { c.s.job.unemployedUntil = c.year + 1; c.meter("happiness", -F.mid); c.money(-c.income * 0.3); } },
  { id: "kaza-hafif", ages: [6, 80], max: 2, cooldown: 10, tone: "kotu", weight: 0.4, text: ["Merdivenden düştün; bileğin aylarca alçıda kaldı.", "Küçük bir trafik kazası geçirdin. Yara izi kaldı; korku daha uzun kaldı.", "Bir iş kazası parmağında iz bıraktı. Şanslıydın, diyorlar."], fx: (c) => { c.meter("health", -F.mid); c.money(-c.income * 0.05); } },
  { id: "hastalik", ages: [25, 90], max: 3, cooldown: 6, tone: "kotu", weight: (c) => 0.3 + c.age / 80, text: ["Haftalarca geçmeyen bir öksürük seni yatağa düşürdü. Geçti, ama eski gücün geri gelmedi.", "Doktor tahlillere uzun uzun baktı. 'Bundan sonra dikkat etmen gerek,' dedi.", "Bir hastalık seni aylarca evden çıkarmadı. Pencereden mevsimin değişmesini izledin.", "Tansiyonun yükseldi. Artık her sabah bir ilaçla güne başlıyorsun."], fx: (c) => { c.meter("health", -F.big); c.money(-c.income * 0.08); } },
  { id: "komsu", ages: [20, 85], max: 2, cooldown: 10, tone: "iyi", text: ["Yan dairedeki yaşlı kadın sana her bayram tatlı getiriyor. Sen de onun pazar alışverişini taşıyorsun.", "Komşunun çocuğu kayboldu; bütün mahalle aradı, bulundu. O gece herkes birbirine biraz daha yakın uyudu."], fx: (c) => c.meter("relationships", F.small) },
  { id: "eski-mesaj", ages: [25, 80], tone: "iyi", weight: 0.5, text: ["Okuldan eski bir arkadaşın yıllar sonra sana yazdı. Mesajı okurken kendini on beş yaşında hissettin.", "Bir düğünde çocukluk arkadaşlarından birini gördün. İkiniz de yaşlanmıştınız ve ikiniz de bunu söylemediniz."], fx: (c) => c.meter("happiness", F.small) },
  { id: "cocuk-adim", ages: [18, 70], max: 2, cooldown: 3, tone: "iyi", pickPerson: (c) => { const k = c.alive("child").filter((x) => yasOf(c, x) === 1); return k.length ? pick(c, k) : null; }, text: ["#kisi.cap# ilk adımlarını attı. Sen de bir zamanlar böyle mi sendelemiştin?", "#kisiAd.cap# ilk kelimesini söyledi. Hangi kelime olduğu konusunda evde hâlâ anlaşmazlık var."], fx: (c) => c.meter("happiness", F.mid) },
  { id: "cocuk-okul", ages: [22, 75], max: 3, cooldown: 2, tone: "iyi", pickPerson: (c) => { const k = c.alive("child").filter((x) => yasOf(c, x) === 6 || yasOf(c, x) === 7); return k.length ? pick(c, k) : null; }, text: ["#kisi.cap# okula başladı. Kapıda elini bırakması senin için daha zordu.", "#kisiAd.cap# okulun ilk günü dönüp sana baktı. Gülümsedin; sonra köşeyi dönünce gözlerin doldu."], fx: (c) => c.meter("happiness", F.small) },
  { id: "cocuk-ayrildi", ages: [35, 85], max: 3, cooldown: 2, tone: "notr", important: true, pickPerson: (c) => { const k = c.alive("child").filter((x) => yasOf(c, x) >= 19 && x.livesTogether !== false); return k.length ? pick(c, k) : null; }, text: ["#kisi.cap# evden ayrıldı. Odası hâlâ onun kokuyor.", "#kisiAd.cap# kendi hayatını kurmaya gitti. Sofraya bir tabak eksik koyuyorsun artık.", "#kisiAd.cap# eşyalarını topladı. Kapıda 'Her hafta ararım,' dedi; ilk ay gerçekten aradı.", "#kisi.cap# başka bir şehre taşındı. Ev büyüdü sanki, sesler azaldı."], fx: (c) => { if (c.target) c.target.livesTogether = false; c.meter("happiness", -2); } },
  { id: "torun", ages: [40, 95], max: 3, cooldown: 3, tone: "iyi", important: true, pickPerson: (c) => { const k = c.alive("child").filter((x) => yasOf(c, x) >= 22 && yasOf(c, x) <= 42); return k.length ? pick(c, k) : null; }, weight: 0.8, text: ["#kisi.in.cap# bir bebeği oldu. Torununu ilk kucağına aldığında ellerin hiç titremedi.", "Torunun dünyaya geldi. #kisiAd.cap# sana bebeğin fotoğrafını gece yarısı gönderdi.", "Bir torunun daha oldu. Bu kez adını sana sordular.", "#kisiAd.cap# kucağında bir bebekle kapında belirdi. Bebek seni görünce ağladı, sonra uyudu."], fx: (c) => { c.meter("happiness", F.mid); c.bond(c.target, 4); } },
  { id: "anne-yasli", ages: [25, 70], tone: "notr", pickPerson: (c) => { const l = [c.mother(), c.father()].filter((p): p is GPerson => !!p && yasOf(c, p) >= 70); return l.length ? pick(c, l) : null; }, text: ["#kisi.cap# artık yavaş yürüyor. Telefonda sesini her duyduğunda içinden bir şey sayıyorsun.", "#kisiAd.e.cap# bir ilaç kutusu aldın, günlere bölünmüş. Bir zamanlar o senin için yapardı bunu."], fx: (c) => c.bond(c.target, 4) },
  { id: "yildonumu", ages: [25, 90], max: 3, cooldown: 7, tone: "iyi", pickPerson: (c) => { const p = c.partner(); return p && p.married ? p : null; }, text: ["#kisiAd.cap# ile evliliğinizin yıl dönümünde eski fotoğraflara baktınız. İkiniz de o kadar genç miydiniz?", "#kisiAd.cap# yıl dönümünüzü unuttu; sen de unuttun. Fark ettiğinizde uzun uzun güldünüz."], fx: (c) => { c.bond(c.target, 5); c.meter("happiness", 2); } },
  { id: "es-tartisma", ages: [20, 80], max: 3, cooldown: 4, tone: "kotu", pickPerson: (c) => c.partner(), text: ["#kisiAd.cap# ile para yüzünden kavga ettiniz. Kapılar çarptı, sonra sessizlik.", "Aranızda bir mesafe büyüyor. Aynı sofrada oturup başka şeyler düşünüyorsunuz."], fx: (c) => { c.bond(c.target, -8); c.meter("happiness", -F.small); } },
  { id: "ayrilik", ages: [20, 80], max: 2, cooldown: 5, tone: "kotu", important: true, pickPerson: (c) => c.partner(), weight: (c) => { const p = c.partner(); return p ? Math.max(0, (60 - p.bond) / 20) * DENGE.separationBase * 40 : 0; }, text: ["#kisiAd.cap# ile ayrıldınız. Eşyaları bölüştürmek, yılları bölüştürmekten kolaydı.", "Bir gün #kisiAd# 'Böyle olmuyor,' dedi. Haklıydı. Ayrı evlere taşındınız."], fx: (c) => { const p = c.target!; p.role = "ex"; p.livesTogether = false; p.married = false; c.flag("birlikte", false); c.flag("evli", false); c.flag("bosandi"); c.s.wantKids = null; c.meter("happiness", -F.big); } },
  { id: "yalnizlik", ages: [32, 90], max: 2, cooldown: 10, tone: "notr", when: (c) => !c.partner(), text: ["Kendi düzenini seviyorsun: kendi saatin, kendi çayın, kendi sessizliğin. Bazen biri olsun istiyorsun; bazen hiç.", "Akrabalar 'Hâlâ mı?' diye soruyor. Sen hayatının dolu olduğunu biliyorsun."], fx: (c) => c.meter("happiness", 1) },
  { id: "dogum-gunu", ages: [40, 80], max: 3, cooldown: 10, tone: "notr", when: (c) => c.age % 10 === 0, text: ["#yas.cap# yaşına girdin. Kimse sormadan kendi kendine bir hesap yapıyorsun.", "#yas.cap# yaşındasın. Mumları üflerken bir dilek tuttun, ne olduğunu kendine bile söylemedin."] },
  { id: "kardes-evlendi", ages: [10, 60], max: 2, cooldown: 4, tone: "iyi", pickPerson: (c) => { const l = c.alive("sibling").filter((x) => yasOf(c, x) >= 20 && yasOf(c, x) <= 40 && !x.married); return l.length ? pick(c, l) : null; }, weight: 0.6, text: ["#kisi.cap# evlendi. Düğünde en çok sen dans ettin.", "#kisiAd.cap# evlendi. Aile fotoğrafında yeni bir yüz var artık."], fx: (c) => { c.bond(c.target, 2); c.meter("happiness", 2); if (c.target) { c.target.livesTogether = false; c.target.married = true; } } },
  { id: "kardes-yardim", ages: [20, 80], max: 2, cooldown: 8, tone: "iyi", pickPerson: (c) => kin(c, ["sibling"]), weight: 0.5, text: ["#kisi.cap# zor bir dönemden geçerken birkaç ay yanında kaldı. Ev daraldı, siz yakınlaştınız.", "#kisiAd.cap# ile uzun bir telefon konuşması yaptınız. Çocukluğunuzdan kimsenin hatırlamadığı şeyleri hatırladınız."], fx: (c) => { c.bond(c.target, 6); c.meter("relationships", 2); } },
  { id: "yas-tutmak", ages: [5, 100], max: 3, cooldown: 5, tone: "notr", when: (c) => mourned(c).length > 0, prep: (c) => { const p = pick(c, mourned(c)); c.vars.olen = c.nameOf(p); c.vars.yer2 = p.livesTogether !== false && !c.s.leftHome ? "evde" : "bir sokakta"; }, text: ["Bir dükkânın önünden geçerken #olen# geldi aklına. Bir an durdun.", "Rüyanda #olen.i# gördün. Hiçbir şey söylemedi, sadece gülümsedi.", "#olen.in.cap# eski bir eşyasını buldun. Bir süre elinde tuttun, sonra yerine koydun.", "Bir şarkı çaldı, #olen# hep onu mırıldanırdı. Radyoyu kapatmadın.", "#olen.in.cap# ölüm yıl dönümünde mezarına gittin. Yanına küçük bir şey bıraktın.", "Bugün #olen.e# anlatmak istediğin bir şey oldu. Kime anlatacağını bilemedin."], fx: (c) => c.meter("happiness", -1) },
  { id: "hayvan", ages: [6, 75], tone: "iyi", important: true, weight: 0.5, when: (c) => !c.alive("pet").length, prep: (c) => { const nm = pick(c, ["Pamuk", "Karabaş", "Tarçın", "Boncuk", "Duman", "Fındık", "Zeytin", "Paşa"]); c.vars.hayvanAd = nm; const p = c.addPerson("pet", "female", c.year, { name: nm, bond: 70, livesTogether: true }); c.target = p; }, text: ["Kapının önünde titreyen bir köpek yavrusu buldun. Adını #hayvanAd# koydun; o gün bu gündür evde.", "Bir sokak kedisi seni seçti. Adı #hayvanAd# oldu ve yatağın yarısı artık onun."], fx: (c) => { c.meter("happiness", F.small); } },
  { id: "sessiz-an", ages: [20, 95], max: 3, cooldown: 8, tone: "notr", text: ["Bir akşam balkonda tek başına oturdun. Ne bir şey istedin ne bir şeyden kaçtın.", "Sabah herkesten önce uyandın. Evin sessizliği sana ait gibiydi.", "#zaman.cap# eski bir şarkı çaldı radyoda. Hangi yıl olduğunu hatırladın, hangi sokak olduğunu da."], fx: (c) => c.meter("happiness", 2) },
  { id: "ay-sonu", ages: [18, 90], max: 3, cooldown: 3, tone: "kotu", when: (c) => c.s.leftHome && c.cash < 0, text: ["Ay sonu geldi, para gelmedi. Bakkalın defterine adın bir daha yazıldı.", "Faturaları masaya dizdin, hangisini önce ödeyeceğine karar veremedin.", "Borç yüzünden geceleri uyuyamıyorsun. Kimseye söylemiyorsun."], fx: (c) => { c.meter("happiness", -F.small); c.meter("health", -2); } },
  { id: "borc-bitti", ages: [20, 90], max: 1, tone: "iyi", when: (c) => c.s.leftHome && c.has("borclandi") && c.cash > 0, text: ["Son borcunu da ödedin. Omuzlarından bir yük kalktı; bunu ancak şimdi fark ediyorsun."], fx: (c) => { c.flag("borclandi", false); c.meter("happiness", F.mid); } },
  { id: "yaslilik", ages: [70, 110], max: 3, cooldown: 4, tone: "notr", text: ["Gözlüğünü arıyorsun; başının üstünde. Buna artık sen de gülüyorsun.", "Merdivenler uzadı, günler kısaldı. Yine de her sabah pencereyi açıyorsun.", "Eski bir fotoğrafta kendini zor tanıdın. O çocuk hâlâ içinde bir yerde."], fx: (c) => c.meter("health", -2) },
  { id: "torun-masal", ages: [60, 100], tone: "iyi", when: (c) => c.s.counts["torun"] > 0, text: ["Torununa senin çocukluğunu anlattın. Bazı yerleri biraz süsledin; hakkın var."], fx: (c) => c.meter("happiness", F.small) },
  { id: "tur-bakim", ages: [22, 70], tone: "notr", countries: ["TUR"], when: (c) => c.s.sex === "female" && c.s.leftHome && !!c.tur?.careTimeMinutes, text: ["Günün çoğu yemek, temizlik, çocuklar ve yaşlıların ihtiyaçlarıyla geçiyor. Akşam oturduğunda kimse 'Yoruldun mu?' diye sormuyor."], stat: (c) => { const t = c.tur!.careTimeMinutes!; return { text: `Türkiye'de kadınlar günde ortalama ${Math.floor(t.v / 60)} saat ${t.v % 60} dakikayı hane ve aile bakımına ayırıyor (${t.yil}${t.menWorking !== null ? `; çalışan erkeklerde ${t.menWorking} dakika` : ""}).`, kaynak: "TÜİK Zaman Kullanım Araştırması 2014-2015 (content/countries/TUR.json)" }; }, fx: (c) => c.meter("health", -1) },
];

// ------------------------------------------------------------------ yetişkin karar anları

const decisions: S[] = [
  {
    id: "d-sehir-is", ages: [20, 50], tone: "onemli", important: true,
    when: (c) => c.s.job.working || c.has("calismak-istiyor"),
    choice: (c) => {
      const mv = c.cost("move");
      return {
        prompt: "Başka bir şehirden bir iş teklifi geldi. Maaş daha iyi; ama tanıdığın herkes burada.",
        options: [
          { id: "git", label: "Git", cost: mv, locked: c.canAfford(mv, 0.5) ? null : "Taşınma masrafını karşılayamazsın.", effect: (cc) => { cc.s.urban = true; cc.s.leftHome = true; cc.s.job.working = true; cc.s.job.decile = Math.min(9, cc.s.job.decile + 1); cc.meter("relationships", -F.mid); cc.meter("happiness", 1); for (const p of cc.alive()) if (p.role === "mother" || p.role === "father") cc.bond(p, -5); return ["Yeni şehirde ilk aylar kimseyi tanımadın. Maaş günü ise ilk kez rahat nefes aldın."]; }, tone: "onemli", important: true },
          { id: "kal", label: "Kal", effect: (cc) => { cc.meter("relationships", 2); return ["Kalmaya karar verdin. Bazen o işi düşünüyorsun; çoğu zaman bu sokakları seviyorsun."]; } },
          { id: "pazarlik", label: "Mevcut işinde pazarlık et", locked: c.s.job.working ? null : "Şu an bir işin yok.", effect: (cc) => { if (cc.rng.chance(0.4)) { cc.s.job.decile = Math.min(9, cc.s.job.decile + 1); return ["Teklifi masaya koydun. Patronun kaşlarını çattı, sonra maaşını artırdı."]; } return ["Pazarlık işe yaramadı. 'Gidebilirsin,' dediler. Gitmedin; ama bir şey kırıldı."]; } },
        ],
      };
    },
  },
  {
    id: "d-ev", ages: [26, 65], tone: "onemli", important: true,
    when: (c) => c.s.leftHome && !c.has("ev-sahibi"),
    choice: (c) => {
      const price = c.cost("house");
      const down = Math.round(price * 0.25);
      return {
        prompt: "Kiralar artıyor. Bir ev satın almayı düşünüyorsun.",
        options: [
          { id: "al", label: "Krediyle ev al (peşinat)", cost: down, locked: c.canAfford(down) ? null : "Peşinatı biriktiremedin.", effect: (cc) => { cc.flag("ev-sahibi"); cc.flag("borclandi"); cc.money(-(price - down)); cc.meter("happiness", F.mid); return ["Tapu elinde. Duvarlar senin; borç da senin. Bunu yıllarca ödeyeceksin."]; }, tone: "onemli", important: true },
          { id: "kira", label: "Kirada kal, birikime devam et", effect: (cc) => { cc.meter("happiness", -1); return ["Kirada kalmaya devam ettin. Ev sahibi her yıl kapıyı çalıyor; sen her yıl biraz daha biriktiriyorsun."]; } },
          { id: "aile", label: "Aileyle aynı eve geç", locked: c.mother() || c.father() ? null : "Yanına taşınabileceğin bir aile büyüğün kalmadı.", effect: (cc) => { cc.money(cc.income * 0.1); for (const p of [cc.mother(), cc.father()]) if (p) { p.livesTogether = true; cc.bond(p, 6); } cc.meter("happiness", -1); return ["Ailenin evine taşındın. Kira yok; mahremiyet de az."]; } },
        ],
      };
    },
  },
  {
    id: "d-bakim", ages: [25, 75], tone: "onemli", important: true, max: 2, cooldown: 8,
    pickPerson: (c) => { const l = [c.mother(), c.father()].filter((p): p is GPerson => !!p && yasOf(c, p) >= 72); return l.length ? pick(c, l) : null; },
    choice: (c) => {
      const pay = c.cost("supportParent");
      return {
        prompt: "#kisi.cap# artık tek başına yaşamakta zorlanıyor. Bir karar vermek gerek.",
        options: [
          { id: "yanina", label: "Yanına al", effect: (cc) => { const p = cc.target!; p.livesTogether = true; cc.bond(p, 12); cc.meter("happiness", -2); cc.meter("health", -2); cc.money(-cc.income * 0.05); return ["#kisiAd.cap# artık seninle yaşıyor. Geceleri kalkıp ilacını veriyorsun; bazen birlikte eski şarkılar dinliyorsunuz."]; }, tone: "onemli", important: true },
          { id: "para", label: "Bakım için para gönder", cost: pay, locked: c.canAfford(pay) ? null : "Göndereceğin para yok.", effect: (cc) => { cc.bond(cc.target, 3); return ["Her ay bakım için para gönderiyorsun. Telefonda sesi iyi; yanında olmamak içini kemiriyor."]; } },
          { id: "ziyaret", label: "Fırsat buldukça ziyaret et", effect: (cc) => { cc.bond(cc.target, -4); cc.meter("happiness", -1); return ["Ayda bir gidebiliyorsun. Her gidişinde biraz daha küçülmüş buluyorsun onu."]; } },
        ],
      };
    },
  },
  {
    id: "d-kontrol", ages: [40, 80], tone: "notr", max: 2, cooldown: 10,
    choice: (c) => {
      const ch = c.cost("checkup");
      return {
        prompt: "Bir süredir yorgunsun. Bir tanıdık 'Bir kontrol yaptır,' diyor.",
        options: [
          { id: "yaptir", label: "Kontrol yaptır", cost: ch, effect: (cc) => { cc.flag("kontrol"); cc.meter("health", F.small); return ["Tahliller birkaç şey gösterdi; erken yakalandı. Doktor ilaç ve yürüyüş önerdi."]; } },
          { id: "ertele", label: "Ertele, geçer", effect: (cc) => { cc.meter("health", -2); return ["Erteledin. Yorgunluk bazen geçti, bazen geri geldi."]; } },
          { id: "yuru", label: "Kendi başına: daha çok yürü, daha az tuz", effect: (cc) => { cc.flag("hareketli"); cc.meter("health", 2); return ["Her akşam yürüyüşe çıkmaya başladın. İlk hafta ayakların, ikinci hafta kafan rahatladı."]; } },
        ],
      };
    },
  },
  {
    id: "d-sigara", ages: [20, 70], tone: "notr", max: 2, cooldown: 10, when: (c) => c.has("sigara"),
    choice: () => ({
      prompt: "Merdiven çıkarken nefesin kesildi. Cebindeki paket ağırlaştı sanki.",
      options: [
        { id: "birak", label: "Bırakmayı dene", effect: (c) => { if (c.rng.chance(0.45)) { c.flag("sigara", false); c.meter("health", F.mid); return ["Zor oldu; üç kez başladın, dördüncüde bıraktın. Kahvenin tadı değişti."]; } c.meter("happiness", -2); return ["Bir ay dayanabildin. Sonra kötü bir günde yeniden yaktın."]; } },
        { id: "azalt", label: "Azalt", effect: (c) => { c.meter("health", 1); return ["Günde birkaç taneye indirdin. Kendine bunun yeterli olduğunu söylüyorsun."]; } },
        { id: "devam", label: "Şimdi sırası değil", effect: (c) => { c.meter("health", -2); return ["Şimdi sırası değil, dedin. Bu cümleyi kaç kez kurduğunu sayan yok."]; } },
      ],
    }),
  },
  {
    id: "d-borc-ver", ages: [22, 80], tone: "notr", max: 2, cooldown: 8,
    pickPerson: (c) => kin(c, ["sibling", "friend"]),
    choice: (c) => {
      const amt = c.cost("lend");
      return {
        prompt: "#kisi.cap# zor durumda; senden borç istedi. Geri ödenip ödenmeyeceği belli değil.",
        options: [
          { id: "ver", label: "Ver", cost: amt, locked: c.canAfford(amt) ? null : "Verebilecek paran yok.", effect: (cc) => { cc.bond(cc.target, 10); if (cc.rng.chance(0.5)) { cc.money(Math.round(amt * 0.8)); return ["Parayı verdin. İki yıl sonra #kisiAd# çoğunu geri getirdi; yanında bir de kutu tatlı vardı."]; } return ["Parayı verdin. Bir daha konusu açılmadı. Bazen aklına geliyor; ama aranız iyi."]; } },
          { id: "yarim", label: "Bir kısmını ver", cost: Math.round(amt / 3), locked: c.canAfford(Math.round(amt / 3)) ? null : "Bir kısmını bile veremezsin.", effect: (cc) => { cc.bond(cc.target, 3); return ["Elinden geleni verdin. #kisiAd.cap# teşekkür etti; gözlerinde biraz kırgınlık da vardı."]; } },
          { id: "hayir", label: "Veremeyeceğini söyle", effect: (cc) => { cc.bond(cc.target, -10); return ["Veremeyeceğini söyledin. Haklı sebeplerin vardı; yine de telefonlar seyrekleşti."]; } },
        ],
      };
    },
  },
  {
    id: "d-kurs", ages: [25, 60], tone: "notr", max: 2, cooldown: 10,
    choice: (c) => {
      const cost = c.cost("tutoring");
      return {
        prompt: "Akşamları açılan bir kursun ilanını gördün. Yeni bir şey öğrenmek, ama yorgunken.",
        options: [
          { id: "yazil", label: "Yazıl", cost, locked: c.canAfford(cost) ? null : "Kurs ücretini karşılayamazsın.", effect: (cc) => { cc.meter("knowledge", F.mid); cc.meter("health", -1); if (cc.s.job.working && cc.rng.chance(0.4)) cc.s.job.decile = Math.min(9, cc.s.job.decile + 1); return ["Haftada üç akşam sınıfa gidiyorsun. Yanındaki öğrencilerin yarı yaşındasın; kimse umursamıyor."]; } },
          { id: "kendi", label: "Kendi kendine öğrenmeye çalış", effect: (cc) => { cc.meter("knowledge", F.small); return ["Telefonda videolar, ödünç kitaplar. Yavaş ama ilerliyorsun."]; } },
          { id: "dinlen", label: "Akşamlar dinlenmek için", effect: (cc) => { cc.meter("happiness", 2); return ["Akşamlarını kendine ayırdın. Bazen dinlenmek de bir şey öğrenmektir."]; } },
        ],
      };
    },
  },
  {
    id: "d-eski", ages: [28, 60], tone: "notr",
    pickPerson: (c) => kin(c, ["ex"]),
    choice: () => ({
      prompt: "Yıllar sonra #kisiAd# sana yazdı: 'Bir kahve içelim mi?'",
      options: [
        { id: "bulus", label: "Buluş", effect: (c) => { c.bond(c.target, 10); c.meter("happiness", 2); if (c.partner()) c.bond(c.partner(), -4); return ["Bir kahve iki saat sürdü. Eski günleri konuştunuz, yeni günleri değil."]; } },
        { id: "nazik", label: "Nazikçe geri çevir", effect: (c) => { c.bond(c.target, -3); return ["Teşekkür edip uzak durdun. Mesajı silmeden önce bir kez daha okudun."]; } },
        { id: "cevapsiz", label: "Cevap verme", effect: (c) => { c.bond(c.target, -10); return ["Mesaj cevapsız kaldı. Bazı kapılar kapalı kalınca daha iyi."]; } },
      ],
    }),
  },
  {
    id: "d-arkadas-kriz", ages: [18, 85], tone: "notr", max: 2, cooldown: 8,
    pickPerson: (c) => c.friend(),
    choice: (c) => ({
      prompt: "#kisi.cap# zor günlerden geçiyor. Gece yarısı aradı; sesi titriyordu.",
      options: [
        { id: "git", label: "Hemen yanına git", effect: (cc) => { cc.bond(cc.target, 12); cc.meter("health", -1); return ["Gece yarısı kapısını çaldın. Sabaha kadar mutfakta oturdunuz; pek konuşmadınız."]; } },
        { id: "para", label: "Para gönder", cost: c.cost("donation"), locked: c.canAfford(c.cost("donation")) ? null : "Gönderecek paran yok.", effect: (cc) => { cc.bond(cc.target, 4); return ["Bir miktar para gönderdin. #kisiAd.cap# 'Sağ ol,' yazdı; ama asıl ihtiyacı bu muydu, emin değilsin."]; } },
        { id: "mesaj", label: "Sabah ararım, de", effect: (cc) => { cc.bond(cc.target, -6); return ["Sabah aradın. #kisiAd.cap# 'Geçti,' dedi. Sesi hâlâ uzaktı."]; } },
      ],
    }),
  },
  {
    id: "d-hayal", ages: [35, 75], tone: "iyi",
    choice: (c) => {
      const cost = c.cost("trip");
      return {
        prompt: "Yıllardır ertelediğin bir şey var: bir yolculuk, bir enstrüman, bir bahçe.",
        options: [
          { id: "yap", label: "Artık yap", cost, locked: c.canAfford(cost) ? null : "Şu an buna ayıracak paran yok.", effect: (cc) => { cc.meter("happiness", F.big); return ["Sonunda yaptın. Hayal ettiğin kadar değildi; başka türlü güzeldi."]; }, tone: "iyi", important: true },
          { id: "kucuk", label: "Küçük bir parçasını yap", effect: (cc) => { cc.meter("happiness", F.small); return ["Hepsini değil, küçük bir parçasını yaptın. Balkonda üç saksı domates; yine de senin."]; } },
          { id: "ertele", label: "Bir gün", effect: (cc) => { cc.meter("happiness", -1); return ["Bir gün, dedin. Bu 'bir gün'ün takvimde yeri yok."]; } },
        ],
      };
    },
  },
  {
    id: "d-bagis", ages: [25, 90], tone: "notr", max: 2, cooldown: 10,
    choice: (c) => {
      const cost = c.cost("donation");
      return {
        prompt: "Mahallede bir aile zor durumda. Biri yardım toplamak için kapı kapı dolaşıyor.",
        options: [
          { id: "ver", label: "Yardım et", cost, locked: c.canAfford(cost) ? null : "Senin de durumun dar.", effect: (cc) => { cc.meter("happiness", F.small); cc.meter("relationships", 2); return ["Elinden geleni verdin. Kimse adını sormadı; sen de söylemedin."]; } },
          { id: "emek", label: "Para değil, zaman ver", effect: (cc) => { cc.meter("relationships", F.small); cc.meter("health", -1); return ["Hafta sonu o ailenin evini boyamaya gittin. Akşam ellerin boya, için hafif."]; } },
          { id: "gec", label: "Bu sefer geç", effect: () => ["Bu sefer bir şey veremedin. Kapıyı kapatırken kendine bir sebep söyledin."] },
        ],
      };
    },
  },
  {
    id: "d-emeklilik", ages: [60, 75], tone: "notr",
    when: (c) => !c.isTur && c.s.job.working && !c.s.job.retired,
    choice: () => ({
      prompt: "Yaşıtların birer birer çalışmayı bırakıyor. Sen ne yapacaksın?",
      options: [
        { id: "birak", label: "Bırak", effect: (c) => { c.s.job.working = false; c.s.job.retired = true; c.meter("happiness", F.small); c.flag("emekli"); return ["Son iş gününden eve yürüyerek döndün. Acelen yoktu."]; }, tone: "onemli", important: true },
        { id: "devam", label: "Biraz daha çalış", effect: (c) => { c.meter("health", -2); return ["Biraz daha çalışmaya karar verdin. Para lazım; belki de alışkanlık."]; } },
        { id: "yarim", label: "Yarım gün devam et", effect: (c) => { c.s.job.decile = Math.max(0, c.s.job.decile - 1); c.meter("happiness", 2); return ["Haftada birkaç gün çalışıyorsun. Kalan günler senin."]; } },
      ],
    }),
  },
  {
    id: "d-cocuk-okul", ages: [28, 70], tone: "notr", max: 2, cooldown: 4,
    pickPerson: (c) => { const k = c.alive("child").filter((x) => yasOf(c, x) >= 12 && yasOf(c, x) <= 16); return k.length ? pick(c, k) : null; },
    choice: (c) => {
      const cost = c.cost("tutoring");
      return {
        prompt: "#kisi.cap# okulda zorlanıyor. Öğretmeni seninle konuşmak istedi.",
        options: [
          { id: "ders", label: "Özel ders aldır", cost, locked: c.canAfford(cost) ? null : "Özel derse ayıracak para yok.", effect: (cc) => { cc.bond(cc.target, 3); return ["Özel ders notlarını biraz yükseltti. #kisiAd.cap# yine de en çok seninle çalıştığı akşamları hatırlayacak."]; } },
          { id: "kendin", label: "Akşamları kendin çalıştır", effect: (cc) => { cc.bond(cc.target, 8); cc.meter("health", -1); return ["Mutfak masasında birlikte çalıştınız. Bazı soruları sen de bilmiyordun; birlikte bulduğunuz cevaplar daha güzeldi."]; } },
          { id: "baski", label: "Kendisi halletsin", effect: (cc) => { cc.bond(cc.target, -6); return ["'Kendi işini kendin hallet,' dedin. #kisiAd.cap# halletti; ama sana daha az anlatmaya başladı."]; } },
        ],
      };
    },
  },
];

// ------------------------------------------------------------------ yansıma soruları (bu proje için yazıldı)

export const REFLECTIONS: { age: number; question: string; options: string[] }[] = [
  { age: 5, question: "Bu çocuk beş yaşında. Sen beş yaşındayken, bugün hatırladığın ilk şey neydi?", options: ["Bir yüz", "Bir yer", "Bir koku ya da ses", "Hiçbir şey hatırlamıyorum"] },
  { age: 15, question: "On beş yaşındaki bu genç, on beş yaşındaki sana bir şey sorsaydı, ne sorardı?", options: ["Korkuyor muydun?", "Kimi seviyordun?", "Ne olmak istiyordun?", "Bunu hiç düşünmedim"] },
  { age: 30, question: "Otuz yaş. Senin hayatında bu yaşa kadar en çok emek verdiğin şey ne oldu, ya da ne olacak?", options: ["Bir insan", "Bir iş", "Kendim", "Henüz bilmiyorum"] },
  { age: 50, question: "Elli yaşında insan geriye ve ileriye eşit bakabiliyor. Sen hangi tarafa daha çok bakıyorsun?", options: ["Geriye", "İleriye", "Bugüne", "İkisine de bakmamaya çalışıyorum"] },
  { age: 70, question: "Yetmiş yaşına gelen bu insanla karşılıklı otursaydın, ona ne söylerdin?", options: ["Teşekkür ederim", "Özür dilerim", "Anlat, dinliyorum", "Hiçbir şey; sadece otururdum"] },
];

// ------------------------------------------------------------------ dışa aktarım

export const SYSTEM = {
  birth,
  // Sıra: önce karar açmayan sistemler, sonra karar açanlar.
  yearly: [schoolStart, schoolProgress, lateUni, jobStart, leaveHome, retire, military, marry, meet, kidsTalk] as S[],
  texts: T,
};
export const CRITICAL: S[] = critical;
export const STORYLETS: S[] = [...narrative, ...decisions];
