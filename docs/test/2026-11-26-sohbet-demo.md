# Oyun Testi + Hassasiyet · Sohbet demosu "dem" · 2026-11-26

Test eden: Oyun Testi ve Ar-Ge (bu turda Kalite ve Hassasiyet'in hassasiyet kontrolü de dahil). Demoyu biz yapmadık.
Sürüm: `prototype/sohbet-demo.html` (devir: `docs/devir/2026-11-26-sohbet-demo.md`). Bağlı kararlar: #34-#38.

## Nasıl test edildi
- Başsız Chrome, 390×844, 2x. Kendi betiklerimiz: `docs/test/2026-11-26-sohbet-betik/oyna.py` (tarzlı oyuncu), `ilk30.py` (ilk 30 saniye normal hızda + dokunma alanı ölçümü).
- **3 tam yıl:**
  | Oyun | Tarz | Tohum | Puan | Sonuç | Küs |
  |---|---|---|---|---|---|
  | 1 | Sabırsız: bekleyen sohbeti gelir gelmez aç, ilk seçeneğe bas, 4 akşamı ilk 4 sohbete harca | 41 | 152,37 | seneye tekrar | etüt |
  | 2 | Duygusal: önce aile, anne, baba, ilgi, kardeş, kanka; en sıcak (son) seçenek | 41 | 264,78 | kafede bir yıl | etüt |
  | 3 | Duygusal, başka tohum (tekrar oynanabilirlik) | 9001 | 296,99 | seneye tekrar | etüt |
- Ek: ilk 30 saniye normal hızda (tohum 777), metin dökümü (`s.msgs`) ve kaynak kodda içerik taraması.
- Konsol: 3 yılda + ilk 30 sn'de **0 hata, 0 uyarı**. Takılma yok. Yatay taşma yok.

## Genel his
- **Eğlence: 6/10.** İlk dakika çok iyi; ortası (Kasım-Nisan) aynı döngüye dönüyor: aç, bir cümle seç, bardak bitti, bırak. Karar verirken "neyi kaybettiğimi" görmüyorum, sadece yıl sonunda öğreniyorum.
- **Duygu: 8/10.** Gerçekten dokunan anlar var. Metinlerin çoğu bir Türk ailesinin telefonundan alınmış gibi. Bu, MVP-0'dan çok daha ileri: artık "kötü kopya" değil, kendi sesi olan bir şey.
- Kısaca: **duygu hazır, oyun henüz değil.**

## 1. Oyuncu gözüyle

### İlk 30 saniye: çekiyor mu? **Evet.**
Kilit ekranı 07:12, "Annem: Günaydın oğlum. Kahvaltı hazır…", ardından "Ömer: uyandın mı", "12-C SON SENE: 7 yeni mesaj". Alt satırda "Yusuf Köse · 17 yaşında · İstanbul / Son sene. Haziran'da sınav var." Bu dört satır oyunun tamamını anlatıyor, açıklama gerekmiyor. "Kilidi aç" tek ve belirgin düğme. Açılınca liste kendi kendine doluyor, "Yasin yazıyor…" görünüyor. İpucu balonu ("Bu ay 4 akşamın var… Herkese yetişemezsin.") net.
Tek kusur: üstteki bildirim şeridi açılır açılmaz `dem.` başlığını ve bardakları (bütçeyi) kapatıyor. İlk anda en önemli bilgiyi göremiyorum.

### Nerede sıkıldım
- **Kasım-Nisan ortası.** Her ay aynı ritim; sınıf grubu her ay benzer bir şaka, patron her ay "gelir misin". Ay geçiş ekranları güzel ama hepsi aynı kalıpta ("<Ay>. <tek cümle>. <kim cevapsız kaldı>").
- **Seçimin sonucu görünmüyor.** Bir cevap verdiğimde karşı taraf güzel cevap veriyor, sonra hiçbir şey. Kime ne kadar yakın olduğumu, dersin nereye gittiğini bilmiyorum (karar #36-37'deki durum paneli **demoda yok**; "bu ay" bardaklarına dokunmak sadece ipucunu tekrar açıyor).

### Nerede kafam karıştı
- **"tamam anne 💛" bir akşamı yiyor.** "amin teyzecim 🌹" demek de bir akşam, arkadaşın evine 15 dakikada koşmak da (o 2 akşam). İki saniyelik bir cevabın bir akşama mal olması, akşam benzetmesini bozuyor. Sabırsız oyunda Aralık'ta bütçeyi teyzenin cuma kartına "amin" demeye harcadım; hemen ardından arkadaşım "annem mutfakta ağlıyo. ne yapcağımı bilmiyorum" yazdı ve cevap veremedim. Dramatik olarak güçlü ama **haksız hissettiriyor**, çünkü bunu önceden görmenin yolu yok.
- **İlişki hikâyesi 3 oyunun 3'ünde "Bir şeyler olabilirdi. Olmadı." bitti.** Sabırsız oyuncu ilgi duyulan kişiye 9 kez, duygusal oyuncu 8 kez cevap verdi. İlişki Ocak'taki sinema davetine ve Şubat'taki tek bir seçeneğe bağlı (`icerik.ts` s_ilgi, `yilbasi` bayrağı). Oyuncu bunun hangi anda kaçtığını bilmiyor. Bu "hayatın acısı" değil, gizli bir kapı.
- **Sohbetin altındaki "Mesaj" kutusu.** Yazılabilir gibi duruyor, dokununca hiçbir şey olmuyor.
- **Aynı sohbette iki soru.** Sonuç günü aile grubunda baba "Önce sen söyle oğlum. Ne istiyorsun?" diye soruyor, ama alttaki düğmeler hâlâ önceki soruya ait ("kapıyı açıyorum"). Cevaplayınca tercih düğmeleri geliyor; yine de bir an "babama kapıyı açıyorum mu dedim?" hissi oluyor.
- **Son ekranda "listeyi baban doldurdu" + "seneye tekrar".** Puan hiçbir yere yetmediyse babanın neyi doldurduğu belli değil (`icerik.ts:1052`).

### En güçlü 3 an
1. **Sonuç akşamı:** "Annem: Kapındayım. Açmasan da buradayım." / "Babam: Bir sene bir şey değil. Hiçbir şey değil." / "Tamam. Kapının önüne su bırakıyorum." Oyunun en iyi sayfası; gerçekten boğaz düğümlüyor.
2. **Sınav sabahı aile grubu:** teyzenin kartı, "Sabah namazında dua ettim yavrum", kardeşin "abi kolay gelsin 💪 / annem yazdırdı ama ben de diyorum", annenin gizlice çektiği fotoğraf ("Kapıdan çıkarken çektim, kızma 🙈").
3. **Arkadaşın babası:** "babam bugün öğlen eve geldi. hiç gelmez öğlen" ile başlayıp iki ay sonra "babamın çalıştığı yer kapanmış" ile açılan hikâye. Görmezden gelince "tamam. yoğunsundur" ile bitiyor. Az kelimeyle çok şey.
(Bonus: Şubat 14 "bugün ne günü biliyo musun 🙂 / kutlamıyoruz tabi. sadece soruyorum." cevapsız kalınca tek kelimelik "tamam." ve annenin "Görüyorsun ama yazmıyorsun. Neyse.")

### En zayıf 3 an
1. **Akşam bütçesinin ilk ayda tükenmesi.** 4 bardağı ilk 4 sohbet yiyor; sonra 10 sohbetin hepsine "yazacak vaktim yok" demek zorundayım. Ay ortası boş.
2. **Ara aylardaki sınıf grubu ve patron mesajları.** Tatlı ama karar yükü yok, tekrar hissi veriyor.
3. **"O yıldan kalanlar"da bana uymayan satırlar.** Her ay cevap veren duygusal oyuncuya "Annem… Sen de **artık** cevap veriyorsun." (hiç kopmadım ki); grubu oyun sessize aldığı halde "Grubu sessize **aldın**". Son ekran güçlü olduğu için bu küçük yanlışlar daha çok batıyor.

### Akşam bütçesi (ayda 4): keyifli zorluk mu, ceza mı?
**Şu an cezalandırıcıya yakın.** Fikir doğru (herkese yetişemezsin), ama:
- Küçük cevap ile büyük fedakârlık aynı fiyatta.
- Bütçe ay başında açılan ilk sohbetlere gidiyor. Ay içindeki önemli olay (arkadaşın krizi) sonradan geliyor; o ana para kalmıyor.
- Ders tarafı görünmez. "Kalan akşamlar derse gider" deniyor ama nete/puana etkisini panelde görmüyorum. Sonuç: duygusal oyuncunun puanı 265-297, sabırsızınki 152; ikisi de "yetersiz/düşük". Doğal oynayan herkes sınavı kaybediyor gibi.

### Okunmamış yığılması sinir bozucu mu?
Sabırsız oyunda ay sonlarında **9, 6, 3, 10, 3, 4, 5, 7, 12, 17, 14** okunmamış mesaj kaldı. Büyük kısmı sessizdeki sınıf grubu (gri rozet), bu kısım gerçekçi ve sorun değil. Sinir bozan, kırmızı rozetlerin "cevap veremeyeceğim" sohbetleri de göstermesi: okumak bedava olduğu için hepsini açtım, cevap veremeyince kendimi suçlu hissettim. Bu his kasıtlıysa iyi, ama ayda 4 bardakla her ay tekrarlanınca yoruyor. Duygusal oyunda (hepsini okuyunca) okunmamış 0 kaldı, yük yoktu.

### Metinler doğal mı?
**Büyük çoğunluğu çok doğal.** Yazım dili (bişey, diyo, yapcağımı, sormıycam), BÜYÜK HARFLE yazan sınıf arkadaşı, babanın her şeye 👍 atması, "Baban da sordu ama sana yazmaya çekiniyor", "limit enflasyona endeksli mi" gerçekten Türk telefonundan çıkmış gibi.
Çeviri ya da yapay kokan birkaç satır:
- "kendine iyi davran. bi yıl bu" ("be kind to yourself" kalıbı; Türk genci "kafana takma, bi yıl bu" der).
- "seninle gurur duyuyorum kanka" (biraz dizi altyazısı; "helal lan / gurur duydum kanka" daha doğal).
- Ay geçiş ekranlarındaki edebi cümleler ("Bir yıl, birkaç saate sığmıştı.") tek tek güzel, ama hepsi aynı kalıpta olunca "yazar sesi" sohbetin doğallığını bastırıyor.
- Son ekranda üç oyunda da aynı kalıp satırlar ("Bu yılın en uzun sohbeti. Hâlâ her gün.", "Künefe sözünü tuttu.").

### Tekrar oynanabilirlik
Ölçüm (isimler soyutlanmış metin satırı karşılaştırması):
- Aynı tarz, farklı tohum (41 ve 9001): **%95 aynı metin** (263 ve 264 satırın 251'i ortak).
- Aynı tohum, farklı tarz (sabırsız ve duygusal): **%65 aynı.**
İkinci oyunda isimler ve cinsiyet değişiyor, olaylar ve cümleler neredeyse birebir aynı. Üç oyunun üçünde de etüt arkadaşı küstü, ilişki "olmadı" bitti, aile ve kanka "canlı" kaldı. Devir notundaki "her önemli an için 2-3 olay" ihtiyacı doğrulandı. Demo için kabul edilebilir; oyun için değil.

## 2. Hassasiyet

| Konu | Sonuç |
|---|---|
| **Din içerikli satırlar** (cuma kartı, "Allah utandırmasın", "Maşallah 🧿", iftar daveti, bayram kartı, "Sabah namazında dua ettim", "Allah'ım şükürler olsun") | **Saygılı ve gerçekçi.** Alay yok. Teyzenin gül kartları sevgiyle yazılmış; son ekranda "Her cuma bir gül kartı. Bir yıl boyunca bir kez bile aksatmadı." diye onurlandırılıyor. Cevaplar ("amin teyzecim 🌹", "ellerinden öperim") gerçek davranış. **Tek not (orta):** her ailede aynı dindarlık düzeyi var. Laik ya da az dindar bir aile varyantı yok; tekrar oynanabilirlik ve temsil için ileride gerekli. Takvim: iftar Şubat 2027, Ramazan Bayramı Mart 2027, Kurban Mayıs 2027; 2027 için doğru aylar, kesin gün yazılmamış (doğru tercih). |
| **İşsiz kalan baba** | **Acındırmadan anlatılmış.** Çocuğun gözünden, az kelimeyle ("kimse bana bişey söylemiyo", "babam kimseden bişey istemez ama... sor bi"). Kankanın "senin baban maaş alıyo ama / kusura bakma. öyle demek istemedim" satırı sınıf farkını yüzleştirmeden gösteriyor, çok iyi. **Küçük risk:** "oyuncunun babası depoda iş buldu" yolu kurtarıcı aile klişesine kayabilir. Arkadaşın babasının kendi çabasıyla iş bulduğu bir yol da olmalı. |
| **Cinsiyet ve hitap** | 3 oyunun 3'ü de erkek oyuncu çıktı. Kaynakta sabit "abi/oğlum/aslanım" taraması yaptım: hepsi `{g:..}`/`{oglum}` ile, ya da oyuncunun **başkasına** söylediği cümlelerde (patrona "abi", Ömer Abi). Hata bulmadım. Kız oyuncu ekranda oynanmadı; devirdeki testlere güveniyoruz, bir sonraki turda tek kız oyunu oynanmalı. |
| **Sınıf grubu mizahı** | **Aşağılama yok.** Tek dikkat: aynı kişi (c3) üç kez "saf olan" rolünde ("karne ne zaman veriliyodu", "biz hangi gün mezun olmuştuk"). Sevecen, ama sabit bir "aptal" tipine dönmesin. "İsmail hariç 😄" tarzı takılmalar arkadaşça. |
| **Gerçek kurum/marka** | Marka yok (WhatsApp/Instagram vb. geçmiyor). Geçen gerçek adlar: YKS, TYT (sınav adları; kamuya açık, sorun değil), Moda, Trabzon, Eskişehir. Sınav "Sonuç" hesabı ÖSYM'yi taklit etmiyor. |
| **Doğrulanmamış tarih/istatistik** | Gerçek istatistik yok. Puan/net kurgu. "limit 250 TL" kurgu ama gerçekçi. Sınav günü verilmemiş, doğru. **Not:** karar #38 hedef kartında ÖSYM taban sıralamalarını kaynaklı istiyor; demoda hedef kartı yok, dolayısıyla henüz risk de yok. |

## 3. Teknik
- Konsol: 0 hata / 0 uyarı (4 oturum). Takılma yok; 3 yıl da sona ulaştı. Yatay taşma yok.
- **Bildirim şeridi başlığı kapatıyor (orta):** liste ekranında `dem.` logosunu, ay etiketini ve **akşam bardaklarını**; sohbet ekranında kişi adını ve **geri düğmesini** örtüyor (bkz. `docs/test/2026-11-26-sohbet-ekran/x-bildirim-basligi-kapatiyor.png`). Telefonda geri düğmesine basmak isteyen bildirime basar.
- **Dokunma alanı:** geri düğmesi `#geri` **29×38 px** (öneri ≥44×44). Diğer düğmeler (seçenekler, satırlar, Telefonu bırak) yeterli.
- Karar #36-37 (durum paneli, ihtimal gösterimi) demoda yok. Karara aykırı bir şey yok; sadece eksik.
- `hiz=6` ile bir yıl ~3-4 dk sürüyor; gerçek hızda ay başına birkaç dakika. Oturum uzunluğu demo için uygun.

## Bulgular (öncelik sırasıyla)

**Kritik**
1. Akşam ekonomisi küçük cevabı ve büyük fedakârlığı aynı fiyata koyuyor; bütçe ayın başında bitiyor, ayın asıl dramı parasız kalıyor. Oyunun çekirdek kararı şu an "haksız" hissettiriyor.
2. Seçimlerin etkisi görünmüyor (panel yok, bağ ve ders göstergesi yok). Oyuncu yıl sonuna kadar neyi kazanıp kaybettiğini bilmiyor. Bu yüzden orta aylar sıkıcı.

**Orta**
3. İlişki 3/3 oyunda "olmadı": tek gizli seçeneğe bağlı, çok cevap veren oyuncuyu da cezalandırıyor.
4. Tekrar oynanabilirlik: farklı tohumda %95 aynı metin.
5. Bildirim şeridi başlığı, bardakları ve geri düğmesini örtüyor; geri düğmesi küçük.
6. Doğal oynayan her tarz sınavı "yetersiz/düşük" bitirdi; demo Atakan'a "ne yapsan kaybedersin" mesajı verebilir.
7. Tek tip dindar aile; laik/az dindar varyantı yok.

**Küçük**
8. Son ekran satırları oyuncuya uymuyor ("artık cevap veriyorsun", "grubu sessize aldın").
9. "Listeyi baban doldurdu" + "seneye tekrar" çelişkili okunuyor.
10. Aynı sohbette iki bekleyen soru (sonuç günü) kısa bir kafa karışıklığı yaratıyor.
11. Sahte "Mesaj" kutusu dokununca tepki vermiyor.
12. Birkaç çeviri kokan satır ("kendine iyi davran", "seninle gurur duyuyorum").

## En etkili 5 iyileştirme önerisi
1. **İki fiyatlı cevap:** emoji, "amin", "tamam anne" gibi kısa cevaplar bedava ya da yarım bardak olsun; "yanına gitmek", "sinemaya gitmek", "sesli anlatmak" gibi gerçek akşamlar 1-2 bardak. Böylece "herkese yetişemezsin" acısı küçük nezaketlerde değil, gerçek fedakârlıklarda yaşanır.
2. **Durum panelini (karar #36) demoya ekle**, en azından "en yakın 5 kişi" ve "bilgi/ders" göstergesi. Her cevaptan sonra küçük bir iz ("Eren ↑", "ders −1 akşam") olsun. Orta aylar karar oyununa döner.
3. **Ay içine bir "beklenmedik" an koy ve bütçeyi kısmen sakla:** ay başında bütçe 4 ama 1 bardak "acil durum" için kilitli kalsın ya da ay ortasındaki olay +1 bardak getirsin. Arkadaşın krizi "elimde hiç kalmadı" yüzünden kaçmasın, "ders mi o mu" diye seçilsin.
4. **İlişkiye ikinci kapı:** Ocak/Şubat tek seçeneği yerine "bağ ≥ X ise Mart'ta bir şans daha" (ör. denemeden sonra kapıda bekleyiş). Son ekranda da nedenini tek cümleyle söyle ("Şubat'ta cevap vermedin").
5. **Atakan demosundan önce çeşitlilik:** en az 4 doruk anın (arkadaş krizi, Şubat, Mart denemesi, sonuç akşamı) her biri için 2 varyant ve 1 aile tipi varyantı (daha az dindar ya da boşanmış ebeveyn). Ayrıca bildirim şeridini başlığın altına kaydır, geri düğmesini 44 px yap.

## Karar
**ÖNCE DÜZELTİLMELİ** (kısa bir tur yeter).
Gerekçe: Duygu ve yazı Atakan'ı etkileyecek düzeyde; "anlam yok" eleştirisine güçlü bir cevap. Ama "eğlenceli mi" sorusunda çekirdek karar (akşam bütçesi) şu an haksız ve görünmez. Atakan iki ay oynayıp "yine bir şey seçiyorum, ne olduğunu bilmiyorum" diyebilir. En az öneri 1 (iki fiyatlı cevap), öneri 2'nin hafif hâli (bağ/ders izi) ve bildirim şeridi düzeltmesi yapılırsa **gidebilir**. Tekrar oynanabilirlik (öneri 5'in içerik kısmı) Atakan'a "bilinen zayıflık" olarak söylenebilir.

## En iyi 4 ekran görüntüsü
1. `docs/test/2026-11-26-sohbet-ekran/1-kilit-ekrani.png`: ilk an, kilit ekranı ve bildirimler.
2. `docs/test/2026-11-26-sohbet-ekran/2-sinav-sabahi.png`: sınav sabahı aile grubu, kapıdan çıkarken çekilen foto.
3. `docs/test/2026-11-26-sohbet-ekran/3-sonuc-aksami-kapindayim.png`: "Kapındayım. Açmasan da buradayım."
4. `docs/test/2026-11-26-sohbet-ekran/4-o-yildan-kalanlar.png`: yıl sonu ekranı.
(Sorun örneği: `x-bildirim-basligi-kapatiyor.png`)

## Devir notu (CLAUDE.md #7)
- **Yapılan:** 3 tam yıl + ilk 30 sn testi, hassasiyet taraması, bu rapor. Hiçbir oyun dosyası değiştirilmedi.
- **Kalan:** kız oyuncu ile bir yıl, "hep ders" oyuncusunun gözüyle bir yıl (devir notundaki 450-510 puanı oyuncu hissiyle doğrulamak), gerçek hızda (hiz=1) tam bir ay süresi.
- **Atakan'a sorulacak:** (1) Küçük cevaplar bedava olsun mu, yoksa "her cevap bir akşam" sertliği isteniyor mu? (2) Durum paneli demoya girsin mi, yoksa sonraki sürüme mi kalsın? (3) Demo, Atakan'a varyantsız (her oyunda aynı olaylar) gidebilir mi?
