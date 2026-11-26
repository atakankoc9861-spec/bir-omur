// Oyunun kullandığı sıkıştırılmış veri. Ham veri v1 dosyalarından (data/processed/v1) ve
// içerik dosyalarından (content/) üretilir. Derleme betiği (scripts/build-oyna.mjs) bunu
// bir kez üretip oyna.html'e gömer; testler aynı fonksiyonu ham dosyalar üzerinde çalıştırır.
//
// Dayanıklılık: Kalite denetiminden küçük düzeltmeler gelebilir. Okuma alan adlarıyla yapılır;
// beklenen bir alan yoksa o özellik kapanır (null) ve oyun çalışmaya devam eder.

import type { BirthsFileV1, CountriesFileV1, MvpCountryFileV1 } from "./data-v1";
import type { Sex } from "./types";

export const MVP_COUNTRIES = ["TUR", "IND", "NGA", "CHN", "USA"] as const;
export type MvpIso = (typeof MVP_COUNTRIES)[number];

/** "Bugün" modunda doğum yılı (karar 22: BM WPP 2024'ün 2026 projeksiyonu). */
export const TODAY_YEAR = 2026;
/** Sıkıştırılmış yaşam tablosunun satır yılları. Ara yıllarda bir önceki satır kullanılır. */
export const LT_YEARS = [2026, 2030, 2035, 2040, 2045, 2050, 2055, 2060, 2065, 2070, 2075, 2080, 2085, 2090, 2095, 2100];

export interface Sourced<T> { v: T; yil: number | null; kaynak: string }

export interface CompactCountry {
  iso3: MvpIso;
  nameTr: string;
  /** qx[satır][yaş], yaş 0-99; 100+ için 1/eOpen. */
  lt: { years: number[]; female: number[][]; male: number[][]; eOpenF: number[]; eOpenM: number[]; a0F: number[]; a0M: number[] };
  e0: { female: number; male: number; yil: number; kaynak: string };
  under5: Sourced<number>;
  /** Doğumda cinsiyet oranı: 100 kıza düşen erkek. */
  srb: Sourced<number>;
  /** Yaşa göre doğurganlık, 1000 kadında; gruplar 10-14 ... 50-54; satırlar LT_YEARS. */
  asfr: { groups: [number, number][]; rows: number[][]; kaynak: string };
  urban: Sourced<number> | null;
  income: { gdp: number; gdpYil: number; shares: number[]; anketYil: number; refahTuru: "gelir" | "tuketim"; kaynak: string } | null;
  edu: { primary: Sourced<number> | null; secondary: Sourced<number> | null; tertiary: Sourced<number> | null };
  /** DSÖ GHE 2019 ölüm nedeni payları (düzey 2 grupları). */
  causes: { codes: string[]; namesEn: string[]; ageGroups: [number, number][]; female: number[][]; male: number[][]; yil: number; kaynak: string } | null;
}

export interface WorldEntry { iso3: string; nameTr: string; births: number; e0f: number | null; e0m: number | null; u5: number | null }

export interface NamePool { sex: Sex; from: number; to: number | null; names: string[] }
export interface CountryNames { pools: NamePool[]; surnames: string[]; kaynak: string; not?: string }

/** Türkiye profilinden (content/countries/TUR.json) yalnız oyunda_kullanilabilir: true kayıtlar. */
export interface TurRules {
  military: { from: number; to: number | null; er: number | null; yedekSubay: number | null; bedelliAy: number | null; ageRange: [number, number] | null; kaynak: string[] }[];
  exams: { ad: string; from: number; to: number | null; yas: number }[];
  education: { from: number; to: number | null; zorunluYil: number; startAge: number; endAge: number }[];
  marriageLegal: { from: number; to: number | null; kadin: number; erkek: number }[];
  firstMarriageAge: { female: number; male: number; yil: number; kaynak: string } | null;
  /** steps: [yıl, kadın yaşı, erkek yaşı] — şartların tamamlandığı yıla göre kademeli yaş (baskaSart metninden okunur). */
  retirement: { from: number; to: number | null; yasKadin: number | null; yasErkek: number | null; steps: [number, number, number][]; primGun: number | null }[];
  womenEmployment: { female: number; male: number | null; yil: number; kaynak: string } | null;
  careTimeMinutes: { v: number; menWorking: number | null; yil: number; kaynak: string } | null;
  conscientiousObjection: boolean | null;
  kaynakAdlari: Record<string, string>;
}

