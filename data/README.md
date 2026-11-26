# Veri Planı

Tüm rakamlar birincil kaynaktan çekilip `scripts/` altındaki dönüştürücülerle `data/processed/` içine sürümlü JSON olarak yazılır. Oyunda uydurma rakam kullanılmaz.

| Veri | Kaynak | v1 durumu |
|---|---|---|
| Ülke bazında doğum sayısı, nüfus, doğurganlık | BM World Population Prospects 2024 (+ 2026-01-19 Togo ara güncellemesi) | **Var** (237 ülke, 1950-2100) |
| Cinsiyete göre yaşam tabloları, bebek ve 5 yaş altı ölüm | BM WPP 2024 | **Var** (5 MVP ülkesi, tek yaş, 1950-2100); 5 yaş altı ölüm 237 ülke |
| Kişi başı GSYH (PPP), Gini, kentleşme, tarımda istihdam | Dünya Bankası WDI / PIP | **Var** (237 ülke tek yıl; MVP için seri ve ondalık paylar) |
| Okullaşma, ortalama eğitim yılı | UNDP HDR 2025 / Dünya Bankası (UNESCO UIS kaynaklı) | **Var** (MVP), kısa seriler `eksikler.md`'de |
| Ölüm nedenleri (yaş ve cinsiyete göre) | DSÖ Küresel Sağlık Tahminleri (GHE 2023 sürümü) | **Var** (MVP, ülke düzeyi, 2019 ve 2023) |
| Türkçe ülke adları | Unicode CLDR | **Var** |
| Anne ölümü, HIV, sigara, cep harcaması | DSÖ / Dünya Bankası | v2 |
| Çocuk evliliği | UNICEF | v2 |
| Çatışma | UCDP / PRIO | v2 |
| Yaşam memnuniyeti | Dünya Mutluluk Raporu | v2 |
| Türkiye detayları (asgari ücret, enflasyon, il nüfusu) | TÜİK | v2 |

## Veri v1 (2026-11-26)

### Nasıl yeniden üretilir
```
python3 -I scripts/veri/indir.py      # ham dosyaları indirir, data/raw/MANIFEST.json yazar (~900 MB)
python3 -I scripts/veri/donustur.py   # data/processed/v1/ üretir (~1 dk; pandas + openpyxl gerekir)
npm test                              # tests/data.test.ts doğrulaması
```
Bu çalışma ortamı kaynak sitelere erişebildi; aynı komutlar Atakan'ın bilgisayarında da çalışır. 50 MB'tan büyük ham dosyalar (yaşam tabloları, yaşa göre doğurganlık) `.gitignore`'da; parmak izleri (sha256) `data/raw/MANIFEST.json`'da.

### Ham dosyalar (`data/raw/`, değiştirilmez)
| Klasör | İçerik |
|---|---|
| `un-wpp-2024/` | BM WPP 2024 CSV: demografik göstergeler, tek yaş yaşam tabloları (kadın/erkek, 1950-2023 ve 2024-2100), yaşa göre doğurganlık |
| `un-wpp-2024-interim-togo/` | BM'nin 2026-01-19 Togo ara güncellemesi (zip) |
| `owid/` | OWID doğum dosyası (Dünya ve Kültür'ün K1 hesabında kullanılan; karşılaştırma için) |
| `worldbank-wdi/` | Dünya Bankası WDI API yanıtları ve gösterge tanımları |
| `worldbank-pip/` | Dünya Bankası PIP, 5 MVP ülkesinin bütün anket yılları |
| `undp-hdr/` | UNDP HDR 2025 zaman serisi |
| `who-ghe/` | DSÖ GHE 2023 sürümü (lisans net değil, bkz. `eksikler.md` 3.9), ülke × yaş × cinsiyet ölüm nedenleri, 2019 ve 2023 |
| `cldr/` | Türkçe ülke adları |

### İşlenmiş dosyalar (`data/processed/v1/`)
| Dosya | İçerik | Tip |
|---|---|---|
| `countries.json` | 237 ülke, 2023: doğum, nüfus, yaşam beklentisi (K/E), 5 yaş altı ölüm, kişi başı GSYH, Gini, kentleşme. Her alanın kaynağı ve yılı `fieldSources`'ta. | `CountriesFileV1` (`src/engine/data-v1.ts`), ülkeler `CountryData` (`src/engine/types.ts`) |
| `dogumlar.json` | 237 ülke, 1950-2100 yıllık doğum ve nüfus (kişi). **Doğum çekilişi bunu kullanır.** Ayrıca BM dünya satırı (sadece karşılaştırma). | `BirthsFileV1` |
| `mvp/<ISO3>.json` | TUR, IND, NGA, CHN, USA: tek yaş yaşam tablosu (qx, 1950-2100, K/E), e0, bebek ve 5 yaş altı ölüm, TFR, yaşa göre doğurganlık, anne yaşı, doğumda cinsiyet oranı, GSYH serisi, gelir anketleri (Gini + 10 ondalık pay), kentleşme, eğitim yılı, okullaşma, tarımda istihdam, ölüm nedenleri | `MvpCountryFileV1` |
| `ulke-kodlari.json` | ISO3, ISO2, BM LocID, OWID kodu, Türkçe ad. Oyun kodu = BM'nin ISO3 kodu (Kosova `XKX`). | |
| `rapor.json` | Dönüştürme kontrolleri: dünya toplamı farkı, DSÖ iç farkları, boş alan sayıları | |
| `eksikler-otomatik.txt` | Boş ya da eski alanların otomatik listesi | |

### Kurallar ve kararlar
- **Çekiliş ağırlığı:** Ülke satırlarının toplamı (dünya satırı değil). Bkz. `docs/devir/2026-11-26-veri.md`.
- **Ölüm:** Olasılık BM yaşam tablosundan (`qx`), neden DSÖ'den sadece **pay** olarak. İkisinin toplam ölüm düzeyleri farklı (`eksikler.md` bölüm 3). Ölüm nedeni varsayılan yılı **2019** (`olumNedenleri.varsayilanYil`); `kullanilmasin: true` olan yıl (Türkiye 2023) kullanılmaz.
- **Olağan dışı referans yılı:** `countries.json`'da Türkiye kaydında `yearNote` (2023 deprem yılı).
- **Yeniden indirme:** `indir.py --yeniden [--sadece <metin>]` parmak izi değişen dosyanın üzerine yazmaz.
- **Yaşam tablosu hesabı:** `lifeExpectancyAtBirth()` (`src/engine/data-v1.ts`). BM'nin e0 değerine en büyük fark 0,0006 yıl (test eşiği 0,5).
- **Yuvarlama:** Oranlar 5-6 anlamlı basamak; doğum ve nüfus tam sayı (BM binlik birimle 3 ondalık yayımlıyor, yani kişi düzeyinde tam).
- Eksikler: `data/eksikler.md`.
