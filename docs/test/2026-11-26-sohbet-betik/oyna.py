"""Oyuncu tarzlarıyla demo oynar. python3 -I oyna.py <html> <out> <sabirsiz|duygusal> <tohum> <cinsiyetSeçilmez>"""
import sys, pathlib, json, time
from playwright.sync_api import sync_playwright

html = pathlib.Path(sys.argv[1]).resolve().as_uri()
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
st = sys.argv[3]; seed = sys.argv[4]
errors = []
DUYGU = ["aile", "anne", "baba", "ilgi", "kardes", "kanka"]
log = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    pg.on("pageerror", lambda e: errors.append("pageerror: " + str(e)))
    pg.on("console", lambda m: errors.append(f"console.{m.type}: " + m.text) if m.type in ("error", "warning") else None)
    t0 = time.time()
    pg.goto(f"{html}?tohum={seed}&hiz=6")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=str(out / "00-kilit.png"))
    pg.click("#ac"); pg.wait_for_timeout(700)
    pg.screenshot(path=str(out / "01-liste.png"))
    if pg.query_selector("#ipucu"): pg.click("#ipucu", force=True)
    month = 0
    while month < 12:
        m = pg.evaluate("__dem.g.s.month")
        done = set()
        for _ in range(80):
            pg.wait_for_timeout(200)
            pend = pg.evaluate("__dem.g.asks.filter(a=>!a.answered).map(a=>a.beat.chat)")
            q = pg.evaluate("__dem.g.queue.length")
            budget = pg.evaluate("__dem.g.s.budget")
            rows = [r.get_attribute("data-c") for r in pg.query_selector_all(".satir") if r.query_selector(".nokta") or r.query_selector(".rozet")]
            if st == "sabirsiz":
                # sadece cevap bekleyenleri aç, gelen sırayla; grup/rehber dahil
                targets = [c for c in rows if c in pend and c not in done]
            else:
                targets = sorted([c for c in rows if c not in done or c in pend], key=lambda c: DUYGU.index(c) if c in DUYGU else 99)
                targets = [c for c in targets if c not in done or (c in pend and c in DUYGU)]
            if not targets:
                if q == 0: break
                continue
            c = targets[0]; done.add(c)
            try: pg.click(f'.satir[data-c="{c}"]', timeout=3000)
            except Exception: continue
            pg.wait_for_timeout(250 if st == "sabirsiz" else 900)
            opts = pg.query_selector_all(".secenek:not([disabled])")
            want = budget > 0 and opts and (st == "sabirsiz" or c in DUYGU or m >= 10 or budget > 2)
            if want:
                i = 0 if st == "sabirsiz" else len(opts) - 1
                log.append({"m": m, "c": c, "sec": opts[i].inner_text()})
                opts[i].click(); pg.wait_for_timeout(300 if st == "sabirsiz" else 1500)
                if m in (0, 3, 6, 9, 10, 11): pg.screenshot(path=str(out / f"m{m:02d}-{c}.png"))
            if pg.query_selector("#geri"): pg.click("#geri")
            pg.wait_for_timeout(150)
        if m in (0, 5, 9): pg.screenshot(path=str(out / f"m{m:02d}-liste.png"))
        unread = pg.evaluate("__dem.g.s.msgs.filter(x=>!x.read).length")
        log.append({"m": m, "ay_sonu_okunmamis": unread, "kalan_aksam": pg.evaluate("__dem.g.s.budget")})
        pg.click("#birak", force=True); pg.wait_for_timeout(300)
        if pg.query_selector("#birak"): pg.click("#birak", force=True)
        pg.wait_for_timeout(7000 if m >= 9 else 2500)
        pg.screenshot(path=str(out / f"m{m:02d}-gecis.png"))
        pg.click("#devam", force=True); pg.wait_for_timeout(700)
        month = m + 1
        if pg.query_selector(".son"): break
    pg.wait_for_timeout(5000)
    pg.screenshot(path=str(out / "99-son.png"), full_page=True)
    info = pg.evaluate("({tier: __dem.g.s.f.tier, puan: __dem.g.s.f.puan, kus: __dem.g.s.kus, f: __dem.g.s.f, msgs: __dem.g.s.msgs.length})")
    msgs = pg.evaluate("__dem.g.s.msgs.map(x=>[x.month,x.chat,x.from,x.kind,x.text])")
    son = pg.inner_text("body")
    # taşma kontrolü
    tasma = pg.evaluate("[...document.querySelectorAll('*')].filter(e=>e.scrollWidth>e.clientWidth+2 && getComputedStyle(e).overflowX==='visible').map(e=>e.className).slice(0,10)")
    b.close()
json.dump({"info": info, "log": log, "errors": errors, "sure_sn": round(time.time() - t0), "tasma": tasma, "son": son}, open(out / "ozet.json", "w"), ensure_ascii=False, indent=1, default=str)
with open(out / "mesajlar.txt", "w") as f:
    for x in msgs: f.write(f"[{x[0]}] {x[1]} <{x[2]}> ({x[3]}) {x[4]}\n")
print(st, seed, info.get("puan"), info.get("tier"), "hata:", len(errors), "sure:", round(time.time() - t0))
