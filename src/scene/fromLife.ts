// Motorun Life nesnesinden sahne durumu üretir.
import type { Life } from "../engine/types";
import type { RegionId, Season, SceneState, TimeOfDay, Place } from "./types";

import type { VisualProfileId } from "./gorsel-ayar";

/**
 * Ülke → görsel kit + görsel profil. Bu bir kültür iddiası değil; hangi mimari/iklim çizim
 * setinin ve hangi GEÇİCİ görsel ayarın (gorsel-ayar.ts) kullanılacağını söyler.
 * Bölgeler: content/regions/bolge-listesi.md (R01-R13).
 *  - "tam": kit o ülkenin bölgesi için çizildi.
 *  - "gecici": kendi kiti yok, en yakın kit kendi profiliyle ödünç alınıyor (Kalite'de işaretli).
 *  - listede yoksa: kit YOK. Sessizce bir kite düşülmez; çağıran açıkça yedek istemeli.
 */
interface KitEntry { region: RegionId; profile: VisualProfileId; status: "tam" | "gecici" }

const entries: [string[], KitEntry][] = [
  // R01 Batı Afrika (kıyı ve orman kuşağı): kit bu bölge için çizildi
  [["NGA", "GHA", "CIV", "BEN", "TGO", "LBR", "SLE", "GIN", "GNB", "SEN", "GMB", "CPV", "SHN"], { region: "bati-afrika", profile: "bati-afrika", status: "tam" }],
  // Doğu Akdeniz kıyısı + Anadolu + Mağrip: Akdeniz kiti bunlar için çizildi
  [["TUR", "LBN", "SYR", "JOR", "PSE", "EGY", "LBY", "TUN", "DZA", "MAR"], { region: "akdeniz", profile: "dogu-akdeniz", status: "tam" }],
  // Güney Avrupa (R12-b): mimari ortak ama giyim/oranlar farklı → ayrı profil, kit geçici
  [["ITA", "ESP", "PRT", "GRC", "MLT", "CYP"], { region: "akdeniz", profile: "guney-avrupa", status: "gecici" }],
  // Adriyatik kıyısı (R13 Balkan): Akdeniz mimarisi ortak; Güney Avrupa ayarıyla, geçici
  [["HRV", "MNE"], { region: "akdeniz", profile: "guney-avrupa", status: "gecici" }],
  // Kendi profili henüz olmayan, başörtüsünün az görüldüğü ülkeler: nötr adlı ayarla, geçici.
  // İsrail (R06, Dünya ve Kültür ayrı alt profil önerdi), Arnavutluk (R13), Ermenistan ve Gürcistan
  // (R07 Kafkasya; dağ/kar iklimi bu kitte zayıf, R07 kiti gelince oraya taşınacak).
  [["ISR", "ALB", "ARM", "GEO"], { region: "akdeniz", profile: "dusuk-basortusu-gecici", status: "gecici" }],
  // R06 Irak ve Körfez, R07 İran/Azerbaycan: kendi kitleri gelene kadar Doğu Akdeniz ayarıyla, geçici
  [["IRQ", "SAU", "YEM", "OMN", "ARE", "QAT", "BHR", "KWT", "ESH", "IRN", "AZE"], { region: "akdeniz", profile: "dogu-akdeniz", status: "gecici" }],
  // R02 Sahel: kendi kiti gelene kadar Batı Afrika kiti, geçici
  [["MLI", "NER", "BFA", "TCD", "MRT", "SDN"], { region: "bati-afrika", profile: "sahel-gecici", status: "gecici" }],
];
const KIT_OF: Record<string, KitEntry> = {};
for (const [list, e] of entries) for (const c of list) KIT_OF[c] = e;

export function kitForCountry(iso3: string): KitEntry | null {
  return KIT_OF[iso3.toUpperCase()] ?? null;
}

export function regionForCountry(iso3: string): RegionId | null {
  return kitForCountry(iso3)?.region ?? null;
}

/** Kit bu ülke için gerçekten çizildi mi, yoksa geçici ödünç mü? */
export function kitIsExact(iso3: string): boolean {
  return kitForCountry(iso3)?.status === "tam";
}

export interface SceneMoment {
  year: number;
  season: Season;
  timeOfDay: TimeOfDay;
  place?: Place;
  /**
   * Ülkenin kiti yoksa kullanılacak yedek kit. VERİLMEZSE HATA fırlatılır (sessiz düşüş yok).
   * Yedekle çizilen sahne "yedek" profiliyle (nötr ayar) çizilir ve kitStatus = "yedek" olur.
   */
  fallbackRegion?: RegionId;
}

export function sceneStateFromLife(life: Life, m: SceneMoment): SceneState {
  const k = kitForCountry(life.countryIso3);
  if (!k && !m.fallbackRegion) {
    throw new Error(`Görsel kit yok: ${life.countryIso3}. Bu ülke için kit çizilmedi; fallbackRegion açıkça verilmeli.`);
  }
  return {
    lifeSeed: life.seed,
    region: k ? k.region : m.fallbackRegion!,
    profile: k ? k.profile : "yedek",
    kitStatus: k ? k.status : "yedek",
    income: life.incomeQuintile,
    urban: life.urban,
    age: life.age,
    sex: life.sex,
    year: m.year,
    season: m.season,
    timeOfDay: m.timeOfDay,
    place: m.place,
    health: life.meters.health,
    family: life.people.map((p) => ({
      id: p.id,
      role: p.role,
      sex: p.sex,
      age: Math.max(0, m.year - p.birthYear),
      alive: p.alive,
    })),
  };
}
