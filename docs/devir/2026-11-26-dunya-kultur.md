# Devir Notu · Dünya ve Kültür · 2026-11-26

## Ne yapıldı
1. **`content/countries/K1-liste.md`**: 21 K1 ülke önerisi (20 + Türkiye). Doğum payları BM WPP 2024 (2023 tahmini) dosyasından, OWID üzerinden indirilip hesaplandı. **Toplam pay %64,89** (2025 tahmininde %64,63). Bütün pay rakamları dosyadan doğrulandı. Yedek liste ve ilk 5 önerisi de var.
2. **`content/regions/bolge-listesi.md`**: 13 K2 bölgesi. Veri dosyasındaki 236 ülkenin her biri tam olarak bir bölgeye kondu (scriptle kontrol edildi, eksik ya da çift yok). Her bölge için gerekçe, iç farklar ve Görsel departmanı için görsel ortaklıklar yazıldı. Her bölgede en az bir K1 ülke var.
3. **`content/countries/_sablon.md` + `_sablon.json`**: Ülke profili şablonu v0.1. Her alanın `kaynak` ve `durum` (dogrulandi / dogrulanmali / tahmin / bos) alanı var. Kurallar yıllar içinde değiştiği için eğitim, askerlik, emeklilik, evlilik yaşı ve sağlık `donemler` listesi olarak yazılıyor.
4. **`content/countries/TUR.json`**: Şablonun tam doldurulmuş Türkiye örneği. Geçerli JSON; bütün kaynak kimlikleri tanımlı.
   - Doğrulanan (kaynağı açılıp görülen): TÜİK 2023-2024 doğum, toplam doğurganlık hızı, il uçları; 2024 ilk evlilik yaşı ve evlenme-boşanma sayıları; 7179 sayılı Askeralma Kanunu (6 ay, bedelli, 20-41 yaş); NVİ'nin 1940'lar, 60'lar, 70'ler, 80'ler, 90'lar, 2004 ve 2020 isim listeleri; 6 Şubat depremleri can kaybı (53.537); Ekim 2022 TÜFE %85,51.
   - Kalan büyük kısım (~196 madde) **"dogrulanmali"**: kanun numaraları ve yılları, sınav adlarının yılları, 2019 öncesi askerlik süreleri, emeklilik reformlarının ayrıntısı, din ve dil dağılımları, tarihsel olayların ölü sayıları.
5. Yapımcının ek bilgisi uygulandı: isim kaynağı olarak `sigpwned/popular-names-by-country-dataset` (CC0, sadece tamamlayıcı, doğum yılı boyutu yok) şablona ve TUR.json kaynaklarına eklendi. `philipperemy/name-dataset` şablonda açıkça **yasak** olarak yazıldı.

