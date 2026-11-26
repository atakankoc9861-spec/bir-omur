// MVP ülkeleri → yaşayan sahne kiti.
// Türkiye ve Nijerya'nın kiti var (src/scene/fromLife.ts: "tam").
// Hindistan, Çin ve ABD için henüz kit YOK. Aşağıdaki seçimler GEÇİCİDİR ve oyuncuya
// gösterilmez; Görsel ve Arayüz kendi kitlerini (R08 Güney Asya, R09 Doğu Asya, Kuzey Amerika)
// yapınca bu dosya silinir. Yedek kit, sahne kodunun "yedek" profiliyle (nötr görsel ayar)
// çizilir; yani bu ülkelere Akdeniz ya da Batı Afrika'nın giyim/ten ayarı UYGULANMAZ.
//  - IND → bati-afrika: sıcak iklim, harmattan pusu Kuzey Hindistan'ın kış pusuna en yakın
//    hava; kerpiç/avlu evler kırsal Hindistan'a Akdeniz taş evinden daha yakın. GEÇİCİ.
//  - CHN → akdeniz: kar ve dört mevsim var; apartman/sokak dokusu daha uygun. GEÇİCİ.
//  - USA → akdeniz: kar ve dört mevsim; şehir sokağı. GEÇİCİ (mimari belirgin şekilde farklı).
import type { RegionId } from "../scene/types";
import { kitForCountry } from "../scene/fromLife";

export const GECICI_KIT: Record<string, RegionId> = {
  IND: "bati-afrika",
  CHN: "akdeniz",
  USA: "akdeniz",
};

/** Sahne için yedek bölge: ülkenin kendi kiti varsa undefined (fromLife kendisi seçer). */
export function fallbackRegionFor(iso3: string): RegionId | undefined {
  if (kitForCountry(iso3)) return undefined;
  return GECICI_KIT[iso3] ?? "akdeniz";
}

/**
 * GEÇİCİ görsel profil. Çin için "yedek" profilin eşit ten dağılımı yanıltıcı (Görsel'e bildirildi).
 * Yeni sayı yazmamak için gorsel-ayar.ts'deki mevcut nötr adlı profil ödünç alınır. Görsel ve Arayüz
 * Doğu Asya profili/kiti yapınca silinir. ABD ve Hindistan "yedek" (nötr) profilde kalır.
 */
import type { VisualProfileId } from "../scene/gorsel-ayar";
export function profileOverride(iso3: string): VisualProfileId | undefined {
  return iso3 === "CHN" ? "dusuk-basortusu-gecici" : undefined;
}
