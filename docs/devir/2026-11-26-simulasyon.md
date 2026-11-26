# Devir Notu · Simülasyon ve Denge (+ Yapımcı adına arayüz bağlantısı) · 2026-11-26

## Ne yapıldı
**İlk oynanabilir sürüm (MVP-0): `prototype/oyna.html`** — tek dosya, 376 KB, internetsiz çalışır. Telefonda dosyayı tarayıcıda açmak yeterli. Yeniden üretmek: `npm run oyna:derle`.

### Motor (`src/engine/`, saf TypeScript, tohumlu)
- `game.ts` — doğum çekilişi (`drawBirth`), `Game` sınıfı: `step()` bir yıl, `choose()` karar, `summary()` hayat özeti.
- `gamedata.ts` — veri v1 + içerikten sıkıştırılmış oyun verisi. Alan adlarıyla okur; Kalite düzeltmesiyle bir alan kaybolursa o özellik kapanır, oyun çökmez (testli).
- `storylets.ts` — 8 çocukluk kritik anı, 10 hayat sistemi, 42 anlatı olayı, 13 yetişkin karar anı, 5 yansıma sorusu. Hepsi bu proje için yazıldı.
- `grammar.ts` — küçük Tracery benzeri gramer: tohumlu, her sembolde en az kullanılanı seçer, aynı cümleyi bir hayatta ikinci kez üretmez. Türkçe ünlü uyumlu ekler (`#anne.in#`, `Amerika Birleşik Devletleri'nde`).
- `denge.ts` — **kaynaksız bütün ayarlar tek dosyada** ("denge ayarı, kaynak yok").
- `causes.ts` — DSÖ neden gruplarının Türkçe adları (geçici çeviri, Anlatı onayı bekliyor).

