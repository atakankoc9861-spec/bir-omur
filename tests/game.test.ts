// Motor testleri (MVP-0). Hipotez ve ölçütler: docs/devir/2026-11-26-simulasyon.md
import { beforeAll, describe, expect, it } from "vitest";
import { lifeExpectancyAtBirth } from "../src/engine/data-v1";
import { Game, drawBirth, qxOf } from "../src/engine/game";
import { MVP_COUNTRIES, type GameData, turRules, turNames } from "../src/engine/gamedata";
import { RAW_MVP, loadGameData } from "../src/engine/load-raw";
import { suffix } from "../src/engine/grammar";

let data: GameData;
beforeAll(() => {
  data = loadGameData();
});

/** Bir hayatı otomatik kararlarla sonuna kadar oynatır. */
function playOut(g: Game): string[] {
  const ch: string[] = [];
  let guard = 0;
  while (!g.finished && guard++ < 200) {
    const rep = g.step();
    if (rep.decision) {
      const id = g.autoChoose();
      ch.push(id);
      g.choose(id);
    }
  }
  return ch;
}

interface Agg { n: number; age: number; female: number; u5: number }

/** 10.000 hayat (ülke başına 2.000) ve her hayatta tutarlılık kontrolleri. */
function bigRun(mode: "period" | "cohort", perCountry: number) {
  const agg: Record<string, Agg> = {};
  const problems: string[] = [];
  let seed = 1000;
  for (const iso of MVP_COUNTRIES) {
    const a: Agg = (agg[iso] = { n: 0, age: 0, female: 0, u5: 0 });
    for (let i = 0; i < perCountry; i++) {
      const g = new Game(data, seed++, { mortality: mode, forceCountry: iso });
      playOut(g);
      a.n++;
      a.age += g.s.deathAge!;
      if (g.s.sex === "female") a.female++;
      if (g.s.deathAge! < 5) a.u5++;
      if (problems.length < 20) problems.push(...checkLife(g));
    }
  }
  return { agg, problems };
}

/** Bir hayattaki tutarlılık ihlalleri (boş liste = sorun yok). */
function checkLife(g: Game): string[] {
  const out: string[] = [];
  const log = g.s.log;
  const texts = log.map((e) => e.text);
  const dup = texts.length - new Set(texts).size;
  if (dup) out.push(`tohum ${g.seed}: ${dup} tekrar eden metin`);
  for (const t of texts) if (t.includes("#")) out.push(`tohum ${g.seed}: açılmamış sembol: ${t}`);
  for (const p of g.s.people) {
    const deaths = log.filter((e) => e.about === p.id).length;
    if (p.alive && deaths) out.push(`tohum ${g.seed}: ${p.id} yaşıyor ama ölüm satırı var`);
    if (!p.alive && deaths !== 1) out.push(`tohum ${g.seed}: ${p.id} ${deaths} kez öldü`);
    if (!p.alive && p.deathYear === undefined) out.push(`tohum ${g.seed}: ${p.id} ölüm yılı yok`);
    if (!p.alive) {
      const re = p.name ? new RegExp(`(^|[^\\p{L}])${p.name}([^\\p{L}]|$)`, "u") : null;
      for (const e of log) {
        if (e.year <= p.deathYear! || e.key.startsWith("olum") || e.key === "yas-tutmak") continue;
        if (e.refs.includes(p.id)) out.push(`tohum ${g.seed}: ölü ${p.id} sonra olayda: ${e.text}`);
        if (re && re.test(e.text)) out.push(`tohum ${g.seed}: ölü ${p.name} adı sonra geçiyor: ${e.text}`);
      }
    }
  }
  if (log.filter((e) => e.about === "ben").length !== 1) out.push(`tohum ${g.seed}: oyuncunun ölüm satırı sayısı yanlış`);
  return out;
}

