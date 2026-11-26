// =====================================================================================
//  DENGE AYARI — KAYNAK YOK
// =====================================================================================
//  Bu dosyadaki sayıların HİÇBİRİ istatistik değildir. Oyunun akması için elle konmuş
//  ayarlardır; oyuncuya rakam olarak gösterilmez. Kaynaklı bir seri bulununca ilgili ayar
//  silinip veriye bağlanır. Kodun başka hiçbir yerinde bu tür oran yazılmaz (kural 5).
//
//  Kaynaklı veriler motorda şunlardan gelir (data/processed/v1, content/countries/TUR.json):
//   ölüm olasılığı (BM WPP qx), ölüm nedeni (DSÖ GHE 2019 payları), cinsiyet oranı, yaşa göre
//   doğurganlık, kentleşme, gelir ondalık payları, kişi başı GSYH, okullaşma oranları,
//   Türkiye kuralları (askerlik, sınav, zorunlu eğitim, evlilik yaşı, emeklilik, kadın istihdamı).
// =====================================================================================

export const DENGE = {
  kaynak: "YOK — denge ayarı",

  /** Ölüm olasılığına gelir dilimi çarpanı (1 = en yoksul). Ortalaması ~1 tutuldu ki BM e0 korunsun. */
  incomeMortality: [1.22, 1.08, 1.0, 0.92, 0.8] as const,
  /** Sağlık göstergesinin yaşa göre beklenen değerinden sapması ölümü ne kadar etkiler. çarpan = exp(-sapma / bu). */
  healthMortalityScale: 60,
  healthMortalityClamp: [0.7, 1.8] as const,
  /** Olayların sağlığa ortalama net etkisini dengeler (toplu testle ayarlandı: ortalama çarpan ≈ 1). */
  healthDevCenter: 0,
  /** Otomatik oyuncunun ilk ("olağan") seçeneği seçme olasılığı. */
  autoFirstOption: 0.5,

  /** Yaşa göre beklenen sağlık (göstergenin yöneldiği taban). */
  healthBaseline(age: number): number {
    if (age < 5) return 82;
    if (age < 40) return 88;
    if (age < 60) return 88 - (age - 40) * 0.8;
    return Math.max(15, 72 - (age - 60) * 1.4);
  },
  /** Göstergeler her yıl tabana bu oranda yaklaşır (olaylar bu tabandan oynatır). */
  meterReversion: 0.3,

  /** Babanın yaşı = annenin yaşı + bu aralıkta tam sayı. (Babanın yaşına dair kaynaklı seri yok.) */
  fatherAgeGap: [-2, 8] as const,
  /** Doğumdan önceki kardeş sayısı üst sınırı (yaşa göre doğurganlıktan çekilir, sonra kesilir). */
  maxOlderSiblings: 7,

  /** Gelir diliminin hayat boyunca harcadığı pay (gelirin yüzde kaçı yıllık giderlere gider). */
  spendShare: [1.0, 0.96, 0.9, 0.84, 0.78] as const,
  /** Çocuk başına yıllık ek gider (hane gelirinin payı). */
  childCostShare: 0.08,
  /** Borç faizi (yıllık). */
  debtInterest: 0.08,
  /** Borçluyken gelirin en çok bu kadarı harcanır, kalanı borca gider. */
  debtSpendShare: 0.85,
  /** Borç tavanı: yıllık hane gelirinin bu katı (ev kredisi dahil). */
  maxDebtYears: 4,
  /** Birikim getirisi (yıllık, enflasyondan arındırılmış varsayım). */
  savingsReturn: 0.02,

  /** Okullaşma oranına gelir dilimi çarpanı (oran × çarpan, en çok 0,995). */
  schoolIncomeMult: [0.8, 0.92, 1.0, 1.06, 1.1] as const,
  /** Okula başlama yaşı (Türkiye dışında; Türkiye'de TUR.json egitim.donemler). */
  schoolStartAge: 6,
  /** Ortaöğretim bitiş yaşı (Türkiye dışında). */
  secondaryEndAge: 18,
  primaryEndAge: 12,
  universityYears: 4,

  /** Yetişkin gelir ondalığı: aile ondalığından sapma + eğitim etkisi. */
  mobility: { spread: 2, edu: { none: -2, primary: -1, secondary: 0, tertiary: 2 } },
  /** Hane kişi başı gelirine eşin katkısı (çalışıyorsa). */
  partnerIncomeBoost: 0.35,
  /** Emeklilik geliri, çalışma gelirinin bu kadarı (kayıtlı işte); kayıt dışında daha düşük. */
  pensionShare: { formal: 0.6, informal: 0.25 },
  /** Türkiye dışında çalışmayı bırakma yaşı aralığı (emeklilik kuralı verisi yok). */
  retireAgeRange: [60, 70] as const,

  /** Kadınların ücretli işte olma olasılığı (Türkiye dışında; Türkiye'de TÜİK 2024). */
  womenWorkShare: 0.6,
  menWorkShare: 0.85,

  /** Eş bulma: ortalama ilk evlilik yaşı (Türkiye dışında; Türkiye'de TÜİK 2024 verisi). */
  firstUnionMeanAge: { female: 26, male: 28 },
  /** Ortalama yaşta yıllık eş bulma olasılığı (zirve). */
  unionPeak: 0.4,
  /** Eş bulma olayının en erken yaşı (Türkiye'de yasal evlilik yaşıyla büyüğü alınır). */
  unionMinAge: 18,
  /** Eşin yaş farkı (eş − oyuncu) erkek oyuncu için; kadın oyuncuda işaret ters. */
  partnerAgeGap: [-6, 1] as const,
  /** Yıllık ayrılık olasılığı, ilişkiler göstergesi düşükken. */
  separationBase: 0.012,

  /** Eşi olan kadının yıllık doğum olasılığı = ASFR/1000 × bu (ASFR tüm kadınlar içindir). */
  partneredFertilityBoost: 2.0,
  /** "Çocuk isteği" kararının doğurganlığa çarpanı. */
  wantKids: { yes: 1.25, later: 0.45, no: 0.06 },

  /** Yılda en çok anlatı olayı ve karar. */
  eventsPerYear: { child: 1, adult: 2 },
  /** Yetişkinlikte bir yılda karar anı olasılığı. */
  adultDecisionChance: 0.42,
  /** Montaj (0-mezuniyet) boyunca kritik karar sayısı hedefi. */
  childhoodCritical: [6, 8] as const,

  /** Arkadaşın yıllık uzaklaşma olasılığı (taşınma vb.). */
  friendDrift: 0.04,

  /** Olay etkileri: gösterge değişim büyüklükleri. */
  fx: { small: 3, mid: 6, big: 12, huge: 20 },

  /** Kararlardaki para bedelleri (yıllık hane geliri × bu). */
  cost: {
    tutoring: 0.12,
    hobby: 0.05,
    wedding: 0.5,
    house: 3.5,
    treatment: 0.4,
    supportParent: 0.15,
    lend: 0.2,
    bedelli: 0.3,
    move: 0.25,
    donation: 0.05,
    trip: 0.15,
    checkup: 0.03,
  },
} as const;

export type Denge = typeof DENGE;
