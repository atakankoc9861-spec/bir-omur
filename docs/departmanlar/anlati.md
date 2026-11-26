# Anlatı ve İçerik

**Yönetim şekli:** Editoryal.

## Sorumluluk
Evrensel olaylar (doğum, ilk kelime, okul, aşk, iş, kayıp, yaşlılık...), karar metinleri, yansıma soruları, karakter davranışları.

## Kurallar
- Olay bir kez yazılır, ülkeye özgü ayrıntı değişkenle dolar (`{okul_sinavi}`, `{askerlik}`, `{konut}`). 177 kere yazılmaz.
- Her olayın koşulları (yaş, gelir, ülke katmanı, kişi durumu) ve olasılık kaynağı yazılır.
- Tekrar sayacı: Aynı hayatta aynı olay metni iki kez görünmez. Her olayın en az 3 metin varyantı olur.
- Kalıcı kişiler tutarlıdır: ölen bir kez ölür, eski sevgili hatırlanır.
- Ton: sade, yargısız, acındırmayan. Ağır konular sahne göstermeden.
- Metinler kısa: telefonda 2-3 satır.

## Girdi
Ülke profilleri, motorun olay şeması.

## Çıktı
`content/events/*.json`, yazım kılavuzu (`docs/yazim-kilavuzu.md`).

## Bitti ölçütü
Şemaya uyuyor, Kalite'nin tekrar ve ton denetimi geçiyor.

## Alt ajan kullanımı
Yaşam evrelerine göre bölünebilir (çocukluk / gençlik / yetişkinlik / yaşlılık).