export interface GameData {
  surum: string;
  births: { yil: number; kaynak: string; list: WorldEntry[] };
  countries: Record<string, CompactCountry>;
  names: Record<string, CountryNames>;
  tur: TurRules | null;
  sources: Record<string, string>;
}

// ------------------------------------------------------------------ yardımcılar

const sig = (x: number, d = 4) => (x === 0 ? 0 : Number(x.toPrecision(d)));

function lastValid(ys: { yillar: number[]; degerler: number[] } | undefined | null, maxYear = TODAY_YEAR): { v: number; yil: number } | null {
  if (!ys || !Array.isArray(ys.yillar)) return null;
  for (let i = ys.yillar.length - 1; i >= 0; i--) {
    const v = ys.degerler[i];
    if (ys.yillar[i] <= maxYear && typeof v === "number" && Number.isFinite(v)) return { v, yil: ys.yillar[i] };
  }
  return null;
}

function parseGroup(g: string): [number, number] {
  const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(g);
  if (m) return [+m[1], +m[2]];
  const p = /^(\d+)\+$/.exec(g);
  if (p) return [+p[1], 200];
  throw new Error(`yaş grubu okunamadı: ${g}`);
}

export function compactCountry(f: MvpCountryFileV1): CompactCountry {
  const iso3 = f.meta.iso3 as MvpIso;
  const lt = f.yasamTablosu;
  const rowIdx = LT_YEARS.map((y) => Math.min(lt.yilSon, Math.max(lt.yilBas, y)) - lt.yilBas);
  const s = f.seriler;
  const si = TODAY_YEAR - s.yilBas;
  const asfrRows = LT_YEARS.map((y) => {
    const i = f.dogurganlikYasaGore.yillar.indexOf(y);
    const j = i >= 0 ? i : f.dogurganlikYasaGore.yillar.length - 1;
    return f.dogurganlikYasaGore.degerler[j].map((v) => sig(v, 4));
  });

  let causes: CompactCountry["causes"] = null;
  try {
    const on = f.olumNedenleri;
    // Kalite/Yapımcı: olağan yıl için DSÖ 2019 dağılımı (TUR 2023 deprem yılı olağan dışı).
    const y = on.yillar["2019"];
    if (y) {
      const groups = on.yasGruplari;
      const all = new Set<string>();
      for (const sx of ["female", "male"] as const) for (const g of groups) for (const k of Object.keys(y[sx][g].gruplar)) all.add(k);
      const codes = [...all].filter((k) => k !== "dagitilmamis").sort((a, b) => +a - +b);
      const tab = (sex: "female" | "male") =>
        groups.map((g) => {
          const cell = y[sex][g].gruplar;
          const v = codes.map((c) => Math.max(0, cell[c]?.pay ?? 0));
          const t = v.reduce((a, b) => a + b, 0) || 1;
          return v.map((x) => sig(x / t, 3));
        });
      causes = {
        codes,
        namesEn: codes.map((c) => on.nedenler[c]?.adEn ?? c),
        ageGroups: groups.map(parseGroup),
        female: tab("female"),
        male: tab("male"),
        yil: 2019,
        kaynak: y.kaynak ?? on.kaynak,
      };
    }
  } catch {
    causes = null;
  }

  const survey = f.gelir?.anketler?.liste?.length ? f.gelir.anketler.liste[f.gelir.anketler.liste.length - 1] : null;
  const gdp = lastValid(f.gelir?.gdpPerCapitaPpp);
  const urb = lastValid(f.kentlesme);
  const ed = f.egitim;
  const pct = (x: { v: number; yil: number } | null, k: string): Sourced<number> | null => (x ? { v: x.v / 100, yil: x.yil, kaynak: k } : null);

  return {
    iso3,
    nameTr: f.meta.nameTr,
    lt: {
      years: LT_YEARS,
      female: rowIdx.map((i) => lt.female.qx[i].map((q) => sig(q))),
      male: rowIdx.map((i) => lt.male.qx[i].map((q) => sig(q))),
      eOpenF: rowIdx.map((i) => sig(lt.female.eAcik[i])),
      eOpenM: rowIdx.map((i) => sig(lt.male.eAcik[i])),
      a0F: rowIdx.map((i) => sig(lt.female.a0[i])),
      a0M: rowIdx.map((i) => sig(lt.male.a0[i])),
    },
    e0: { female: s.e0.female[si], male: s.e0.male[si], yil: TODAY_YEAR, kaynak: s.e0.kaynak },
    under5: { v: s.under5Mortality.degerler[si], yil: TODAY_YEAR, kaynak: s.under5Mortality.kaynak },
    srb: { v: s.dogumdaCinsiyetOrani.degerler[si], yil: TODAY_YEAR, kaynak: s.dogumdaCinsiyetOrani.kaynak },
    asfr: { groups: f.dogurganlikYasaGore.yasGruplari.map(parseGroup), rows: asfrRows, kaynak: f.dogurganlikYasaGore.kaynak },
    urban: urb ? { v: urb.v, yil: urb.yil, kaynak: f.kentlesme.kaynak } : null,
    income:
      survey && gdp
        ? { gdp: Math.round(gdp.v), gdpYil: gdp.yil, shares: survey.ondalikPaylar.map((x) => sig(x, 4)), anketYil: survey.yil, refahTuru: survey.refahTuru, kaynak: `${f.gelir.gdpPerCapitaPpp.kaynak}+${f.gelir.anketler.kaynak}` }
        : null,
    edu: {
      primary: pct(lastValid(ed?.ilkokulNetOkullasma), ed?.ilkokulNetOkullasma?.kaynak),
      secondary: pct(lastValid(ed?.ortaogretimBrutOkullasma), ed?.ortaogretimBrutOkullasma?.kaynak),
      tertiary: pct(lastValid(ed?.yuksekogretimBrutOkullasma), ed?.yuksekogretimBrutOkullasma?.kaynak),
    },
    causes,
  };
}

