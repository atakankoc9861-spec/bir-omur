# Veri Planı

Tüm rakamlar birincil kaynaktan çekilip `scripts/` altındaki dönüştürücülerle `data/processed/` içine sürümlü JSON olarak yazılacak. Oyunda uydurma rakam kullanılmayacak.

| Veri | Kaynak |
|---|---|
| Ülke bazında doğum sayısı, nüfus, doğurganlık | BM World Population Prospects 2024 |
| Cinsiyete göre yaşam tabloları, bebek ve 5 yaş altı ölüm | BM WPP 2024 |
| Kişi başı GSYH (PPP), Gini, kentleşme, tarımda istihdam | Dünya Bankası WDI |
| Okullaşma, ortalama eğitim yılı | UNESCO UIS / Dünya Bankası |
| Ölüm nedenleri (yaş ve bölgeye göre) | DSÖ Küresel Sağlık Tahminleri |
| Anne ölümü, HIV, sigara, cep harcaması | DSÖ / Dünya Bankası |
| Çocuk evliliği | UNICEF |
| Çatışma | UCDP / PRIO |
| Yaşam memnuniyeti | Dünya Mutluluk Raporu |
| Türkiye detayları (asgari ücret, enflasyon, il nüfusu) | TÜİK |

Not: Bu çalışma ortamı bu sitelere doğrudan erişemiyor. Veri dosyaları bir sonraki adımda ya senin bilgisayarından indirilecek ya da erişimi olan bir ortamda çekilecek.