Veriden gelenler (kaynağı ekranda satır altında yazar):
| Ne | Kaynak |
|---|---|
| Doğum ülkesi (237 ülke) | BM WPP 2024, 2026 projeksiyonu (karar 22) |
| Ölüp ölmeme | BM WPP qx; her yıl o takvim yılının tablosu (Veri'nin önerisi) |
| Ölüm nedeni | DSÖ GHE **2019** payları (Kalite/Yapımcı şartı) |
| Cinsiyet, annenin yaşı, kardeş sayısı, yeni kardeş ve çocuk doğumları | BM WPP doğumda cinsiyet oranı ve yaşa göre doğurganlık |
| Şehir/köy | Dünya Bankası kentleşme (2025) |
| Gelir | kişi başı GSYH × gelir/tüketim ondalık payı (Dünya Bankası WDI + PIP). **Yöntem tahmin**: anket ortalaması GSYH değildir |
| Okula kayıt, ortaöğretim, üniversite olasılığı | Dünya Bankası/UNESCO okullaşma (bazı yıllar eski: ör. TUR ilkokul 2017) |
| Türkiye: askerlik (7179), YKS, 12 yıl zorunlu eğitim (6287), evlilik yaşı (TMK), ilk evlilik yaşı ort. (TÜİK 2024), emeklilik (5510, kademeli yaş), kadın istihdamı (TÜİK 2024), bakım süresi (TÜİK 2014-15), vicdani ret | `content/countries/TUR.json`, yalnız `oyunda_kullanilabilir: true` kayıtlar |
| İsimler | TUR: TUR.json NVİ havuzları (genel, din: null). IND/CHN/USA: `content/names/sigpwned-cc0.json` (CC0, commit eb62e13, dönüştürücü `scripts/isimler/donustur.py`). **NGA: kaynaklı havuz bulunamadı → kişiler rolleriyle anılır** ("annen", "ablan"). Uydurma isim listesi yazılmadı. |

Kurallar: aynı hayatta isim tekrar etmez (kelime düzeyinde: "Ali" varsa "Ali Asaf" çıkmaz); kişiler yaşlanır, BM qx ile bir kez ölür; ölü kişi sonraki olaylarda canlı geçmez (yalnız yas/anma satırlarında adı anılır). Karar seçeneklerinin bedeli gelire göre değişir, para yetmezse seçenek gerekçesiyle kilitlenir; puan yok, suçla zenginleşme yok.

### Arayüz (`src/ui/`)
Ana ekran → "Doğ" → doğum kartı (MVP dışı ülke: "Bu ülke henüz hazırlanıyor — tekrar doğ" + ülke, doğum payı, e0, 5 yaş altı ölüm) → oyun (üstte yaşayan sahne, altta yıl yıl metin, 4 gösterge, hane bütçesi, karar düğmeleri, ❚❚/1×/4×) → 5/15/30/50/70 yaşında yansıma sorusu → ölüm → özet (neden + DSÖ payı, yaşam haritası, önemli anlar, insanlar, yansımalar, son söz). Kayıt `localStorage` (try/catch): tohum + seçimler saklanır, açılınca hayat aynen yeniden kurulur. Yaşanan hayatlar ana ekranda listelenir.

**Kit eşlemesi** (`src/ui/kit-esleme.ts`, ekranda gösterilmez): TUR → Akdeniz (tam), NGA → Batı Afrika (tam). **GEÇİCİ:** IND → Batı Afrika kiti, CHN ve USA → Akdeniz kiti, "yedek" (nötr) görsel profille; CHN'de eşit ten dağılımı yanıltıcı olduğu için mevcut `dusuk-basortusu-gecici` profili ödünç (yeni sayı yazılmadı).

### Testler
`npm test` **52/52** (yeni `tests/game.test.ts` 13 test, ~80 sn), `npm run typecheck` temiz.
- Aynı tohum + aynı seçimler = aynı hayat; kayıttan yeniden kurma.
- **10.000 hayat** (ülke başına 2.000, dönem modu): ortalama ölüm yaşı BM e0 2026'ya fark en çok **0,5 yıl** (eşik ±2).
- Kuşak modu (oyunun varsayılanı, ülke başına 1.500): BM tablolarından hesaplanan kuşak ömrüne fark en çok 0,7 yıl.
- 5 yaş altı ölüm BM WPP ile (IGME değil): NGA 94 / 100,7‰, TUR 8,5 / 9,5‰ ...
- Her hayatta: tekrar eden metin 0, açılmamış sembol 0, iki kez ölen kişi 0, öldükten sonra olayda geçen kişi 0.
- Ayrıntı: `docs/denge/2026-11-26-mvp0.md`. Araçlar: `npm run denge:rapor`, `scripts/denge/ornek-hayat.ts` (bir hayatın tüm metni).

### Tarayıcı denemesi
`python3 -I scripts/oyna-dene.py prototype/oyna.html <klasör> 3` — başsız Chrome, 390×844. 3 hayat baştan sona (NGA, IND, IND; "hazırlanıyor" kartı, yansıma, karar, özet) + kayıt/devam. Konsol hatası yok. Görüntülere bakılarak düzeltilenler: karar açılınca akış en alta kaymıyordu; borç faizle kontrolsüz büyüyordu (tavan + kısıntı eklendi); "Hindistan'de/Nijerya'de" ekleri; sayıdan sonra ek gerektiren cümleler; Çin sahnesindeki ten dağılımı; aynı kardeşin iki kez evlenmesi; Türkçeye özgü "simit/önlük" gibi ayrıntıların her ülkede çıkması.

## Ne kaldı (bilinen eksikler)
- **Nijerya isim havuzu yok** → Dünya ve Kültür'e. Hindistan/Çin listeleri yalnız bebek adları, kuşak boyutu yok; ABD 1990 sayımı + 2022.
- Topluluk/din çekilişi yok (TUR.json'da ağırlıklar kaynaklı değil); herkes genel havuzdan ad alıyor. Eş yalnız karşı cinsten (MVP basitleştirmesi; karar gerektirir).
- Evlilik, çocuk isteği, iş bulma, terfi/işsizlik, eşin çalışması, emeklilik yaşı (TUR dışı), hane harcama payları: **denge ayarı**. Gelir ile şehir/köy arasında bağ yok.
- Gelecekteki (2026+) ülke krizleri yok — gerçek yıllara bağlanacak kriz verisi geleceği kapsamıyor.
- İleri yaşlarda (60+) olay çeşidi az; yaşam haritasının son satırları çoğunlukla "sakin".
- Para dolar (SAGP) olarak; TL karşılığı yok (dönüşüm verisi yok).
- Sahne yalnız ev/sokak; okul, iş, hastane yok. IND/CHN/USA kitleri geçici.
- Yabancı adlarda ek okunuşa göre değil yazıma göre ("Dorothy'un").
- Ayrı "hızlı geç" düğmesi yok; montajda 4× aynı işi görüyor.
- Kalite denetimi yapılmadı (kural 6): teslim Kalite'ye.

## Atakan'a sorulacaklar
1. **Hangi ömür?** Oyun her yıl o yılın BM tablosunu kullanıyor (kuşak). Bu yüzden 2026 doğumlu bir Türk ortalama ~87-88 yaşında ölüyor; BM'nin yayımladığı "beklenen ömür" (dönem) 78. Kuşak mı (bugünkü ayar, BM'nin geleceğe dair iyileşme varsayımı dahil), dönem mi (2026 tablosu ömür boyu sabit)?
2. Nijerya'da isim yok, kişiler "annen, ağabeyin" diye anılıyor. Kaynaklı liste bulunana kadar böyle kalsın mı?
3. Eş seçimi şimdilik karşı cinsten. Bunu nasıl ele alalım?
4. Hindistan/Çin/ABD sahneleri geçici kitlerle çiziliyor (ABD'de Akdeniz evleri). Görsel'in sıradaki kit sırası buna göre mi olsun?
5. Hız: 1× montajda yılı ~2-3 sn, yetişkinlikte ~3-4 sn gösteriyor. Uygun mu?