## Kalite denetimi sonrası düzeltmeler (v0.2, aynı gün)
Kalite kararı: **şartlı geçti** (`docs/denetim/2026-11-26-dunya-kultur.md`). Düzeltme listesinin ilk 7 maddesi ve küçük bulgulardan istenenler uygulandı:
1. **Biçimsel şema:** `content/countries/_sablon.schema.json` (JSON Schema 2020-12; seçenek değerleri sabit). **Doğrulama scripti:** `scripts/validate_countries.py` (şema + 7 ek kural: kaynak kimlikleri, oyunda kullanılabilirlik, durum zinciri, dönem sırası, havuz/topluluk/din bağlantıları, çift sayım). TUR.json: **0 hata**, 14 uyarı (havuzlar 30 isimden küçük). Script Python + `jsonschema` paketiyle çalışıyor; projenin TypeScript tarafına (ör. vitest testi) taşınması Yapımcı kararı.
2. **`topluluklar` yapısı** eklendi (dil + din + iç bölge + isim havuzu + ağırlık + `havuzHazir`). TUR.json'da 13 topluluk. Boş havuzlu topluluklar `havuzHazir: false`, motor bunları çekilişte kullanmaz, "genel"e düşürmez. Not: 1950'ler ve 2010'lar genel havuzları boş olduğu için **Türk ve Balkan toplulukları da şimdilik `havuzHazir: false`**.
3. **Alevilik tek kayıt:** "Müslüman" kaydının alt grupları arasından çıkarıldı, ayrı ve tek kayıt; `ustGrup` alanı Atakan kararına göre değişecek (`atakan_karari_bekliyor`). Script çift sayımı denetliyor.
4. **İsim havuzları:** `cinsiyet` sadece `kadin`/`erkek` (eski "ikisi" havuzları ikiye bölündü); `onYil` yerine doğum yılı aralığı `yilBas`/`yilSon`; köken `topluluk`, inanç `din` alanına ayrıldı.
5. **Veri bağlantısı:** Çekiliş yapılan her listeye `agirlik` nesnesi (`deger`, `veriAnahtari`, `kaynak`, `durum`). Yazılan anahtarlar (ör. `tuik.evlenme.ilkEvlilikYasOrt`) **öneri**; ortak anahtar listesi Veri ile kurulacak.
6. **Dönem kuralı:** `yilBas` dahil, `yilSon` hariç; her bölümde `donemSecimi` (hangi yıl esas). Bütün dönemler `yilBas`/`yilSon` biçiminde. `durum_` yerine `deger`. Askerlik süre türleri tanımlandı.
7. **Durum zinciri:** Üst kaydın durumu alt kayıtların en zayıfı. Kahramanmaraş ve enflasyon olayları `dogrulanmali` oldu; sadece `olcek` rakamları `dogrulandi`. Script 13 topluluğu da otomatik `tahmin`e indirdi (ağırlıkları tahmin).
8. **`genel-bilgi` → `kaynaksiz`**, ve her kayda `oyunda_kullanilabilir` alanı. Kural: sadece `dogrulandi` + gerçek kaynak → `true`. TUR.json'da 26 kayıt `true`, 357 kayıt `false`.
9. Kalite'nin bulduğu kaynaklarla eklendi: Soma 301 ölü, Marmara 1999 17.480 ölü (TBMM raporu, NTV aktarımı), SBB enflasyon, Medyascope deprem; Suriyeli sayısı tarihli iki rakam olarak (3.737.000 / 2021; 2.371.412 / büyük ihtimalle 2025), `dogrulanmali`. İkincil kaynaklara `tur` ve `birincilAdres` yazıldı.
10. **Bölge ve K1 listeleri:** Kosova R13'e eklendi (Sırbistan içinde sayılmıyordu; R13 %2,01, toplam %99,98). R13'ün adı "Doğu Avrupa ve Balkanlar (sosyalizm sonrası)". R11 tanımından cinayet oranı, R13'ten "kürk şapka" çıkarıldı; TR5'teki "Konya muhafazakâr" çeşitlendirildi. Güney Afrika'nın seçim gerekçesi yazıldı; Mozambik ve Irak yedek listeye eklendi.
11. **Dokunulmayanlar** (`atakan_karari_bekliyor` ile işaretli, metinler aynen duruyor): "1915 olayları" ifadesi (hassasiyet bölümü), "Kıbrıs harekâtı" adı, 28 Şubat'ın türü (`darbe`), Aleviliğin din listesindeki gösterimi.

## Yeniden denetim sonrası (v0.2.1, aynı gün)
Kalite: **şartlı geçti**, tek şart Y1. Uygulananlar:
- **Y1:** Scripte K8 kuralı eklendi: `dogrulandi` olan kaydın kaynağı boş olamaz ve `kaynaksiz` içeremez. Kahramanmaraş olayını tekrar `dogrulandi` yapan bozuk kopyada hata veriyor (test edildi).
- **Y2:** Dönem çakışması artık **hata**; boşluk uyarı olarak kaldı (test edildi).
- **Y4:** Topluluklara `yedekHavuz` alanı eklendi. Varsayılan `null`, çünkü yanlış bir yedek topluluğun kendi isimlerini sessizce siler; `genel` yazmak gerekçe ister. TUR.json'da Zaza, Arap, Laz-Hemşinli-Gürcü, Kafkas, Roman ve Balkan için `genel` (gerekçe yazılı, `kaynaksiz`, `dogrulanmali`). Kürt için bilinçli olarak `null` (Kürtçe havuz dolana kadar), gayrimüslim ve Suriyeli topluluklar için `null`. Genel havuzların 1950'ler ve 2010'lar dilimleri dolunca bu topluluklar çekilişe hazır olabilir (test edildi).
- **Y5:** Kosova kod eşlemesi: `content/regions/kod-eslemeleri.json` (XKX ↔ OWID_KOS).
- **Y6:** Veri notlarındaki eski Kosova cümlesi düzeltildi.
- **Y7:** `_sablon.md`'ye şablonun kendi şemasından geçmediğini belirten not eklendi.
- **Y3 (Yapımcı için bilgi):** Türkiye profilinde şu an çekilebilecek aile yok. İlk adım: NVİ 1951-1960 ve 2010-2019 isim listeleri; sonra eğitim ve askerlik dönemlerinin birincil kaynaktan kontrolü.

