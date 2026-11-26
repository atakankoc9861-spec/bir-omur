"""İlk 30 saniyeyi normal hızda kaydeder + dokunma alanlarını ölçer."""
import sys, pathlib, json
from playwright.sync_api import sync_playwright
html = pathlib.Path(sys.argv[1]).resolve().as_uri(); out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type in ("error", "warning") else None)
    pg.goto(f"{html}?tohum=777")
    for t in (1, 4):
        pg.wait_for_timeout(1500 if t == 1 else 3000); pg.screenshot(path=str(out / f"t{t:02d}.png"))
    pg.click("#ac"); pg.wait_for_timeout(1500); pg.screenshot(path=str(out / "t06-liste.png"))
    pg.wait_for_timeout(6000); pg.screenshot(path=str(out / "t12-liste.png"))
    if pg.query_selector("#ipucu"): pg.click("#ipucu", force=True)
    pg.click('.satir[data-c="aile"]'); pg.wait_for_timeout(5000); pg.screenshot(path=str(out / "t18-aile.png"))
    pg.wait_for_timeout(8000); pg.screenshot(path=str(out / "t26-aile.png"))
    small = pg.evaluate("[...document.querySelectorAll('button,.satir,[onclick]')].map(e=>{const r=e.getBoundingClientRect();return [e.id||e.className,Math.round(r.width),Math.round(r.height)]}).filter(x=>x[1]<44||x[2]<44)")
    pg.click("#geri"); pg.wait_for_timeout(500)
    # durum paneli (karar 36): yukarıdan aşağı kaydırma / akşam düğmesi
    if pg.query_selector("#aksam"): pg.click("#aksam"); pg.wait_for_timeout(1000); pg.screenshot(path=str(out / "t30-panel.png"))
    b.close()
print(json.dumps({"errs": errs, "kucuk_dokunma": small}, ensure_ascii=False))