export function worldBirths(births: BirthsFileV1, countries: CountriesFileV1, year = TODAY_YEAR): GameData["births"] {
  const i = year - births.meta.yilBas;
  const byIso = new Map(countries.countries.map((c) => [c.iso3, c]));
  const list: WorldEntry[] = [];
  for (const [iso3, u] of Object.entries(births.ulkeler)) {
    const b = u.births[i];
    if (!(b > 0)) continue;
    const c = byIso.get(iso3);
    list.push({
      iso3,
      nameTr: u.nameTr,
      births: Math.round(b),
      e0f: c ? sig(c.lifeExpectancy.female, 3) : null,
      e0m: c ? sig(c.lifeExpectancy.male, 3) : null,
      u5: c ? sig(c.under5Mortality, 3) : null,
    });
  }
  return { yil: year, kaynak: "wpp2024", list };
}

// ------------------------------------------------------------------ isimler

/* eslint-disable @typescript-eslint/no-explicit-any */
const usable = (o: any) => o && o.oyunda_kullanilabilir === true;

export function turNames(profile: any): CountryNames | null {
  try {
    const pools: NamePool[] = [];
    for (const h of profile.isimler.havuzlar) {
      // Karar 28-29 ve şablon kuralı: yalnız dolu, kullanılabilir, genel (din: null) havuzlar.
      // Topluluk/din ağırlıkları henüz kaynaklı olmadığı için MVP'de topluluk çekilmez (devir notu).
      if (!usable(h) || h.topluluk !== "genel" || h.din !== null || !h.isimler?.length) continue;
      pools.push({ sex: h.cinsiyet === "kadin" ? "female" : "male", from: h.yilBas, to: h.yilSon ?? null, names: [...new Set<string>(h.isimler)] });
    }
    const sur = (profile.isimler.soyadlari ?? []).filter((s: any) => usable(s) && s.topluluk === "genel").flatMap((s: any) => s.isimler);
    if (!pools.length) return null;
    return { pools, surnames: [...new Set<string>(sur)], kaynak: "TUR.json isimler (NVİ)" };
  } catch {
    return null;
  }
}