function bmE0(iso: string, femaleShare: number, mode: "period" | "cohort"): number {
  const f = RAW_MVP.find((x) => x.meta.iso3 === iso)!;
  const lt = f.yasamTablosu;
  const i = 2026 - lt.yilBas;
  const e = (sx: "female" | "male") => {
    if (mode === "period") return lifeExpectancyAtBirth(lt[sx].qx[i], lt[sx].a0[i], lt[sx].eAcik[i]);
    // Kuşak: 2026 doğumlu biri her yıl o takvim yılının tablosuyla (2100 sonrası 2100 tablosu)
    const q = Array.from({ length: 100 }, (_, a) => lt[sx].qx[Math.min(lt.yilSon, 2026 + a) - lt.yilBas][a]);
    return lifeExpectancyAtBirth(q, lt[sx].a0[i], lt[sx].eAcik[lt.yilSon - lt.yilBas]);
  };
  return femaleShare * e("female") + (1 - femaleShare) * e("male");
}

describe("doğum çekilişi", () => {
  it("2026 doğumlarıyla 237 ülkeden çeker; oynanabilirler sadece 5 MVP ülkesi", () => {
    expect(data.births.yil).toBe(2026);
    expect(data.births.list.length).toBeGreaterThan(230);
    let mvp = 0;
    const n = 20000;
    for (let s = 0; s < n; s++) if (drawBirth(data, s).playable) mvp++;
    const share = MVP_COUNTRIES.reduce((a, iso) => a + data.births.list.find((c) => c.iso3 === iso)!.births, 0) / data.births.list.reduce((a, c) => a + c.births, 0);
    expect(Math.abs(mvp / n - share)).toBeLessThan(0.015);
  });
  it("MVP dışı ülkede oyun başlamaz (ekranda 'hazırlanıyor')", () => {
    let s = 0;
    while (drawBirth(data, s).playable) s++;
    expect(() => new Game(data, s)).toThrow();
  });
});

describe("tohum", () => {
  it("aynı tohum + aynı kararlar = aynı hayat", () => {
    for (const seed of [3, 17, 99, 2024]) {
      let s = seed;
      while (!drawBirth(data, s).playable) s += 1000;
      const a = new Game(data, s), b = new Game(data, s);
      const ca = playOut(a), cb = playOut(b);
      expect(cb).toEqual(ca);
      expect(b.s.log.map((e) => e.text)).toEqual(a.s.log.map((e) => e.text));
      expect(b.s.deathAge).toBe(a.s.deathAge);
    }
  });
  it("kayıttan yeniden kurma: seçimler tekrar oynatılınca aynı yere gelinir", () => {
    let s = 5;
    while (!drawBirth(data, s).playable) s++;
    const a = new Game(data, s);
    const ch = playOut(a);
    const b = new Game(data, s);
    let i = 0;
    while (!b.finished) { const r = b.step(); if (r.decision) b.choose(ch[i++]); }
    expect(b.s.log.map((e) => e.text)).toEqual(a.s.log.map((e) => e.text));
  });
});

describe("10.000 hayat (dönem modu, ülke başına 2.000)", () => {
  let res: ReturnType<typeof bigRun>;
  beforeAll(() => {
    res = bigRun("period", 2000);
  }, 600_000);

  it("ortalama ölüm yaşı BM WPP 2024 e0 (2026) ile ±2 yıl", () => {
    for (const iso of MVP_COUNTRIES) {
      const a = res.agg[iso];
      const sim = a.age / a.n;
      const bm = bmE0(iso, a.female / a.n, "period");
      expect(Math.abs(sim - bm), `${iso}: simülasyon ${sim.toFixed(2)}, BM ${bm.toFixed(2)}`).toBeLessThan(2);
    }
  });
  it("5 yaş altı ölüm BM WPP 2024 (2026) ile uyumlu (±%25 ya da ±4‰)", () => {
    for (const iso of MVP_COUNTRIES) {
      const a = res.agg[iso];
      const sim = (1000 * a.u5) / a.n;
      const bm = data.countries[iso].under5.v;
      expect(Math.abs(sim - bm), `${iso}: ${sim.toFixed(1)}‰ / BM ${bm.toFixed(1)}‰`).toBeLessThan(Math.max(4, 0.25 * bm));
    }
  });
  it("hiçbir hayatta tekrar eden metin, açılmamış sembol, iki kez ölen ya da öldükten sonra olaylarda görünen kişi yok", () => {
    expect(res.problems).toEqual([]);
  });
});

