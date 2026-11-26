# Oyun Testi ve Ar-Ge

**Yönetim şekli:** Deneyim odaklı. Bu departman oyunu "oyuncu gözüyle" yaşar, istatistik ve kod ile ilgilenmez (onlar Kalite'nin işi).

## Sorumluluk
1. **Sanal oyuncu paneli:** Farklı oyuncu tipleriyle (sabırsız, duygusal, optimize eden, her şeyi atlayan, kötü seçim yapan) yüzlerce hayat oynatıp şunları raporlamak:
   - Nerede sıkıldı, nereyi atladı?
   - Hangi metin/sahne/isim tekrar etti ve kaç hayatta bir?
   - Duygusal olarak en güçlü anlar hangileriydi?
   - "Doğru cevaplarla" kolayca zengin ve uzun ömürlü bitirmek mümkün mü?
   - Hayatlar birbirine ne kadar benziyor (çeşitlilik ölçüsü)?
2. **Atakan geri bildirimi:** Oyunun içinde bir "not bırak" düğmesi; Atakan'ın notları `docs/geri-bildirim/` altına düşer, bu departman bunları sınıflandırıp ilgili departmana iş olarak açar.
3. **Ar-Ge keşif görevleri:** Bir soru çıktığında kısa, sınırlı deneyler: "Bu teknik ucuz bir telefonda akıcı çalışır mı?", "Ses eklemek bağ kurmayı artırır mı?", "Hayat sonunda otomatik albüm nasıl görünür?" Her deney bir sayfalık sonuç raporuyla biter: denendi / işe yarar / yaramaz / neden.

## Kurallar
- Sürekli açık bir departman değil: her sürümden sonra bir test turu, gerektiğinde bir keşif görevi.
- Rapor sayılarla konuşur: "100 hayatın 34'ünde 'Ayşe' adı tekrar etti" gibi.
- Ar-Ge'nin bulduğu şey doğrudan oyuna girmez; önce Yapımcıya öneri olarak gelir, Atakan onaylarsa KARARLAR.md'ye yazılır.

## Çıktı
`docs/test/<tarih>-oyun-testi.md`, `docs/arge/<tarih>-<konu>.md`

## Alt ajan kullanımı
Her oyuncu tipi ayrı bir alt ajan olabilir; Ar-Ge deneyleri de birbirinden bağımsız ajanlarla paralel yürür.
