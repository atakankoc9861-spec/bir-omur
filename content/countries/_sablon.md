# Ülke Profili Şablonu (v0.2)

Hazırlayan: Dünya ve Kültür · Tarih: 2026-11-26 · Durum: Kalite denetimi (2026-11-26) sonrası düzeltildi; v0.1 şartlı geçmişti

Bu belge, her K1 ülke profilinin **neleri** içermesi gerektiğini sade dille anlatır. Dosyanın makine için hâli `content/countries/_sablon.json`. Biçimsel şema (izin verilen alanlar ve değerler): `content/countries/_sablon.schema.json`. Doldurulmuş tam örnek: `content/countries/TUR.json`.

**Her profil teslimden önce doğrulamadan geçer:** `python3 -I scripts/validate_countries.py` (hata 0 olmalı; uyarılar devir notuna yazılır).

> **Not:** `_sablon.json` kendi şemasından **geçmez**, bu beklenen bir durumdur. İçindeki yer tutucular (boş `adTr`, `YYYY-AA-GG` tarihi, `ornek-kaynak` gibi kimlikler) bilerek geçersizdir; script `_` ile başlayan dosyaları atlar. Şablonu kopyalayıp yeni bir profile başlayan ilk çalıştırmada hata görür; yer tutucular gerçek değerlerle doldurulunca hatalar kaybolur.

