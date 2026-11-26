"""prototype/sohbet-demo.html'i başsız Chrome'da 390x844 açar ve bir yıl oynar.
Kullanım: python3 -I scripts/sohbet-dene.py <html> <çıktı-klasörü> <ders|arkadas|karisik> [tohum] [hiz]
"""
import sys, pathlib, time
from playwright.sync_api import sync_playwright

html = pathlib.Path(sys.argv[1]).resolve().as_uri()
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
st = sys.argv[3]
seed = sys.argv[4] if len(sys.argv) > 4 else "12345"
hiz = sys.argv[5] if len(sys.argv) > 5 else "8"
errors = []
SHOT_MONTHS = {0, 2, 3, 6, 9, 10, 11}
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append("console: " + m.text) if m.type in ("error",) else None)
    pg.goto(f"{html}?tohum={seed}&hiz={hiz}")
    pg.wait_for_timeout(4800)
    pg.screenshot(path=str(out / "00-kilit.png"))
    pg.click("#ac")
    pg.wait_for_timeout(900)
    pg.screenshot(path=str(out / "01-liste.png"))
    if pg.query_selector("#ipucu"): pg.click("#ipucu")
    month = 0
    answered_total = 0
    visited = set()
    pending = lambda: pg.evaluate("__dem.g.asks.filter(a=>!a.answered).map(a=>a.beat.chat)")
    while month < 12:
        m = pg.evaluate("__dem.g.s.month")
        shot = m in SHOT_MONTHS
        n_ans = 0
        for _ in range(60):
            pg.wait_for_timeout(250)
            q = pg.evaluate("__dem.g.queue.length")
            rows = pg.query_selector_all(".satir")
            targets = [r.get_attribute("data-c") for r in rows if (r.query_selector(".nokta") or r.query_selector(".rozet"))]
            targets = [c for c in targets if (c, m) not in visited or st != "ders" and c in pending()]
            for c in targets[:1]:
                visited.add((c, m))
                try:
                    pg.click(f'.satir[data-c="{c}"]', timeout=3000)
                except Exception:
                    continue
                pg.wait_for_timeout(500 if shot else 150)
                # sesli mesajı aç
                v = pg.query_selector(".ses")
                if v and shot: v.click(); pg.wait_for_timeout(300)
                want = st == "arkadas" or (st == "karisik" and n_ans < 2) or m >= 10
                opts = pg.query_selector_all(".secenek:not([disabled])")
                if shot: pg.screenshot(path=str(out / f"m{m:02d}-{c}.png"))
                if want and opts:
                    idx = 0 if st != "karisik" else (len(opts) - 1)
                    opts[idx].click(); n_ans += 1; answered_total += 1
                    pg.wait_for_timeout(1200 if shot else 400)
                    if shot: pg.screenshot(path=str(out / f"m{m:02d}-{c}-cevap.png"))
                if pg.query_selector("#geri"): pg.click("#geri")
                pg.wait_for_timeout(300)
            if q == 0 and not targets:
                break
        if shot: pg.screenshot(path=str(out / f"m{m:02d}-liste-son.png"))
        if m in (2, 6, 10):
            pg.evaluate("__dem.panelAc()"); pg.wait_for_timeout(500)
            pg.screenshot(path=str(out / f"m{m:02d}-panel.png"))
            pg.click("#panel-kapat", force=True); pg.wait_for_timeout(400)
        pg.click("#birak", force=True)
        pg.wait_for_timeout(300)
        if pg.query_selector("#birak"): pg.click("#birak", force=True)
        pg.wait_for_timeout(300 if m != 9 else 7000)
        pg.wait_for_timeout(5000 if shot else 300)
        if shot: pg.screenshot(path=str(out / f"m{m:02d}-gecis.png"))
        pg.click("#devam", force=True)
        pg.wait_for_timeout(800)
        month = m + 1
        if pg.query_selector(".son"):
            break
    pg.wait_for_timeout(4500)
    pg.screenshot(path=str(out / "99-son.png"), full_page=True)
    info = pg.evaluate("({tier: __dem.g.s.f.tier, puan: __dem.g.s.f.puan, kus: Object.keys(__dem.g.s.kus), sevgili: !!__dem.g.s.f.sevgili, msgs: __dem.g.s.msgs.length})")
    print(st, info, flush=True) if False else print(st, info, "cevap:", answered_total)
    b.close()
print("HATALAR:", errors[:10] if errors else "yok")
