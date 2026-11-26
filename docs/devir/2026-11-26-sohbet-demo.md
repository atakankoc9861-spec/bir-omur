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
