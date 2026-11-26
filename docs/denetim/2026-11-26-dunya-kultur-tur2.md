# Denetim · Dünya ve Kültür · Türkiye profili 2. tur · 2026-11-26

Denetleyen: Kalite ve Hassasiyet (bağımsız; bu işi yapmadı)
Denetlenen: `content/countries/TUR.json` (şablon 0.2), `_sablon.schema.json`, `_sablon.md`, `scripts/validate_countries.py`, `content/regions/kod-eslemeleri.json`, devir notunun "Türkiye profilini oynanabilir yapma turu" bölümü. Çakışma kontrolü için Veri departmanının dosyalarına da baktım: `src/engine/types.ts`, `src/engine/data-v1.ts`, `data/processed/v1/`, `docs/devir/2026-11-26-veri.md`.
Dosyalara dokunmadım. Testleri `/tmp` altındaki kopyalarda yaptım.

## Karar: **ŞARTLI GEÇTİ**

Bağımsız olarak kontrol ettiğim 21 "doğrulandı" kaydının 20'si birebir tuttu. Kalan 1'inde tek harflik bir fark var. Askerlik, evlilik yaşı, eğitim kanunları, emeklilik, isim ve soyadı listeleri ve kadın hayatı rakamları artık sağlam. KARAR 17 ve 18 metinlerde doğru uygulanmış. Yeni hassas olaylar (faili meçhuller, Gazi, 15 Temmuz) tarafsız yazılmış. Doğrulayıcı script çalışıyor. Bilerek bozduğum 13 kopyanın 10'unda hatayı yakaladı. Yakalayamadığı 3 durumun 2'si önemli (bkz. Ş1).

Kritik bulgu yok. Aşağıdaki 4 şart (Ş1-Ş4) kapanınca bu tur GEÇTİ sayılır.

---

## 1 · "Doğrulandı" kayıtların bağımsız kontrolü

TUR.json'da 65 kayıt `dogrulandi`. Bunlardan 21'ini seçip kaynağı kendim açtım ya da başka bir kaynaktan buldum.

