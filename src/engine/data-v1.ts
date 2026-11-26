// data/processed/v1/ dosyalarının biçimi. Üreten: scripts/veri/donustur.py
// Açıklamalar: data/README.md (bölüm "Veri v1").

import type { CountryData } from "./types";

export interface SourceInfo {
  ad: string;
  kurum: string;
  yayin: string;
  adres: string;
  lisans: string;
  not?: string;
}

/** countries.json */
export interface CountriesFileV1 {
  meta: { surum: "v1"; uretildi: string; yil: number; aciklama: string; kaynaklar: Record<string, SourceInfo> };
  countries: CountryData[];
}

/** dogumlar.json: dizilerin i. elemanı = yilBas + i yılı. */
export interface BirthsFileV1 {
  meta: {
    surum: "v1";
    uretildi: string;
    yilBas: number;
    yilSon: number;
    tahminSonYil: number; // bu yıldan sonrası BM projeksiyonu
    kaynaklar: Record<string, SourceInfo>;
  };
  dunya: { births: number[]; population: number[] };
  ulkeler: Record<string, { nameTr: string; kaynak: string; births: number[]; population: number[] }>;
}

export interface YearSeries {
  yillar: number[];
  degerler: number[];
}

/** Tek yaş dönem yaşam tablosu; qx[yilIndex][yas], yaş 0-99. 100+ açık yaş. */
export interface LifeTableSex {
  qx: number[][];
  a0: number[];
  eAcik: number[];
}

export interface CauseCell {
  olumBin: number;
  pay: number;
}

export interface DeathCauseAgeCell {
  gruplar: Record<string, CauseCell>;
  yapraklar: Record<string, CauseCell>;
  toplamOlumBin: number;
  nufusBin: number;
}

/** mvp/<ISO3>.json */
export interface MvpCountryFileV1 {
  meta: { surum: "v1"; iso3: string; nameTr: string; kaynaklar: Record<string, SourceInfo>; tahminSonYil: number };
  yasamTablosu: {
    kaynak: string;
    yilBas: number;
    yilSon: number;
    acikYas: number;
    female: LifeTableSex;
    male: LifeTableSex;
  };
  seriler: {
    yilBas: number;
    yilSon: number;
    e0: { kaynak: string; female: number[]; male: number[] };
    under5Mortality: { kaynak: string; degerler: number[] };
    infantMortality: { kaynak: string; degerler: number[] };
    tfr: { kaynak: string; degerler: number[] };
    anneOrtalamaYasi: { kaynak: string; degerler: number[] };
    dogumdaCinsiyetOrani: { kaynak: string; degerler: number[] };
  };
  dogurganlikYasaGore: { kaynak: string; yasGruplari: string[]; yillar: number[]; degerler: number[][] };
  gelir: {
    gdpPerCapitaPpp: YearSeries & { kaynak: string };
    anketler: {
      kaynak: string;
      liste: { yil: number; refahTuru: "gelir" | "tuketim"; gini: number; ondalikPaylar: number[]; anket: string }[];
    };
  };
  kentlesme: YearSeries & { kaynak: string };
  egitim: {
    ortalamaEgitimYili: { kaynak: string; toplam: YearSeries; female: YearSeries; male: YearSeries };
    beklenenEgitimYili: { kaynak: string; toplam: YearSeries; female: YearSeries; male: YearSeries };
    ilkokulNetOkullasma: YearSeries & { kaynak: string };
    ortaogretimBrutOkullasma: YearSeries & { kaynak: string };
    yuksekogretimBrutOkullasma: YearSeries & { kaynak: string };
  };
  istihdam: { tarimdaIstihdam: YearSeries & { kaynak: string } };
  olumNedenleri: {
    kaynak: string;
    /** Olağan yıl varsayılanı ("2019"). Motor ölüm nedenini varsayılan olarak bu yıldan çeker. */
    varsayilanYil: string;
    varsayilanYilNot: string;
    yasGruplari: string[];
    nedenler: Record<string, { kod: number | string; adEn: string; duzey: number | null; ustGrup: number | null }>;
    yillar: Record<
      string,
      {
        kaynak: string;
        dsoVeriKaliteKodu: number;
        /** true ise bu yılın neden payları oyunda kullanılmaz (ör. Türkiye 2023). */
        olaganDisi: boolean;
        kullanilmasin: boolean;
        olaganDisiNot: string | null;
        female: Record<string, DeathCauseAgeCell>; male: Record<string, DeathCauseAgeCell> }
    >;
  };
}

/**
 * Dönem yaşam tablosundan doğumda beklenen yaşam süresi (e0).
 * l0 = 1; d = l·q; L(x) = l(x+1) + a(x)·d(x), a(0) = a0, a(1..99) = 0,5 (BM WPP); L(100+) = l100 · eAcik.
 */
export function lifeExpectancyAtBirth(qx: readonly number[], a0: number, eOpen: number): number {
  let l = 1;
  let total = 0;
  for (let x = 0; x < qx.length; x++) {
    const d = l * qx[x];
    const a = x === 0 ? a0 : 0.5;
    total += l - d + a * d;
    l -= d;
  }
  return total + l * eOpen;
}
