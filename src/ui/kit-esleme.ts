// MVP ülkeleri → yaşayan sahne kiti.
// Türkiye ve Nijerya'nın kiti var (src/scene/fromLife.ts: "tam").
// Hindistan, Çin ve ABD için henüz kit YOK. Yapımcı kararı (Kalite denetimi O1, 2026-11-26):
// kendi kitleri gelene kadar bu ülkeler NÖTR çizilir:
//  - profil: "yedek" (sahne kodunun nötr görsel ayarı; hiçbir bölgeye ağırlık vermez),
//  - giysi: neutralDress (desen yok, bölgesel başlık yok, entari/geleneksel kesim yok),
//  - zemin/mimari: Akdeniz kitinin şehir/köy dokusu GEÇİCİ olarak ödünç alınır (Batı Afrika
//    kitinin kerpiç ev, baobab gibi belirgin bölge işaretleri daha yanıltıcı bulundu).
// Görsel ve Arayüz R08 Güney Asya, R09 Doğu Asya ve Kuzey Amerika kitlerini yapınca bu dosya silinir.
import type { RegionId } from "../scene/types";
import { kitForCountry } from "../scene/fromLife";

export const GECICI_KIT: Record<string, RegionId> = {
  IND: "akdeniz",
  CHN: "akdeniz",
  USA: "akdeniz",
};

/** Sahne için yedek bölge: ülkenin kendi kiti varsa undefined (fromLife kendisi seçer). */
export function fallbackRegionFor(iso3: string): RegionId | undefined {
  if (kitForCountry(iso3)) return undefined;
  return GECICI_KIT[iso3] ?? "akdeniz";
}

/** Kiti olmayan ülkede nötr giysi. */
export function needsNeutralDress(iso3: string): boolean {
  return !kitForCountry(iso3);
}
