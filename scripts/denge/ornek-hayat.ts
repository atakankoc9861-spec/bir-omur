// Bir hayatın tüm metnini yazdırır: npx vite-node scripts/denge/ornek-hayat.ts <ülke> <tohum> [cinsiyet]
import { Game } from "../../src/engine/game";
import { loadGameData } from "../../src/engine/load-raw";
const [iso = "TUR", seedS = "1", sex] = process.argv.slice(2);
const data = loadGameData();
let seed = +seedS, g: Game;
for (;;) { g = new Game(data, seed, { forceCountry: iso }); if (!sex || g.s.sex === sex) break; seed++; }
console.log(`# ${g.s.name || "(isimsiz)"} · ${g.country.nameTr} · ${g.s.sex} · ${g.s.urban ? "şehir" : "köy"} · ondalık ${g.s.familyDecile} · tohum ${seed}`);
while (!g.finished) {
  const r = g.step();
  for (const e of r.entries) console.log(`${r.age}\t${e.key.endsWith(":soru") ? "?" : " "} ${e.text}${e.stat ? `  [${e.stat.text}]` : ""}`);
  if (r.decision) { console.log("\t  » " + r.decision.options.map((o) => o.label + (o.locked ? ` (KİLİTLİ: ${o.locked})` : "")).join(" | ")); const id = g.autoChoose(); const before = r.entries.length; g.choose(id); console.log(`\t  → ${id}`); for (const e of r.entries.slice(before)) console.log(`${r.age}\t  ${e.text}`); }
}