## Ne kaldı
- TUR.json içindeki "dogrulanmali" maddeler birincil kaynaktan (mevzuat.gov.tr, TÜİK bültenleri, MEB, MSB, SGK) kontrol edilmeli. Bu iş bölge alt ajanlarına değil, Türkiye sorumlusuna verilmeli.
- İsim havuzları: 1950'ler ve 2010'lar boş; Kürtçe, Alevi, gayrimüslim ve Suriyeli havuzları boş (uydurma örnek yazılmadı, kaynak bulunmalı). Her havuz 10'dan en az 30 isme çıkarılmalı.
- `sigpwned` veri seti henüz indirilmedi ve incelenmedi.
- Doğum payı dosyası `data/raw/` altına alınmadı. Bu Veri'nin işi. Kaynak adresi K1-liste.md'de yazılı.
- Diğer 20 K1 profili ve 13 bölge JSON'u (`content/regions/<bolge>.json`) henüz yazılmadı. Bölge JSON şablonu da henüz yok.
- Kalite düzeltme listesi 8-11 ve 15 (Türkiye profili oyuna girmeden önce): "dogrulanmali" rakamların birincil kaynaktan kontrolü (öncelik: askerlik 1950-1990, emeklilik, evlilik yaşı), Kürt/Alevi/gayrimüslim/Suriyeli isim havuzları, denge eksikleri (faili meçhul cinayetler, 1995 Gazi olayları, 15 Temmuz'da ölen siviller, kadın hayatı dokusu, Kürt gündelik kültürü).
- Kalite'nin v0.2 düzeltmelerini yeniden denetlemesi.
- Dünya toplamı ile ülke satırları arasında kalan ~21.308 doğum (Veri).
- Bölge JSON şablonu (`content/regions/<bolge>.json`).

## Veri departmanına notlar
- BM ve TÜİK doğum sayısı farklı (2023: BM 1.072.014, TÜİK 958.408). Çekilişte BM kullanılmalı (bütün ülkeler aynı yöntemle).
- Kosova (`OWID_KOS`) OWID dosyasında ayrı satır ve Sırbistan'ın içinde **sayılmıyor**; çift sayım riski yok, R13'e eklendi. Oyun kodu `XKX` ile veri kodu `OWID_KOS` eşlemesi `content/regions/kod-eslemeleri.json` içinde; Veri kendi ülke kodu tablosunu kurunca oraya taşımalı ve BM WPP CSV'sinde Kosova'nın nasıl yer aldığını kontrol etmeli. Dünya toplamı ile ülke satırları arasında kalan yaklaşık 21.308 doğum ayrıca bulunmalı.
- TUR.json'daki eğitim, okullaşma, kayıt dışılık, akraba evliliği, ev sahipliği, ölü sayısı gibi rakamlar için kaynaklı seri istendi (alanlar boş bırakıldı).

## Atakan'a sorulacak kararlar
(Kalite denetiminden gelen yeni sorular: 8, 9, 10. Dosyalarda `atakan_karari_bekliyor` ile aranabilir.)
1. **K1 listesi uygun mu?** Özellikle: Tanzanya mı Kenya mı? Sudan (savaşta, verisi zor) yerine Nijer olabilir mi? Vietnam ilk yedek.
2. **İlk 5 K1 (MVP):** Öneri Türkiye + Hindistan + Nijerya + Çin + ABD.
3. **Bölge sayısı 13 mü kalsın**, yoksa Sahel Batı Afrika ile birleşip 12'ye mi insin?
4. **Zor gruplamalar:** Türkiye R07'de (İran, Kafkasya, Orta Asya ile). İsrail R06'da kendi alt profiliyle. Kuzey Amerika ve Avustralya Batı Avrupa ile aynı bölgede. Bunlar uygun mu?
5. **Geçmiş modu kaç yılına kadar gidecek?** Şablon 1950'yi varsaydı.
6. **Alevilik** din dağılımında Müslüman alt grubu olarak mı, ayrı grup olarak mı gösterilsin? (Şablonda tek kayıt; karar sadece `ustGrup` alanını değiştirir. Kalite önerisi: tek kayıt + kişinin kendi tanımı; oyunda hem "Müslüman, Alevi" hem "Alevi" diyen karakterler olabilir.)
7. BM ile TÜİK arasındaki rakam farkı oyuncuya gösterilsin mi?
8. **1915'e** (gayrimüslim aile hafızasında geçerse) hangi tarafsız ifadeyle değinilsin? Kalite önerisi: "1915'te Ermenilerin sürgünü ve toplu ölümleri" + adlandırmanın tartışmalı olduğu notu.
9. **1974 Kıbrıs** olayının adı ne olsun? Şu an "Kıbrıs harekâtı"; Kalite önerisi: "1974 Kıbrıs savaşı (Türkiye'nin askerî müdahalesi)".
10. **28 Şubat** sürecinin türü `darbe` mi `siyasi` mi?
