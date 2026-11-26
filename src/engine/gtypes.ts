// Oyun motorunun durum tipleri ve olay (storylet) arayüzü.
import type { Rng } from "./rng";
import type { CompactCountry, TurRules } from "./gamedata";
import type { Life, Person, Sex } from "./types";

export type Tone = "iyi" | "kotu" | "notr" | "onemli" | "kayip";
export type EduLevel = "none" | "primary" | "secondary" | "tertiary";
export type MeterKey = "health" | "happiness" | "knowledge" | "relationships";

export interface StatLine {
  text: string;
  kaynak: string;
}

export interface GPerson extends Person {
  deathYear?: number;
  deathAge?: number;
  deathCause?: string;
  /** Sahne için: oyuncuyla aynı evde mi. */
  livesTogether?: boolean;
  /** Eş için: evli mi (yoksa sevgili). */
  married?: boolean;
  /** Bu kişinin kendi gelir ondalığı (eş için). */
  decile?: number;
  works?: boolean;
}

export interface Entry {
  age: number;
  year: number;
  key: string;
  text: string;
  tone: Tone;
  stat?: StatLine;
  important?: boolean;
  /** Metinde "canlı" olarak geçen kişiler (anma metinleri hariç). */
  refs: string[];
  /** Ölüm satırlarında ölen kişinin kimliği ("ben" = oyuncu). */
  about?: string;
  /** Göstergedeki değişimler (arayüzde küçük işaretler için). */
  fx?: Partial<Record<MeterKey | "money", number>>;
}

export interface ChoiceView {
  id: string;
  label: string;
  cost?: number;
  locked?: string | null;
}

export interface DecisionView {
  key: string;
  prompt: string;
  options: ChoiceView[];
  stat?: StatLine;
  critical?: boolean;
}

export interface ReflectionView {
  age: number;
  question: string;
  options: string[];
}

export interface YearReport {
  age: number;
  year: number;
  entries: Entry[];
  decision?: DecisionView;
  reflection?: ReflectionView;
  montage: boolean;
  died: boolean;
}

export interface Job {
  working: boolean;
  formal: boolean;
  decile: number;
  startYear: number | null;
  formalYears: number;
  retired: boolean;
  unemployedUntil: number;
}

export interface LifeState extends Life {
  iso3: string;
  people: GPerson[];
  givenName: string | null;
  surname: string | null;
  familyDecile: number;
  edu: EduLevel;
  inSchool: boolean;
  student: "none" | "primary" | "secondary" | "tertiary";
  leftHome: boolean;
  job: Job;
  flags: Set<string>;
  counts: Record<string, number>;
  lastSeen: Record<string, number>;
  wantKids: "yes" | "later" | "no" | null;
  yearTones: Tone[];
  reflections: { age: number; question: string; answer: string | null }[];
  deathAge?: number;
  deathYear?: number;
  deathCauseCode?: string;
  criticalCount: number;
  log: Entry[];
}

export interface OptionSpec<C = Ctx> {
  id: string;
  label: string;
  cost?: number;
  /** Doluysa seçenek kilitli; metin nedeni söyler. */
  locked?: string | null;
  /** Sonuç: gramer metni (ya da listesi). Etkileri burada uygulanır. */
  effect: (c: C) => string | string[] | null;
  tone?: Tone;
  important?: boolean;
}

export interface DecisionSpec<C = Ctx> {
  prompt: string;
  options: OptionSpec<C>[];
  stat?: StatLine | null;
  critical?: boolean;
}

export interface Storylet<C = Ctx> {
  id: string;
  ages: [number, number];
  weight?: number | ((c: C) => number);
  when?: (c: C) => boolean;
  /** Bu hayatta en çok kaç kez (varsayılan 1). */
  max?: number;
  /** Aynı olay arasında en az kaç yıl. */
  cooldown?: number;
  countries?: string[];
  text?: string | string[];
  tone: Tone;
  important?: boolean;
  /** Metinden ÖNCE çalışır (değişken hazırlamak için; durum değiştirmemeli). */
  prep?: (c: C) => void;
  fx?: (c: C) => void;
  choice?: (c: C) => DecisionSpec<C> | null;
  stat?: (c: C) => StatLine | null;
  /** Olay metninde canlı olarak geçen kişi (seçilir, vars.kisi olur). */
  pickPerson?: (c: C) => GPerson | null;
}

export interface Ctx {
  readonly s: LifeState;
  readonly rng: Rng;
  readonly age: number;
  readonly year: number;
  readonly country: CompactCountry;
  readonly tur: TurRules | null;
  readonly isTur: boolean;
  /** Bu olayda seçilen kişi (pickPerson). */
  target: GPerson | null;
  vars: Record<string, string>;
  alive(role?: GPerson["role"]): GPerson[];
  mother(): GPerson | null;
  father(): GPerson | null;
  partner(): GPerson | null;
  friend(): GPerson | null;
  has(flag: string): boolean;
  flag(flag: string, on?: boolean): void;
  meter(k: MeterKey, d: number): void;
  money(d: number): void;
  readonly cash: number;
  readonly income: number;
  cost(kind: keyof typeof import("./denge").DENGE.cost): number;
  canAfford(x: number, creditYears?: number): boolean;
  bond(p: GPerson | null, d: number): void;
  addPerson(role: GPerson["role"], sex: Sex, birthYear: number, extra?: Partial<GPerson>): GPerson;
  phrase(p: GPerson): string;
  nameOf(p: GPerson): string;
  money$(x: number): string;
  /** Kayıt dışı bir sistem olayı: hemen metin ekler (benzersizse). */
  say(text: string | string[], tone: Tone, opt?: { stat?: StatLine | null; important?: boolean; key?: string; refs?: GPerson[]; about?: string }): boolean;
}
