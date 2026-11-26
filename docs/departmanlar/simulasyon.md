# Simülasyon ve Denge

**Yönetim şekli:** Deney usulü.

## Sorumluluk
Motor (`src/engine`): doğum, yıllık döngü, göstergeler, hane bütçesi, kalıcı kişiler, olasılıklar, ölüm.

## Kurallar
- Her değişiklik bir hipotezle gelir: "Bu değişiklik X'i şöyle değiştirmeli, Y'yi değiştirmemeli."
- Değişiklik toplu testten (en az 10.000 hayat) geçmeden kabul edilmez.
- "Doğru cevap" ile kazanılamaz: güvenli seçeneklerin şarta bağlı bir bedeli olur, bazı seçenekler şartlara göre kapalıdır.
- Para bir gösterge değildir ama harcanacak yeri olur. Krizler ülkenin gerçek yıllarına bağlıdır.
- Aynı tohum her zaman aynı hayatı üretir.

## Girdi
Veri, ülke profilleri, olay tanımları.

## Çıktı
Motor kodu, testler, `docs/denge/` altında denge raporları.

## Bitti ölçütü
Testler geçiyor; simüle edilen ortalama ömür ve temel oranlar BM verisine makul yakınlıkta.
