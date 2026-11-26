// oyna.html'e gömülecek sıkıştırılmış veriyi üretir: dist/oyna-veri.json
import { mkdirSync, writeFileSync } from "node:fs";
import { loadGameData } from "../src/engine/load-raw";

const d = loadGameData();
mkdirSync("dist", { recursive: true });
const json = JSON.stringify(d);
writeFileSync("dist/oyna-veri.json", json);
console.log(`dist/oyna-veri.json yazıldı (${(json.length / 1024).toFixed(0)} KB)`);
for (const [k, v] of Object.entries(d.countries)) console.log(" ", k, (JSON.stringify(v).length / 1024).toFixed(0), "KB");
console.log("  doğumlar", (JSON.stringify(d.births).length / 1024).toFixed(0), "KB; isimler", (JSON.stringify(d.names).length / 1024).toFixed(0), "KB; TUR kuralları", (JSON.stringify(d.tur).length / 1024).toFixed(0), "KB");
