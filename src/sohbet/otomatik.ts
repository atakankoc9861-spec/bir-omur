// Otomatik oyuncu: testler ve denge raporu için üç tarz (hep ders, hep arkadaş, karışık).
import "./icerik";
import { Game } from "./motor";

export type Strateji = "ders" | "arkadas" | "karisik";
const ONCELIK = ["ilgi", "kanka", "kardes", "anne", "etut", "baba", "aile", "patron", "sinif", "rehber"];

/** Bir yılı baştan sona oynar. Ay içinde önce mesajları okur, sonra önceliğe göre cevaplar. */
export function oyna(seed: number, st: Strateji): Game {
  const g = new Game(seed);
  let n = 0;
  while (!g.ended) {
    g.startMonth();
    let cevap = 0;
    for (let tur = 0; tur < 20; tur++) {
      g.flush();
      const acik = g.asks.filter((x) => !x.answered).sort((a, b) => ONCELIK.indexOf(a.beat.chat) - ONCELIK.indexOf(b.beat.chat));
      let degisti = false;
      for (const a of acik) {
        n++;
        const zorunlu = a.beat.id === "tercih" || a.beat.m >= 10;
        const want = zorunlu || st === "arkadas" || (st === "karisik" && cevap < 2 && (seed + n) % 3 !== 0);
        if (st === "karisik" && (seed + n) % 2 === 0) g.openChat(a.beat.chat);
        if (!want) continue;
        const ok = a.opts.map((o, i) => i).filter((i) => g.canAfford(a.opts[i]));
        if (!ok.length) continue;
        g.answer(a, st === "karisik" ? ok[(seed + n) % ok.length] : ok[0]);
        cevap++;
        degisti = true;
      }
      if (!degisti && !g.queue.length) break;
    }
    g.endMonth();
  }
  return g;
}
