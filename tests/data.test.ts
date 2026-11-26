// Veri v1 doğrulama testi. Veri: data/processed/v1/ (scripts/veri/donustur.py üretir).
import { describe, expect, it } from "vitest";
import countriesRaw from "../data/processed/v1/countries.json";
import birthsRaw from "../data/processed/v1/dogumlar.json";
import turRaw from "../data/processed/v1/mvp/TUR.json";
import indRaw from "../data/processed/v1/mvp/IND.json";
import ngaRaw from "../data/processed/v1/mvp/NGA.json";
import chnRaw from "../data/processed/v1/mvp/CHN.json";
import usaRaw from "../data/processed/v1/mvp/USA.json";
import {
  lifeExpectancyAtBirth,
  type BirthsFileV1,
  type CountriesFileV1,
  type MvpCountryFileV1,
} from "../src/engine/data-v1";
import type { CountryData } from "../src/engine/types";

const countries = countriesRaw as CountriesFileV1;
const births = birthsRaw as BirthsFileV1;
const mvp: MvpCountryFileV1[] = [turRaw, indRaw, ngaRaw, chnRaw, usaRaw] as MvpCountryFileV1[];
const MVP = ["TUR", "IND", "NGA", "CHN", "USA"];

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const sum = (a: readonly number[]) => a.reduce((s, x) => s + x, 0);

describe("countries.json şeması", () => {
  const list = countries.countries;

  it("237 ülke, ISO3 tekil, Kosova ve Togo var", () => {
    expect(list).toHaveLength(237);
    expect(new Set(list.map((c) => c.iso3)).size).toBe(237);
    for (const iso of [...MVP, "XKX", "TGO"]) expect(list.some((c) => c.iso3 === iso)).toBe(true);
  });

  it("her ülke CountryData alanlarına ve değer aralıklarına uyuyor", () => {
    for (const c of list) {
      const ctx = c.iso3;
      expect(c.iso3, ctx).toMatch(/^[A-Z]{3}$/);
      expect(typeof c.nameTr === "string" && c.nameTr.length > 0, ctx).toBe(true);
      expect(c.year, ctx).toBe(countries.meta.yil);
      expect(Number.isInteger(c.annualBirths) && c.annualBirths > 0, ctx).toBe(true);
      expect(Number.isInteger(c.population) && c.population > 0, ctx).toBe(true);
      for (const s of ["female", "male"] as const) {
        expect(isNum(c.lifeExpectancy[s]), ctx).toBe(true);
        expect(c.lifeExpectancy[s], ctx).toBeGreaterThan(20);
        expect(c.lifeExpectancy[s], ctx).toBeLessThan(100);
      }
      expect(c.under5Mortality, ctx).toBeGreaterThan(0);
      expect(c.under5Mortality, ctx).toBeLessThan(1000);
      if (c.gdpPerCapitaPpp !== null) expect(c.gdpPerCapitaPpp, ctx).toBeGreaterThan(0);
      if (c.gini !== null) {
        expect(c.gini, ctx).toBeGreaterThan(0);
        expect(c.gini, ctx).toBeLessThan(100);
      }
      if (c.urbanShare !== null) {
        expect(c.urbanShare, ctx).toBeGreaterThanOrEqual(0);
        expect(c.urbanShare, ctx).toBeLessThanOrEqual(1);
      }
      expect(c.source.length, ctx).toBeGreaterThan(0);
    }
  });

  it("her alanın kaynağı ve yılı var; değer null ise kaynak da null", () => {
    const fields = [
      "annualBirths",
      "population",
      "lifeExpectancy",
      "under5Mortality",
      "gdpPerCapitaPpp",
      "gini",
      "urbanShare",
    ] as const;
    for (const c of list) {
      for (const f of fields) {
        const fs = c.fieldSources?.[f];
        expect(fs, `${c.iso3}.${f}`).toBeDefined();
        const value = (c as CountryData)[f];
        if (value === null) {
          expect(fs!.kaynak, `${c.iso3}.${f}`).toBeNull();
        } else {
          expect(countries.meta.kaynaklar[fs!.kaynak!], `${c.iso3}.${f} kaynak kimliği`).toBeDefined();
          expect(Number.isInteger(fs!.yil), `${c.iso3}.${f} yıl`).toBe(true);
          expect(fs!.yil!, `${c.iso3}.${f}`).toBeLessThanOrEqual(countries.meta.yil);
        }
      }
    }
  });

  it("5 MVP ülkesinde Dünya Bankası alanları dolu", () => {
    for (const iso of MVP) {
      const c = list.find((x) => x.iso3 === iso)!;
      expect(c.gdpPerCapitaPpp, iso).not.toBeNull();
      expect(c.gini, iso).not.toBeNull();
      expect(c.urbanShare, iso).not.toBeNull();
    }
  });
});

