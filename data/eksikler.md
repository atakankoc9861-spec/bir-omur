# Eksik ve Dikkat Gerektiren Veriler (Veri v1)

Tarih: 2026-11-26 · Hazırlayan: Veri departmanı

Kural: Eksik veri uydurulmaz. Kaynakta olmayan alan `null` yazılır ve burada listelenir. Satır satır otomatik liste: `data/processed/v1/eksikler-otomatik.txt` (dönüştürücü her çalıştığında yeniden yazar).

## 1. countries.json'da `null` kalan alanlar (237 ülke, yıl 2023)

Demografi alanları (doğum, nüfus, yaşam beklentisi, 5 yaş altı ölüm) **237 ülkenin hepsinde dolu** (BM WPP 2024). Boşluklar sadece Dünya Bankası alanlarında:

| Alan | Boş | Ülkeler | Neden |
|---|---|---|---|
| `gdpPerCapitaPpp` | 38 | AIA, ASM, BES, BLM, COK, CUB, ERI, ESH, FLK, GGY, GIB, GLP, GUF, GUM, IMN, JEY, LIE, MAF, MCO, MNP, MSR, MTQ, MYT, NCL, NIU, PRK, PYF, REU, SHN, SPM, SSD, TKL, TWN, VAT, VEN, VGB, WLF, YEM | Dünya Bankası bu ülke/bölgeler için SAGP'li kişi başı GSYH yayımlamıyor (çoğu küçük ada/bağımlı bölge; Tayvan Dünya Bankası'nda yok; Küba, Kuzey Kore, Venezuela, Yemen, Eritre, Güney Sudan'da seri yok ya da kesik). |
| `gini` | 66 | ABW, AFG, AIA, AND, ASM, ATG, BES, BHR, BHS, BLM, BMU, BRN, COK, CUB, CUW, CYM, DMA, ERI, ESH, FLK, FRO, GGY, GIB, GLP, GRL, GUF, GUM, HKG, IMN, JEY, KHM, KNA, KWT, LBY, LIE, MAC, MAF, MCO, MNP, MSR, MTQ, MYT, NCL, NIU, NZL, OMN, PLW, PRI, PRK, PYF, REU, SAU, SGP, SHN, SMR, SOM, SPM, SXM, TCA, TKL, TWN, VAT, VCT, VGB, VIR, WLF | Dünya Bankası PIP'te bu ülkeler için hane anketine dayalı Gini yok (Körfez ülkeleri, Yeni Zelanda, Singapur, küçük adalar...). |
| `urbanShare` | 21 | AIA, BES, BLM, COK, ESH, FLK, GGY, GLP, GUF, JEY, MSR, MTQ, MYT, NIU, REU, SHN, SPM, TKL, TWN, VAT, WLF | Dünya Bankası bu bölgeler için seri yayımlamıyor. |

**Eski değerler (kullanılıyor ama yılı eski):** Gini, 2013 öncesi: AZE 2005, COG 2011, DZA 2011, GUY 1998, HTI 2012, JOR 2010, NRU 2012, PNG 2009, SLB 2012, TKM 1998, TTO 1992, TUV 2010, VEN 2006. GSYH: SYR 2022, VIR 2022. Yıl her ülkenin `fieldSources` alanında yazılı; motor eski değeri kullanıp kullanmamaya kendisi karar verebilir.

**Nasıl tamamlanır (öneri, uygulanmadı):**
- Tayvan: ulusal istatistik (DGBAS) ya da IMF WEO. Farklı kaynak olduğu için Atakan/Simülasyon onayı gerekir.
- Küçük ada ve bağımlı bölgeler (Fransa denizaşırı bölgeleri vb.) için çoğu durumda bağlı olduğu ülkenin değeri kullanılabilir; bu bir **tahmin** olur, yöntemi yazılıp işaretlenmeli.

## 2. MVP 5 ülke (TUR, IND, NGA, CHN, USA): eksik ya da kısa seriler

