// Toplu simülasyon: npx vite-node scripts/denge/rapor.ts [hayat sayısı] [period|cohort]
import { Game, enableStats } from "../../src/engine/game";
import { loadGameData } from "../../src/engine/load-raw";
import { lifeExpectancyAtBirth } from "../../src/engine/data-v1";
import { RAW_MVP } from "../../src/engine/load-raw";

const N = +(process.argv[2] ?? 2000);
const mode = (process.argv[3] ?? "cohort") as "period" | "cohort";
const force = process.argv[4] === "ulke-basina";
const ISOS = ["TUR", "IND", "NGA", "CHN", "USA"];
const data = loadGameData();
const ST = enableStats();
const per: Record<string, { n: number; age: number; u5: number; f: number; kids: number; married: number; uni: number; entries: number; dups: number; decisions: number; crit: number; hashes: number }> = {};
let seed = 1, playable = 0, tries = 0;
const t0 = Date.now();
while (playable < N) {
  tries++;
  seed++;
  let g: Game;
  try { g = new Game(data, seed, { mortality: mode, forceCountry: force ? ISOS[playable % 5] : undefined }); } catch { continue; }
  playable++;
  const k = g.country.iso3;
  const r = (per[k] ??= { n: 0, age: 0, u5: 0, f: 0, kids: 0, married: 0, uni: 0, entries: 0, dups: 0, decisions: 0, crit: 0, hashes: 0 });
  let decisions = 0;
  while (!g.finished) {
    const rep = g.step();
    if (rep.decision) { decisions++; g.choose(g.autoChoose()); }
  }
  r.n++; r.age += g.s.deathAge!; if (g.s.deathAge! < 5) r.u5++; if (g.s.sex === "female") r.f++;
  r.kids += g.s.people.filter((p) => p.role === "child").length;
  if (g.s.people.some((p) => (p.role === "partner" || p.role === "ex") && p.married) || g.has("evli") || g.has("bosandi")) r.married++;
  if (g.s.edu === "tertiary") r.uni++;
  const texts = g.s.log.map((e) => e.text);
  r.entries += texts.length; r.dups += texts.length - new Set(texts).size; r.decisions += decisions; r.crit += g.s.criticalCount;
  r.hashes += texts.filter((t) => t.includes("#")).length;
}
console.log(`${N} oynanabilir hayat (${tries} çekiliş), mod=${mode}, ${((Date.now() - t0) / 1000).toFixed(1)} sn`);
for (const f of RAW_MVP) {
  const iso = f.meta.iso3, r = per[iso];
  if (!r) continue;
  const lt = f.yasamTablosu, i = 2026 - lt.yilBas;
  const cohort = (sx: "female" | "male") => { const q = Array.from({ length: 100 }, (_, a) => lt[sx].qx[Math.min(lt.yilSon, 2026 + a) - lt.yilBas][a]); return lifeExpectancyAtBirth(q, lt[sx].a0[i], lt[sx].eAcik[lt.yilSon - lt.yilBas]); };
  const e0f = mode === "period" ? lifeExpectancyAtBirth(lt.female.qx[i], lt.female.a0[i], lt.female.eAcik[i]) : cohort("female");
  const e0m = mode === "period" ? lifeExpectancyAtBirth(lt.male.qx[i], lt.male.a0[i], lt.male.eAcik[i]) : cohort("male");
  const fs = r.f / r.n;
  console.log(`${iso} n=${r.n} ortÖlümYaşı=${(r.age / r.n).toFixed(1)} (BM e0 ${mode === "period" ? "2026 dönem" : "2026 kuşağı"} ≈ ${(fs * e0f + (1 - fs) * e0m).toFixed(1)}) u5=${((1000 * r.u5) / r.n).toFixed(1)}‰ (BM ${f.seriler.under5Mortality.degerler[2026 - 1950].toFixed(1)}) çocuk/hayat=${(r.kids / r.n).toFixed(2)} evli=${((100 * r.married) / r.n).toFixed(0)}% üni=${((100 * r.uni) / r.n).toFixed(0)}% satır/hayat=${(r.entries / r.n).toFixed(0)} tekrar=${r.dups} '#'=${r.hashes} karar/hayat=${(r.decisions / r.n).toFixed(1)} kritik/hayat=${(r.crit / r.n).toFixed(1)}`);
}

console.log("ortalama ölüm çarpanı", (ST.sum / ST.n).toFixed(3), "yaş onlukları sağlık çarpanı", ST.byAge.map((x, i) => (x / ST.cnt[i]).toFixed(2)).join(" "));
