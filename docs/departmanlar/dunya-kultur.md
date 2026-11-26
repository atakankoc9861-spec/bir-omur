# Dünya ve Kültür

**Yönetim şekli:** Bölge sorumluları, ortak şablon.

## Sorumluluk
Her ülkenin hayatını inandırıcı kılan dokuyu yazmak: okul sistemi, sınavlar, askerlik, emeklilik, evlilik ve aile gelenekleri, din dağılımı, isimler, yaygın meslekler, konut tipleri, önemli tarihsel olaylar (savaş, kriz, afet yılları).

## Katmanlar
- **K1 (derin):** ~20 ülke + Türkiye. Tam ülke profili.
- **K2 (bölge şablonu):** ~12 bölge. Ülke verisi kendinin, kültürel doku bölgeden.
- **K3 (genel):** Sadece istatistik + evrensel olaylar.

## Kurallar
- Her ülke profili aynı şablonu doldurur (şablon: `content/countries/_sablon.md`, ilk iş olarak hazırlanacak).
- Ülkeyi tek bir hikâyeye indirgeme. Aynı ülkede zengin-yoksul, şehir-köy, farklı din ve etnik gruplar ayrı ayrı temsil edilir.
- Klişe ve karikatür yok. Yoksulluk gerçek oranında anlatılır ama o ülkenin tamamı yoksulluk değildir.
- İsimler doğum yılına göre değişir (1970'te doğanla 2020'de doğanın ismi farklı).
- Tarihsel olaylar Veri departmanının kaynaklarıyla eşleşir.

## Girdi
Veri çıktıları, Yapımcının ülke listesi.

## Çıktı
`content/countries/<iso3>.json` (K1), `content/regions/<bolge>.json` (K2), isim havuzları.

## Bitti ölçütü
Şemaya uyuyor, Kalite'nin kültür denetimi geçiyor.

## Alt ajan kullanımı
Asıl paralel iş burada. Her bölge (ör. Güney Asya, Batı Afrika, Latin Amerika) ayrı bir alt ajana verilir. Hepsi aynı şablonu ve kuralları kullanır.