describe("dogumlar.json (doğum çekilişi)", () => {
  const n = births.meta.yilSon - births.meta.yilBas + 1;

  it("1950-2100, her ülke için tam seri", () => {
    expect(births.meta.yilBas).toBe(1950);
    expect(births.meta.yilSon).toBe(2100);
    expect(Object.keys(births.ulkeler)).toHaveLength(237);
    for (const [iso, u] of Object.entries(births.ulkeler)) {
      expect(u.births, iso).toHaveLength(n);
      expect(u.population, iso).toHaveLength(n);
      for (const v of [...u.births, ...u.population]) expect(Number.isInteger(v) && v >= 0, iso).toBe(true);
    }
  });

  it("countries.json ile aynı yılın doğumları aynı", () => {
    const i = countries.meta.yil - births.meta.yilBas;
    for (const c of countries.countries) expect(births.ulkeler[c.iso3].births[i], c.iso3).toBe(c.annualBirths);
  });

  it("doğum payları her yıl toplamda 1; ülke toplamı dünya satırından en çok %0,05 sapar (Togo düzeltmesi)", () => {
    for (let i = 0; i < n; i++) {
      const total = sum(Object.values(births.ulkeler).map((u) => u.births[i]));
      const shares = Object.values(births.ulkeler).map((u) => u.births[i] / total);
      expect(sum(shares)).toBeCloseTo(1, 9);
      expect(Math.abs(total - births.dunya.births[i]) / births.dunya.births[i]).toBeLessThan(0.0005);
    }
  });

  it("Togo BM'nin 2026-01-19 ara güncellemesinden", () => {
    expect(births.ulkeler.TGO.kaynak).toBe("wpp2024-togo");
  });
});