describe("kuşak modu (oyunun varsayılanı: her yıl o takvim yılının tablosu)", () => {
  it("ortalama ölüm yaşı BM tablolarından hesaplanan 2026 kuşağı ömrüyle ±2 yıl (ülke başına 1.500 hayat)", () => {
    const { agg, problems } = bigRun("cohort", 1500);
    expect(problems).toEqual([]);
    for (const iso of MVP_COUNTRIES) {
      const a = agg[iso];
      const sim = a.age / a.n;
      const bm = bmE0(iso, a.female / a.n, "cohort");
      expect(Math.abs(sim - bm), `${iso}: ${sim.toFixed(2)} / ${bm.toFixed(2)}`).toBeLessThan(2);
    }
  }, 600_000);
});

describe("veri ve dayanıklılık", () => {
  it("sıkıştırılmış qx ham BM qx ile aynı (4 anlamlı basamak)", () => {
    for (const f of RAW_MVP) {
      const c = data.countries[f.meta.iso3];
      for (const age of [0, 1, 30, 70, 99]) {
        const raw = f.yasamTablosu.male.qx[2026 - f.yasamTablosu.yilBas][age];
        expect(Math.abs(qxOf(c, "male", age, 2026) - raw) / raw).toBeLessThan(1e-3);
      }
    }
  });
  it("ölüm nedeni 2019 DSÖ dağılımından; paylar toplamı 1", () => {
    for (const iso of MVP_COUNTRIES) {
      const cs = data.countries[iso].causes!;
      expect(cs.yil).toBe(2019);
      for (const row of [...cs.female, ...cs.male]) expect(Math.abs(row.reduce((a, b) => a + b, 0) - 1)).toBeLessThan(0.01);
    }
  });
  it("Türkiye profili eksik ya da bozuk gelirse motor çökmez", () => {
    expect(turRules({})).not.toBeNull();
    expect(turRules({})!.military).toEqual([]);
    expect(turNames({})).toBeNull();
    const d2: GameData = { ...data, tur: turRules({ askerlik: null }), names: { ...data.names, TUR: undefined as never } };
    const g = new Game(d2, 1, { forceCountry: "TUR" });
    playOut(g);
    expect(g.finished).toBe(true);
  });
  it("Türkiye isimleri yalnız oyunda kullanılabilir genel havuzlardan", () => {
    expect(data.names.TUR.pools.length).toBeGreaterThanOrEqual(10);
    expect(data.names.NGA).toBeUndefined(); // kaynaklı havuz yok: kişiler rolleriyle anılır
  });
  it("Türkçe ekler", () => {
    expect(suffix("Ayşe", "in")).toBe("Ayşe'nin");
    expect(suffix("Mehmet", "e")).toBe("Mehmet'e");
    expect(suffix("annen", "i")).toBe("anneni");
    expect(suffix("Türkiye", "de")).toBe("Türkiye'de");
    expect(suffix("köy", "de")).toBe("köyde");
    expect(suffix("Çin", "de")).toBe("Çin'de");
    expect(suffix("Hindistan", "de")).toBe("Hindistan'da");
    expect(suffix("Nijerya", "de")).toBe("Nijerya'da");
    expect(suffix("Amerika Birleşik Devletleri", "de")).toBe("Amerika Birleşik Devletleri'nde");
  });
});
