# Devir Notu · Demo ekibi (Anlatı + Görsel/Arayüz + Simülasyon) · Sohbet demosu "dem" · 2026-11-26

Bağlı kararlar: #34 (MVP-0 beğenilmedi), #35 (telefon/mesajlaşma yönü, tek yıllık YKS demosu).

## Ne yapıldı
- **Uygulamanın adı: `dem`** (çay demi + "an, zaman"). WhatsApp'tan hiçbir şey yok: yeşil yok, logo yok; koyu sıcak zemin, kehribar–mercan vurgu, çay bardağı simgeleri.
- **Oynanış:** Eylül 2026 → Ağustos 2027, ay ay. Her ay mesajlar kendi kendine akar (yazıyor…, bildirim şeridi, okunmamış sayısı, okundu tikleri). Ayda 3-4 **akşam** var (kafede çalışırsan bir eksik). Her cevap bir akşam; kalan akşamlar derse gider. "Telefonu bırak" ile ay kapanır.
- **Cevapsızlığın iki türü:** hiç açmamak (okunmadı) ve açıp cevap vermemek (görüldü). İkincisi daha çok kırar; bazı kişiler gece yarısı "görüldü attın bi de 😐" gibi bir satır bırakır. Bağı düşen arkadaş küser, bir son mesaj atar ve yazmayı bırakır; sohbet listesinde soluklaşır.
- **Sohbetler:** Ailemiz (anne, baba, kardeş, teyze), Annem, Babam, kardeş, 12-C sınıf grubu (sessizde), en yakın arkadaş, kurstan ilgi duyulan kişi (ilişki ilerledikçe kayıtlı adı değişir), etüt arkadaşı, kafe patronu (isteğe bağlı iş), rehber öğretmen, Kurs Bilgilendirme (deneme sonuçları), Sınav Sonuç.
- **Doruklar:** Arkadaşın babasının işsiz kalması (yanına gitmek 2 akşam), kursu bırakması; Mart'ta herkesin düştüğü deneme; kardeşin "ödev bahane" mesajı; sınav sabahı aile grubu (dua, "hadi bakalım aslanım", kapıdan çıkarken çekilen fotoğraf); küs arkadaşın sınav sabahı yine "bol şans" yazması (barışma şansı); sonuç günü (puanın hemen ardından aile tepkisi); tercih akşamı (anne yakını, sevgili kendi şehrini, baba "önce sen söyle"); yerleştirme; **"O yıldan kalanlar"** ekranı (kim canlı, kim sustu; sonucun nedeni tek cümle).
- **Görseller:** Fotoğraflar `src/scene` motoruyla (kahvaltı, sofra, bayram, sınav sabahı, sınıf, çocukluk, ay geçişlerinde gece odası). Kodla çizilenler: fizik notu fotoğrafı, Moda'dan deniz ve vapur, teyzenin gül kartları (yazı HTML üstünde), 24×24 piksel profil resimleri, grup simgeleri.
- **İsimler:** `content/countries/TUR.json` havuzlarından (yalnız `oyunda_kullanilabilir: true`, NVİ). Oyuncu 2000'ler, anne-baba 1960/70'ler, kardeş 2010'lar.
- **Dosyalar:** `src/sohbet/` (motor.ts, icerik.ts, kadro.ts, gorsel.ts, arayuz.ts, stil.css, otomatik.ts, rng.ts), `scripts/build-sohbet.mjs`, `scripts/sohbet-dene.py`, `tests/sohbet.test.ts`. Çıktı: `prototype/sohbet-demo.html` (tek dosya, internetsiz, ~380 KB). Komut: `npm run sohbet:derle`. URL'de `?tohum=123` aynı yılı, `?hiz=5` hızlı akışı verir.
- **Testler:** typecheck ve tüm testler geçiyor. Demo testleri: 3 tarz × 30 tohum yıl sonuna ulaşıyor, aynı mesaj iki kez gelmiyor, çözülmemiş değişken yok, iki cinsiyette hitaplar doğru (oğlum/kızım, abi/abla, aslanım/aslan kızım), hep ders oynayan hep arkadaş oynayandan belirgin yüksek puan alıyor, fotoğraf/kart/portreler çiziliyor.

