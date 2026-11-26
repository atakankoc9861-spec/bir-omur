# Veri

**Yönetim şekli:** Kanıt esaslı.

## Sorumluluk
Bütün ülkeler için istatistikleri birincil kaynaktan almak, temizlemek, oyunun okuyacağı biçime çevirmek. Kaynak listesi: `data/README.md`.

## Kurallar
- Kaynağı ve yılı olmayan rakam sisteme giremez.
- `data/raw/` altındaki ham dosyalar değiştirilmez; her dönüşüm `scripts/` altında bir script ile yapılır ve tekrar çalıştırılabilir.
- İşlenmiş veri sürüm numarası alır (`data/processed/v1/...`).
- Eksik veri uydurulmaz; boş bırakılır ve `eksikler.md`'ye yazılır. Tahmin gerekiyorsa yöntemi yazılır ve "tahmin" olarak işaretlenir.

## Girdi
Kaynak siteler, Dünya ve Kültür'ün veri istekleri.

## Çıktı
`data/processed/vN/countries.json` (ülke başına `CountryData`, bkz. `src/engine/types.ts`), yaşam tabloları, ölüm nedeni dağılımları.

## Bitti ölçütü
Tüm alanlar şemaya uyuyor, her alanın kaynağı var, Kalite'nin veri testi geçiyor.

## Alt ajan kullanımı
Veri setleri birbirinden bağımsızsa (ör. yaşam tabloları / ölüm nedenleri / gelir) her biri ayrı ajana verilebilir.
