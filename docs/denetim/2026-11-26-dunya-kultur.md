# Denetim · Dünya ve Kültür teslimi · 2026-11-26

Denetleyen: Kalite ve Hassasiyet (bağımsız; bu işi yapmadı)
Denetlenen dosyalar:
- `content/countries/K1-liste.md`
- `content/regions/bolge-listesi.md`
- `content/countries/_sablon.md`, `content/countries/_sablon.json`
- `content/countries/TUR.json`
- `docs/devir/2026-11-26-dunya-kultur.md`

## Genel karar: **ŞARTLI GEÇTİ**

K1 listesi ve bölge listesi rakam olarak temiz. Kontrol ettiğim her doğum payı birebir tuttu. Şablon kullanılabilir ama motorun güvenle okuyabilmesi için birkaç düzeltme lazım. TUR.json **şablon örneği olarak** geçti. **Oyuna veri olarak girmeye hazır değil**, çünkü maddelerin çoğu (196 madde) hâlâ "dogrulanmali" ve 200 madde kaynak olarak sadece "genel-bilgi" gösteriyor.

Kritik bulgu yok. Uydurma rakam, orijinal oyundan içerik ya da yasaklı veri seti bulmadım.

Aşağıdaki "Düzeltilecekler" listesi bitince iş tam geçer. Orta bulgular, sıradaki 20 ülke profili yazılmaya başlamadan önce düzeltilmeli. Çünkü şablondaki hatalar 20 dosyaya kopyalanır.

---

## Denetim 1 · Kaynak ve rakam

### Yöntem
- OWID dosyasını (`number-of-births-per-year.csv`, BM WPP 2024, OWID son güncelleme 2024-07-12) kendim indirdim. K1 toplamını, bölge paylarını, ülke sıralamasını ve 2025 değerini bağımsız bir scriptle yeniden hesapladım.
- Türkiye rakamlarını web'den kontrol ettim. Birincil kaynağa ulaşabildiğimde onu, ulaşamadığımda birden fazla haber kaynağını kullandım.

### Kontrol edilen rakamlar

