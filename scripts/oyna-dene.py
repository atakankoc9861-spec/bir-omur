"""prototype/oyna.html'i başsız Chrome'da 390x844 açar, N hayatı otomatik oynatır, ekran görüntüsü alır.
Kullanım: python3 -I scripts/oyna-dene.py <oyna.html> <çıktı-klasörü> [hayat-sayısı]
"""
import sys, json, pathlib
from playwright.sync_api import sync_playwright

html = pathlib.Path(sys.argv[1]).resolve().as_uri()
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
N = int(sys.argv[3]) if len(sys.argv) > 3 else 3
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type in ("error", "warning") else None)
    pg.goto(html)
    pg.screenshot(path=str(out / "00-ana.png"))
    lives = 0; draws = 0
    while lives < N:
        pg.click("#dog") if pg.query_selector("#dog") else pg.click("#yeniden")
        draws += 1
        while pg.query_selector("#tekrar"):
            if draws == 1: pg.screenshot(path=str(out / "01-hazirlaniyor.png"))
            pg.click("#tekrar"); draws += 1
        pg.screenshot(path=str(out / f"L{lives}-0-dogum.png"))
        pg.click("#basla")
        pg.wait_for_timeout(300)
        # hızlı oynat: 0 hız, adımları elle tetikle
        pg.click(".spd[data-speed='0']")
        shots = {3: "a-cocukluk", 17: "b-genclik", 35: "c-yetiskin", 70: "d-yasli"}
        took_dec = False
        for step in range(400):
            st = pg.evaluate("window.__birOmur.state()")
            if st["finished"]:
                break
            if st["pending"] or pg.query_selector("#refl:not(.hidden)"):
                if not took_dec and st["pending"] and st["age"] and st["age"] >= 8:
                    pg.screenshot(path=str(out / f"L{lives}-karar-{st['age']}.png")); took_dec = True
                if pg.query_selector("#refl:not(.hidden)") and lives == 0:
                    pg.screenshot(path=str(out / f"L{lives}-yansima-{st['age']}.png"))
                pg.evaluate("window.__birOmur.auto()")
            else:
                pg.evaluate("window.__birOmur.tick()")
            a = pg.evaluate("window.__birOmur.state()")["age"]
            if a in shots:
                pg.wait_for_timeout(60)
                pg.screenshot(path=str(out / f"L{lives}-{shots.pop(a)}-{a}.png"))
        st = pg.evaluate("window.__birOmur.state()")
        pg.screenshot(path=str(out / f"L{lives}-e-olum.png"))
        pg.click("#ozet")
        pg.wait_for_timeout(200)
        pg.screenshot(path=str(out / f"L{lives}-f-ozet.png"))
        pg.screenshot(path=str(out / f"L{lives}-g-ozet-tam.png"), full_page=True)
        print(json.dumps({"hayat": lives, "ulke": st["country"], "yas": st["age"], "cekilis": draws}))
        lives += 1
    # kayıt/devam denemesi
    pg.click("#yeniden")
    while pg.query_selector("#tekrar"): pg.click("#tekrar")
    pg.click("#basla"); pg.click(".spd[data-speed='0']")
    for _ in range(25):
        if pg.evaluate("window.__birOmur.state()")["pending"]: pg.evaluate("window.__birOmur.auto()")
        else: pg.evaluate("window.__birOmur.tick()")
    before = pg.evaluate("window.__birOmur.state()")
    pg.reload(); pg.wait_for_timeout(200)
    pg.screenshot(path=str(out / "90-ana-devam.png"))
    pg.click("text=Kaldığın hayata devam et"); pg.wait_for_timeout(300)
    after = pg.evaluate("window.__birOmur.state()")
    pg.screenshot(path=str(out / "91-devam.png"))
    print(json.dumps({"kayit_once": before, "kayit_sonra": after}))
    b.close()
print("HATALAR:", errors if errors else "yok")