describe("MVP derin veri", () => {
  it("5 ülke dosyası var ve yaşam tablosu biçimi doğru", () => {
    expect(mvp.map((m) => m.meta.iso3)).toEqual(MVP);
    for (const m of mvp) {
      const lt = m.yasamTablosu;
      const n = lt.yilSon - lt.yilBas + 1;
      expect(n).toBe(151);
      for (const s of ["female", "male"] as const) {
        expect(lt[s].qx).toHaveLength(n);
        expect(lt[s].a0).toHaveLength(n);
        expect(lt[s].eAcik).toHaveLength(n);
        for (const row of lt[s].qx) {
          expect(row).toHaveLength(100);
          for (const q of row) expect(q >= 0 && q <= 1).toBe(true);
        }
      }
    }
  });

  it("yaşam tablosundan hesaplanan e0, BM'nin yayımladığı e0'a ±0,5 yıl yakın (her yıl, iki cinsiyet)", () => {
    let worst = 0;
    for (const m of mvp) {
      for (const s of ["female", "male"] as const) {
        const lt = m.yasamTablosu[s];
        for (let i = 0; i < lt.qx.length; i++) {
          const e0 = lifeExpectancyAtBirth(lt.qx[i], lt.a0[i], lt.eAcik[i]);
          const un = m.seriler.e0[s][i];
          const diff = Math.abs(e0 - un);
          worst = Math.max(worst, diff);
          expect(diff, `${m.meta.iso3} ${s} ${m.yasamTablosu.yilBas + i}`).toBeLessThan(0.5);
        }
      }
    }
    expect(worst).toBeLessThan(0.5);
    // Kalite K6: gerçek fark ~0,0006; bozulmayı erken yakalamak için sıkı eşik de var.
    expect(worst).toBeLessThan(0.01);
  });

  it("2023 yaşam tablosu e0 = countries.json yaşam beklentisi (±0,5)", () => {
    for (const m of mvp) {
      const c = countries.countries.find((x) => x.iso3 === m.meta.iso3)!;
      const i = 2023 - m.yasamTablosu.yilBas;
      for (const s of ["female", "male"] as const) {
        const lt = m.yasamTablosu[s];
        expect(Math.abs(lifeExpectancyAtBirth(lt.qx[i], lt.a0[i], lt.eAcik[i]) - c.lifeExpectancy[s])).toBeLessThan(0.5);
      }
    }
  });

  it("gelir ondalık payları her ankette ~1", () => {
    for (const m of mvp) {
      expect(m.gelir.anketler.liste.length, m.meta.iso3).toBeGreaterThan(0);
      for (const a of m.gelir.anketler.liste) {
        expect(a.ondalikPaylar).toHaveLength(10);
        expect(Math.abs(sum(a.ondalikPaylar) - 1), `${m.meta.iso3} ${a.yil}`).toBeLessThan(0.01);
        expect(a.gini > 0 && a.gini < 1).toBe(true);
      }
    }
  });

  it("ölüm nedeni payları her cinsiyet × yaş hücresinde ~1 (gruplar ve yapraklar ayrı ayrı)", () => {
    for (const m of mvp) {
      for (const [yil, y] of Object.entries(m.olumNedenleri.yillar)) {
        for (const s of ["female", "male"] as const) {
          for (const yas of m.olumNedenleri.yasGruplari) {
            const cell = y[s][yas];
            for (const level of ["gruplar", "yapraklar"] as const) {
              const ps = Object.values(cell[level]).map((c) => c.pay);
              expect(Math.abs(sum(ps) - 1), `${m.meta.iso3} ${yil} ${s} ${yas} ${level}`).toBeLessThan(1e-3);
              for (const k of Object.keys(cell[level])) expect(m.olumNedenleri.nedenler[k], k).toBeDefined();
            }
          }
        }
      }
    }
  });

  it("ölüm nedeni varsayılan yılı 2019 ve olağan; Türkiye 2023 işaretli ve kullanılmıyor (Kalite O1)", () => {
    for (const m of mvp) {
      const o = m.olumNedenleri;
      expect(o.varsayilanYil, m.meta.iso3).toBe("2019");
      expect(o.yillar[o.varsayilanYil].olaganDisi, m.meta.iso3).toBe(false);
      expect(o.yillar[o.varsayilanYil].kullanilmasin, m.meta.iso3).toBe(false);
      for (const y of Object.values(o.yillar)) {
        expect(y.kullanilmasin).toBe(y.olaganDisi);
        if (y.olaganDisi) expect((y.olaganDisiNot ?? "").length).toBeGreaterThan(0);
      }
    }
    const tur = mvp.find((m) => m.meta.iso3 === "TUR")!.olumNedenleri.yillar["2023"];
    expect(tur.olaganDisi).toBe(true);
    expect(tur.kullanilmasin).toBe(true);
    expect(tur.olaganDisiNot).toMatch(/kadın/);
  });

  it("Türkiye 2023 countries.json'da 'deprem yılı, olağan dışı' notu taşıyor (Kalite O3)", () => {
    const tur = countries.countries.find((c) => c.iso3 === "TUR")!;
    expect(tur.yearNote?.olaganDisi).toBe(true);
    expect(tur.yearNote?.not).toMatch(/[Dd]eprem yılı, olağan dışı/);
  });

  it("doğurganlık ve eğitim serileri dolu, kaynaklı", () => {
    for (const m of mvp) {
      expect(m.seriler.tfr.degerler).toHaveLength(151);
      expect(m.dogurganlikYasaGore.degerler).toHaveLength(151);
      expect(m.egitim.ortalamaEgitimYili.toplam.yillar.length).toBeGreaterThan(0);
      expect(m.kentlesme.yillar.length).toBeGreaterThan(0);
      for (const k of [m.seriler.tfr.kaynak, m.kentlesme.kaynak, m.egitim.ortalamaEgitimYili.kaynak, m.olumNedenleri.kaynak])
        expect(m.meta.kaynaklar[k], k).toBeDefined();
    }
  });
});
