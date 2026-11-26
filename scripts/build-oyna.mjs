// prototype/oyna.html üretir: motor + sahne + arayüz + veri tek dosyada, internetsiz çalışır.
// Çalıştır: npm run oyna:derle  (önce scripts/oyna-veri.ts dist/oyna-veri.json üretir)
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

if (!existsSync("dist/oyna-veri.json")) {
  console.error("dist/oyna-veri.json yok. Önce: npx vite-node scripts/oyna-veri.ts");
  process.exit(1);
}

const virtualData = {
  name: "oyna-veri",
  setup(b) {
    b.onResolve({ filter: /^virtual:oyna-veri$/ }, () => ({ path: "oyna-veri", namespace: "oyna-veri" }));
    b.onLoad({ filter: /.*/, namespace: "oyna-veri" }, () => ({ contents: readFileSync("dist/oyna-veri.json", "utf8"), loader: "json" }));
  },
};

const res = await build({
  entryPoints: ["src/ui/main.ts"],
  bundle: true,
  format: "iife",
  minify: true,
  target: "es2019",
  write: false,
  plugins: [virtualData],
  legalComments: "none",
});
const js = res.outputFiles[0].text.replace(/<\/script/g, "<\\/script");
const css = readFileSync("src/ui/style.css", "utf8");

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#16141c">
<title>Bir Ömür</title>
<style>${css}</style>
</head>
<body>
<div id="app"></div>
<script>${js}</script>
</body>
</html>
`;
mkdirSync("prototype", { recursive: true });
writeFileSync("prototype/oyna.html", html);
console.log(`prototype/oyna.html yazıldı (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB)`);
