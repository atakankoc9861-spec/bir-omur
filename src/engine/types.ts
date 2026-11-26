// Motorun temel veri tipleri. Tasarım: docs/TASARIM.md

export type Sex = "female" | "male";
export type Era = "past" | "today" | "future";

/** Bir alanın kaynağı ve yılı (data/processed/v1/countries.json → meta.kaynaklar kimlikleri). */
export interface FieldSource {
  kaynak: string | null; // değer null ise kaynak da null
  yil: number | null;
  seri: string;
}

/** Bir ülkenin oyunda kullanılan verisi (data/processed içinden yüklenir). */
export interface CountryData {
  iso3: string;
  nameTr: string;
  year: number;
  annualBirths: number;
  population: number;
  lifeExpectancy: { female: number; male: number };
  under5Mortality: number; // 1000 doğumda
  gdpPerCapitaPpp: number | null; // sabit 2021 uluslararası $; kaynakta yoksa null
  gini: number | null; // 0-100
  urbanShare: number | null; // 0-1; kaynakta yoksa null
  source: string; // ör. "UN WPP 2024; World Bank WDI"
  /** Referans yılı bu ülke için olağan dışıysa (ör. Türkiye 2023 depremi) not; motor/ekran bunu göstermeli. */
  yearNote?: { olaganDisi: boolean; not: string; alanlar: string[] };
  /** Alan alan kaynak ve yıl (veri v1'den itibaren dolu). */
  fieldSources?: Partial<
    Record<
      | "annualBirths"
      | "population"
      | "lifeExpectancy"
      | "under5Mortality"
      | "gdpPerCapitaPpp"
      | "gini"
      | "urbanShare",
      FieldSource
    >
  >;
}

export interface Meters {
  health: number; // 0-100
  happiness: number;
  knowledge: number;
  relationships: number;
}

export interface Budget {
  cash: number; // PPP dolar
  debt: number;
  annualIncome: number;
  annualExpenses: number;
}

/** Hayattaki kalıcı bir kişi: anne, eş, çocuk, arkadaş... */
export interface Person {
  id: string;
  name: string;
  sex: Sex;
  birthYear: number;
  role: "mother" | "father" | "sibling" | "partner" | "ex" | "child" | "friend" | "pet";
  alive: boolean;
  bond: number; // 0-100 ilişki gücü
  occupation?: string;
}

export interface LifeEvent {
  age: number;
  year: number;
  key: string; // olay kimliği, tekrar kontrolü için
  text: string;
  source?: string; // olayın dayandığı istatistik
}

export interface Life {
  seed: number;
  name: string;
  sex: Sex;
  birthYear: number;
  countryIso3: string;
  urban: boolean;
  incomeQuintile: 1 | 2 | 3 | 4 | 5;
  age: number;
  alive: boolean;
  meters: Meters;
  budget: Budget;
  people: Person[];
  events: LifeEvent[];
  causeOfDeath?: string;
}
