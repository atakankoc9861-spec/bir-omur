# Araştırma: Hazır Araçlar, Kütüphaneler ve Veri Setleri

Tarih: 26 Kasım 2026
Soru: Oyunu güzelleştirmek için sıfırdan yazmak yerine hangi hazır, açık kaynaklı işleri "işe alabiliriz"?

Karar ilkesi: Bir aracı alırız, eğer (1) lisansı uygunsa, (2) Android'de çevrimdışı çalışıyorsa, (3) KARARLAR.md ile çelişmiyorsa, (4) yerine yazacağımız koddan açıkça daha iyiyse.

---

## A. Kesin öneri (alalım)

### 1. Tracery — tekrar sorununun ilacı (Anlatı ve İçerik)
- **Ne:** Kate Compton'ın "hikâye grameri" kütüphanesi. Bir cümleyi tek metin olarak değil, parçaları değişen bir kural olarak yazıyorsun; her seferinde farklı ama tutarlı cümle çıkıyor. Lisans: Apache-2.0.
- **Neden:** Orijinal oyuna gelen en sert eleştiri "aynı şablonlar, hep aynı cümleler" idi. Tracery tam olarak bunu çözüyor.
- **Hangi sürüm:** Orijinal kütüphane 2015'ten beri pek güncellenmedi. Node paketi `tracery-grammar` tohumla (seed) çalışabiliyor; bu bizim için şart (aynı tohum = aynı hayat). Ayrıca sembolleri tekrar kullanmayı azaltan `tracery-improved` ve TypeScript'e yeniden yazılmış `tracery-ts` var.
- **Öneri:** `tracery-ts` veya kendi küçük TypeScript uyarlamamız + tekrar önleme. Anlatı departmanı karar versin.