export function sigpwnedNames(file: any): Record<string, CountryNames> {
  const out: Record<string, CountryNames> = {};
  for (const [iso, c] of Object.entries<any>(file?.ulkeler ?? {})) {
    const pools: NamePool[] = c.forenames.map((f: any) => ({ sex: f.cinsiyet, from: f.yil, to: null, names: f.isimler }));
    // ABD: 1990 sayımı ~1990 öncesi doğanlar, 2022 listesi sonrakiler için (aşağıda pickPool).
    // Hindistan: "Devi" ve "Kumar" aile adı olarak çekilmez; cinsiyete bağlı ikinci ad olarak da
    // kullanıldıkları için erkek çocuğa "Devi" soyadı vermek yanlış olur (Dünya ve Kültür doğrulamalı).
    const surnames = (c.surnames as string[]).filter((s) => !(iso === "IND" && (s === "Devi" || s === "Kumar")));
    out[iso] = { pools, surnames, kaynak: "sigpwned/popular-names-by-country-dataset (CC0)", not: file.meta?.sinirlar };
  }
  return out;
}

// ------------------------------------------------------------------ Türkiye kuralları

export function turRules(p: any): TurRules | null {
  if (!p) return null;
  const safe = <T>(f: () => T, d: T): T => {
    try {
      const v = f();
      return v ?? d;
    } catch {
      return d;
    }
  };
  const kaynakAdlari: Record<string, string> = {};
  for (const k of safe(() => p.kaynaklar as any[], [])) if (k?.id) kaynakAdlari[k.id] = `${k.ad ?? k.id}${k.yil ? ` (${k.yil})` : ""}`;

  const military = safe(
    () =>
      (p.askerlik.donemler as any[]).filter(usable).map((d) => ({
        from: d.yilBas,
        to: d.yilSon ?? null,
        er: d.sure?.er ?? null,
        yedekSubay: d.sure?.yedekSubay ?? null,
        bedelliAy: d.bedelli?.var ? (d.sure?.bedelliTemelEgitim ?? null) : null,
        ageRange: Array.isArray(d.yasAraligi) ? ([d.yasAraligi[0], d.yasAraligi[1]] as [number, number]) : null,
        kaynak: d.kaynak ?? [],
      })),
    [],
  );
  const exams = safe(
    () => (p.egitim.sinavlar as any[]).filter((s) => usable(s) && typeof s.yas === "number").map((s) => ({ ad: s.ad, from: s.yilBas, to: s.yilSon ?? null, yas: s.yas })),
    [],
  );
  const education = safe(
    () =>
      (p.egitim.donemler as any[]).filter(usable).map((d) => {
        const k = d.kademeler as any[];
        return { from: d.yilBas, to: d.yilSon ?? null, zorunluYil: d.zorunluYil, startAge: k[0].yasBas, endAge: k[k.length - 1].yasSon };
      }),
    [],
  );
  const marriageLegal = safe(
    () => (p.evlilikAile.yasalYas as any[]).filter(usable).map((d) => ({ from: d.yilBas, to: d.yilSon ?? null, kadin: d.kadin, erkek: d.erkek })),
    [],
  );
  const fm = safe(() => (p.evlilikAile.ilkEvlilikYasOrt as any[]).filter(usable).sort((a, b) => b.yil - a.yil)[0], null);
  const retirement = safe(
    () => (p.emeklilik.donemler as any[]).filter(usable).map((d) => ({ from: d.yilBas, to: d.yilSon ?? null, yasKadin: d.yasKadin ?? null, yasErkek: d.yasErkek ?? null, steps: retirementSteps(d.baskaSart ?? ""), primGun: ((m) => (m ? +m[1] : null))(/(\d{3,5}) gün prim/.exec(d.baskaSart ?? "")) })),
    [],
  );
  const emp = safe(() => (p.yerelSayilar as any[]).find((y) => usable(y) && y.veriAnahtari === "tuik.isgucu.istihdamOrani.kadin"), null);
  let womenEmployment: TurRules["womenEmployment"] = null;
  if (emp && typeof emp.deger === "number") {
    const m = /Erkek %([\d.,]+)/.exec(emp.not ?? "");
    womenEmployment = { female: emp.deger / 100, male: m ? parseFloat(m[1].replace(",", ".")) / 100 : null, yil: emp.yil, kaynak: (emp.kaynak ?? []).join(",") };
  }
  const care = safe(() => (p.yerelSayilar as any[]).find((y) => usable(y) && y.veriAnahtari === "tuik.zamanKullanim.haneBakim.kadin"), null);
  const co = safe(() => (usable(p.askerlik.vicdaniRet) ? p.askerlik.vicdaniRet.taniniyor === true : null), null);

  return {
    military,
    exams,
    education,
    marriageLegal,
    firstMarriageAge: fm ? { female: fm.kadin, male: fm.erkek, yil: fm.yil, kaynak: (fm.kaynak ?? []).join(",") } : null,
    retirement,
    womenEmployment,
    careTimeMinutes: care && typeof care.deger === "number" ? { v: care.deger, menWorking: menMinutes(care.not ?? ""), yil: care.yil, kaynak: (care.kaynak ?? []).join(",") } : null,
    conscientiousObjection: co,
    kaynakAdlari,
  };
}

