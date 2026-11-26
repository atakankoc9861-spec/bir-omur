// Yaşayan sahnenin girdi ve plan tipleri. Stil kuralları: docs/stil-rehberi.md
import type { Person, Sex } from "../engine/types";
import type { VisualProfileId } from "./gorsel-ayar";

export type RegionId = "akdeniz" | "bati-afrika";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type Place = "home" | "outside";
export type Weather = "clear" | "cloudy" | "rain" | "snow" | "haze";
export type Activity = "rest" | "meal" | "chores" | "walk" | "doorstep" | "play" | "market";

/** Sahnede görünebilecek bir aile üyesi (motorun Person tipinden türetilir). */
export interface SceneFamilyMember {
  id: string;
  role: Person["role"];
  sex: Sex;
  age: number;
  alive: boolean;
  /** Aynı evde mi yaşıyor? Verilmezse yaş ve role göre tahmin edilir. */
  livesTogether?: boolean;
}

/** Sahneyi çizmek için gereken her şey. Motor bunu her yıl üretir. */
export interface SceneState {
  lifeSeed: number;
  region: RegionId;
  income: 1 | 2 | 3 | 4 | 5;
  urban: boolean;
  age: number;
  sex: Sex;
  /** Takvim yılı: eşyaların dönemini belirler (radyo, tüplü TV, düz ekran...). */
  year: number;
  season: Season;
  timeOfDay: TimeOfDay;
  family: SceneFamilyMember[];
  /** 0-100. Düşükse karakter oturur/dinlenir; hastane sahnesi gösterilmez. */
  health?: number;
  /** Verilmezse yönetmen (director) seçer. Güvenlik kuralı (bebek yanında büyük) bunu ezebilir. */
  place?: Place;
  /** Görsel profil (gorsel-ayar.ts). Verilmezse kitin varsayılanı. */
  profile?: VisualProfileId;
  /** Kit bu ülke için çizildi mi ("tam"), ödünç mü ("gecici"), yoksa açıkça istenen yedek mi ("yedek")? */
  kitStatus?: "tam" | "gecici" | "yedek";
}

/** Yönetmenin seçtiği, aynı hayatta tekrar etmeyen sahne planı. */
export interface ScenePlan {
  place: Place;
  activity: Activity;
  weather: Weather;
  /** Mobilya dizilimi, eşya seçimi, yoldan geçenler için tohum. */
  variant: number;
  /** Ev kimliği: aynı gelir ve yerleşimde ev aynı kalır (tutarlılık). */
  homeSeed: number;
  /** Tekrar kontrolü için imza. */
  signature: string;
}
