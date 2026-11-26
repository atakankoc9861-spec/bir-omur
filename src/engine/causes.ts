// DSÖ GHE neden gruplarının (düzey 2) oyunda görünen Türkçe adları.
// GEÇİCİ ÇEVİRİ: Simülasyon departmanı yazdı; Anlatı ve İçerik onayı bekliyor (Veri devir notu:
// "Türkçe adlar sizin"). Kod → DSÖ İngilizce adı yorumda.
export const CAUSE_TR: Record<string, string> = {
  "20": "bulaşıcı bir hastalık", // Infectious and parasitic diseases
  "380": "bir solunum yolu enfeksiyonu", // Respiratory infectious
  "420": "doğumla ilgili bir komplikasyon", // Maternal conditions
  "490": "doğum sırasında ya da ilk haftalarda yaşanan bir sorun", // Neonatal conditions
  "540": "yetersiz beslenme", // Nutritional deficiencies
  "610": "kanser", // Malignant neoplasms
  "790": "bir tümör", // Other neoplasms
  "800": "şeker hastalığı", // Diabetes mellitus
  "810": "bir kan ya da bağışıklık hastalığı", // Endocrine, blood, immune disorders
  "820": "bir ruh sağlığı ya da bağımlılık sorunu", // Mental and substance use disorders
  "940": "bir sinir sistemi hastalığı", // Neurological conditions
  "1020": "bir duyu organı hastalığı", // Sense organ diseases
  "1100": "kalp ve damar hastalığı", // Cardiovascular diseases
  "1170": "bir akciğer hastalığı", // Respiratory diseases
  "1210": "bir sindirim sistemi hastalığı", // Digestive diseases
  "1260": "böbrek ya da idrar yolu hastalığı", // Genitourinary diseases
  "1330": "bir deri hastalığı", // Skin diseases
  "1340": "bir kas-iskelet hastalığı", // Musculoskeletal diseases
  "1400": "doğuştan bir rahatsızlık", // Congenital anomalies
  "1470": "bir ağız ve diş hastalığı", // Oral conditions
  "1505": "ani bebek ölümü", // Sudden infant death syndrome
  "1520": "bir kaza", // Unintentional injuries
  "1600": "şiddet ya da kendine zarar", // Intentional injuries — ayrıntı yok, sahne yok
};

/** Ölüm nedeni kodu kaza/şiddet mi? (Metin seçimi için; sahne gösterilmez.) */
export const isInjury = (code: string) => code === "1520" || code === "1600";
