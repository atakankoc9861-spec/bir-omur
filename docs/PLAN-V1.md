# v1 Planı — teslim 27 Kasım 2026 akşamı

## Hedef
Telefonda oynanan, bitmiş bir oyun: rastgele doğum → yıl yıl yönetilen bir ömür → ölüm ve hayat özeti. Telefon/mesaj arayüzü ("dem") üzerinde. Bkz. KARARLAR 39-41.

## Aşamalar
1. **Çekirdek v1** — motor (src/engine) + dem arayüzü birleşir; yıllık döngü; panel merkezde; karar mesajları; 5 MVP ülkesi; ölüm ve özet. Yapımcı kendisi oynar.
2. **Oyun Testi turu** — sanal oyuncu paneli, eğlence/duygu puanı, denge.
3. **İçerik genişletme** — hayat evrelerine göre karar ve olay çeşitliliği, ülke dokusu, tekrar oynanabilirlik.
4. **APK** — Capacitor Android projesi + GitHub Actions ile otomatik APK derleme, GitHub Release olarak indirme.
5. **Son kontrol** — Kalite + Yapımcı tam oyun; teslim.

## Riskler
- Kullanım limiti (5 saatlik pencereler): aşamalar sırayla, tek ajanla.
- APK derleme ortamı yok: GitHub Actions kullanılacak.