## Kendi test oyunlarımdan (başsız Chrome, 390×844)
- **Hep ders:** puan ~450-510. Yıl sonunda en yakın arkadaş ve etüt arkadaşı küs, ilgi duyulan kişi "Eylül'de bir fizik notu istemişti. O kadar." Sessiz bir ekran. İstenen his bu.
- **Hep arkadaş:** puan ~190-290, seneye tekrar; ama herkes canlı, arkadaşın babası işe girmiş. Akşamlar yetmediği için ilgi hikâyesi cevap sırasına göre kayabiliyor.
- **Karışık:** puan ~300-390, ortada; bazı ilişkiler sürüyor, bazıları susuyor.
- Ara notlarla düzeltilenler: teyzenin "çok akıllı kız" cümlesi oyuncuya söylenmiş gibi okunuyordu (komşunun kızı olduğu netleştirildi); ilk ipucu balonu listeyi kapatıyordu (alta taşındı); tercih akşamı cevapsız kalınca yüksek puanla "seneye tekrar" çıkıyordu (artık listeyi baba doldurur ve yıl sonunda nedeni bir cümleyle yazar); ay geçişi sahnesinde 18 yaş yetişkin/sakallı çiziliyordu (17 yaşla çiziliyor); puan kartından sonra aile ve arkadaş tepkileri hemen geliyor; sohbet açılınca eski mesajlarda kalma (fotoğraf yüklenince en alta kaydırma) düzeltildi; isim + ek uyumu hataları ("Samet'ı") ekten kaçınılarak giderildi.

