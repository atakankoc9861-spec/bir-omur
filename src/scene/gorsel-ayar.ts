// =====================================================================================
//  GEÇİCİ GÖRSEL AYAR — KAYNAKSIZ
// =====================================================================================
//  Bu dosyadaki HİÇBİR sayı istatistik değildir. Hepsi sahnede çeşitlilik sağlamak için
//  elle konmuş geçici ayarlardır ve oyuncuya rakam olarak gösterilmez.
//  Ama dünyayı nasıl gösterdiğimizi belirledikleri için (kural 5, Kalite denetimi O3):
//   - Kodun başka hiçbir yerinde bu tür oran YAZILMAZ; kitler buradan okur.
//   - Dünya ve Kültür departmanının ülke/bölge profilleri (content/countries, content/regions)
//     kaynaklı değerleri verdiğinde bu dosya o profillerden beslenecek ve buradaki
//     sayılar silinecek. Oyuncuya çıkmadan önce bu değiştirilmelidir.
//  Her değerin yanındaki "kaynak" alanı bilerek "YOK" yazıyor.
// =====================================================================================

/** Görsel profil: bir kitin hangi ayarlarla çizileceği. Kit ≠ profil (bir kit birden çok profil taşıyabilir). */
export type VisualProfileId = "dogu-akdeniz" | "guney-avrupa" | "dusuk-basortusu-gecici" | "bati-afrika" | "sahel-gecici" | "yedek";

export interface VisualSettings {
  kaynak: "YOK — geçici görsel ayar, ülke profilinden gelecek";
  /** 10 basamaklı ten paletinde hane tonunun ağırlıkları (palette.ts SKIN). */
  skinWeights: number[];
  /** Başörtüsü/başa bez: hanelerin ne kadarında yaygın, o hanelerde ve diğerlerinde olasılık. */
  headCover: { householdShare: number; inCovering: number; otherwise: number };
  /** Geleneksel giysi eğilimi çarpanı (0 = hiç, 1 = kitteki tam eğilim). */
  traditionalDress: number;
  /** Kırsal ve gelir ≤2 evde elektrik olasılığı (yoksa fener). Şehirde hep var. */
  ruralLowIncomeElectricity: number;
  /** Kırsalda bu gelir diliminin altı ve eşiti kerpiç ev olarak çizilir. */
  ruralMudHouseMaxIncome: number;
  /** Kış kar ağırlığı (şehir / köy); kitin diğer hava ağırlıklarıyla birlikte okunur. */
  winterSnow: { urban: number; rural: number };
}

const K = "YOK — geçici görsel ayar, ülke profilinden gelecek" as const;

export const GORSEL_AYAR: Record<VisualProfileId, VisualSettings> = {
  // Akdeniz kiti, Doğu Akdeniz / Anadolu / Kuzey Afrika kıyısı için
  "dogu-akdeniz": {
    kaynak: K,
    skinWeights: [1, 3, 4, 4, 3, 1.2, 0.3, 0, 0, 0],
    headCover: { householdShare: 0.35, inCovering: 0.85, otherwise: 0.04 },
    traditionalDress: 1,
    ruralLowIncomeElectricity: 1,
    ruralMudHouseMaxIncome: 0,
    winterSnow: { urban: 0.6, rural: 1.4 },
  },
  // Akdeniz kiti, Güney Avrupa için (geçici: kendi alt kiti yapılana kadar)
  "guney-avrupa": {
    kaynak: K,
    skinWeights: [2, 4, 4, 3, 1.2, 0.4, 0.2, 0.1, 0, 0],
    headCover: { householdShare: 0.03, inCovering: 0.8, otherwise: 0 },
    traditionalDress: 0.2,
    ruralLowIncomeElectricity: 1,
    ruralMudHouseMaxIncome: 0,
    winterSnow: { urban: 0.3, rural: 0.8 },
  },
  // Ülkeye/bölgeye bağlanmayan nötr ayar: kendi profili henüz olmayan, başörtüsünün az
  // görüldüğü ülkeler için (İsrail, Arnavutluk, Ermenistan, Gürcistan). Adı bilerek bölge adı değil.
  "dusuk-basortusu-gecici": {
    kaynak: K,
    skinWeights: [1.5, 3, 4, 3, 1.5, 0.5, 0.2, 0.1, 0, 0],
    headCover: { householdShare: 0.05, inCovering: 0.8, otherwise: 0.01 },
    traditionalDress: 0.25,
    ruralLowIncomeElectricity: 1,
    ruralMudHouseMaxIncome: 0,
    winterSnow: { urban: 0.6, rural: 1.4 },
  },
  "bati-afrika": {
    kaynak: K,
    skinWeights: [0, 0, 0, 0, 0.3, 1.5, 3, 4, 3.5, 2],
    headCover: { householdShare: 0.4, inCovering: 0.7, otherwise: 0.25 },
    traditionalDress: 1,
    ruralLowIncomeElectricity: 0.45,
    ruralMudHouseMaxIncome: 3,
    winterSnow: { urban: 0, rural: 0 },
  },
  // Sahel (R02) kendi kiti gelene kadar Batı Afrika kitiyle; ayrı ayar uydurulmadı, aynı değerler.
  "sahel-gecici": {
    kaynak: K,
    skinWeights: [0, 0, 0, 0, 0.3, 1.5, 3, 4, 3.5, 2],
    headCover: { householdShare: 0.4, inCovering: 0.7, otherwise: 0.25 },
    traditionalDress: 1,
    ruralLowIncomeElectricity: 0.45,
    ruralMudHouseMaxIncome: 3,
    winterSnow: { urban: 0, rural: 0 },
  },
  // Kiti olmayan ülke için açıkça istenmiş yedek: nötr, hiçbir kültüre ağırlık vermez.
  yedek: {
    kaynak: K,
    skinWeights: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    headCover: { householdShare: 0.1, inCovering: 0.5, otherwise: 0.05 },
    traditionalDress: 0.3,
    ruralLowIncomeElectricity: 0.7,
    ruralMudHouseMaxIncome: 1,
    winterSnow: { urban: 0.3, rural: 0.6 },
  },
};

export const DEFAULT_PROFILE = { akdeniz: "dogu-akdeniz", "bati-afrika": "bati-afrika" } as const;