### 2. Storylet (kalite tabanlı anlatı) yaklaşımı — olay motorunun iskeleti (Simülasyon + Anlatı)
- **Ne:** Fallen London'dan gelen bir tasarım deseni: her olay bir "storylet"; ön koşulları var (yaş, gelir, ülke, kişi durumu), koşullar uyunca desteye girer, oradan çekilir.
- **Hazır kütüphaneler:** SimpleQBN (genel JavaScript, Node ve web için), TinyQBN (Twine'a bağlı), StoryAssembler (planlayıcılı, akademik).
- **Öneri:** Kütüphane almayalım, deseni alalım. Emily Short'un da dediği gibi, temel bir storylet sistemi kurmak zor değil. Bizim ihtiyaçlarımız (istatistik tabanlı olasılık, kalıcı kişiler) hazır kütüphanelerden daha özel. SimpleQBN'i referans olarak okuyalım.

### 3. Our World in Data — veri hazırlığının yarısı hazır (Veri)
- **Ne:** BM, DSÖ, Dünya Bankası verilerini temizleyip tek formatta (CSV + metadata) yayınlıyorlar. Kendi işlenmiş verileri CC BY lisanslı; işleme kodları (`owid/etl`) MIT lisanslı.
- **Dikkat:** Verilerin çoğu üçüncü taraf kaynaklardan gelir ve o kaynağın lisansına tabidir. Her veri setinde orijinal kaynak ayrıca yazılmalı.
- **Öneri:** Doğum sayısı, yaşam beklentisi, doğurganlık gibi temel serileri OWID'den alalım. Hepsinin kaynağı BM WPP 2024.

### 4. Dünya Bankası API + `wbgapi` (Veri)
- **Ne:** Dünya Bankası'nın resmî Python paketi. WDI (gelir, Gini, kentleşme, okullaşma...) verilerine doğrudan erişim. WDI lisansı: CC BY 4.0.
- **Öneri:** Veri departmanının ana aracı.

### 5. DSÖ Global Health Observatory OData API (Veri)
- **Ne:** DSÖ verilerine programla erişim. Ölüm nedenleri için DSÖ Küresel Sağlık Tahminleri (GHE) yaşa, cinsiyete ve nedene göre dağılım veriyor; son sürüm 2000-2021 yıllarını kapsıyor.
- **Dikkat:** DSÖ mevcut OData API'yi 2025 sonunda yenisiyle değiştireceğini duyurmuştu. Veri departmanı güncel uç noktayı kontrol etmeli.

### 6. world-atlas (Natural Earth haritası) (Görsel)
- **Ne:** Natural Earth ülke sınırlarının (sürüm 4.1.0) hazır TopoJSON hâli. Doğum anındaki "dünya haritasında gezinen nokta" ve sonda "yaşadığın ülkeler atlası" için.
- **Öneri:** 110m (düşük çözünürlük) dosyası telefona yeter, uygulamaya gömülür, internet gerekmez.

### 7. Capacitor + `@capacitor-community/sqlite` (Yapımcı/Teknik)
- **Ne:** Telefonda gerçek SQLite veritabanı. Ücretsiz, açık kaynak, yıllardır yaygın kullanılıyor. Tarayıcıda da IndexedDB üzerinden çalışıyor.
- **Neden:** Tarayıcı deposu (IndexedDB) işletim sistemi tarafından her an temizlenebilir. Orijinal oyunun "kayıtlar kayboluyor" sorununu yaşamayalım.

### 8. İsimler: `popular-names-by-country-dataset` (Dünya ve Kültür)
- **Ne:** Ülkelere göre yaygın ad ve soyadlar. Lisans: CC0 (tamamen serbest).
- **Eksik:** Doğum yılına göre değişim yok. K1 ülkelerinde ulusal istatistik ofislerinin bebek isimleri listeleriyle (ör. TÜİK) tamamlanmalı.

---

## B. Bilinçli olarak REDDEDİLENLER

| Araç | Neden almıyoruz |
|---|---|
| **philipperemy/name-dataset** | Çok büyük ve kullanışlı ama kaynağı 533 milyon hesaplık Facebook sızıntısı. Sızdırılmış kişisel veriden üretilmiş bir şeyi oyuna koymuyoruz. |
| **Universal LPC karakter üretici** | Çok zengin piksel karakter arşivi ama lisansı CC-BY-SA / GPL (paylaşımcı, bulaşıcı lisans). Üstelik karar 10'a göre çizimler kodla üretiliyor. Sadece ilham/referans olarak bakılabilir. |
| **ink / inkjs** | Çok güçlü, MIT lisanslı, profesyonel oyunlarda kullanılmış bir anlatı dili. Ama dallanan, elle yazılmış hikâyeler için tasarlanmış. Bizim olaylarımız istatistikle tetikleniyor; storylet + Tracery daha uygun. İleride özel uzun sahneler (göç yolculuğu, savaş) için tekrar değerlendirilebilir. |
| **pixel-sprite-generator, ZzSprite** | Prosedürel piksel üretimi için güzel örnekler (MIT) ama uzay gemisi/yaratık gibi soyut şekiller üretiyorlar; insan ve mekân için uygun değiller. Görsel departmanı tekniklerine bakabilir. |
| **BitLife klonları (GitHub)** | Çoğu basit okul projesi; kendi sahipleri bile örnek alınmamasını söylüyor. Öğrenecek bir şey yok. |
| **Orijinal oyunun "1in8b Engine" motoru** | Orijinalden hiçbir şey kullanmıyoruz (karar 1). |

---

## C. Departmanlara göre özet

| Departman | Alınacak |
|---|---|
| Veri | OWID, `wbgapi` (Dünya Bankası), DSÖ GHO API, BM WPP 2024 |
| Dünya ve Kültür | `popular-names-by-country-dataset` + ulusal isim istatistikleri |
| Anlatı ve İçerik | Tracery (TypeScript sürümü veya kendi uyarlamamız) |
| Simülasyon ve Denge | Storylet deseni (kütüphane değil), SimpleQBN referans |
| Görsel ve Arayüz | world-atlas (Natural Earth 110m) |
| Yapımcı/Teknik | Capacitor, `@capacitor-community/sqlite` |

Hepsi ücretsiz. Kurulması gereken ayrı bir "repo" yok; hepsi bizim repoya paket olarak eklenir ya da veri olarak bir kez indirilip işlenir.
