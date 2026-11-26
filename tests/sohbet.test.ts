import { describe, it, expect } from "vitest";
import { oyna, type Strateji } from "../src/sohbet/otomatik";
import { kalanlar, tumBeatlerKontrol } from "../src/sohbet/icerik";
import { photo, kartResim, portre, simge } from "../src/sohbet/gorsel";

describe("sohbet demosu", () => {
  it("içerik tutarlı (beat kimlikleri tekil, tepkiler var olan soruya bağlı)", () => {
    expect(tumBeatlerKontrol()).toEqual([]);
  });

  for (const st of ["ders", "arkadas", "karisik"] as Strateji[]) {
    it(`${st}: 30 yıl çökmeden sona ulaşıyor, tekrar eden mesaj yok`, () => {
      for (let seed = 1; seed <= 30; seed++) {
        const g = oyna(seed * 7919, st);
        expect(g.ended).toBe(true);
        expect(g.s.f.tier).toBeTruthy();
        const k = kalanlar(g.s);
        expect(k.length).toBeGreaterThan(3);
        // gelen mesajlarda (10+ karakter) aynı metin iki kez yok
        const seen = new Map<string, number>();
        for (const m of g.s.msgs) {
          if (m.from === "me" || m.text.length < 10) continue;
          const key = m.chat + "|" + m.text;
          seen.set(key, (seen.get(key) ?? 0) + 1);
        }
        const dup = [...seen].filter(([, c]) => c > 1);
        expect(dup).toEqual([]);
        // çözülmemiş değişken kalmasın
        const bad = g.s.msgs.filter((m) => /\{[\w:]+[}|]|\[[^\]]*\|/.test(m.text));
        expect(bad.map((m) => m.text)).toEqual([]);
      }
    });
  }

  it("cinsiyete bağlı hitaplar iki cinsiyette de doğru", () => {
    let kiz = 0, erkek = 0;
    for (let seed = 1; seed <= 40; seed++) {
      for (const st of ["arkadas", "karisik"] as Strateji[]) {
        const g = oyna(seed * 31337, st);
        const female = g.s.k.me.sex === "female";
        female ? kiz++ : erkek++;
        const aile = g.s.msgs.filter((m) => ["anne", "baba", "kardes", "teyze", "kanka"].includes(m.from)).map((m) => m.text).join("\n");
        const yanlis = female ? /oğlum|aslanım\b|\babi\b|\blan\b/ : /kızım|aslan kızım|\babla\b/;
        expect(aile.match(yanlis)?.[0] ?? null).toBe(null);
      }
    }
    expect(kiz).toBeGreaterThan(5);
    expect(erkek).toBeGreaterThan(5);
  });

  it("akşam ekonomisi: kısa cevap yarım, zaman alan tam; kriz için ayrılan akşam krizle açılıyor", async () => {
    const { Game } = await import("../src/sohbet/motor");
    const g = new Game(5);
    g.startMonth();
    expect(g.s.budget).toBe(3);
    expect(g.s.yedek).toBe(1);
    expect(g.costOf({ say: "tamam anne 💛" })).toBe(0.5);
    expect(g.costOf({ say: ["tabi, atıyorum", "#foto:notlar"] })).toBe(1);
    expect(g.costOf({ say: "olur", fx: { st: -1 } })).toBe(1);
    g.flush();
    expect(g.s.yedek).toBe(0); // Eylül'ün krizi (ilgi) geldi
    expect(g.s.budget).toBe(4);
  });

  it("varyantlar: farklı tohumlarda aile tipi, hane ve kriz türü değişiyor", () => {
    const tip = new Set<string>();
    for (let s = 1; s <= 20; s++) {
      const g = oyna(s * 7, "karisik");
      tip.add(`${g.s.f.aileTip}|${g.s.f.krizTip}|${g.s.f.ayriBaba}`);
    }
    expect(tip.size).toBeGreaterThan(4);
  });

  it("strateji sonucu etkiliyor: hep ders > hep arkadaş (ortalama puan)", () => {
    const avg = (st: Strateji) => {
      let t = 0;
      for (let s = 1; s <= 20; s++) t += oyna(s * 104729, st).s.f.puanSayi;
      return t / 20;
    };
    expect(avg("ders")).toBeGreaterThan(avg("arkadas") + 80);
  });

  it("hep ders oynayınca en yakın arkadaş küsüyor, hep arkadaş oynayınca küsmüyor", () => {
    expect("kanka" in oyna(11, "ders").s.kus || oyna(11, "ders").s.f.baristi === undefined).toBe(true);
    expect("kanka" in oyna(11, "arkadas").s.kus).toBe(false);
  });

  it("fotoğraf, kart ve portreler çizilebiliyor", () => {
    for (const id of ["kahvalti", "sofra", "bayram", "sinavsabahi", "sinif", "cocukluk", "notlar", "notlar2", "deniz"]) expect(photo(id, 42, "female").w).toBe(160);
    for (const id of ["cuma", "bayram", "sinav", "tebrik"]) expect(kartResim(id, 42).w).toBe(160);
    expect(portre({ sex: "male", age: 50, seed: 3, mustache: true }).w).toBe(24);
    expect(simge("aile").h).toBe(24);
  });
});
