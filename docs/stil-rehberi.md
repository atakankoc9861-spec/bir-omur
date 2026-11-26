# Stil Rehberi: Yaşayan Sahne (v0.3)

Görsel ve Arayüz departmanı · 2026-11-26 · v0.2: Kalite denetimi düzeltmeleri; v0.3: yeniden denetim (Y1-Y5) düzeltmeleri (docs/denetim/2026-11-26-gorsel.md). Görsel yön onaylı (karar #19).
Bağlı kararlar: KARARLAR.md #6 (yaşayan sahne), #10 (çizimler kodla üretilir, yöntem bu departmanda).

Bu belge sahnenin **nasıl** çizildiğini sabitler. Yeni bir bölge kiti, eşya ya da ekran yapan herkes buna uyar. Değiştirmek için önce bu belge güncellenir.

---

## 1. Yöntem kararı

**Seçilen yöntem: kendi küçük piksel tamponumuza kodla çizim.**
Sahne 160 × 120 piksellik bir bellek alanına (tampon) TypeScript koduyla, piksel piksel çizilir. Bitince tek hamlede ekrandaki canvas'a basılır ve tarayıcı bunu keskin kenarlı olarak büyütür.

Hazır resim dosyası yok. Her çizim (ev, kanepe, insan, ağaç) bir fonksiyondur ve renklerini paletten alır. Aynı fonksiyon farklı renk, boy ve tohumla binlerce farklı sonuç verir.

### Neden bu yöntem?

| Seçenek | Neden seçilmedi / seçildi |
|---|---|
| **Piksel tamponu (seçildi)** | Her cihazda birebir aynı görüntü. Bilgisayarda (Node) da çalıştığı için binlerce sahneyi otomatik test edebiliyor, PNG'sini üretip bakabiliyoruz. Ekrana basmak tek işlem; düşük güçlü telefonda bile hızlı. Hiçbir dış kütüphane gerekmiyor. |
| Canvas'a doğrudan çizim komutları | Tarayıcı kenarları yumuşatıyor (piksel sanat bulanıklaşıyor), cihazdan cihaza fark var, Node'da test etmek için ayrı kütüphane gerekiyor. |
| SVG | Vektör; piksel sanat görüntüsü zor, yüzlerce öğe olunca telefonda ağırlaşıyor. |
| WebGL | Bu iş için fazla; bazı ucuz telefonlarda sorunlu, test etmesi zor. |
| Hazır sprite (resim) dosyaları | Karar #10'a aykırı. Ayrıca her bölge × yaş × gelir için ayrı çizim gerekirdi. |
| Yapay zekâ ile üretilmiş görsel | Karar #10'a aykırı; tutarlılık ve tekrar kontrolü zor. |

### Wave Function Collapse (WFC) kararı

Yapımcının önerdiği WFC (JS uyarlaması `kchapelier/wavefunctioncollapse`) incelendi. **Lisansı MIT, kullanıma uygun** (2026-11-26'da GitHub'daki LICENSE dosyasından kontrol edildi).

**Şimdilik kullanılmıyor.** Gerekçe:
- WFC ızgara (karo) tabanlı haritalar için güçlü. Bizim sahnemiz ise önden görünüşlü küçük bir "diorama": 8-15 eşya, 3 duvar bölgesi, birkaç oturma yeri. Bu boyutta kural tabanlı yerleşim daha basit ve daha hızlı.
- Bizim için "mantıklı" olan şeyler anlamsal: kanepe duvara dayanır, masa insanların önündedir, bebek annenin kucağındadır, fener elektrik olmayan evdedir. Bunları WFC komşuluk kurallarıyla anlatmak zor; doğrudan kodla yazmak kolay ve denetlenebilir.
- WFC bazen çelişkiye düşüp yeniden başlar; süresi tahmin edilemez. Düşük güçlü telefonda istemiyoruz.

**İleride kullanılabilecek yer:** Üstten görünen köy/mahalle haritası, "yaşam haritası" ekranı ya da büyük şehir siluetleri. O iş gelince yeniden değerlendirilecek.

`world-atlas` (Natural Earth 110m, lisans ISC) doğum anındaki dünya haritası ve yaşam atlası için uygun; sahneye girmez, harita ekranı yapılırken eklenecek.

---

## 2. Çözünürlük ve piksel ölçeği

- **Sahne:** 160 × 120 mantıksal piksel (4:3), ekranın üstünde, tam genişlikte.
- **Büyütme:** Yalnız **tam sayı katı**. 1080 px genişlikte ×6 (960 px), 720 px ×4 (640 px), 390 px ×2 (320 px). Artan kenar boşluğu siyah kalır. Kesirli büyütme pikselleri eşitsiz gösterir (denetim S7). CSS `image-rendering: pixelated`.
- **Metin sahnenin altında**, sahnenin içine yazı yazılmaz.
- **Işık yönü:** Sol üstten. Her nesnenin sağ ve alt kenarı koyu, üst kenarı açık.
- **Kontur:** "Seçici kontur": insan ve eşyaların dış kenarı, komşu rengin çok koyu ve hafif morumsu hali. Düz siyah kontur kullanılmaz.
- **Gölge rengi** hafif mora, **ışık rengi** hafif sıcağa kayar (`color.ts` → `darker`, `lighter`).
- **Noktalama (dither):** Sadece gökyüzü degradesi ve dokularda (sıva, toprak, yaprak). Işıkta kullanılmaz; denemede bütün yüzeyi kumlu gösterdi.

---

## 3. Renk paletleri

### Ortak
- **Ten:** 10 basamak, açıktan koyuya (`palette.ts → SKIN`). Her bölge kendi ağırlıklarını verir, hiçbir bölge tek tona indirgenmez. Aile üyeleri hane tonunun ±1 basamağında.
  - Akdeniz kiti: ağırlıklı 1-5. basamak (5-6 da var).
  - Batı Afrika kiti: ağırlıklı 5-9. basamak (4 de var).
- **Saç:** Yaşla grileşir. Kişiye özel başlama yaşı 38-56 arası, ~28 yılda tam beyaz.

### Gün saati (gökyüzü ve ortam ışığı)

| Saat | Gökyüzü | Dış ortam ışığı (R,G,B çarpanı) | İç ortam ışığı |
|---|---|---|---|
| Şafak | lacivert → leylak → şeftali | 0,86 / 0,80 / 0,84 | 0,66 / 0,62 / 0,68 + pencere |
| Gündüz | mavi → açık mavi | 1 / 1 / 1 | 0,86 / 0,84 / 0,82 + pencere |
| Akşam | mor → gül → turuncu | 0,98 / 0,74 / 0,62 | 0,70 / 0,58 / 0,54 + pencere |
| Gece | koyu lacivert, yıldız, ay | 0,34 / 0,38 / 0,56 | 0,34 / 0,32 / 0,40 + lambalar |

Hava durumu gökyüzünü değiştirir: kapalı/yağmur/kar gri gökyüzü, **harmattan** kum rengi pus.
Gece iç mekânda ışık kaynağı gelire ve elektriğe göre değişir: tavan ampulü, avize, yer lambası, **fener** (elektriksiz köy evi), soba ateşi, TV ışığı.

### Görsel profiller ve kaynaksız oranlar

Bir kit birden fazla **görsel profil** taşıyabilir. Profil, kitin hangi oranlarla çizileceğini belirler: ten ağırlıkları, başörtüsü, geleneksel giysi, kırsalda elektrik, kerpiç ev eşiği, kar.
**Bu oranların hepsi tek dosyada: `src/scene/gorsel-ayar.ts`.** Her biri "YOK — geçici görsel ayar, ülke profilinden gelecek" diye işaretli. Kitlerin içinde demografik oran yazılmaz (test bunu `kaynak` alanıyla denetler).

| Profil | Kit | Kullanıldığı ülkeler | Durum |
|---|---|---|---|
| dogu-akdeniz | Akdeniz | TUR, LBN, SYR, JOR, PSE, EGY, LBY, TUN, DZA, MAR | tam |
| dogu-akdeniz | Akdeniz | IRQ, Körfez, IRN, AZE | geçici |
| guney-avrupa | Akdeniz | ITA, ESP, PRT, GRC, MLT, CYP, HRV, MNE | geçici (kendi alt kiti yok) |
| dusuk-basortusu-gecici | Akdeniz | ISR, ALB, ARM, GEO | geçici; adı bilerek bölge adı değil (bir ülkeyi bir bölgeye "atamasın") |
| bati-afrika | Batı Afrika | R01'in 13 ülkesi | tam |
| sahel-gecici | Batı Afrika | R02 (MLI, NER, BFA, TCD, MRT, SDN) | geçici |
| yedek | (çağıranın seçtiği) | kiti olmayan her ülke, **yalnız açıkça istenirse** | yedek |

Kiti olmayan ülke (ör. Hindistan) sessizce bir kite düşmez: `sceneStateFromLife` hata verir, çağıran `fallbackRegion` vermelidir. O zaman sahne nötr "yedek" profille çizilir ve `kitStatus = "yedek"` olur (arayüz bunu gösterebilir).

### Bölge kitleri

**Akdeniz ve Orta Doğu (`kits/akdeniz.ts`)**
- Duvar: krem, kırık beyaz, açık hardal, açık mavi, mint, şeftali; eski evlerde alt kısmı farklı boyalı duvar (yeşil, mavi).
- Cephe: badana, hardal, toprak tonları; panjur yeşil, mavi, kahverengi.
- Zemin: pişmiş toprak karo, mozaik (terrazzo), parke, beton.
- Doku: kilim desenleri, dantel örtü, saksıda sardunya (teneke ya da toprak saksı), çay takımı.
- Çatı: kiremit ya da düz çatı + su deposu + güneş enerjili ısıtıcı + çanak anten. Balkonda çamaşır ipi.

**Batı Afrika (`kits/bati-afrika.ts`)**: Dünya ve Kültür'ün R01 bölgesi.
- Duvar: pastel yeşil, gök mavi, krem, leylak, şeftali; alt kısmı koyu boyalı. Köyde kerpiç (sıcak toprak tonları).
- Kumaş: balmumu baskı (wax print) desenleri: elmas, zikzak, nokta, çizgi. Renkler canlı ama doygunluğu biraz kırılmış.
- Eşya: plastik sandalye, emaye kaseler (renkli), toprak su küpü, vitrin, ayaklı vantilatör, klima (varlıklı ev), aile fotoğrafları.
- Dış: avlu duvarı ve demir kapı, oluklu sac çatı, kara plastik su tankı, elektrik direği ve teller, dükkân kulübesi, motosiklet, mango/neem ağacı. Köyde kerpiç ev, saman çatılı yuvarlak ambar, örme çit, havan, keçi ve tavuk.
- İklim: yaz = yağmur mevsimi (ıslak toprak, yeşillik), kış = harmattan (pus). Kar yok.

---

## 4. Karakter boyu ve yaşa göre değişim

Tüm insanlar önden çizilir, aynı yüz yapısıyla (iki göz, ağız). Bölgeye göre yüz çizimi **değişmez**; fark ten, saç, kıyafet ve başlıktadır. Karikatür özellik (abartılı dudak, burun vb.) yasak.

| Evre | Yaş | Boy (piksel) | Baş | Notlar |
|---|---|---|---|---|
| Bebek | 0-1 | 10 (oturan) / yatar | 5×5 | Kucakta, sırtta (Batı Afrika'da bez ile), beşikte ya da hasırda. Uyuyan gözler. |
| Küçük çocuk | 2-3 | 15 | 6×6 | Başı gövdeye göre büyük. |
| Çocuk | 4-8 | 19 | 7×7 | Yanak kızarıklığı, yerde oturup oynar. |
| Ergenlik öncesi | 9-12 | 24 | 7×7 | Okul saatinde dışarıdaysa okul forması. |
| Genç | 13-17 | 28 | 7×8 | Ders çalışır (kitap), dışarıda oynar. |
| Yetişkin | 18-61 | 31 | 7×8 | Kadın gövdesi 8, erkek 9 piksel geniş (45 yaştan sonra +1). Bıyık/sakal olasılığı. |
| Yaşlı | 62+ | 29 (78+: 28) | 7×8 | Gövde +1 geniş, boyun yok, baş 1 piksel aşağı (78+ yaşta 2: belirgin kambur), 72+ yaşta omuzlar düşük. Ayaktayken baston olasılığı 62-69: %15, 70-79: %60, 80+: %85 (görsel ayar). Sağlık 35'in altındaysa oturur, dizinde battaniye; ayakta kalması gerekirse bastonla. |

**Saçtan bağımsız yaş izleri** (başörtülü yüzde de görünür; denetim O2): 35+ göz altı, 48+ alın çizgisi, 55+ ağız kenarı ve çene hattı, 68+ yanak çökmesi.

**Koyu ten kuralları** (denetim Y2; ten parlaklığı < 0,30): yaş izleri koyulaştırılarak değil **hafif ışıkla** çizilir; göz pikseli daha koyu (#050302) ve üstünde ince açık göz kapağı; gözlük çerçevesi açık gri değil koyu altın. Sakal göz hizasından başlamaz, yanak satırı açık kalır; bıyık ortada 3 piksel. Amaç: ak saç/sakal yüzü çerçeveleyip "maske" gibi göstermesin. Örnek: `docs/gorsel-ornekler/yasli-erkek-koyu-ten.png`.

**Başlık–ten kontrastı** (denetim Y4): başörtüsü/başlık rengi tene çok yakınsa (RGB farkı < 110) tenden uzaklaştırılır (`ensureHeadContrast`). 42-69 arası şakaklar saçın geri kalanından önce grileşir. Örnek: `docs/gorsel-ornekler/yas-seridi-kadin.png` (20-88 yaş, başörtülü ve başı açık, iki bölge). 7 piksellik yüzde 20-30 farkı bilerek yok; 25 / 40 / 55 ve yaşlılık ayrılır.

**Oyuncu işareti (deneme):** `renderScene(..., { marker: true })` oyuncunun başının üstüne 5×3 piksellik sarı, koyu konturlu küçük bir ok çizer. **Varsayılan kapalı.** Açılıp açılmayacağına Atakan karar verecek. Örnek: `docs/gorsel-ornekler/12-oyuncu-isareti-acik.png`.

**Kimlik sabit, kıyafet değişken:** Bir kişinin teni, saç rengi, yüz özellikleri ve gözlüğü hayat boyu aynı kalır (kimlik tohumu). Kıyafeti her sahnede yeniden seçilir (sahne tohumu). Saç modeli yaş evresi değişince değişebilir.

**Giyim kuralları:** Gelir 1'de renkler biraz solgun ama kıyafet temiz ve düzgündür; yırtık/yamalı çizim yok. Kış ve harmattan sabahları ceket/hırka. Başörtüsü ve geleneksel giysi **hane bazlı bir olasılıktır**, bölgenin tamamına verilmez. Bu olasılıklar şu an görsel çeşitlilik ayarıdır, istatistik değildir (bkz. Bölüm 8).

---

## 5. Katman sırası

Sahne her zaman bu sırayla çizilir (`render.ts`):

1. **Zemin**: gökyüzü, uzak tepeler/deniz/kent siluetleri, toprak, kaldırım, iç mekânda yer döşemesi. Islak zemin, su birikintisi ve kar da zeminin parçasıdır.
2. **Bina**: duvarlar, cepheler, çatılar, pencereler, kapılar.
3. **İç mekân / eşya**: mobilya, duvar süsleri, araçlar, ağaçlar, hayvanlar. (1-3 bölge kitinin `build` fonksiyonundadır ve bu sırayı korur.)
4. **İnsanlar**: arkadan öne (ayak satırına göre) sıralı. Evcil hayvan.
   - **4b. Ön eşya**: insanların önüne düşen masa, sofra, ortak yemek kabı, havan.
5. **Hava / mevsim**: harmattan pusu (uzak daha soluk). Yağmur, kar ve toz parçacıkları her karede ayrıca çizilir.
6. **Işık**: gün saati ortam rengi + nokta ışıklar (pencere, ampul, fener, ateş, sokak lambası, TV). Gökyüzü, yanan pencere ve ekran kendi ışığını yayar, karartılmaz.

---

## 6. Çeşitlilik kuralları ("aynı sahne tekrar etmez")

`director.ts → SceneDirector` her yıl için bir sahne planı seçer.

1. **Sahne imzası:** mekân + etkinlik + hava + gün saati + mevsim + yaş evresi + gelir + şehir/köy + dizilim sınıfı (8 sınıf). Aynı hayatta aynı imza iki kez kullanılmaz. Görülen imzalar kayıt dosyasına yazılabilir (`director.history`).
2. **Art arda aynı etkinlik yok** (dinlenme, yemek, ev işi/ders, yürüyüş, kapı önü, oyun, pazar).
3. **Ev ve dışarı dönüşümlü** olma eğiliminde. Sağlığı çok düşük karakter çoğunlukla evdedir.
4. **Ev kimliği:** Gelir dilimi ve şehir/köy değişmedikçe ev aynı kalır (duvar rengi, zemin, pencere, perde, kanepe rengi). Gelir veya yerleşim değişince "taşınılmış" olur, yeni ev çizilir. Böylece çeşitlilik tutarlılığı bozmaz.
5. **Yaşayan ayrıntılar:** Vefat eden aile üyesi duvarda siyah kurdeleli fotoğraf olarak kalır. Yaşayanların fotoğrafları duvarda. Bebek varsa kucakta ya da beşikte. Dönem eşyaları yıla göre: 1975 öncesi radyo, 2008'e kadar tüplü TV, sonra düz ekran; arabaların biçimi yıla göre.
6. **Kimin sahnede olduğu:** Aynı evde yaşayanlar (motor `livesTogether` vermezse yaş ve rolden tahmin). Dışarıda ailenin bir kısmı + yoldan geçenler, satıcı.
7. **Görüntü benzerliği (denetim O1):** İmza tek başına yetmez; farklı imzalı iki kare gözle aynı olabilir. Oyun `SceneDirector.compose()` kullanır: her aday çizilir, 80×60 küçük resme indirilir ve bu hayatta gösterilen **her** kareyle karşılaştırılır. Küçük resim 40×30 (4×4 ortalama). Belirgin farklı piksel oranı %14'ün altındaysa aday reddedilir; en çok 5 deneme, en iyisi %9'un altında kalırsa en çok 3 ek deneme (nadir). Karşılaştırma eşik aşılınca erken kesilir. Ölçüm (16 hayat × 91 yaş): önceki herhangi bir kareye %8'den çok benzeyen kare **0** (önce %11-17); en benzer çift %8,4. Küçük resimler kayıt dosyasına yazılabilir (kare başına 3,6 KB).
8. **Test garantisi:** `tests/scene.test.ts` 0-95 yaş boyunca imzaların tekrar etmediğini ve 0-90 yaş boyunca hiçbir karenin öncekilerden birine %8'den fazla benzemediğini doğrular.

---

## 7. Onur, kültür ve hassasiyet kuralları

- **Yoksul ev de canlı ve onurlu çizilir:** kilim, çiçekli saksı, renkli emaye kaseler, örtülü raf, aile fotoğrafları, fenerin sıcak ışığı. Pislik, çöp, yıkıntı, yırtık giysi çizilmez.
- **Bölge tek hikâyeye indirgenmez:** Batı Afrika kitinde varlıklı şehir evi (klima, vitrin, iki katlı ev, araba) da var. Akdeniz kitinde köy evi de, apartman da var.
- **Ağır konular sahnede gösterilmez** (hastalık, şiddet, savaş, ölüm anı). Sahne yalnızca sonuçlarını sessizce taşır: boş kalan yer, duvardaki fotoğraf, battaniye.
- **Dini semboller şimdilik sahnede yok** (cami, kilise, ibadet eşyası). Eklenip eklenmeyeceği Atakan'a soruldu.
- **Bebek ve çocuklar** her zaman bir yetişkinin yanında ya da güvenli yerdedir (kucak, beşik, hasır). Kodda kural (`cast.ts`, denetim K1):
  - 6 yaş altı biri dışarıdaysa aileden 16+ yaşında biri mutlaka sahnede olur; küçük çocuk ona en yakın yere konur.
  - 2 yaş altı bebek dışarıda daima bir aile büyüğünün kucağında ya da sırtındadır.
  - Hanede böyle bir büyük yoksa yönetmen sahneyi eve alır (`place: "outside"` istense bile).
  - Asfalt yolda insan yeri yoktur; insanlar kaldırımda/yol kenarında durur.
- **Oyuncu her sahnede ve ekranın içinde görünür** (denetim K2, Y1). Sahne dışına taşan yuvalar (x < 8 ya da x > 152) hiç kullanılmaz; kapı önü sandalyeleri kenara yakın kapıya konmaz. Uygun yuva yoksa boş bir yuvaya, o da yoksa önde yeni bir yere konur; sağlığı düşükse oturur, oturacak yer yoksa bastonla ayakta durur. Bebekse taşınır ya da güvenli bir yere konur.
- **Yoldan geçenler** arka plandadır: kimsenin üstüne binmez, havaya doğru hafif soluk çizilir, 14 yaştan küçük olmaz.
- **Yüzler herkes için aynı yapıda**; fark sadece ten, saç ve kıyafette.
- Orijinal oyunun (1in8b.life) görselleri incelenmedi ve taklit edilmedi.

---

## 8. Veri ve kaynak notu

Sahnedeki demografik olasılıklar (ten ağırlıkları, başörtüsü, geleneksel giysi, kırsalda elektrik, kerpiç ev, kar) **oyuncuya gösterilen istatistik değildir**, ama dünyayı nasıl gösterdiğimizi belirler. Bu yüzden:
- Hepsi `src/scene/gorsel-ayar.ts` içinde toplanır ve "YOK — geçici görsel ayar, ülke profilinden gelecek" diye işaretlidir.
- **Oyuncuya çıkmadan önce** Dünya ve Kültür'ün kaynaklı ülke/bölge profilleriyle değiştirilmelidir (Kalite şartı).
- Kitlerde kalan küçük olasılıklar (gözlük, bıyık, ceket, perde deseni) demografik iddia değil, stil çeşitliliğidir.

---

## 9. Performans bütçesi

| Ölçü | Bütçe | Ölçülen (2026-11-26, masaüstü Node, ısınmış) |
|---|---|---|
| Bir sahnenin tam çizimi | Düşük güçlü telefonda ≤ 50 ms | masaüstü ort. **2,3 ms** (v0.3: ışık geçişi bayt dizisi üzerinde ve ışık başına sınır kutusuyla, 2,16 → 0,60 ms). **Gerçek cihazda ölçülmeli.** |
| Yıllık sahne hazırlama (compose: görsel tekrar kontrolü dahil) | Düşük güçlü telefonda (Chrome, işlemci 6 kat yavaş) **en kötü ≤ 250 ms** | v0.3 ölçümü, önizleme sayfasında 0-90 yaş, iki bölge, değişken ve sabit mevsim/saat: ort. **15-24 ms**, p95 36-50 ms, **en kötü 63 ms** (v0.2: ort. 288, en kötü 600). Açılıştaki soğuk ilk hazırlama 96-150 ms. Normal hızda ort. 2-3 ms. Gerçek Android cihazda hâlâ ölçülmedi. |
| Animasyon karesi (yağmur/kar/toz) | ≤ 2 ms, 12 kare/sn | **0,011 ms** |
| Bellek | < 0,5 MB | Tampon 77 KB + kopya 77 KB |
| Önizleme dosyası | < 150 KB | 86 KB (tüm kod gömülü) |

Kurallar:
- Sabit kare bir kez çizilir. Sadece yağan/uçuşan bir şey varsa 12 fps animasyon çalışır; açık havada hiç döngü yoktur.
- Sayfa arka plana geçince animasyon durur.
- Çizimde nesne oluşturma azdır; karakter başına bir küçük geçici tampon.
- Kalıcı kontrol: `tests/scene.test.ts` masaüstünde ortalama < 25 ms şartını arar. Önizleme sayfası her çizimin süresini ekranda gösterir; telefonda bakılabilir.

---

## 10. Dosyalar ve yeni kit ekleme

```
src/scene/
  types.ts        Sahne durumu ve plan tipleri
  color.ts        Renk yardımcıları (gölge, ışık, kontur)
  raster.ts       Piksel tamponu, karakter tamponu, çizim ilkelleri
  palette.ts      Ten, gökyüzü, ortam ışığı, tohum (hash)
  light.ts        Işık katmanı
  people.ts       İnsan figürleri (yaş evreleri, saç, başlık, kıyafet, pozlar)
  props.ts        Ortak eşya ve çevre çizimleri
  kits/common.ts  Kit arayüzü, gökyüzü/manzara yardımcıları
  kits/akdeniz.ts, kits/bati-afrika.ts
  director.ts     Sahne seçimi, imza ve görüntü benzerliğiyle tekrar önleme
  cast.ts         Kim evde, kim kimin yanında (çocuk güvenliği kuralı)
  gorsel-ayar.ts  GEÇİCİ GÖRSEL AYAR: tüm kaynaksız oranlar tek yerde
  render.ts       Katmanları birleştirme, insan yerleşimi, hava, oyuncu işareti
  view.ts         Tarayıcıda canvas'a basma ve animasyon
  fromLife.ts     Motorun Life nesnesinden sahne durumu; ülke → kit eşlemesi
  preview.ts      Önizleme sayfasının kodu (demo aile üretici içerir)
scripts/render-samples.ts   PNG örnekleri (npm run sahne:ornek)
scripts/build-preview.mjs   prototype/sahne.html (npm run sahne:onizleme)
```

**Yeni bölge kiti eklemek için:** `RegionKit` arayüzünü uygulayan bir dosya yaz (`household`, `look`, `weatherWeights`, `activities`, `petColor`, `build`). `build` iç mekân, şehir ve köy için 1-3. katmanları çizer ve insan yerlerini (`Slot`) döner. Her kit en az: 1 şehir dış, 1 köy dış, 1 iç mekân; en az 2 gelir seviyesi farkı. Sonra `kits/index.ts` ve `fromLife.ts` eşlemesine ekle, `npm run sahne:ornek` ile PNG'lere bak, testleri çalıştır.

---

## 11. Yazı tipi

Şimdilik cihazın sistem yazı tipi (Türkçe karakterler sorunsuz, ek dosya yok). Piksel yazı tipi kullanılıp kullanılmayacağı açık soru.