| # | Rakam | Dosyadaki değer | Bulduğum değer | Kaynak | Sonuç |
|---|---|---|---|---|---|
| 1 | Dünya doğumu 2023 | 132.110.264 | 132.110.264 | OWID / WPP 2024 CSV | Tuttu |
| 2 | K1 toplam doğum 2023 | 85.728.944 | 85.728.944 | aynı | Tuttu |
| 3 | K1 toplam pay 2023 | %64,89 | %64,89 | aynı | Tuttu |
| 4 | K1 toplam pay 2025 (orta senaryo) | %64,63 | %64,63 | aynı | Tuttu |
| 5 | İlk 14 ülkenin payı | %58,9 | %58,93 | aynı | Tuttu |
| 6 | Hindistan 2023 | 23.219.488 / %17,58 | 23.219.488 / %17,58 | aynı | Tuttu |
| 7 | Çin 2023 | 8.899.881 / %6,74 | aynı | aynı | Tuttu |
| 8 | Nijerya 2023 | 7.509.758 / %5,68 | aynı | aynı | Tuttu |
| 9 | Sudan 2023 | 1.682.049 / %1,27 | aynı | aynı | Tuttu |
| 10 | Türkiye 2023 (BM) | 1.072.014 / %0,81 | aynı | aynı | Tuttu |
| 11 | Türkiye'nin sırası | 28. | 28. (236 ülke içinde) | aynı | Tuttu |
| 12 | Almanya 2023 | 719.249 / %0,54 | aynı | aynı | Tuttu |
| 13 | Diğer 15 K1 ülkesi (tek tek) | tablo | hepsi birebir aynı | aynı | Tuttu |
| 14 | Yedek liste payları (12 ülke) | tablo | hepsi aynı | aynı | Tuttu |
| 15 | 2025'te KDC'nin Endonezya'yı geçmesi | var | KDC %3,44 > IDN %3,35 | aynı | Tuttu |
| 16 | 13 bölgenin payları | R01 %8,89 … R13 %1,99 | 13'ü de aynı | aynı | Tuttu |
| 17 | Bölge toplamı / 236 ülke, eksiksiz ve çiftsiz | %99,97, 236 | %99,968, 236, eksik ve çift yok | aynı | Tuttu |
| 18 | TÜİK canlı doğum 2024 | 937.559 | 937.559 | [Alomaliye, TÜİK bülteni aktarımı](https://www.alomaliye.com/2025/05/13/dogum-istatistikleri-2024/) | Tuttu (ikincil kaynak) |
| 19 | TÜİK canlı doğum 2023 | 958.408 | 958.408 | [NTV](https://www.ntv.com.tr/turkiye/turkiyede-2023te-958-bin-408-bebek-dogdu,vapiLPVaFkOsT7qpzFXX4g), [TRT Haber](https://www.trthaber.com/haber/gundem/turkiyede-2023te-958-bin-408-bebek-dunyaya-geldi-857603.html) | Tuttu (ikincil kaynak) |
| 20 | Toplam doğurganlık hızı 2024 | 1,48 | 1,48 | Alomaliye (TÜİK) | Tuttu |
| 21 | En yüksek / en düşük il TDH 2024 | Şanlıurfa 3,28 / Bartın ve Eskişehir 1,12 | aynı | aynı | Tuttu |
| 22 | Annenin ortalama yaşı / ilk doğum yaşı 2024 | 29,3 / 27,3 | 29,3 / 27,3 | aynı | Tuttu |
| 23 | Ortalama ilk evlilik yaşı 2024 (K/E) | 25,8 / 28,3 | 25,8 / 28,3 | [Alomaliye, TÜİK Evlenme ve Boşanma 2024](https://www.alomaliye.com/2025/02/24/evlenme-ve-bosanma-istatistikleri-2024/) | Tuttu |
| 24 | Evlenen çift / kaba evlenme hızı 2024 | 568.395 / binde 6,65 | aynı | aynı | Tuttu |
| 25 | Boşanma 2024 | 187.343 | 187.343 | aynı | Tuttu |
| 26 | Yabancı gelin 2024 | 29.115 (%5,1) | aynı | aynı | Tuttu |
| 27 | 6 Şubat depremleri can kaybı | 53.537 ölü, 107.213 yaralı | aynı (İçişleri Bakanı, Şubat 2024) | [Medyascope](https://medyascope.tv/2024/02/02/ali-yerlikaya-depremlerde-53-bin-537-canimizi-yitirdik-38-bin-901-bina-yikildi-691-bin-afetzede-konteynerde-kaliyor/), [Ensonhaber](https://www.ensonhaber.com/gundem/bakan-yerlikaya-deprem-calismalariyla-ilgili-aciklama) | Tuttu (bakan açıklaması; TÜİK ölüm istatistiğiyle ayrıca karşılaştırılmalı) |
| 28 | 6 Şubat depreminden etkilenen 11 il | liste | resmî 11 il listesiyle aynı | genel bilinen resmî liste | Tuttu (dosyadaki "doğrulanmalı" notu kaldırılabilir) |
| 29 | Yıllık TÜFE, Ekim 2022 | %85,51 | %85,51 | [SBB](https://www.sbb.gov.tr/ekim-2022-enflasyon-verileri/), [Evrensel](https://www.evrensel.net/haber/473815/ekim-ayinda-yillik-enflasyon-enaga-gore-yuzde-185-tuike-gore-yuzde-85-51e-oldu) | Tuttu |
| 30 | 7179 sayılı kanun: er süresi / yedek subay / yedek astsubay | 6 / 12 / 12 ay | 6 / 12 / 12 ay | [Bianet](https://bianet.org/haber/yeni-zorunlu-askerlik-sistemi-yasalasti-209758) | Tuttu (ikincil kaynak; mevzuat.gov.tr eklenmeli) |
| 31 | 2019 bedelli ücreti ve temel eğitim | 31.343 TL, 1 ay | 31.343 TL, 1 ay, 6 ayda bir memur zammı kadar artış | Bianet | Tuttu |
| 32 | Askerlik yaşı | 20–41 | 20–41 | Bianet | Tuttu |
| 33 | NVİ 1941-1950 ilk 10 isim (K/E) | liste | sıra dahil aynı | [NVİ PDF](https://nvi.gov.tr/kurumlar/nvi.gov.tr/Genel_Mudurluk/istatistikler/1941_1950-Tarihleri-Arasinda-En-Cok-Verilen-Isimler.pdf) | Tuttu |
| 34 | NVİ 1971-1980 ilk 10 isim (K/E) | liste | sıra dahil aynı | [NVİ PDF](https://nvi.gov.tr/kurumlar/nvi.gov.tr/Genel_Mudurluk/istatistikler/1971_1980Tarihleri_Arasinda_En_cok_Verilen_isimler.pdf) | Tuttu |
| 35 | NVİ 1991-2000 ilk 10 isim (K/E) | liste | sıra dahil aynı | [NVİ PDF](https://www.nvi.gov.tr/kurumlar/nvi.gov.tr/Genel_Mudurluk/istatistikler/1991_2000Tarihleri_Arasinda_En_cok_Verilen_isimler.pdf) | Tuttu |
| 36 | 2020'nin en çok verilen isimleri | 9+9 isim | aynı isimler, aynı sıra | [CNN Türk](https://www.cnnturk.com/yasam/2020-yilinda-en-cok-tercih-edilen-isim-yusuf-ve-zeynep-oldu-1608104) | Tuttu |
| 37 | Soma, 2014 | 301 ölü ("genel-bilgi", dogrulanmali) | 301 | [Dünya](https://www.dunya.com/gundem/soma039da-301-maden-iscisi-hayatini-kaybetti-haberi-246792), [Cumhuriyet](https://www.cumhuriyet.com.tr/turkiye/soma-katliaminin-8-yili-hayatini-kaybeden-301-madenci-aniliyor-1935529) | Tuttu. Kaynak eklenip "dogrulandi" yapılabilir |
| 38 | 1999 Marmara depremi ölü sayısı | "17 binin üzerinde", değer boş | 17.480 ölü, 43.953 yaralı (TBMM araştırma komisyonu raporu, Temmuz 2010, NTV aktarımı) | [NTV](https://www.ntv.com.tr/turkiye/17-agustos-depreminin-26-yili,0249EYhh8kWQXCawcOdzuA) | Tuttu. Değer doldurulabilir |
| 39 | Suriyeli geçici koruma: zirve / güncel | ~3,7 milyon (2020-21) / ~2,3 milyon (2025-26) | 3.737.000 (2021) / 2.371.412 (27 Kasım, büyük ihtimalle 2025; Göç İdaresi rakamı, haber aktarımı) | [Al Ain](https://tr.al-ain.com/article/turkiye-deki-suriyelilerin-say-s-yeniden-g-ndemde-son-veriler-geri-d-n-ler-ve-ehirlerdeki-da-l-m) | Kısmen tuttu. "2,3" yerine "2,4" olmalı ve tarih yazılmalı. Rakam hızlı değişiyor, Göç İdaresi'nden tarihli alınmalı |
| 40 | Emeklilik yaşının 2036'dan sonra artıp 2048'de 65 olması | var (dogrulanmali) | haberlerde aynı şekilde anlatılıyor | [Sözcü](https://www.sozcu.com.tr/emeklilikte-elini-cabuk-tutan-kazanacak-2036-kritik-esik-p310331), [Haberturk](https://www.haberturk.com/emeklilik-yasi-65-oldu-3768067-ekonomi) | Büyük ihtimalle doğru. Birincil kaynak (5510 geçici/ek madde) gerekli, "dogrulanmali" kalsın |

**Yanlış rakam:** bulamadım.
**Kaynaksız rakam:** var (bkz. bulgu 1.1).

### Bulgular

**1.1 · ORTA · 200 madde kaynak olarak sadece "genel-bilgi" gösteriyor.** Bu kaynağın adresi yok ve tanımı "hazırlayanın bilgisi, kaynak gösterilmedi". Aralarında rakamlar da var: askerlik süreleri (18/15/12 ay), tek seferlik bedelli yılları, emeklilik yaşları (58/60), yasal evlilik yaşları (15/17, 18), kanun numaraları, Soma 301, Suriyeli 3,7 ve 2,3 milyon. Hepsi dürüstçe "dogrulanmali" diye işaretlenmiş, uydurma değil. Ama CLAUDE.md kural 5 "her rakamın kaynağı ve yılı yazılı olur" diyor. Şartlar:
- Motor, `durum` değeri `dogrulanmali` ya da kaynağı yalnızca `genel-bilgi` olan hiçbir **rakamı** oyuna sokmamalı. Bu kural şablona yazılmalı.
- `genel-bilgi` adı yanıltıcı. Adı `kaynaksiz` gibi bir şeye çevrilmeli ki kimse bunu bir kaynak sanmasın.
- Bu denetimde doğrulanan Soma (301) ve Marmara (17.480) rakamları kaynağıyla eklenebilir.

**1.2 · ORTA · Olay düzeyindeki "dogrulandi" etiketleri doğrulananın ötesine geçiyor.** `kahramanmaras-2023` ve `enflasyon-2021-2024` olaylarının tamamı `durum: dogrulandi` diye işaretli. Oysa sadece `olcek` rakamı (53.537 ölü, %85,51) doğrulandı. Etki metinleri, etkilenen gruplar ve il listesi doğrulanmadı. Hatta il listesinde metnin içinde "(il listesi doğrulanmalı)" yazıyor. Kural şu olmalı: üst düzeydeki `durum`, alt maddelerin **en zayıfı** kadar olur. Ya da etiket sadece `olcek` üzerinde durur.

**1.3 · KÜÇÜK · "Doğrulandı" denen Türkiye rakamlarının çoğu ikincil kaynaktan geliyor.** Alomaliye, NTV, Sözcü, Evrensel, CNN Türk, Bianet. Rakamlar doğru çıktı. Ama şablonun kendi `not` alanı "birincil mi ikincil mi" diye soruyor ve TUR.json'da bu alan doldurulmamış. Şunlar eklenmeli: TÜİK bülten adresleri (data.tuik.gov.tr), 7179 için mevzuat.gov.tr ya da Resmî Gazete, deprem için AFAD ya da TÜİK ölüm istatistiği. `yerelSayilar[1]` için not "haber başlığından" diyor. Rakam doğru ama TÜİK bülteni eklenmeli.

**1.4 · KÜÇÜK · Kosova değerlendirmesi yanlış yönde.** Dünya toplamından 236 ISO3 ülkenin toplamını çıkarınca 41.822 doğum kalıyor. Kosova'nın 20.514 doğumu bu farkın içinde. Yani Kosova, Sırbistan'ın içinde **sayılmıyor** ve dünya toplamına zaten dahil. Çift sayım riski yok. Kosova'yı R13'e eklemek eksik sayımı kapatır. Kalan yaklaşık 21 bin doğumun hangi satır olduğu Veri tarafından bulunmalı. "Yuvarlama farkı" açıklaması doğru değil.

**1.5 · KÜÇÜK · Seçim gerekçesinde iki boşluk var.** Mozambik (%0,95, R05) Güney Afrika'dan (%0,90), Irak (%0,88) da İran ve Türkiye'den büyük. İkisi de ne listede ne yedek listede. Güney Afrika'nın neden seçildiği (eşitsizlik, apartheid mirası, veri kalitesi) yazılmalı. Mozambik ve Irak yedek listeye eklenmeli.

**1.6 · KÜÇÜK · Suriyeli sayısı** tarihsiz ve biraz düşük yuvarlanmış (bkz. tablo, satır 39).

---

## Denetim 2 · Kültür ve hassasiyet

### Genel değerlendirme
İyi iş. Türkiye profili ülkeyi tek bir hikâyeye indirgemiyor. Şunların her biri ayrı ayrı yer alıyor: Kürt, Zaza, Alevi (Türk, Kürt ve Arap Alevileri dahil), Caferi, gayrimüslim topluluklar, Ezidi, Laz, Hemşinli, Çerkez, Balkan göçmeni, Roman, Suriyeli sığınmacı, mevsimlik işçi, şehirli beyaz yaka, yalı sahibi ve gecekondu ailesi. Hassas olaylar (6-7 Eylül, 1964 sınır dışı etmeler, Varlık Vergisi, Maraş, Çorum, Sivas, 1990'ların zorunlu göçü, 28 Şubat, 15 Temmuz) var ve çoğu tarafsız dille yazılmış. Başörtüsü konusunda "iki tarafın da mağduriyet hafızası" yaklaşımı ve "seçenekler yargısız" kuralı doğru. Parti ve lider adı kullanmama kuralı iyi. Ağır olaylar için "sahne gösterilmez" notu Kalite yönergesiyle uyumlu.

Bölge gruplamalarında politik olarak ağır bir sorun bulmadım. Zor kararlar (İsrail, Türkiye, Afganistan, Sudan, Madagaskar) açıkça yazılıp gerekçelendirilmiş. Bu doğru yöntem.

### Bulgular

**2.1 · ORTA · Kürt, Alevi, gayrimüslim ve Suriyeli isim havuzları boş.** Dürüstçe boş bırakılmışlar, uydurma isim yok. Ama şu hâliyle motor Kürt, Ermeni ya da Suriyeli bir aileye sadece "genel" havuzdan isim verir. Bu da o kimlikleri görünmez yapar ve tam olarak "tek hikâye" sorununa yol açar. Şart: bu havuzlar dolmadan Türkiye profili oyuna girmemeli. Ya da motor, boş havuzlu bir grubu çekilişte o grup olarak hiç kullanmamalı, sessizce "genel"e düşürmemeli.

**2.2 · ORTA · "1915 olayları" ifadesi tarafsız değil.** `hassasiyet` bölümünde geçiyor. Bu ad, konunun bir tarafının tercih ettiği bir ad. Oyun 1950'den başladığı için olay olarak yok. Ama gayrimüslim bir ailenin aile hafızasında geçebilir. Profilin kendi kuralı ("olay adı tarafsız") gereği betimleyici bir ifade gerekli, örneğin "1915'te Ermenilerin sürgünü ve toplu ölümleri". Adlandırmanın kendisinin tartışmalı olduğu da not edilmeli. Kesin ifade Atakan'a sorulmalı.

**2.3 · KÜÇÜK · "Kıbrıs harekâtı" bir tarafın adı.** Olayın kendi hassasiyet notu "tarafsız ad kullanılmalı" diyor, ama seçilen ad Türkiye tarafının adı. Öneri: "1974 Kıbrıs savaşı (Türkiye'nin askerî müdahalesi)". Aynı şekilde "28 Şubat süreci"nin `tur` alanı `darbe`. Bu sınıflandırma tartışmalı, `siyasi` olarak işaretlenmesi daha tarafsız olur.

**2.4 · KÜÇÜK · Genellemeler.** `icBolgeler.TR5` için "Konya muhafazakâr" ifadesi bir ili tek sıfata indiriyor. Daha nötr bir ifade önerisi: "Konya'da dindar-muhafazakâr kesim ağırlıklı". R13'teki "kürk şapkalar" ve R11'in "neden bir arada" bölümünde cinayet oranlarının bölgeyi tanımlayan özellikler arasında sayılması klişeye yakın duruyor. Cinayet oranı ülke verisinde kalsın, bölgenin tanımında olmasın.

**2.5 · KÜÇÜK · Denge eksikleri (ileride eklenecekler).** Çatışma döneminde 1990'lardaki faili meçhul cinayetler ve 1995 Gazi olayları yok. 15 Temmuz gecesi ölen siviller de yazılmamış. Kadın hayatına dair temel doku eksik: kadın istihdamı, ev içi iş bölümü, kadına yönelik şiddetin sahne göstermeden ele alınışı. Kürt kimliği şimdilik çoğunlukla yasaklar, çatışma ve göç üzerinden anlatılıyor. Gündelik kültür (müzik, dengbêj, düğün gelenekleri, Kürtçe medya) eklenmezse profil kendi kuralına ("tek mağduriyet hikâyesine indirgenmez") rağmen bu yöne kayar.

**2.6 · KÜÇÜK · R13'ün adı "Doğu Avrupa, Balkanlar ve Rusya".** Ukrayna, Polonya ve Baltık ülkeleri, adında Rusya geçen bir bölgeye konmuş. 2022 sonrasında bu hassas. Gruplama mantığı (sosyalizm sonrası dönüşüm) doğru, sadece ad nötrleşmeli. Örnek: "Doğu Avrupa ve Balkanlar (sosyalizm sonrası)".

**2.7 · KÜÇÜK · R06'da İsrail ve Filistin.** Çözüm (İsrail'in kendi alt profili, Kalite'nin özel denetimi) doğru. Sadece bölge girişindeki "Büyük çoğunlukta Arapça ve İslam" cümlesinin İsrail'i kapsamadığı zaten yazılmış. Ek bir değişiklik gerekmiyor. Bu bölgenin metinleri yazıldığında ayrıca denetlenecek.

---

## Denetim 3 · Şablon kalitesi

### JSON geçerliliği
- `_sablon.json`: geçerli (node `JSON.parse` ile kontrol edildi).
- `TUR.json`: geçerli. Kaynak olarak gösterilen her kimlik `kaynaklar` listesinde tanımlı.
- TUR.json'da şablonda olmayan anahtarlar var: `askerlik.donemler[].sure.kisaDonem`, `yedekSubay`, `yedekAstsubay` ve `bedelliTemelEgitim`. Ayrıca `goc[].olcek` bir nesne, ama şablonda düz bir değer (`null`).
- Şablondaki her alan TUR.json'da var.

### 21 ülke için doldurulabilir mi?
Evet, büyük ölçüde. Başlıklar evrensel. Dönemli alanlar, durum etiketleri ve kaynak kimlikleri iyi kurulmuş. Askerliği olmayan, din istatistiği resmî olan ya da çok dilli ülkeler bu yapıya sığar. Ama motorun güvenle okuyabilmesi için aşağıdakiler gerekli.

### Bulgular

**3.1 · ORTA · Biçimsel şema yok.** Seçenekler `"kadin | erkek"`, `"kent | kir | ikisi"` gibi metinler olarak yazılmış. Motor ya da bir doğrulama scripti bunları kontrol edemez. Sonuç olarak TUR.json bile şablonun dışına çıkmış: `tr-alevi`, `tr-gayrimuslim` ve `tr-suriyeli` havuzlarında `cinsiyet: "ikisi"` yazıyor, şablonda böyle bir seçenek yok. Ayrıca `onYil: null`. 20 ülke daha yazılmadan önce bir JSON Schema (ya da TypeScript tipi + doğrulama scripti) yazılmalı. Bu Yapımcı ve Veri ile birlikte yapılacak bir iş.

**3.2 · ORTA · Etnik/kimlik grubu için ayrı bir alan yok.** Din (`din`) ve dil (`dil`) var, ama "bu kişi Kürt, Laz, Çerkez, Rum..." diyen ayrı bir yapı yok. İsim havuzlarının `grup` alanı ("kurt", "alevi", "ermeni-rum-yahudi-suryani") etnik, dini ve göçmen kimliklerini aynı listede karıştırıyor. Motorun bir aileye bir kimlik (dil + din + köken + isim havuzu + bölge) çekebilmesi için `topluluklar` gibi bir liste gerekli. Her topluluk dil, din, bölge, isim havuzu ve ağırlık bağlantısını taşımalı. Bu, inandırıcı ve çeşitli bir hayat için en önemli eksik.

**3.3 · ORTA · Alevilik iki kez sayılabilir.** `din.dagilim` listesinde Alevi hem "Müslüman" grubunun alt grubu, hem de ayrı bir grup. Oranlar doldurulduğunda çift sayım olur. Atakan'ın vereceği karar ne olursa olsun yapı şöyle olmalı: tek bir kayıt, üstünde `kendiniTanimlama` gibi bir not. Bu karar zaten Atakan'a sorulacaklar arasında.

**3.4 · ORTA · Çekiliş için ağırlıklar ve bağlantılar yok.** Din payları, dil ağırlıkları, meslek, konut ve isim havuzu ağırlıklarının hepsi `null`. Şablon "rakamlar Veri'den gelir" diyor, ama hangi Veri serisinin hangi alana bağlanacağını söyleyen bir alan yok (ör. `veriAnahtari: "tuik.isgucu.kayitdisi"`). Bu bağ olmadan motor anne-baba mesleğini, evin tipini ya da ailenin dinini çekemez. Ya bağlantı alanı eklenmeli ya da Veri ile ortak bir anahtar listesi tanımlanmalı.

**3.5 · ORTA · 1950-1990 arası askerlik süresi boş.** 1950-1970 doğumlu erkeklerin bütün askerlik dönemi bu aralığa düşüyor. "Geçmiş" modu için bu kritik bir boşluk. Dürüstçe `bos` işaretlenmiş, ama sıradaki doldurma işinin önceliği olmalı.

**3.6 · KÜÇÜK · Dönem sınırları belirsiz.** `yilSon` bir dönemde 1997 iken bir sonraki dönemin `yilBas` değeri de 1997 (eğitim, askerlik, dil ve emeklilikte de aynı durum var). Sınır yılının hangi döneme ait olduğu bir kurala bağlanmalı. Örneğin `yilSon` o yılı kapsamaz. Ayrıca bir dönemin hangi tarihe göre seçileceği yazılmalı: kanunun yürürlüğe girdiği tarih mi, okula başlama yılı mı?

**3.7 · KÜÇÜK · Yazım tutarsızlıkları.**
- Dönem bazı yerlerde `yilBas`/`yilSon` ile, `meslekler`, `konut` ve `ulasim` alanlarında ise `donem: [a, b]` dizisiyle yazılmış.
- `evlilikAile.yasalDurumlar` içinde `durum` adı çakıştığı için `durum_` diye bir anahtar uydurulmuş. Bu anahtar `deger` gibi açık bir adla değiştirilmeli.
- `askerlik.sure` alanının hangi alt anahtarları alacağı belli değil. Kim kısa dönem yapar, kim yedek subay olur (eğitim koşulu) yazılmamış.

**3.8 · KÜÇÜK · İsim havuzları küçük.** Dolu her havuzda 9-10 isim var. Şablonun kendi kuralı en az 30. Biliniyor ve devir notunda yazılı.

**3.9 · KÜÇÜK · Bölge JSON şablonu yok.** K2 için `content/regions/<bolge>.json` biçimi henüz tanımlanmadı. Devir notunda yazılı.

---

## Denetim 4 · Kurallara uyum (CLAUDE.md ve KARARLAR.md)

| Kural | Durum |
|---|---|
| CLAUDE 4 / Karar 1: Orijinal oyunun kodu, metni, görseli ve adı kullanılmaz | **Uyuyor.** Dosyalarda orijinal oyundan içerik yok. `_sablon.md` içinde orijinal oyundaki bir soruna ("herkesin adı Raif") gönderme var. Bu bir tasarım notu, içerik değil, sorun yok. |
| CLAUDE 5: Uydurma istatistik yok, her rakamın kaynağı ve yılı var | **Kısmen.** Uydurma rakam bulmadım. Ama "genel-bilgi" kaynaklı rakamlar var (bulgu 1.1). Etiketler dürüst, oyuna girmeden önce kapatılmalı. |
| CLAUDE 6: İşi yapan kendi işini onaylamaz | **Uyuyor.** Denetim durumu "bekliyor", devir notu Kalite'ye yönlendiriyor. |
| CLAUDE 7: Devir notu | **Uyuyor.** `docs/devir/2026-11-26-dunya-kultur.md` var. Ne yapıldığı, ne kaldığı ve Atakan'a ne sorulacağı yazılı. |
| CLAUDE 3: Türkçe belgeler | **Uyuyor.** |
| Karar 3: Türkiye ayrıcalıklı değil | **Uyuyor.** Türkiye, Karar 4'teki "~20 + Türkiye" ifadesine uygun olarak listede. Pay sırasının 28. olduğu açıkça yazılmış. Türkiye'nin şablon örneği ve MVP'de olması makul. |
| Karar 4: K1 ~20+TR, K2 ~12 bölge | **Uyuyor.** 21 ülke ve 13 bölge. 13'ün gerekçesi yazılmış ve 12'ye inme yolu açık soru olarak bırakılmış. |
| Yasaklı isim veri seti (`philipperemy/name-dataset`) | **Uyuyor.** Hiçbir yerde kullanılmamış, şablonda açıkça yasaklanmış. |
| `sigpwned` veri seti | Henüz indirilmedi. Lisansının (CC0) Veri tarafından dosyanın kendisinden doğrulanması gerekiyor. Bu denetimde kontrol edilmedi. |
| Kalite yönergesi: ağır konular sahne göstermeden | **Uyuyor.** Deprem, çatışma, darbe ve çocuk yaşta evlilik maddelerinde not var. |

---

## Düzeltilecekler (şartlar)

Sıradaki 20 profil yazılmaya başlamadan önce:
1. Şablon için biçimsel bir şema ve doğrulama scripti yazılmalı. Seçenek değerleri sabitlenmeli. TUR.json'daki `cinsiyet: "ikisi"` ve `onYil: null` düzeltilmeli. (3.1)
2. Şablona `topluluklar` yapısı eklenmeli: dil, din, köken, isim havuzu, bölge ve ağırlık bağlantısıyla. (3.2)
3. Alevilik din dağılımında tek kayıt olmalı. (3.3)
4. Veri serileriyle bağlantı alanı eklenmeli (`veriAnahtari` ya da ortak bir anahtar listesi). (3.4)
5. Dönem sınırı kuralı yazılmalı. `donem` ile `yilBas`/`yilSon` yazımı tek biçime indirilmeli. `durum_` anahtarı düzeltilmeli. (3.6, 3.7)
6. Üst düzey `durum` kuralı: alt maddelerin en zayıfı. Kahramanmaraş ve enflasyon olaylarının etiketleri buna göre düzeltilmeli. (1.2)
7. `genel-bilgi` kaynağının adı değişmeli. Motorun `dogrulanmali` ya da kaynaksız rakamları oyuna sokmaması kuralı şablona yazılmalı. (1.1)

Türkiye profili oyuna girmeden önce:
8. "dogrulanmali" rakamlar birincil kaynaktan kontrol edilmeli. Önce askerlik 1950-1990, emeklilik ve evlilik yaşı. (1.1, 3.5)
9. Kürt, Alevi, gayrimüslim ve Suriyeli isim havuzları kaynaklı olarak doldurulmalı. Doldurulana kadar motor bu grupları sessizce "genel"e düşürmemeli. (2.1)
10. "1915 olayları" ve "Kıbrıs harekâtı" ifadeleri tarafsız hâle getirilmeli. 28 Şubat'ın türü düzeltilmeli. (2.2, 2.3)
11. Soma ve Marmara rakamları kaynağıyla eklenmeli. Suriyeli sayısı tarihli olarak güncellenmeli. İkincil kaynaklara birincil kaynak eklenmeli. (1.3, 1.6)

Küçük düzeltmeler (uygun bir zamanda):
12. Kosova R13'e eklenmeli. "Yuvarlama farkı" açıklaması düzeltilmeli. (1.4)
13. Güney Afrika'nın seçilme gerekçesi yazılmalı. Mozambik ve Irak yedek listeye eklenmeli. (1.5)
14. Genelleme ifadeleri ("Konya muhafazakâr", "kürk şapkalar", R11 tanımındaki cinayet oranı) düzeltilmeli. R13'ün adı nötrleştirilmeli. (2.4, 2.6)
15. Denge eksikleri ileride eklenmeli: faili meçhul cinayetler, Gazi olayları, 15 Temmuz'da ölen siviller, kadın hayatı dokusu, Kürt gündelik kültürü. (2.5)

## Atakan'a sorulacaklar (bu denetimden çıkan)
- 1915'e (aile hafızasında geçerse) ve 1974 Kıbrıs'a hangi tarafsız adla değinilsin?
- Alevilik nasıl gösterilsin? (Devir notundaki 6. soruyla aynı. Kalite'nin önerisi: tek kayıt ve kişinin kendi tanımı. Oyunda hem "Müslüman, Alevi" hem "Alevi" olarak kendini tanımlayan karakterler olabilir.)

---

## Yeniden denetim (v0.2, aynı gün)

Denetleyen: Kalite ve Hassasiyet (bağımsız). Dosyalara dokunmadım. Testleri `/tmp` altındaki kopyalarda yaptım.

### Yeni karar: **ŞARTLI GEÇTİ**

İlk 7 düzeltme ve istenen küçük düzeltmeler doğru uygulanmış. Doğrulama scripti çalışıyor. Bilerek bozduğum 11 kopyanın 9'unda hatayı doğru yakaladı. Kalan tek şart, doğrulama scriptindeki **bir boşluğun** kapatılması (Y1). Bu boşluk açık kalırsa, ilk denetimdeki "fazla doğrulandı etiketi" sorunu 20 yeni profilde fark edilmeden tekrar edebilir. Y1 kapanınca şablon ve listeler **GEÇTİ** sayılır. Sıradaki 20 profilin yazımı Y1 düzeltilir düzeltilmez başlayabilir.

Türkiye profilinin oyuna girmesi için ilk denetimdeki 8-11. maddeler hâlâ açık. Bu beklenen bir durum ve devir notunda yazılı.

### Script çalışıyor mu?
- `python3 -I scripts/validate_countries.py` → `TUR.json: 0 hata, 14 uyarı` (uyarıların hepsi "havuz 30 isimden küçük"). Çıkış kodu 0. jsonschema 4.26.0 kurulu. Şemanın kendisi geçerli (`check_schema`).
- Script dosyaları **değiştirmiyor**: TUR.json'un md5 değeri çalıştırmadan önce ve sonra aynı.
- TUR.json, `_sablon.json` ve `_sablon.schema.json` node ile parse edildi, üçü de geçerli.

Bozuk kopyalarla yaptığım test:

| Bozma | Beklenen | Sonuç |
|---|---|---|
| Havuzda `cinsiyet: "ikisi"` | şema hatası | Yakaladı |
| `durum: "kesin"` (seçenek dışı) | şema hatası | Yakaladı |
| Bir kayıttan `oyunda_kullanilabilir` silmek | şema hatası | Yakaladı |
| Tanımsız kaynak kimliği | K1 | Yakaladı |
| `dogrulanmali` bir kayıtta `oyunda_kullanilabilir: true` | K2 | Yakaladı |
| `dogrulandi` + kaynağı sadece `kaynaksiz` + `true` | K2 | Yakaladı |
| Alevi'yi Müslüman alt grubuna da eklemek | K7 çift sayım | Yakaladı |
| Boş havuzlu topluluğu `havuzHazir: true` yapmak | K6 | Yakaladı |
| Dönemde yilBas > yilSon | K4 | Yakaladı |
| Kahramanmaraş olayını tekrar `durum: dogrulandi` yapmak (kaynakta `kaynaksiz` var, `oyunda_kullanilabilir: false`) | hata | **Yakalamadı** (bkz. Y1) |
| Ardışık iki dönemi 3 yıl çakıştırmak | hata | **Sadece uyarı** verdi (bkz. Y2) |

### Düzeltmeler doğru uygulanmış mı?

| İlk denetim maddesi | Durum |
|---|---|
| 1. Biçimsel şema, seçenekler sabit, `ikisi` ve `onYil: null` | Uygulandı. Şema var. Havuzlar kadin/erkek olarak ikiye bölünmüş ve `yilBas`/`yilSon` kullanıyor. |
| 2. `topluluklar` yapısı | Uygulandı. 13 topluluk, her birinde dil, din, iç bölge, havuz ve ağırlık bağlantısı var. Boş havuzlu topluluklar `havuzHazir: false`. Köken (`topluluk`) ile inanç (`din`) ayrılmış. |
| 3. Alevilik tek kayıt | Uygulandı. Tek kayıt, `ustGrup: null`, `kendiniTanimlama` notu ve Atakan sorusu var. Çift sayımı script denetliyor. |
| 4. Veri bağlantısı | Uygulandı. Her çekiliş kaydında `agirlik` nesnesi ve `veriAnahtari` var (öneri olarak işaretli). |
| 5. Dönem kuralı, tek biçim, `durum_` | Uygulandı. Kural `yilBas` dahil, `yilSon` hariç. `donemSecimi` alanı eklenmiş (örnek, askerlik için: "20 yaşına girilen yıl"). `durum_` yerine `deger` gelmiş. |
| 6. Durum zinciri, Kahramanmaraş ve enflasyon | Veride doğru: iki olay `dogrulanmali`, sadece `olcek` rakamları `dogrulandi`. Script tarafında boşluk var (Y1). |
| 7. `genel-bilgi` → `kaynaksiz`, motor kuralı | Uygulandı. `genel-bilgi` hiçbir yerde kalmamış. `oyunda_kullanilabilir` her kayıtta zorunlu: 26 kayıt `true`, 357 kayıt `false`. |
| 1.3 Birincil kaynak | Kısmen. Kaynaklara `tur` (birincil/ikincil) ve `birincilAdres` eklenmiş, ama birincil kaynaklar hâlâ "kontrol edilmedi". Açık, Türkiye oyuna girmeden önce yapılacak (madde 11). |
| 1.4 Kosova | Uygulandı. R13 %2,01 ve toplam %99,98: kendi hesabımla tuttu (%1,99 + %0,016; %99,968 + %0,016). Açıklama artık doğru. |
| 1.5 Güney Afrika gerekçesi, Mozambik ve Irak | Uygulandı. Rakamlar doğru (MOZ %0,95, IRQ %0,88). |
| 1.6 Suriyeli sayısı | Uygulandı. İki tarihli rakam var, `dogrulanmali`, `oyunda_kullanilabilir: false`. |
| 2.4 Genellemeler | Uygulandı. Konya ifadesi çeşitlendirilmiş, "kürk şapka" ve R11 tanımındaki cinayet oranı çıkarılmış. |
| 2.6 R13 adı | Uygulandı: "Doğu Avrupa ve Balkanlar (sosyalizm sonrası)". Kosova için tarafsız ad notu da eklenmiş. |
| 2.2, 2.3 (1915, Kıbrıs, 28 Şubat) | Bilerek değiştirilmemiş, `atakan_karari_bekliyor` ile işaretlenmiş. Kalite olarak bunu kabul ediyorum: adlandırma kararı Atakan'ın. Bu kayıtlar `oyunda_kullanilabilir: false` olduğu için oyuna girmiyor. |

### Yeni bulgular

**Y1 · ORTA · Durum zinciri kuralı (K3) metin içeriğini göremiyor.** K3 sadece `durum` alanı olan alt kayıtlara bakıyor. Bir olayın etki metinlerinin, etkilenen gruplarının ve il listesinin kendi `durum` alanı yok. Bu yüzden içinde sadece doğrulanmış `olcek` rakamları olan bir olay, kaynak listesinde `kaynaksiz` olduğu hâlde `durum: dogrulandi` yapılabiliyor ve script hata vermiyor (test edildi). `oyunda_kullanilabilir: false` kaldığı için oyuna sızmıyor, ama etiket yine yanlış ve ilk denetimdeki 1.2 sorunu tekrar etmiş oluyor. Önerilen kural: **`durum: dogrulandi` olan bir kaydın `kaynak` listesinde `kaynaksiz` bulunamaz** (`oyunda_kullanilabilir` değerinden bağımsız olarak). Bu, scripte tek satırlık bir ek.

**Y2 · KÜÇÜK · Dönem çakışması sadece uyarı veriyor.** Şablonun kuralı "sonraki `yilBas` = önceki `yilSon`" diyor. Script çakışmayı (sonraki dönemin, öncekinin bitişinden önce başlaması) da sadece uyarı olarak gösteriyor. Boşluk (iki dönem arasında yıl atlanması) uyarı olarak kalabilir, çünkü veri eksikliği olabilir. Ama çakışma hata olmalı. Motor aynı yıl için iki farklı kural bulur.

**Y3 · KÜÇÜK · Türkiye profilinde şu an çekilebilecek bir aile yok.** 13 topluluğun hepsi `havuzHazir: false`. Türk ve Balkan toplulukları da öyle, çünkü 1950'ler ve 2010'lar genel havuzları boş. Ayrıca 357 kaydın `false` olması, eğitim dönemleri ve tarihsel olaylar dahil profilin neredeyse tamamının şu an oyunda kullanılamayacağı anlamına geliyor. Bu kurallara uygun ve dürüst bir sonuç, hata değil. Ama MVP takvimi bunu bilmeli. "Türkiye profili dolu" demek, "oyunda Türkiye'de bir hayat yaşanabilir" demek değil. Önce 1950'ler ve 2010'lar NVİ listeleri, sonra eğitim ve askerlik dönemlerinin birincil kaynaktan kontrolü gerekli. Yapımcı için bilgi.

**Y4 · KÜÇÜK · Bazı toplulukların hiç isim havuzu yok.** Zaza, Arap, Laz-Hemşinli-Gürcü, Kafkas ve Roman topluluklarının `isimHavuzlari` listesi boş. Bu ailelerin çoğu genel havuzdaki isimleri de kullanır. Şablona "topluluk genel havuzu + kendi ek havuzunu kullanır" seçeneğini anlatan bir alan (ör. `genelHavuzKullanir: true`) eklenmezse, bu topluluklar hiçbir zaman `havuzHazir` olamaz.

**Y5 · KÜÇÜK · Kosova için iki farklı kod.** Bölge listesi `XKX` yazıyor, veri dosyası `OWID_KOS` kullanıyor. Motor ya da Veri için bir eşleme notu tek bir yerde (ör. Veri'nin ülke kodu tablosunda) tanımlanmalı.

**Y6 · KÜÇÜK · Devir notunda eski bir cümle kalmış.** "Veri departmanına notlar" bölümü hâlâ "Kosova çift sayım riski kontrol edilmeli" diyor. Bu, düzeltilmiş değerlendirmeyle çelişiyor.

**Y7 · KÜÇÜK · `_sablon.json` kendi şemasından geçmiyor.** Yer tutucu değerler (`""`, `"YYYY-AA-GG"`) yüzünden 2 hata veriyor. Script `_` ile başlayan dosyaları atladığı için bu bir sorun değil. Ama yeni bir profile başlayan ajan şablonu kopyalayınca ilk çalıştırmada hata görür. Bu beklenen bir durum; `_sablon.md`'de bir cümleyle belirtilmesi yeterli.

### Şartlar (ŞARTLI GEÇTİ → GEÇTİ için)
1. Y1: `dogrulandi` + `kaynaksiz` birlikteliği script hatası olmalı.

Küçükler (20 profil yazılırken düzeltilebilir): Y2, Y4, Y5, Y6, Y7. Y3 Yapımcı için bilgi.

Türkiye profilinin oyuna girmesi için ilk denetimin 8-11. maddeleri ve 15. madde hâlâ geçerli.
