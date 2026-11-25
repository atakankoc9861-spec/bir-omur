// Motorun temel veri tipleri. Tasarım: docs/TASARIM.md

export type Sex = "female" | "male";
export type Era = "past" | "today" | "future";

/** Bir ülkenin oyunda kullanılan verisi (data/processed içinden yüklenir). */
export interface CountryData {
  iso3: string;
  nameTr: string;
  year: number;
  annualBirths: number;
  population: number;
  lifeExpectancy: { female: number; male: number };
  under5Mortality: number; // 1000 doğumda
  gdpPerCapitaPpp: number;
  gini: number | null;
  urbanShare: number; // 0-1
  source: string; // ör. "UN WPP 2024; World Bank WDI"
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
