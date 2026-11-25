# Bir Ömür — Oyun Tasarım Taslağı (v0)

Bu belge araştırma raporundaki (ARASTIRMA.md) bulgulara dayanıyor. Henüz taslak; birlikte netleştireceğiz.

## Tek cümle
Gerçek doğum oranlarıyla dünyanın bir yerinde doğ, yanında kalıcı insanlarla, bütçesi ve bedeli olan seçimlerle bir ömrü sonuna kadar yaşa.

## Platform ve teknik karar
- **Hedef:** Android (APK / Play Store), çevrimdışı, reklamsız.
- **Yapı:** TypeScript + Vite ile web arayüzü, Capacitor ile Android uygulamasına paketleme.
- **Neden:** Simülasyon motoru tarayıcıda da çalışır, yani her değişikliği telefondan bir linkle hemen deneyebiliriz; APK'yı ancak hazır olunca çıkarırız. Motor saf TypeScript olduğu için binlerce hayatı bilgisayarda test edebiliriz.
- **Kayıt:** Cihazda yerel veritabanı + yedek dosyası.

## Ana döngü
1. **Doğum:** Dünya haritasında nokta gezinir, gerçek doğum payına göre bir ülkede durur. Şehir/köy, cinsiyet, aile gelir dilimi, anne-baba yaşı ve mesleği çekilir. Aynı saniyede doğan 4 bebek daha belirir.
2. **Erken çocukluk (0-5):** Ailenin kararlarıyla akan kısa anı kartları.
3. **Yıllık döngü (6+):** Her yıl bir odak seçilir, yıl akar, olaylar çıkar.
4. **Karar anları:** Seçenekler, bedelleri ve (varsa) gerçek oranları ile. Bazı seçenekler şartlara göre kilitli.
5. **Yansıma molaları:** 5, 15, 30, 50, 70 yaşlarında.
6. **Ölüm ve sonrası:** Hayat özeti, yaşam haritası, hayat kartı, son söz.

## Sistemler
### Göstergeler
Sağlık, mutluluk, bilgi, ilişkiler (orijinaldeki gibi) + **ayrı bir hane bütçesi** (gösterge değil, gerçek para).

### Kişiler (en büyük fark)
- Anne, baba, kardeşler, eş, çocuklar, yakın arkadaşlar, eski sevgili, iş arkadaşı birer kalıcı `Kişi`.
- Her kişinin yaşı, sağlığı, işi, ilişki seviyesi ve kendi yıllık simülasyonu var. Yaşlanırlar, hastalanırlar, taşınırlar, ölürler (bir kez).
- İsimler ülke, bölge ve doğum yılına göre havuzdan çekilir, aynı hayatta tekrar etmez.

### Ekonomi
- Gelir: ülkenin gelir dağılımı + eğitim + meslek + şans.
- Giderler: barınma, gıda, eğitim, sağlık, ulaşım, aileye destek, borç ödemesi.
- Kararlar: ev/araba almak, kredi çekmek, çocuğu özel okula vermek, anne-babaya bakmak, bağış, yatırım, göç masrafı.
- Enflasyon ve krizler ülkenin gerçek yıllarına bağlı (ör. Türkiye 2001, 2018, 2021-23).
- Gösterim: PPP dolar + bugünün TL karşılığı.

### Olay motoru
- Olaylar şablon değil **koşullu kural**: yaş aralığı, ülke, gelir, kişi durumu, önceki olaylar.
- Olasılıklar veriden gelir (ör. 5 yaş altı ölüm, okula kayıt, çocuk evliliği, cinayet oranı).
- Aynı olay aynı hayatta aynı metinle iki kez gelmez.

### Ülke paketleri
- Başlangıçta **Türkiye derin paketi**: askerlik, YKS/KPSS, asgari ücret, deprem, büyükşehre göç, yurt dışı, emeklilik, düğün, kira.
- Diğer ülkeler genel veriyle çalışır; zamanla paket eklenir.

### Modlar
- **Gerçek çekiliş** (varsayılan).
- **Keşif:** Yaşamadığın ülkeleri öncelikli çeker, yine de seçtirmez.
- **Otomatik izleme:** Oyun kararları kendisi verir.
- **Dönem:** Geçmiş / bugün / gelecek.

## Korunan kurallar
- Puan, sıralama, rozet yok. Doğum yeri ve cinsiyet seçilemez.
- Suçla zenginleşme yolu yok.
- Ağır konular gerçek oranlarında, sahne göstermeden.

## İlk sürüm (MVP) kapsamı
1. 30 ülke (doğumların büyük kısmını kapsayan ülkeler + Türkiye), gerçek veriyle.
2. Doğum, yıllık döngü, 4 gösterge, temel bütçe.
3. Aile kişileri (anne, baba, kardeş, eş, çocuk).
4. ~80 olay, Türkiye paketi başlangıcı.
5. Ölüm, hayat özeti, yaşam haritası.
6. Android APK.

## Açık sorular (Atakan'a)
- Oyunun adı ne olsun? ("Bir Ömür" çalışma adı.)
- Bir hayat ne kadar sürsün? (Orijinal 30/60/90 dk.)
- Görsel tarz: piksel sanat mı, sade/minimal mi?
- Para kazanma düşünüyor muyuz, yoksa tamamen kişisel mi?
