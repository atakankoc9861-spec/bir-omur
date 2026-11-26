# Departmanlar

| Departman | Yönetim şekli | Ana çıktı |
|---|---|---|
| [Yapımcı](yapimci.md) | Tek doğruluk kaynağı | KARARLAR.md, plan, teknik altyapı |
| [Veri](veri.md) | Kanıt esaslı | data/processed/*.json |
| [Dünya ve Kültür](dunya-kultur.md) | Bölge sorumluları, ortak şablon | Ülke profilleri, bölge şablonları |
| [Simülasyon ve Denge](simulasyon.md) | Deney usulü | src/engine, denge raporları |
| [Anlatı ve İçerik](anlati.md) | Editoryal | Olaylar, karakter şablonları |
| [Görsel ve Arayüz](gorsel.md) | Stil rehberi | Sahne katmanları, ekranlar |
| [Kalite ve Hassasiyet](kalite.md) | Bağımsız denetim, veto | Test raporları, onay/red |
| [Oyun Testi ve Ar-Ge](oyun-testi-arge.md) | Deneyim odaklı, dönemsel | Sanal oyuncu raporları, deney raporları |

## Akış
Veri → Dünya ve Kültür → Anlatı ve İçerik → Simülasyon ve Denge → Görsel ve Arayüz → Kalite ve Hassasiyet → Atakan'ın onayı

Her sürümden sonra: Oyun Testi ve Ar-Ge → bulgular Yapımcıya → yeni işler.

## Her yönergede aynı başlıklar
Sorumluluk · Kurallar · Girdi · Çıktı · Bitti sayılma ölçütü · Alt ajan kullanımı
