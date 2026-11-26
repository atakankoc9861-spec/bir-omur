// prototype/sohbet-demo.html üretir: "dem" sohbet demosu, tek dosya, internetsiz.
// Çalıştır: npm run sohbet:derle
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const res = await build({
  entryPoints: ["src/sohbet/arayuz.ts"],
  bundle: true,
  format: "iife",
  minify: true,
  target: "es2019",
  write: false,
  legalComments: "none",
  loader: { ".json": "json" },
});
const js = res.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const css = readFileSync("src/sohbet/stil.css", "utf8");
const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#15111a">
<title>dem · Bir Ömür</title>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script>${js}</script>
</body>
</html>
`;
mkdirSync("prototype", { recursive: true });
writeFileSync("prototype/sohbet-demo.html", html);
console.log(`prototype/sohbet-demo.html yazıldı (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