| Veri | Ne var | Ne eksik | Nasıl tamamlanır |
|---|---|---|---|
| Kişi başı GSYH (SAGP) | 1990-2025 (Dünya Bankası) | **1950-1989 yok.** Geçmiş modu (karar 15) için gerekli. | Maddison Project Database 2023 (Groningen): https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023 → "mpd2023_web.xlsx" (doğrudan: https://dataverse.nl/api/access/datafile/421302). Bu ortamdan erişilebiliyor, **indirilmedi**: Maddison 2011 fiyatlarıyla, Dünya Bankası 2021 SAGP ile. İki seri birleştirilecekse yöntem (ör. 1990'da oranlama) Simülasyon ile kararlaştırılmalı. |
| Ortalama eğitim yılı | 1990-2023 (UNDP HDR 2025), kadın/erkek ayrı | **1950-1989 yok.** HDR son yıllarda bazen aynı değeri tekrarlıyor (ör. TUR kadın 2021-2023: 8,28). | Barro-Lee (5 yıllık, 1950-2015, yaş ve cinsiyete göre): https://barrolee.github.io/BarroLeeDataSet/Data.html. İndirilmedi. |
| İlkokul net okullaşma | Dünya Bankası (UNESCO UIS kaynaklı) | Son yıl eski: TUR 2017, IND 2013, NGA 2010, CHN 1997, USA 2017 | UNESCO UIS veri tarayıcısı: https://databrowser.uis.unesco.org/ (gösterge: "Total net enrolment rate, primary"). UIS API'nin gösterge kodları bu oturumda bulunamadı. |
| Ortaöğretim brüt okullaşma | Dünya Bankası | CHN son yıl 2012 | Aynı (UIS). |
| Yükseköğretim brüt okullaşma | Dünya Bankası | NGA son yıl 2011 | Aynı (UIS). |
| Gelir dağılımı (ondalık paylar) | Dünya Bankası PIP, anket yılları (TUR 27, IND 9, NGA 9, CHN 23, USA 62 anket) | Anket olmayan yıllar boş (ara doldurma yapılmadı). | Motor en yakın anket yılını kullanabilir; ya da PIP'in `fill_gaps=true` seçeneği (PIP'in kendi ara tahmini) indirilebilir. |
| Kentleşme | 1960-2025 (Dünya Bankası / BM WUP, ulusal tanımlar) | **1950-1959 yok.** | BM World Urbanization Prospects: https://population.un.org/wup/ |
| Tarımda istihdam | 1991-2025 (ILO modellenmiş tahmin, Dünya Bankası üzerinden) | 1991 öncesi yok | ILOSTAT. |
| Ölüm nedenleri | DSÖ GHE, 2019 ve 2023, 7 yaş grubu × cinsiyet | Diğer yıllar (2000, 2010, 2015, 2020-2022) indirilmedi; Türkçe neden adları yok (sadece İngilizce). | Aynı DSÖ sayfasında yıl başına dosya var (scripts/veri/indir.py'ye eklenir). Türkçe adlar Anlatı departmanının işi. |

## 3. Dikkat: doğru ama yanlış kullanılabilecek veriler

1. **DSÖ ile BM'nin toplam ölüm sayısı farklı.** DSÖ GHE toplamı / BM WPP ölüm sayısı (2023): TUR 1,00 · IND 1,09 · NGA **0,68** · CHN 0,99 · USA 1,04. Bu yüzden **ölüm olasılığı BM yaşam tablosundan**, **ölüm nedeni sadece pay olarak DSÖ'den** alınmalı (motor: "bu yıl ölüyor mu?" → WPP qx; "neden?" → GHE payı). DSÖ'nün kendi veri kalite kodu: USA 1, TUR 2, IND/NGA/CHN 4 (dosyada `dsoVeriKaliteKodu`).
2. **Türkiye 2023 ölüm nedeni verisi kullanılmaz (Kalite denetimi O1, şart).** DSÖ'de deprem görünüyor ("Natural disasters" toplamı 52,8 bin), ama 15-29 yaşta toplam ölüm 2019'da 8,75 bin, 2023'te 33,98 bin: **kadın 2,35 → 16,64 bin (×7, afet 5,38 bin)**, erkek 6,40 → 17,34 bin (afet 1,63 bin). Afet dışındaki ~18 bin fazla ölüm başka nedenlere ("Other neurological conditions", epilepsi, solunum enfeksiyonları) dağılmış; BM WPP yaşam tablosundan bu yaşta yaklaşık üçte biri kadar ölüm çıkıyor (Kalite'nin kaba hesabı: ~5,7 bin K, ~6,1 bin E). Nedeni kaynakta açıklanmıyor. **Kural:** Ölüm nedeni için varsayılan yıl `2019` (`olumNedenleri.varsayilanYil`). Türkiye 2023 dosyada `olaganDisi: true`, `kullanilmasin: true` ve açıklama notuyla işaretli; motor bu yılın paylarını kullanmaz, deprem ayrı olay olarak işlenir.
3. **Gini/ondalık payları gelir ya da tüketime dayalı.** TUR ve USA gelir; IND, NGA, CHN (son anketler) tüketim. Tüketime dayalı Gini genellikle gelire dayalı Gini'den düşük çıkar (ör. IND 2023: 23,0). Ülkeler arası doğrudan kıyaslanmamalı. `refahTuru` alanı her ankette yazılı.
4. **Kentleşme ulusal tanımlara dayanıyor** (BM WUP "national definitions"). Türkiye %89 çıkıyor; tanımlar ülkeden ülkeye farklı olduğu için kır/kent çekilişinde ülkeler arası kıyas sınırlı.
5. **2024 sonrası projeksiyon.** WPP 2024'te 2023'e kadar tahmin, 2024-2100 orta varyant projeksiyonu. Bugün 2026; "bugün" modundaki doğumlar da projeksiyondur.
6. **countries.json'ın yılı (2023) Türkiye için deprem yılı, olağan dışı (Kalite O3).** Kadın e0 79,86 (2022: 80,72; 2024: 80,34), 5 yaş altı ölüm binde 13,1 (2022: 9,6; 2024: 11,3). Türkiye kaydında `yearNote` alanı var; bu tek yıllık değerler "bugünün Türkiye'si" diye gösterilmemeli. Yaşam tabloları dönem tablosu olduğu için motorun her takvim yılını kendi `qx`'iyle kullanması doğru. 2023'te başka ülkelerde de şok vardı (Kalite'nin notu: Sudan'daki savaş, Libya Derne seli, Fas depremi); bunlar MVP dışında, K1 genişlerken kontrol edilecek.
7. **Togo:** BM 2026-01-19'da sadece Togo'yu düzeltti (nüfus ~%10 aşağı). v1 düzeltilmiş Togo'yu kullanır. BM dünya ve bölge toplamlarını güncellemedi, bu yüzden "dünya satırı" ülke toplamından küçük bir fark verir (2023: 21.307 doğum). Ayrıntı: `docs/devir/2026-11-26-veri.md`.
8. **DSÖ tablosunun küçük iç farkları:** Bazı hücrelerde alt nedenlerin toplamı "All Causes"tan en çok %0,07 sapıyor (en büyüğü Hindistan). Fark dağıtılmadı, `dagitilmamis` kalemi olarak yazıldı (69 hücre, liste `rapor.json` → `gheIcFarklar`).
9. **DSÖ GHE verisinin lisansı net değil.** Excel dosyasında ve GHE sayfasında lisans yazmıyor. Daha önce yazdığım "CC BY-NC-SA 3.0 IGO" DSÖ'nün **yayınlarının** lisansı, bu veri için yazılı değil (düzeltildi). DSÖ'nün iki resmî sayfası farklı şey söylüyor:
   - [data.who.int şartları](https://data.who.int/redirect-pages/footer/learn-more/terms-and-conditions): CC BY 4.0 + DSÖ ek şartları (DSÖ'nün onayladığı ima edilemez; DSÖ adı ve amblemi yazılı izinsiz kullanılamaz).
   - [who.int veri politikası şartları](https://www.who.int/about/policies/publishing/data-policy/terms-and-conditions): kullanım hakkı "kamu sağlığı amaçlı"; ticari bir girişimin tanıtımında kullanılamaz, satılamaz; tabloları yayının biçimine uydurmak için küçük uyarlama serbest, başka değişiklik DSÖ'nün yazılı iznini ister; DSÖ'ye ve veriyi sağlayan ülkelere atıf zorunlu.
   - Belirsiz kalanlar: bir oyunun "kamu sağlığı amaçlı" sayılıp sayılmadığı; ham sayıları paya çevirmenin "değiştirme" sayılıp sayılmadığı. Kişisel ve reklamsız kullanımda (karar 2) pratik risk düşük. Yayın düşünülürse DSÖ'den izin istenmeli ya da başka kaynak (ör. IHME GBD, onun da kendi şartları var) bulunmalı.
10. **5 yaş altı ölümde iki BM kaynağı var (Kalite K2).** Dosyadaki değer BM WPP; Dünya Bankası ve OWID'deki UN IGME. 2023 (binde, WPP / IGME): NGA 104,2 / 116,8. Oyun içi testler WPP ile kıyaslanmalı.
11. **Ham veri sürümü:** BM WPP, UNDP HDR, DSÖ dosyaları sabit sürümlü. Dünya Bankası WDI ve PIP canlı API; `MANIFEST.json`'da `surumSabit: false` ve WDI için `apiSonGuncelleme` (2026-11-11) yazılı. `indir.py --yeniden` parmak izi değişen dosyanın üzerine yazmaz, yanına `.yeni-<tarih>` koyar ve uyarır (Kalite O4).

## 4. Bu sürümde bilerek yapılmayanlar

- Yaşam tablosu, doğurganlık, gelir dilimleri ve ölüm nedenleri sadece 5 MVP ülkesi için çıkarıldı. Ham dosyalar 237 ülkeyi içeriyor; `scripts/veri/donustur.py` içindeki `MVP` listesine ülke eklemek yeterli (dosya başına ~470 KB).
- Bölge (K2) düzeyi ölüm nedeni dağılımı çıkarılmadı (ülke düzeyi elde olduğu için gerekmedi).
- Dünya ve Kültür'ün TUR.json'daki `veriAnahtari` önerileri (ör. `tuik.evlenme.ilkEvlilikYasOrt`) TÜİK verisi istiyor; bu sürümde TÜİK verisi çekilmedi.
- Elektrik erişimi, konut tipi (Görsel'in isteği), anne ölümü, çocuk evliliği, çatışma, yaşam memnuniyeti: v2.