/** "2036-2037 59/61, ..., 2048'den itibaren 65/65" → [[2036,59,61], ..., [2048,65,65]]. Okunamazsa boş. */
export function retirementSteps(text: string): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (const m of text.matchAll(/(\d{4})\s*[-–]\s*\d{4}\s+(\d{2})\/(\d{2})/g)) out.push([+m[1], +m[2], +m[3]]);
  const last = /(\d{4})'[dt][ae]n itibaren\s+(\d{2})\/(\d{2})/.exec(text);
  if (last) out.push([+last[1], +last[2], +last[3]]);
  return out.sort((a, b) => a[0] - b[0]);
}

/** "Çalışan erkekler 46 dk." → 46. Okunamazsa null (cümle yazılmaz). */
export function menMinutes(text: string): number | null {
  const m = /erkekler\s+(\d+)\s*dk/i.exec(text);
  return m ? +m[1] : null;
}

export interface RawInputs {
  countries: CountriesFileV1;
  births: BirthsFileV1;
  mvp: MvpCountryFileV1[];
  turProfile: any;
  sigpwned: any;
}

export function buildGameData(r: RawInputs): GameData {
  const countries: Record<string, CompactCountry> = {};
  for (const f of r.mvp) countries[f.meta.iso3] = compactCountry(f);
  const names: Record<string, CountryNames> = { ...sigpwnedNames(r.sigpwned) };
  const tn = turNames(r.turProfile);
  if (tn) names.TUR = tn;
  const sources: Record<string, string> = {};
  const first = r.mvp[0]?.meta.kaynaklar ?? {};
  for (const [k, v] of Object.entries(first)) sources[k] = `${v.kurum}, ${v.ad}`;
  sources.isimCC0 = "sigpwned/popular-names-by-country-dataset (CC0, Temmuz 2023 Wikipedia derlemesi)";
  sources.nvi = "NVİ isim istatistikleri (content/countries/TUR.json)";
  return { surum: "mvp0", births: worldBirths(r.births, r.countries), countries, names, tur: turRules(r.turProfile), sources };
}