| # | Kayıt | Dosyadaki değer | Bulduğum | Kaynak | Sonuç |
|---|---|---|---|---|---|
| 1 | Kadın / erkek / toplam istihdam oranı, 2024 | %32,5 / %66,9 / %49,5 | aynı | [Alomaliye, TÜİK İşgücü 2024](https://www.alomaliye.com/2025/03/20/isgucu-istatistikleri-2024/) | Tuttu |
| 2 | İşgücüne katılma oranı, 2024 | %36,8 / %72,0 / %54,2 | aynı | aynı | Tuttu |
| 3 | Kadınların hane ve aile bakımına ayırdığı süre / çalışan erkekler, 2014-15 | 3 sa 31 dk / 46 dk | aynı | [Alomaliye, TÜİK Zaman Kullanım](https://www.alomaliye.com/2015/12/04/zaman-kullanim-arastirmasi-2014-2015/) | Tuttu |
| 4 | Çalışan kadın / erkeklerin istihdama ayırdığı süre | 4 sa 32 dk / 6 sa 25 dk | aynı | aynı | Tuttu |
| 5 | Evlenme yaşı 1950-2002 (743 s.K.) | erkek 17, kadın 15; hâkim kararıyla 15/14 | aynı | [Bianet 2004](https://bianet.org/haber/yeni-turk-medeni-kanununda-evlenme-47663) | Tuttu |
| 6 | Evlenme yaşı 2002 sonrası (TMK 4721) | 17/17; hâkim kararıyla 16 | aynı | aynı | Tuttu. Eski kayıttaki "18" düzeltmesi doğru |
| 7 | Askerlik, 1111 m.5 (2973 s.K., 25.1.1984) | er 18 ay | "on sekiz aydır", 2973 s.K. 25/1/1984 | [Lexpera, 1111 s.K.](https://www.lexpera.com.tr/mevzuat/kanunlar/askerlik-kanunu-1111) | Tuttu |
| 8 | Askerlik 1995-2003 ve 2003-2014 | 18/16/8 → 15/12/6 ay, 15 Temmuz 2003'ten itibaren | aynı (er 18→15, yedek subay 16→12, kısa dönem 8→6) | [Bianet, Genelkurmay açıklaması](https://bianet.org/haber/genelkurmay-baskanliginin-aciklamasi-20393) | Tuttu. Not: Genelkurmay metni bir öneri; tarih sadece er süresi için yazılı |
| 9 | Askerlik 2014-2019 | er 12, kısa dönem 6, 1 Ocak 2014'ten itibaren | aynı | [Posta](https://www.posta.com.tr/gundem/askerlik-suresi-1-ocak-2014ten-itibaren-kisaliyor-201279) | Tuttu |
| 10 | 222 s.K. m.8, ilkokul süresi | en az 5 yıl, 1961 | "en az beş yıldır"; RG 12.01.1961; 4306 ile mülga | [Lexpera, 222 s.K.](https://www.lexpera.com.tr/mevzuat/kanunlar/ilkogretim-ve-egitim-kanunu-222) | Tuttu |
| 11 | EYT, 7438 s.K. | RG 3.3.2023, sayı 32121 | aynı | [Resmî Gazete 3 Mart 2023](https://www.resmigazete.gov.tr/eskiler/2023/03/20230303-8.htm), [TÜRMOB 32121](https://www.turmob.org.tr/arsiv/mbs/resmigazete/32121-3.pdf) | Tuttu |
| 12 | TRT 6 | 1 Ocak 2009; 2954 s.K. değişikliği (2008) | 1 Ocak 2009; 2954 değişikliği 11 Haziran 2008 | [Merlin (Avrupa Konseyi)](https://merlin.obs.coe.int/article/4810) | Tuttu |
| 13 | 15 Temmuz 2016 ölü sayısı | 250 (iddianame) | iddianamede 250 ad; listelerden kabaca 182 sivil, 63 polis, 4-5 asker | [Karar](https://www.karar.com/15-temmuz-sehitlerinin-isimleri-tek-tek-iddianameye-girdi-406318) | Tuttu. Dağılım sayılabiliyor, kayda eklenebilir |
| 14 | 28 Şubat davası | 2018'de 21 sanığa ağırlaştırılmış müebbet; Yargıtay 2021'de 14 sanık için onadı | 21 / 14, onama 9 Temmuz | [Duvar English](https://www.duvarenglish.com/turkeys-top-appeals-court-upholds-convictions-in-post-modern-coup-case-news-58126) | Tuttu |
| 15 | 1915, USHMM rakamı (oyunda kullanılmıyor) | en az 664.000, belki 1,2 milyon | aynı | [USHMM ansiklopedisi](https://encyclopedia.ushmm.org/content/tr/article/the-armenian-genocide-1915-16-in-depth) | Tuttu |
| 16 | NVİ 1931-1940 ilk 30 kadın / erkek adı | liste | 59/60 aynı ve aynı sırada. 30. kadın adı dosyada **"Keziban"**, NVİ PDF'inde **"Kezban"** | [NVİ PDF](https://nvi.gov.tr/kurumlar/nvi.gov.tr/Genel_Mudurluk/istatistikler/1931_1940Tarihleri_Arasinda_En_cok_Verilen_isimler.pdf) | Küçük fark (K4) |
| 17 | 1951-1960 ilk 20 kadın / erkek adı | liste | aynı ve aynı sırada | [Yıldırım 2016, DergiPark](https://dergipark.org.tr/tr/download/article-file/265490) | Tuttu |
| 18 | En çok kullanılan 50 soyadı | liste | aynı ve aynı sırada | [NVİ PDF](https://nvi.gov.tr/kurumlar/nvi.gov.tr/Genel_Mudurluk/istatistikler/En_cok_Kullanilan_Soyad_istatistigi.pdf) | Tuttu |
| 19 | 2024'ün en sık bebek adları (2020'ler havuzu) | Alparslan, Göktuğ, Yusuf / Defne, Asel, Zeynep havuzda | aynı (TÜİK, İstatistiklerle Çocuk 2024) | [Yeni Şafak](https://www.yenisafak.com/tuik-acikladi-2024-yilinin-en-populer-isimleri-neler-h-4696961) | Tuttu |
| 20 | Gazi 1995 (`dogrulanmali`) | 22 ölü (17+5); 20 polis yargılandı, 2 mahkûm, 18 beraat | aynı | [Bianet](https://bianet.org/haber/videolarla-gazi-katliami-ve-dava-sureci-162977) | Tuttu. AİHM 2005 tarihi bu kaynakta yok |
| 21 | Zorla kaybetmeler (`dogrulanmali`) | 1993: 103, 1994: 518; OHAL'deki 13 il | aynı; il listesi de aynı | [Bianet, Hafıza Merkezi raporu özeti](https://bianet.org/haber/90-larda-ne-oldu-yargiya-nasil-yansidi-253344) | Tuttu |

**Yanlış rakam:** yok. **Gerçekte doğrulanmamış bir "doğrulandı":** yok. Kaynak kalitesiyle ilgili bir bulgu var (O3).

---

## 2 · Hassas metinler, KARAR 17 ve 18

### KARAR 17 (tartışmalı olaylar)
- **1915:** Uygun. Oyun metni "1915'te Osmanlı Devleti'ndeki Ermeniler sürgün edildi; sürgün yollarında ve öldürmelerde çok sayıda Ermeni hayatını kaybetti". Yıl ve ne olduğu var, yargılayan bir ad yok. Dört ad birlikte veriliyor, ölü sayısı oyunda yok, olay sadece aile hafızasında geçiyor. Türkiye'nin resmî tutumu doğru özetlenmiş. Tür olarak `toplumsal` seçilmesi 6-7 Eylül ve 1964 kayıtlarıyla tutarlı, kabul.
- **Kıbrıs 1974:** Uygun. Üç ad birlikte, oyunun sesi hiçbirini benimsemiyor. Küçük düzeltmeler K1'de.
- **28 Şubat:** Uygun. Oyun metni olayı olgularla anlatıyor (MGK'nın 18 maddelik kararları, Haziran 1997'de başbakanın istifası). Türün `siyasi` yapılması, 2018 mahkeme kararının notta belirtilmesi ve Atakan'ın geri alabileceğinin yazılması doğru.

### KARAR 18 (Alevilik)
Uygun. Din listesinde tek kayıt var. Seçenekler "Alevi / Müslüman / Alevi ve Müslüman", karardaki "Alevi / Müslüman / ikisi" ile aynı. Aynı aile içinde kişilerin farklı tanım seçebileceği ve tanımın hayat boyunca değişebileceği yazılmış. Hassasiyet notuna "acılar Alevi kimliğinin tamamı değildir" cümlesi eklenmiş, yerinde.

### Yeni olaylar
- **Faili meçhul cinayetler ve zorla kaybetmeler:** Tarafsız. "Fail ima edilmez, oyun sorumluluk hakkında hüküm vermez" kuralı doğru. Rakamlar bir sivil toplum raporundan geldiği için `dogrulanmali` ve oyunda kullanılmıyor, doğru.
- **Gazi 1995:** Tarafsız. Başlık betimleyici ("yaşanan olaylar"). Sorumluluk sadece mahkeme ve AİHM kararlarıyla anlatılıyor.
- **15 Temmuz:** Sivillerin eklenmesi dengeyi düzeltmiş, dil tarafsız.
- **Kadın hayatı:** İyi. Kayıtlı işte çalışmayan kadınların yaptığı işin "görünmez olmaması" ilkesi yerinde. Şiddet oranı doğru biçimde `dogrulanmali` ve sahne yok.
- **Kürt gündelik kültürü:** Dengbêjlik ve Kürtçe yayın tarihi kaynaklı, iyi bir başlangıç. Ama hâlâ iki madde var, Kürt kültürü konusunda çeşitlilik zayıf (O2).

---

## 3 · Doğrulayıcı script

- `python3 -I scripts/validate_countries.py` → TUR.json'da **0 hata, 6 uyarı** (uyarılar: 1950'ler havuzu 20, 2010'lar 29/28, 2020'ler 16 isim). Çıkış kodu 0.
- K6 değişikliği (dine özgü ek havuzların, ör. boş Alevi havuzunun, genel havuz sayılmaması) doğru. Bu düzeltme olmasaydı yedek havuzu olan hiçbir topluluk çekilişe hazır olamazdı.
- Projenin testleri (`npx vitest run`) 37/37 geçiyor. Ama ülke profili doğrulaması bu testlerin içinde değil (K5).

Bozuk kopyalarla yaptığım test:

| Bozma | Beklenen | Sonuç |
|---|---|---|
| Genel 1950'ler kadın havuzunu boşaltmak | Türk, Zaza, Arap ve Laz-Hemşinli-Gürcü toplulukları çekilişe hazır olamaz | Yakaladı (4 hata) |
| Kürt topluluğunu `havuzHazir: true` yapmak (yedek havuz yok) | K6 | Yakaladı |
| Yedek havuzda gerekçe silmek | şema | Yakaladı |
| `toplulukKulturu` içinde tanımsız topluluk ("kurd") | K6 | Yakaladı |
| Kıbrıs olayını `dogrulandi` yapmak (kaynakta `kaynaksiz` var) | K8 | Yakaladı |
| `dogrulandi` bir kaydın kaynağını boşaltmak | K8 | Yakaladı |
| Askerlik dönemlerini çakıştırmak | K4 hata | Yakaladı |
| Aleviliği Müslüman kaydının alt grubu olarak da eklemek | K7 | Yakaladı |
| Bir havuza tanımsız din yazmak | K5 | Yakaladı |
| 28 Şubat'ın türünü `darbe`ye geri almak | hata değil (izin verilen seçenek, Atakan kararı) | Doğru davrandı |
| **1915 olayından `adlandirma` alanını silmek** | hata (KARAR 17) | **Yakalamadı** |
| **Kıbrıs `adlandirma.oyunMetni` alanını boşaltmak** | hata (KARAR 17) | **Yakalamadı** |
| Alevi `tanimlamaSecenekleri` alanına "Şii" yazmak | hata (KARAR 18) | Yakalamadı (küçük) |

---

## 4 · Veri departmanıyla çakışma

- **Kosova:** İki departmanın kayıtları tutarlı (XKX, BM'deki konum kodu 412, OWID_KOS). Ama `kod-eslemeleri.json` içindeki not hâlâ "bmWpp bu yüzden null" diyor, oysa değer artık "XKX". Ayrıca ülke kodu tablosu iki yerde duruyor: Dünya ve Kültür'ün `kod-eslemeleri.json` dosyası ve Veri'nin `ulke-kodlari.json` dosyası (K3).
- **Türkiye'nin BM doğum sayısı:** `dogumlar.json` dosyasında 2023 için 1.072.014. K1 listesi ve TUR.json'daki rakamla aynı.
- **Aynı ölçü için iki farklı rakam (Ş3):** TUR.json `yerelSayilar` bölümünde TÜİK'in toplam doğurganlık hızını (2024: 1,48) ve annenin ortalama yaşını `oyunda_kullanilabilir: true` olarak taşıyor. Veri'nin `mvp/TUR.json` dosyasında aynı ölçüler BM rakamıyla var: doğurganlık hızı 2024'te 1,62, annenin yaşı 29,31. Şablon "yerelSayilar çekilişte kullanılmaz" diyor, KARAR 16 da ulusal rakamın sadece kaynak sayfasında gösterileceğini söylüyor. Ama `oyunda_kullanilabilir: true` bu sınırı söylemiyor. Motor, aynı ülke ve aynı yıl için iki farklı "doğrulanmış" doğurganlık hızı görür.
- **`veriAnahtari`:** TUR.json'daki 10 önerilen anahtarın hepsi `tuik.*` biçiminde. Veri v1'de TÜİK serisi yok ve Veri'nin önerdiği anahtarlar `wpp2024.tfr` gibi bir biçimde. Ortak anahtar listesi hâlâ yok. Biliniyor, iki devir notunda da yazılı. Ama `tuik.dogum.toplamDogurganlik` ile `wpp2024.tfr` aynı ölçüye iki ayrı anahtar demek. Hangisinin oyunda kullanılacağı Ş3 ile birlikte çözülmeli.
- **`src/engine/types.ts`:** Veri'nin değişikliği (`CountryData` alanlarının boş olabilmesi, `fieldSources` eklenmesi) ülke profilleriyle çakışmıyor. Ama motor tiplerinde topluluk, din ya da kendini tanımlama alanı yok: `Life` ve `Person` tiplerinde sadece `name` var. Bu bir çakışma değil, bir boşluk. Simülasyon ve Yapımcı için not (K5).
- **K1 payı:** Veri, paydayı "dünya" satırı yerine 237 ülkenin toplamı olarak alınca payın %64,90 olduğunu söylüyor (dünya satırındaki fark Togo düzeltmesinden geliyor). K1 listesi %64,89 diyor. Fark önemsiz, sadece not (K3).

---

## Bulgular

### Şartlar (orta; kapanınca GEÇTİ)

**Ş1 · KARAR 17 şemada ve scriptte zorunlu değil.** 1915 olayından `adlandirma` alanını silmek ya da Kıbrıs'ın `oyunMetni` alanını boşaltmak hata vermiyor. Bu kontroller yoksa, sıradaki 20 ülkenin profillerinde (Rusya, İran, Çin, Hindistan ve diğerlerinde de tartışmalı olaylar var) KARAR 17 kendiliğinden uygulanmaz. Öneri: olaylara `tartismali: true` gibi bir alan eklenmeli. Bu alan işaretliyse `adlandirma` zorunlu olmalı, `oyunMetni` boş olmamalı ve en az iki taraf adı yazılmalı. 1915, Kıbrıs 1974 ve 28 Şubat bu alanı taşımalı.

**Ş2 · Bir kaydın kendisi kullanılamazken alt alanı kullanılabilir olunca ne olacağı tanımlı değil.** Kıbrıs 1974 ve 28 Şubat olaylarının kendisi `oyunda_kullanilabilir: false`, çünkü etki metinlerinin kaynağı yok. Ama `adlandirma` alanları `true`. Motor buna iki şekilde bakabilir. Olayı göstermez; o zaman `true` olan oyun metninin bir anlamı kalmaz. Ya da sadece oyun metnini gösterir. Bu kural şablonda tek cümleyle yazılmalı. Önerim: alt alan kullanılabilirse sadece o alan gösterilir. Örneğin oyun metni anı kartında görünür, kaynaksız etki metinleri görünmez.

**Ş3 · Ulusal rakam ile BM rakamının kullanımı (KARAR 16 ve Veri ile çakışma).** `yerelSayilar` kayıtlarına bir kullanım alanı eklenmeli. Örnek: `kullanim: "kaynakSayfasi"`, ya da `oyunda_kullanilabilir` alanının bu bölüm için ne anlama geldiği yazılmalı. Motor doğurganlık hızını ve annenin yaşını Veri'nin BM serisinden almalı. Kadın istihdamı ve zaman kullanımı gibi BM'de karşılığı olmayan rakamlar ise oyunda kullanılabilir. Bu ayrım yazılı olmalı.

**Ş4 · 1915'te "Ermeni Soykırımı" adını kimin kullandığı eksik yazılmış.** Şu an "Ermeni tarafı ve olayı soykırım olarak tanıyan kurumlar (ör. USHMM)" yazıyor. Bu ifade, adın sadece bir tarafın kullandığı bir ad olduğu izlenimini veriyor. Oysa bu adı kullananlar arasında bu olayı soykırım olarak resmen tanıyan birçok devlet ve parlamento ile soykırım araştırmacılarının büyük çoğunluğu da var. Tarafsızlık, her adı kimin kullandığını doğru yazmayı gerektirir. Kaynaklı ve sade bir ifade önerisi: "Ermenistan, olayı soykırım olarak tanıyan devletler ve parlamentolar (sayı ve örnekler kaynakla), soykırım araştırmacılarının çoğu, USHMM gibi kurumlar". Aynı denge Kıbrıs için de geçerli. "Barış Harekâtı" adının yanında Türkiye'nin gerekçesi (Garanti Antlaşması) yazılmış. "İşgal" adının yanında da öbür tarafın gerekçesi (BM kararları, uluslararası hukuk değerlendirmesi) kısaca yazılmalı.

### Orta (Atakan veya ileriki iş)

**O1 · Kürt aileler şu an oyunda hiç çıkmıyor, daha küçük topluluklar çıkabiliyor.** Zaza, Arap ve Laz-Hemşinli-Gürcü toplulukları NVİ il verisine dayanarak genel isim havuzunu yedek olarak kullanabiliyor ve çekilişe hazır. Kürt topluluğunun yedek havuzu ise bilerek boş bırakılmış. Sonuç: oyunda Türkiye'nin en büyük azınlığı hiç görünmezken daha küçük topluluklar görünür. Bu, ilk denetimdeki "görünmez kılma" kaygısının (2.1) ters yönden gerçekleşmesi. Aynı il kanıtı (ör. Diyarbakır, Hakkâri, Van) Kürtler için de bakılabilir. Kalite'nin önerisi: bütün topluluklar için aynı kural uygulansın. İl kanıtı varsa yedek olarak genel havuz kullanılsın, Kürtçe isim havuzu dolunca ona geçilsin. Eksik isim listesi, hiç görünmemekten daha az zararlı. Karar Atakan'ın: devir notundaki 1. soru. Bu soru **öncelikli** olarak sorulmalı. Not: topluluk ağırlıkları henüz boş olduğu için şu an zaten hiçbir aile çekilemiyor. Ama ağırlıklar geldiği gün bu asimetri oyuna yansır.

**O2 · Kürt gündelik kültürü hâlâ dar.** Dengbêjlik ve yayın yasakları var. Düğün ve halay gelenekleri, Kürtçe müzik ve sinema, kentli ve orta sınıf Kürt hayatı, dindar ve laik Kürt aileler gibi gündelik çeşitlilik yok. Kürt kimliği şu an yasak, çatışma ve göç anlatısının ağırlığında.

**O3 · Bazı "doğrulandı" kayıtlar sadece ansiklopedi ya da haber derlemesine dayanıyor.** Örnekler: vicdani ret (sadece Wikipedia), YKS (sadece Wikipedia), Kıbrıs adlandırması (sadece Wikiwand), sınavlar (Wikipedia + Onedio), askerlik tarihçesi (A Haber galerisi). Ana rakamlar başka kaynaklarla desteklendiği için yanlış bulmadım. Ama şablonun kaynak politikasına bir kural eklenmeli: Wikipedia ve galeri tipi haberler tek başına "dogrulandi" için yetmez, en az bir kurum, kanun ya da akademik kaynak gerekir.

### Küçük

- **K1:** Kıbrıs oyun metnindeki "15 Temmuz'daki darbe" ifadesi, 2016'daki 15 Temmuz ile karışabilir. Öneri: "15 Temmuz 1974'te adada Yunanistan'daki cuntanın desteklediği darbe".
- **K2:** Alevi `tanimlamaSecenekleri` alanı şemada sabitlenmemiş (KARAR 18 seçenekleri değiştirilebiliyor). Gazi, Sivas ve Maraş için de isteğe bağlı `adlandirma` (taraf adları, ör. "katliam" ve "olaylar") düşünülebilir. 15 Temmuz olayını kimin düzenlediğine dair taraf adları da ayrıntı sayfası için eklenebilir.
- **K3:** `kod-eslemeleri.json` içindeki not güncel değil ("bmWpp null" diyor). Ülke kodu tablosu iki yerde duruyor, tek bir yer seçilmeli. K1 listesindeki %64,89'un yanına Veri'nin %64,90 açıklaması not düşülebilir.
- **K4:** 1931-1940 havuzunun 30. kadın adı NVİ PDF'inde "Kezban", dosyada "Keziban". PDF'e göre düzeltilmeli ya da notta açıklanmalı.
- **K5:** Ülke profili doğrulaması (`validate_countries.py`) projenin test komutunda (`vitest`) yok. Motor tiplerinde topluluk, din ve kendini tanımlama alanları yok. Bunlar Yapımcı ve Simülasyon için not.
- **K6:** 15 Temmuz'da ölenlerin sivil, polis ve asker dağılımı iddianame listesinden sayılabiliyor (bende kabaca 182 / 63 / 4-5 çıktı). Kayda eklenebilir.

---

## Düzeltilecekler (özet)
1. Ş1: Tartışmalı olaylar için `tartismali` alanı, `adlandirma` zorunluluğu ve script kuralı.
2. Ş2: Bir kayıt kullanılamazken alt alanı kullanılabilir olunca ne olacağı kuralı (şablonda tek cümle).
3. Ş3: `yerelSayilar` kullanım kuralı. Doğurganlık hızı ve annenin yaşı BM'den alınır. Veri ile birlikte yazılmalı.
4. Ş4: 1915'te "Ermeni Soykırımı" adını kullananların doğru yazılması (kaynakla). Kıbrıs'ta iki tarafın gerekçelerinin dengelenmesi.

## Atakan'a sorulacak (öncelikli)
- Kürt topluluğu için de il kanıtıyla yedek olarak genel isim havuzu açılsın mı? Kalite'nin önerisi: evet, bütün topluluklar için aynı kural (O1).
