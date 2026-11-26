# Bir Ömür (çalışma adı)

Gerçek dünya istatistiklerine dayalı, Android için bir hayat simülasyonu.

## Belgeler
- [docs/ARASTIRMA.md](docs/ARASTIRMA.md) — Benzer oyunlar, sevilen yönler, eleştiriler, fikirler
- [docs/TASARIM.md](docs/TASARIM.md) — Oyun tasarım taslağı ve MVP kapsamı
- [data/README.md](data/README.md) — Veri kaynakları ve işleme planı
- [KARARLAR.md](KARARLAR.md) — Verilen kararlar ve açık sorular
- [docs/departmanlar/](docs/departmanlar/) — 7 departmanın yönergeleri

## Yapı
```
src/engine/   Simülasyon motoru (saf TypeScript, arayüzden bağımsız)
src/scene/    Yaşayan sahne (kodla piksel sanat) — docs/stil-rehberi.md
src/ui/       Arayüz (sonra)
prototype/    sahne.html: telefonda açılan sahne önizlemesi
data/         Ham veri ve işlenmiş JSON
scripts/      Veri indirme/dönüştürme scriptleri
tests/        Motor testleri
```

## Komutlar
```
npm install
npm run typecheck
npm test
npm run sahne:ornek      # docs/gorsel-ornekler/ PNG'leri
npm run sahne:onizleme   # prototype/sahne.html
```