Ülke kodu veri dosyalarındakinden farklıysa (ör. Kosova: oyunda `XKX`, OWID'de `OWID_KOS`), eşleme tek yerde tutulur: `content/regions/kod-eslemeleri.json`.

## Temel kurallar (her alan için)
1. **Her bilginin kaynağı olur.** Dosyanın başında bir `kaynaklar` listesi var; her kaynak bir kimlik (`id`) alır. Alanlar bu kimliklere `kaynak: ["id1", "id2"]` diye bağlanır.
2. **Her bilginin durumu yazılır** (`durum` alanı):
   - `dogrulandi`: Kaynağı açıp rakamı/bilgiyi kendimiz gördük.
   - `dogrulanmali`: Bilgi büyük ihtimalle doğru ama birincil kaynakta henüz kontrol edilmedi. **Oyuna girmeden önce kontrol şart.**
   - `tahmin`: Resmî veri yok; anket ya da uzman tahmini. Yöntemi `not` alanına yazılır, oyunda "tahmin" diye gösterilir.
   - `bos`: Bilmiyoruz. Uydurmak yerine boş bırakılır.
3. **Zaman boyutu.** Oyuncu 1950'de de doğabilir, 2025'te de ("Geçmiş" modu). Okul, askerlik, emeklilik, evlilik yaşı gibi kurallar yıllar içinde değişti. Bu yüzden bu alanlar `donemler` listesi olarak yazılır: her dönem `yilBas` (başlangıç yılı) ve `yilSon` (bitiş yılı; hâlâ geçerliyse `null`) taşır.
4. **Çeşitlilik zorunlu.** Bir ülke tek hikâye değildir. Din, dil, isim, meslek ve konut alanlarında **en az** şehir/köy ve farklı gelir dilimleri ayrı ayrı yazılır; büyük etnik ve dini gruplar kendi isim havuzunu ve kendi geleneklerini alır.
5. **Rakamlar Veri departmanından gelir.** Nüfus, doğum, ölüm, gelir, okullaşma gibi bütün ülkelerde ortak olan sayılar bu dosyada **tekrar yazılmaz**; `data/processed` içinden okunur. Bu dosyaya sadece ülkeye özgü, başka yerde olmayan bilgiler girer (ör. askerlik süresi, sınav adları, bölgesel doğurganlık farkı).
6. **Hassasiyet.** Savaş, çatışma, şiddet, ayrımcılık gibi konular yazılırken taraf tutulmaz, olay adı ve etkisi tarafsız ve kaynaklı yazılır. Hassas maddelerde `hassasiyet` alanı doldurulur; Kalite bu maddeleri ayrıca denetler.
7. **Oyunda kullanılabilirlik (`oyunda_kullanilabilir`).** Her bilgi kaydında zorunlu. `true` olabilmesi için: `durum` = `dogrulandi` **ve** en az bir kaynak **ve** kaynaklarda `kaynaksiz` yok. Aksi hâlde `false`. **Motor `false` olan hiçbir bilgiyi oyuna sokmaz** (rakam da metin de). Doğrulama scripti bu kuralı denetler (kural K2).
8. **`kaynaksiz` kimliği.** Eskiden `genel-bilgi` adındaydı. Bu bir kaynak değildir; "hazırlayan biliyor ama kaynak göstermedi" demektir. Kaynak bulunca kaldırılır.
9. **Durum zinciri.** Bir kaydın `durum`u, içindeki alt kayıtların (ör. `olcek`, `agirlik`) **en zayıfından** güçlü olamaz. Güç sırası: `dogrulandi` > `dogrulanmali` > `tahmin`. Boş (`bos`) alt kayıtlar hesaba katılmaz. Örnek: bir depremin ölü sayısı doğrulandıysa ama etki metinleri kaynaksızsa, `olcek` `dogrulandi`, olayın kendisi `dogrulanmali` olur.
10. **Dönem sınırı.** `yilBas` dahil, `yilSon` **hariç**. Örnek: `1997-2012` dönemi 1997'yi kapsar, 2012'yi kapsamaz; 2012 bir sonraki dönemdedir. Ardışık dönemlerde sonraki `yilBas` = önceki `yilSon` olmalı. Her dönemli bölümde `donemSecimi` alanı **hangi yılın** esas alındığını yazar (ör. askerlik: 20 yaşına girilen yıl; emeklilik: ilk sigortalı olunan yıl). Tüm bölümlerde dönem aynı biçimde yazılır: `yilBas` / `yilSon` (eski `donem: [a, b]` biçimi kaldırıldı).
11. **Atakan kararı bekleyenler.** Hazırlayanın ya da Kalite'nin karar veremediği adlandırma ve sınıflandırmalar değiştirilmez; kayda `atakan_karari_bekliyor` alanıyla soru metni yazılır.
12. **Çekiliş ağırlıkları ve Veri bağlantısı (`agirlik`).** Motorun çekiliş yaptığı her listede (dil, din, topluluk, okul türü, eşleşme biçimi, meslek, konut, ulaşım, isim havuzu) her kayıt bir `agirlik` nesnesi taşır: `deger` (0-1 pay, biliniyorsa), `veriAnahtari` (Veri departmanının serisinin adı), `kaynak`, `durum`, `oyunda_kullanilabilir`. Pay genellikle burada yazılmaz, Veri'nin serisinden `veriAnahtari` ile okunur. Anahtar biçimi: `kurum.seri.alt` (ör. `tuik.evlenme.ilkEvlilikYasOrt`). **Şu an yazılan anahtarlar öneridir**; ortak anahtar listesi Veri departmanıyla birlikte `data/` altında tanımlanacak.

## Başlıklar ve ne işe yaradıkları

| Başlık (JSON anahtarı) | Ne yazılır | Oyunda nerede kullanılır |
|---|---|---|
| `meta` | Ülke kodu, adı, katman, bölge, şablon sürümü, hazırlayan, denetim durumu | Her yerde |
| `kaynaklar` | Kullanılan bütün kaynaklar: ad, kurum, adres, yıl, erişim tarihi, lisans | Oyunda "kaynak" düğmesi |
| `yerelSayilar` | Ülkenin kendi istatistik kurumunun BM'den farklı verdiği önemli sayılar (ör. TÜİK doğum sayısı) | Bilgi kartları; çekilişte **kullanılmaz** |
| `dil` | Resmî dil(ler), yaygın konuşulan diller, hangi bölgede, okul dili dönemleri, dil yasakları/serbestlikleri | Ana dil, okul, göç olayları |
| `din` | Din ve mezhep dağılımı (resmî veri yoksa anket aralığı), devlet-din ilişkisi. Her kayıt bir `id` ve `ustGrup` taşır; bir topluluk yalnızca bir kayıtta yer alır (çift sayım yasak) | Aile inancı, bayramlar, evlilik, cenaze |
| `topluluklar` | Etnik, dilsel ve göçmen topluluklar: hangi diller, hangi dinler, hangi iç bölgeler, hangi isim havuzları, ağırlık. `havuzHazir: false` olan topluluk çekilişte kullanılmaz | Ailenin kimliğinin çekilişi (dil + din + köken + isim) |
| `egitim` | Dönemlere göre: zorunlu eğitim süresi, kademeler ve yaşlar, geçiş sınavları, okul türleri, yükseköğretim, eşitsizlik notları | Okul yılları, sınav karar anları |
| `askerlik` | Dönemlere göre: zorunlu mu, kim için, hangi yaşta, ne kadar süre, bedelli/muafiyet, vicdani ret | Genç erkek/kadın hayatında askerlik olayı |
| `emeklilik` | Dönemlere göre: sistem(ler), yaş ve prim şartları, büyük reformlar; kayıt dışı çalışanların durumu | Emeklilik yaşı, gelir, yaşlılık |
| `evlilikAile` | Yasal evlilik yaşı (dönemli), ortalama ilk evlilik yaşı, eşleşme biçimleri, törenler, nikah türleri, boşanma, aile yapısı, yaşlı bakımı, ilgili yasal durumlar | Aşk/evlilik karar anları, aile kişileri |
| `isimler` | İsim yapısı (ad, ikinci ad, soyadı kuralları) ve **isim havuzları**: cinsiyet × doğum on yılı × grup (bölge/etnik/dini) | Bütün kalıcı kişilerin adları |
| `meslekler` | Şehirde ve köyde yaygın meslekler, gelir dilimi, kayıt dışılık, dönemlere göre değişim | Anne-baba mesleği, oyuncunun işi |
| `konut` | Konut tipleri (şehir/köy, gelir, dönem) ve her biri için **görsel not** | Yaşayan sahne (Görsel departmanı) |
| `ulasim` | Araçlar, kimin kullandığı, hangi yıldan beri | Sahne, günlük hayat olayları |
| `saglik` | Sağlık sistemi dönemleri, sigorta türleri, şehir-köy erişim farkı | Hastalık/tedavi kararları, masraflar |
| `goc` | İç göç, dış göç, gelen göç örüntüleri: kim, nereden, nereye, hangi yıllar | Göç kararları, aile geçmişi |
| `tarihselOlaylar` | Savaş, çatışma, ekonomik kriz, afet, pandemi, darbe, toplumsal olaylar: yıl aralığı, tür, etkilenen bölge/gruplar, etki | Olay motoru (gerçek yıllarda tetiklenir) |
| `icBolgeler` | Ülke içindeki büyük bölgeler ve farkları (ekonomi, dil, din, doğurganlık, konut) | Doğum yeri, şehir/köy çekilişi |
| `gunlukHayat` | Bayramlar ve kutlamalar, geçiş törenleri (doğum, sünnet/vaftiz, cenaze), yemek, medya dönemleri, evcil hayvan kültürü | Anı kartları, sahne ayrıntıları |
| `hassasiyet` | Bu ülkede dikkatli işlenmesi gereken konular ve neden | Kalite denetimi |
| `acikSorular` | Profili hazırlayanın çözemediği, karar gerektiren konular | Devir notu |

## Alan alan ayrıntı

### Dönemli alanlar (`donemler`)
Eğitim, askerlik, emeklilik, evlilik yaşı ve sağlık sistemi dönem listesi olarak yazılır. Motor, oyuncunun **o yaşa geldiği yıl** hangi dönem geçerliyse onu kullanır. Örnek: 1985 doğumlu Türk erkeği 2005'te 20 yaşındadır; o yılki askerlik süresi uygulanır.

### İsim havuzları (`isimler.havuzlar`)
- Her havuz: `cinsiyet` (sadece `kadin` ya da `erkek`; iki cinsiyete ortak havuz yok, gerekirse iki ayrı havuz açılır), doğum yılı aralığı `yilBas`-`yilSon` (ör. 1980-1990 = 1980-1989 doğumlular), `topluluk` (`genel` ya da `topluluklar[].id`), `din` (`null` ya da `din.dagilim[].id`; dine özgü ek havuzlar için, ör. Alevi ailelerde sık görülen adlar), `isimler` listesi.
- Etnik köken, din ve göçmenlik **aynı alana karıştırılmaz**: köken `topluluk`, inanç `din` alanındadır.
- **Boş havuz kuralı:** Bir topluluğun havuzu boşsa `havuzHazir: false` olur ve motor o topluluğu çekilişte **hiç kullanmaz**. Sessizce "genel" havuza düşürmek yasaktır (o kimliği görünmez yapar).
- **Yedek havuz (`topluluklar[].yedekHavuz`):** Bazı topluluklar gündelik hayatta genel havuzdaki isimleri de yaygın kullanır. Bu durumda `yedekHavuz.havuz: "genel"` yazılır ve topluluk, genel havuzlar dolu olduğu sürece çekilişe hazır olabilir. Bu "sessiz düşürme" değildir: açıkça ve gerekçeyle (`gerekce`, `kaynak`, `durum`) beyan edilir.
  - **Varsayılan `null`'dır (yedek yok).** Gerekçe: Yanlışlıkla `genel` yapılan bir yedek, o topluluğun kendine özgü isimlerini oyundan sessizce siler. Bu, Kalite'nin uyardığı "tek hikâye" hatasının ta kendisi. Bir topluluğun çekilişe geç girmesi, yanlış isimle girmesinden daha az zararlı. Bu yüzden `genel` yazmak gerekçe ister, `null` istemez.
  - Kendi havuzu dolunca yedek kaldırılabilir ya da iki havuz oranla karıştırılır (oran: Anlatı/Simülasyon kararı).
  - Doğrulama scripti: `havuzHazir: true` ancak kendi havuzları doludur **ya da** yedek `genel`dir ve bütün genel havuzlar (`topluluk: genel`, `din: null`) doludur (kural K6). Dine özgü EK havuzlar (ör. `din: alevi`) genel havuz sayılmaz; boş kalmaları yedeği engellemez.
  - Yedek `genel` için kanıt örneği (Türkiye): NVİ'nin il bazında en çok kullanılan adlar listesi. Bir topluluğun yoğun yaşadığı illerde en sık adlar genel havuzdaysa yedek kaynaklı sayılır; ama bu il düzeyinde bir kanıttır, notta sınırı yazılır.
- Bir havuzda en az 30 isim olmalı (orijinal oyundaki "herkesin adı Raif" sorunu). Örnek dosyada ilk 10'lar var; Anlatı ve İçerik ile birlikte genişletilecek. Doğrulama scripti 30'un altını uyarı olarak gösterir.
- Topluluklar ülkenin gerçek çeşitliliğine göre açılır, karikatür olmadan. Topluluğun ağırlığı `topluluklar[].agirlik` içindedir; resmî veri yoksa `durum: tahmin`.
- **Kaynak sırası:**
  1. Ülkenin resmî kurumunun **doğum yılına göre** isim listeleri (ör. Türkiye'de Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü'nün on yıllık listeleri, TÜİK bebek isimleri). Doğum yılı boyutu sadece buradan gelir.
  2. `sigpwned/popular-names-by-country-dataset` (lisans CC0, serbest). Ülkeye göre yaygın ad ve soyadları var ama **doğum yılı boyutu yok**; bu yüzden sadece K2/K3 ülkelerde ve K1'de eksik grupları tamamlamak için kullanılır, K1'de resmî listeyle birlikte kullanılır.
  3. Akademik çalışmalar (ör. azınlık isimleri üzerine).
- **YASAK:** `philipperemy/name-dataset` kullanılmaz. Sebep: 533 milyon hesaplık Facebook sızıntısından üretilmiş; sızdırılmış kişisel veriden yararlanmıyoruz (bkz. `docs/ARASTIRMA-ARACLAR.md`, bölüm B).
- Gerçek kişileri çağrıştıracak ad+soyad birleşimleri (ünlüler, siyasetçiler) motor tarafından engellenmeli (açık soru: Anlatı/Kalite).

### Tarihsel olaylar (`tarihselOlaylar`)
Her olay:
- `id`, `ad`, `yilBas`, `yilSon`
- `tur`: `savas` / `catisma` / `ekonomikKriz` / `afet` / `pandemi` / `darbe` / `siyasi` / `toplumsal` / `goc`
- `kapsam`: `ulusal` ya da etkilenen iç bölgelerin listesi (`icBolgeler` kimlikleriyle)
- `etkilenenGruplar`: ör. "genç erkekler", "memurlar", "Rum toplumu", "deprem bölgesindeki herkes"
- `etki`: ekonomi / sağlık / eğitim / göç / güvenlik / gündelik hayat üzerine kısa notlar
- `oyunNotu`: motor ve Anlatı için öneri (ör. "Bu yıllarda 18-25 yaş erkeklerde askerlik olayı çatışma bölgesi riskini taşır")
- `olcek`: rakam **listesi** (ölü, yaralı, enflasyon...); her rakam kendi `kaynak`, `durum`, `yil` ve `oyunda_kullanilabilir` alanını taşır. Rakam yoksa boş liste.
- `tur` seçenekleri sabittir; bir olayın türü tartışmalıysa `atakan_karari_bekliyor` ile işaretlenir.
- `hassasiyet`: varsa
- Olaylar Veri departmanının kaynaklarıyla eşleşmeli (departman kuralı). Ekonomik krizlerin oyundaki gerçek etkisi (enflasyon, işsizlik) Veri'nin yıllık serilerinden gelir; burada sadece olayın adı, yılı ve niteliği yazılır.

### İsteğe bağlı alanlar (2026-11-26 eklendi)
Bu alanlar zorunlu değildir; eski profiller bunlar olmadan da şemadan geçer.
- **`tarihselOlaylar[].adlandirma`** (KARAR 17): Adı tartışmalı olaylarda doldurulur. `oyunMetni`: oyunda gösterilen tarafsız "yıl + ne oldu" cümlesi. `tarafAdlari`: her tarafın kullandığı ad ve kimin kullandığı (en az bir kayıt). Kendi `kaynak`, `durum`, `oyunda_kullanilabilir` alanı var; olayın durumu bundan güçlü olamaz. Oyun hiçbir adı kendi sesiyle benimsemez; adlar ayrıntı sayfasında birlikte gösterilir.
- **`din.dagilim[].tanimlamaSecenekleri`** (KARAR 18): Bu kayıttaki bir karakterin kendini nasıl tanımlayabileceği (ör. Türkiye'de Alevi kaydı: "Alevi", "Müslüman", "Alevi ve Müslüman"). Kayıt tek kalır, çift sayım olmaz; oyunda karakterin kendi tanımı gösterilir.
- **`evlilikAile.kadinHayati`**: Kadın hayatına dair kaynaklı doku (çalışma, ev içi iş bölümü, şiddet; şiddet sahnesi gösterilmez). Rakamlar ayrıca `yerelSayilar`'a yazılır.
- **`gunlukHayat.toplulukKulturu`**: Bir topluluğun gündelik kültürü (müzik, sözlü gelenek, medya...). `topluluk` alanı `topluluklar[].id` olmalı (script denetler). Amaç: bir topluluğu yalnızca yasak, çatışma ya da göç üzerinden anlatmamak.
- **`askerlik`, `emeklilik`, `egitim` dönemlerinde `not`**: Hangi kaynağın neyi doğruladığı ve dönemin sınırları.
- **Olayların yıl sınırı:** Olaylarda `yilSon` olayın son yılıdır (dahil; ör. 1974-1974). Dönemli alanlardaki "yilSon hariç" kuralı olaylara uygulanmaz.

### Askerlik süre türleri (`askerlik.donemler[].sure`, ay cinsinden)
- `er`: standart süre (o dönemde lise ve altı mezunlar ya da genel durum).
- `kisaDonem`: o dönemde yükseköğrenim mezunlarının yedek subay olmadan yaptığı kısa süre (ülkede varsa).
- `yedekSubay`: lisans mezunlarının yedek subay olarak yaptığı süre.
- `yedekAstsubay`: önlisans mezunlarının yedek astsubay süresi.
- `bedelliTemelEgitim`: bedel ödeyenin yaptığı temel eğitim süresi.
Hangi türün kime uygulandığı her ülkenin `notlar` alanına yazılır. Şemada başka anahtar kabul edilmez; yeni bir tür gerekirse şema güncellenir.

### Konut ve görsel notlar
Her konut tipinde `gorselNot`: Görsel departmanının sahneyi çizebileceği kadar somut (kat sayısı, malzeme, çatı, iç mekânda neler var). Klişe değil, sıradan gerçek hayat.

### İç bölgeler
Mümkünse ülkenin resmî istatistik bölge sistemi kullanılır (ör. Türkiye'de İBBS Düzey 1, 12 bölge), çünkü Veri departmanı bölgesel rakamları bu sistemle bulabilir.

## Doldurma sırası (öneri)
1. `kaynaklar` ve `meta`
2. Dönemli kurallar: `egitim`, `askerlik`, `emeklilik`, `evlilikAile.yasalYas`
3. `isimler` (en çok iş isteyen kısım)
4. `tarihselOlaylar`
5. Geri kalanlar
6. `hassasiyet` ve `acikSorular`
7. `python3 -I scripts/validate_countries.py` ile doğrulama (0 hata), sonra Kalite'ye teslim.
