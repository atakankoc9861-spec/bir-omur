# K1 Ülke Listesi (Öneri v0)

Hazırlayan: Dünya ve Kültür departmanı · Tarih: 2026-11-26 · Durum: **Öneri, Kalite denetimi şartlı geçti (rakamların hepsi tuttu), küçük düzeltmeler uygulandı; Atakan onayı bekliyor**

## Kısaca
21 ülke öneriyoruz (20 + Türkiye). Bu 21 ülke, 2023'te dünyada doğan bebeklerin **%64,89'unu** kapsıyor. Yani oyunda üç doğumdan yaklaşık ikisi derin profilli bir ülkede olacak. (BM'nin 2025 orta senaryo tahminine göre bu pay %64,63.)

## Kaynak
- **BM World Population Prospects 2024 (WPP 2024)**, "Number of births" (yıllık canlı doğum), tahmin serisi, yıl **2023** (WPP 2024'te gerçekleşmiş tahminin son yılı; 2024 ve sonrası projeksiyon).
- Rakamları Our World in Data'nın WPP 2024'ü işlediği dosyadan indirdik ve kendimiz hesapladık:
  `https://ourworldindata.org/grapher/number-of-births-per-year.csv` (OWID künyesi: "UN, World Population Prospects (2024) – processed by Our World in Data", son güncelleme 2024-07-12). İndirme tarihi: 2026-11-26.
- Dünya toplamı (2023): **132.110.264** doğum. Pay = ülke doğumu / dünya toplamı.
- Bu tablodaki **bütün rakamlar bu dosyadan doğrulandı**. Tahmin ya da hafızadan yazılmış rakam yok.

> Veri departmanına not: Bu dosya henüz `data/raw/` altına alınmadı (o iş Veri'nin). Oyunun kullanacağı resmî sayıyı Veri kendi scriptiyle BM'nin kendi CSV'sinden üretmeli; bu tablo sadece seçim için.

## Liste

| # | Ülke | ISO3 | 2023 doğum | Dünya payı | Bölge (K2) | Neden |
|---|---|---|---:|---:|---|---|
| 1 | Hindistan | IND | 23.219.488 | %17,58 | R08 Güney Asya | En büyük pay |
| 2 | Çin | CHN | 8.899.881 | %6,74 | R09 Doğu Asya | Pay |
| 3 | Nijerya | NGA | 7.509.758 | %5,68 | R01 Batı Afrika | Pay |
| 4 | Pakistan | PAK | 6.882.058 | %5,21 | R08 Güney Asya | Pay |
| 5 | Endonezya | IDN | 4.482.359 | %3,39 | R10 Güneydoğu Asya | Pay; en kalabalık Müslüman nüfus, ada ülkesi |
| 6 | Kongo Demokratik Cumhuriyeti | COD | 4.369.683 | %3,31 | R03 Orta Afrika | Pay |
| 7 | Etiyopya | ETH | 4.105.685 | %3,11 | R04 Doğu Afrika | Pay; Hristiyan-Müslüman karışık, sömürge geçmişi farklı |
| 8 | ABD | USA | 3.657.476 | %2,77 | R12 Batı | Pay; zengin ülke ama büyük gelir uçurumu |
| 9 | Bangladeş | BGD | 3.489.953 | %2,64 | R08 Güney Asya | Pay; delta, iklim afetleri |
| 10 | Brezilya | BRA | 2.601.670 | %1,97 | R11 Latin Amerika | Pay; Portekizce konuşan tek büyük ülke |
| 11 | Mısır | EGY | 2.405.717 | %1,82 | R06 K. Afrika-Batı Asya | Pay; Arap dünyasının en kalabalığı |
| 12 | Tanzanya | TZA | 2.346.391 | %1,78 | R04 Doğu Afrika | Pay; Svahili dünyası |
| 13 | Meksika | MEX | 2.037.689 | %1,54 | R11 Latin Amerika | Pay; İspanyolca Latin Amerika |
| 14 | Filipinler | PHL | 1.840.477 | %1,39 | R10 Güneydoğu Asya | Pay; Katolik çoğunluk, yurt dışında çalışan büyük nüfus |
| 15 | Sudan | SDN | 1.682.049 | %1,27 | R02 Sahel | Sahel kuşağından hiç ülke yoktu; bölgenin en büyüğü |
| 16 | Rusya | RUS | 1.297.207 | %0,98 | R13 Doğu Avrupa ve Balkanlar | Pay; R13'ün en büyüğü, Sovyet sonrası dünya |
| 17 | Güney Afrika | ZAF | 1.186.793 | %0,90 | R05 Güney Afrika | R05'in temsilcisi; Mozambik'ten küçük ama gerekçe aşağıda |
| 18 | İran | IRN | 1.173.463 | %0,89 | R07 Anadolu-İran-Orta Asya | Pay; Fars dili ve Şii çoğunluk |
| 19 | **Türkiye** | **TUR** | **1.072.014** | **%0,81** | R07 Anadolu-İran-Orta Asya | Karar 3 gereği mutlaka var (sırada 28.) |
| 20 | Japonya | JPN | 749.884 | %0,57 | R09 Doğu Asya | Yaşlanan, zengin Doğu Asya; kapsamı tamamlıyor |
| 21 | Almanya | DEU | 719.249 | %0,54 | R12 Batı | Batı Avrupa'nın en büyüğü; Türkiye'den göç bağı |
| | **Toplam** | | **85.728.944** | **%64,89** | | |

## Seçim gerekçesi (kısaca)
1. **Önce pay.** Doğumların en büyük 14 ülkesini (Hindistan'dan Filipinler'e) sırayla aldık. Bu 14 ülke tek başına doğumların %58,9'u.
2. **Sonra bölge boşlukları.** 13 K2 bölgesinin her birinde en az bir K1 ülke olsun istedik. Böylece her bölge şablonu, kendi içinden derin bir örneğe dayanabilir:
   - Sahel'de hiç ülke yoktu → **Sudan** (bölgenin en büyüğü, Arap ve Afrika dünyası arasında köprü).
   - Güney Afrika'da hiç ülke yoktu → **Güney Afrika Cumhuriyeti**. Bölgenin en büyüğü değil (Mozambik %0,95 > Güney Afrika %0,90). Seçilme nedenleri: (a) bölge ekonomisinin ve iş göçünün merkezi, R05'teki birçok hayat yolu buraya çıkıyor; (b) dünyanın en eşitsiz toplumlarından biri ve apartheid mirası, aynı ülkede çok farklı hayatları yan yana göstermeye elverişli; (c) istatistik ofisinin (Stats SA) verileri görece ayrıntılı (doğrulanmalı). Mozambik ilk yedek.
   - Doğu Avrupa'da hiç ülke yoktu → **Rusya**.
   - İran yaylası ve Orta Asya → **İran** (+ Türkiye). Irak (%0,88) İran'dan (%0,89) biraz küçük, Türkiye'den (%0,81) büyük; R06'da Mısır olduğu için yedekte.
3. **Hayat çeşitliliği.** Listede bilerek iki "yaşlanan zengin toplum" var: **Japonya** ve **Almanya**. Payları küçük ama oyuncunun "başka bir hayat" karşılaştırması için gerekli. Almanya ayrıca Türkiye'den işçi göçünün (1961 sonrası) ana durağı, Türk hayatlarında göç hedefi olarak zaten lazım.
4. **Türkiye** sırada 28. ülke; listeye pay yüzünden değil, oyunun ilk oyuncuları için yerel derinlik gerektiği için girdi (Karar 3: ayrıcalıklı değil, K1'den biri).

### Bilerek dışarıda kalanlar (yedek liste, ikinci dalga)
Pay olarak bazı K1 ülkelerinden büyük olup dışarıda kalanlar var. Sebep: aynı bölgede zaten derin bir örnek var ya da güvenilir kaynak bulmak şu an çok zor.

| Ülke | ISO3 | 2023 pay | Neden şimdilik dışarıda |
|---|---|---:|---|
| Uganda | UGA | %1,30 | Doğu Afrika'da Etiyopya ve Tanzanya var |
| Mozambik | MOZ | %0,95 | R05'te Güney Afrika seçildi (gerekçe yukarıda); Portekizce Afrika için de aday |
| Irak | IRQ | %0,88 | R06'da Mısır var; Arap-Kürt-Türkmen, Sünni-Şii çeşitliliği ve savaş sonrası hayatlar için güçlü aday |
| Kenya | KEN | %1,14 | Aynı sebep; Tanzanya yerine Kenya da seçilebilir (açık soru) |
| Afganistan | AFG | %1,11 | Çok hassas (savaş, 2021 sonrası kadın eğitimi yasağı); ayrı özen ister |
| Vietnam | VNM | %1,05 | Güneydoğu Asya'da Endonezya ve Filipinler var; ilk yedek |
| Yemen | YEM | %1,05 | Savaş; kaynak sorunu |
| Angola | AGO | %1,05 | Orta Afrika'da KDC var; Portekizce Afrika için iyi aday |
| Nijer | NER | %0,83 | Frankofon Sahel için iyi aday |
| Özbekistan | UZB | %0,71 | Orta Asya için iyi aday |
| Kolombiya | COL | %0,53 | İspanyolca Güney Amerika için aday |
| Birleşik Krallık | GBR | %0,52 | Almanya ile Batı Avrupa temsil ediliyor |
| Fransa | FRA | %0,48 | Aynı sebep |
| Güney Kore | KOR | %0,18 | Pay çok küçük ama orijinal oyunda Kore istekleri çoktu (askerlik, emeklilik) |

## Dikkat edilecekler
- **BM ile ülke istatistik kurumu farklı olabilir.** Örnek: Türkiye için BM WPP 2024 tahmini 2023'te 1.072.014 doğum; TÜİK'in kayıtlı canlı doğum sayısı 2023'te 958.408 (2024'te 937.559). BM tahmini ülkede yaşayan herkesi (göçmenler dahil) ve kayıt eksiklerini düzeltmeye çalışır. **Doğum çekilişinde BM kullanılmalı** (bütün ülkeler aynı yöntemle), ülke profilinde yerel sayı ayrıca not edilir. Bu, Veri departmanının kararı.
- **Kosova** OWID dosyasında ayrı satır (`OWID_KOS`, 2023: 20.514 doğum) ve Sırbistan'ın içinde sayılmıyor; dünya toplamına zaten dahil. Bu yüzden R13'e eklendi (Kalite bulgusu 1.4). K1 toplamı değişmedi. Dünya toplamı ile ülke satırları arasında kalan yaklaşık 21.308 doğumun kaynağı Veri tarafından bulunacak.
- Bu oranlar **bugün** modu içindir. "Geçmiş" modunda (ör. 1970) pay sıralaması çok farklı (Çin çok daha büyük, Afrika çok daha küçük). K1 listesi bugüne göre seçildi.
- Pay sıralaması her yıl biraz değişir (2025 tahmininde KDC Endonezya'yı geçiyor). Liste bundan etkilenmiyor.

## İlk 5 için öneri (MVP: "ilk 5 K1 ülke profili")
Türkiye (şablon örneği zaten dolu) + Hindistan + Nijerya + Çin + ABD. Gerekçe: en yüksek pay ve birbirinden çok farklı dört hayat dünyası. **Atakan'a sorulacak.**
