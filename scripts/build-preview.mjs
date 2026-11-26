// prototype/sahne.html üretir: tüm kod tek dosyaya gömülür, internet/dış dosya gerekmez.
// Çalıştır: npm run sahne:onizleme
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";

const res = await build({
  entryPoints: ["src/scene/preview.ts"],
  bundle: true,
  format: "iife",
  minify: true,
  target: "es2019",
  write: false,
});
const js = res.outputFiles[0].text.replace(/<\/script/g, "<\\/script");

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#16141c">
<title>Bir Ömür — yaşayan sahne önizlemesi</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #16141c; color: #e8e2d6; font: 15px/1.4 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 520px; margin: 0 auto; min-height: 100vh; display: flex; flex-direction: column; }
  .stage { background: #000; display: flex; justify-content: center; }
  canvas { display: block; image-rendering: pixelated; image-rendering: crisp-edges; }
  .check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #a8a0b4; }
  .check input { width: 20px; height: 20px; accent-color: #e0a050; }
  .text { padding: 10px 14px 4px; }
  #caption { font-size: 15px; }
  #family { font-size: 13px; color: #b8b0a4; margin-top: 4px; }
  #meta { font-size: 11px; color: #6e687a; margin-top: 6px; word-break: break-all; }
  .controls { margin-top: auto; padding: 10px 14px calc(14px + env(safe-area-inset-bottom)); display: grid; gap: 10px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  label { font-size: 12px; color: #a8a0b4; display: grid; gap: 3px; }
  select, input[type=range] { width: 100%; }
  select { background: #24212c; color: #e8e2d6; border: 1px solid #3a3644; border-radius: 10px; padding: 9px 8px; font-size: 15px; }
  input[type=range] { accent-color: #e0a050; height: 32px; }
  button { border: 0; border-radius: 14px; padding: 15px; font-size: 17px; font-weight: 600; color: #1a1410; background: #e0a050; }
  button.alt { background: #34303e; color: #e8e2d6; font-weight: 500; font-size: 15px; padding: 12px; }
  .age { display: flex; justify-content: space-between; }
</style>
</head>
<body>
<main>
  <div class="stage"><canvas id="scene" width="160" height="120"></canvas></div>
  <div class="text">
    <div id="caption"></div>
    <div id="family"></div>
    <div id="meta"></div>
  </div>
  <div class="controls">
    <label><span class="age"><span>Yaş</span><b id="ageVal">0</b></span><input id="age" type="range" min="0" max="95" value="30"></label>
    <div class="row">
      <label>Bölge<select id="region"><option value="akdeniz">Akdeniz / Orta Doğu</option><option value="bati-afrika">Batı Afrika</option></select></label>
      <label>Gelir dilimi<select id="income"><option>1</option><option>2</option><option selected>3</option><option>4</option><option>5</option></select></label>
      <label>Yerleşim<select id="urban"><option value="1">Şehir</option><option value="0">Köy</option></select></label>
      <label>Mekân<select id="place"><option value="auto">Otomatik</option><option value="home">Ev içi</option><option value="outside">Dışarı</option></select></label>
      <label>Mevsim<select id="season"><option value="spring">İlkbahar</option><option value="summer">Yaz</option><option value="autumn">Sonbahar</option><option value="winter">Kış</option></select></label>
      <label>Gün saati<select id="time"><option value="dawn">Şafak</option><option value="day">Gündüz</option><option value="dusk">Akşam</option><option value="night">Gece</option></select></label>
    </div>
    <label class="check"><input type="checkbox" id="marker"> Oyuncuyu işaretle (deneme, varsayılan kapalı)</label>
    <div class="row">
      <button class="alt" id="newlife">Yeni hayat</button>
      <button class="alt" id="play">▶ Hayatı oynat</button>
    </div>
    <button id="random">Rastgele hayat anı</button>
  </div>
</main>
<script>${js}</script>
</body>
</html>
`;
mkdirSync("prototype", { recursive: true });
writeFileSync("prototype/sahne.html", html);
console.log(`prototype/sahne.html yazıldı (${(html.length / 1024).toFixed(0)} KB)`);