## Bilinen zayıflıklar / kalanlar
- İçerik tek bir yıl için elle yazıldı (~65 an); ikinci oyunda olaylar aynı, sadece isimler, cinsiyet, şans ve senin seçimlerin değişiyor. Tekrar oynanabilirlik için her önemli an için 2-3 farklı olay gerek.
- Ses yok (karar #12'ye göre Ar-Ge işi). Bildirim yalnız görsel + telefonda kısa titreşim.
- Akşam bütçesi sıkı: ilk ayda 5 sohbetin 4'üne yetiyor. Atakan çok sıkı bulursa `motor.ts → budgetMax` tek satır.
- Puan ve netler karakterin kurgu sonuçları; gerçek sıralama/baraj yok, istatistik gösterilmiyor. Sınav günü ve sonuç tarihi verilmedi (doğrulanmadı).
- Ramazan/Kurban bayramı ayları 2027 için yaklaşık yerleştirildi (Şubat iftar, Mart bayram, Mayıs Kurban); kesin tarih yazılmadı.
- `oyna.html` (MVP-0) dokunulmadan duruyor; yeni demo ona bağlı değil.
- Kalite ve Hassasiyet + Oyun Testi departmanlarından henüz geçmedi (karar #35 ve CLAUDE.md #6). Özellikle bakılmalı: din içerikli satırlar (cuma kartı, dua, iftar) karikatüre kaçıyor mu; işsiz kalan baba hikâyesi.

## Atakan'a sorulacaklar
1. Uygulama adı `dem` olsun mu?
2. Akşam bütçesi (ayda 4) zorlayıcı mı, sinir bozucu mu?
3. Bu yön onaylanırsa: sıradaki adım ikinci bir yıl mı (üniversite ilk yıl / askerlik / ilk iş), yoksa aynı yılı daha çeşitli hâle getirmek mi?

---

## Tur 2 · Oyun Testi raporu (docs/test/2026-11-26-sohbet-demo.md) ve Yapımcı kararları sonrası

**Yapılanlar**
1. **Akşam ekonomisi:** Kısa/rutin cevaplar (≤24 karakter, tek satır, zaman almayan) **yarım bardak**; fotoğraf, sesli anlatım, buluşma, uzun cevap **tam**; "yanına gitmek" 2. Ayda 4 akşamın 1'i **kilitli**: ayın ortasındaki kriz (arkadaşın krizi, etüt arkadaşının çöküşü, ilgi duyulan kişinin mesajı, tercih akşamı...) gelince açılıyor ("Bir akşamı buna ayırmıştın."). Krizsiz ayda bütün mesajlar gelince açılıyor. Kriz anları ayın sonuna (at ≈ 0,7) taşındı.
2. **Durum paneli (karar 36-37):** Yukarıdan aşağı çekince (ya da üstteki tutamaca veya bardaklara dokununca) açılıyor. İçinde: akşamlar, ruh hâli (rakam ve kısa anlamı), uyku, bilgi (tahmini TYT net aralığı), cüzdan, hedef kartı (tahmini puan aralığı ve hedef bölüm için %), en yakın 5 kişi ve ↑/↓, "bu ay ne değişti". Hedef kartında açıkça yazıyor: "Tahmini, oyun içi: kurgu puan sistemi. Gerçek ÖSYM taban sıralamaları bu demoda kullanılmıyor." **Karar 38 (kaynaklı ÖSYM verisi) bu demoda karşılanmadı → Veri departmanına iş.** Ruh hâli düşükse sınav günü küçük bir stres cezası var (karar 37).
3. **Cevap izi:** Her cevaptan sonra "Kübra ↑ · ½ akşam" gibi kısa bir iz çıkıyor.
4. **İlişki için ikinci şans:** Mart'ta "çıkışta bi çay?", Nisan'da "biz neyiz?" sorusu. Kaybedilirse yıl sonunda nedeni tek cümleyle yazılıyor ("Şubat ayında 'sonra' demiştin. Sonra gelmedi." / "Mart ayında yazdı; okudun ama cevap vermedin.").
5. **Varyantlar:**
   - Aile tipi: muhafazakâr (cuma kartı, dua, iftar) ya da laik (pazar "günaydın" kartı, nazar boncuğu, mangal).
   - Hane: %30 ihtimalle baba ayrı yaşıyor. O zaman aile grubunda olmuyor, onun satırları özel sohbetten geliyor ve tercih akşamını anne yönetiyor.
   - Arkadaş krizi: babanın işsiz kalması ya da ailenin Kayseri'ye taşınması. İşsizlik yolunda arkadaşın babası işi kendisi de bulabiliyor (kurtarıcı aile klişesi kırıldı).
   - Her doruk anın iki biçimi var: ilk tanışma, Şubat 14, sınav sabahı (annenin satırları), sonuç akşamı (4 puan düzeyi × 2), tercih akşamını kimin açtığı.
   - "Saf soru" artık tek sınıf arkadaşında değil.
6. **Yıl sonu metinleri oyuncunun davranışına göre yazılıyor:** anneye cevap/ihmal sayısı, ayrı yaşayan baba, barışma, krizde yanında olmak, taşınma, laik/muhafazakâr teyze. "Grubu sessize aldın" yerine "Grup sessizde". "Listeyi baban doldurdu + seneye tekrar" çelişkisi giderildi.
7. **Arayüz:**
   - Bildirim şeridi artık başlığın altında; logo, bardaklar ve geri düğmesi açıkta.
   - Geri düğmesi 44×44.
   - Sahte "Mesaj" kutusu kaldırıldı ("Şu an cevap bekleyen bir şey yok.").
   - Aynı sohbete yeni soru gelince eskisi cezasız kapanıyor.
   - Cevap seçenekleri açılınca sohbet artık en alttan kaymıyor.
   - Çeviri kokan cümleler değişti: "kafana takma. bi yıl bu", "helal be kanka 👏".
8. **Testler:** 63/63 geçiyor, typecheck temiz. Yeni testler: akşam ekonomisi ve kilitli akşam, varyant çeşitliliği.
   - **Kız oyuncuyla tam yıl** (tohum 104729, arkadaş tarzı): puan 296,87, sevgili, kimse küsmedi, hitaplar doğru (abla/kızım).
   - **Hep ders tam yıl** (tohum 314187): puan 500,80, en yakın arkadaş ve etüt arkadaşı küs, ilgi "cevap vermedin".
   - İki yılda da konsolda hata yok.

**Denge (otomatik, 10'ar tohum):** hep ders 484-536 (yüksek), hep arkadaş 282-337 (düşük, ama herkes yanında ve sevgili var), karışık 343-469 (orta/yüksek). Artık doğal oynayan herkes sınavı kaybetmiyor.

**Kalanlar / Atakan'a:** Karar 38 için kaynaklı taban sıralaması verisi (Veri). Tekrar oynanabilirlik hâlâ sınırlı: iki varyant var, üç değil. Etüt arkadaşının küsmesi hep ders oyununda hâlâ kesin.
