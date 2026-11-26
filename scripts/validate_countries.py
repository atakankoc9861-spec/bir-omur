#!/usr/bin/env python3
"""Ülke profillerini (content/countries/*.json) şemaya ve ek kurallara göre denetler.

Kullanım:  python3 -I scripts/validate_countries.py [dosya ...]
Dosya verilmezse content/countries/ altındaki '_' ile başlamayan bütün .json dosyaları denetlenir.
Gereken paket: jsonschema (pip install jsonschema). Hata varsa çıkış kodu 1.

Ek kurallar (şemanın kendi başına denetleyemedikleri):
  K1  Her 'kaynak' kimliği 'kaynaklar' listesinde tanımlı olmalı.
  K2  oyunda_kullanilabilir == true ancak durum == 'dogrulandi' VE kaynakta 'kaynaksiz' yoksa VE en az bir kaynak varsa.
  K3  Durum zinciri: bir kaydın durumu, içindeki ('bos' olmayan) alt kayıtların EN ZAYIFINDAN güçlü olamaz.
      Güç sırası: dogrulandi > dogrulanmali > tahmin. 'bos' alt kayıtlar hesaba katılmaz.
  K4  Dönem listelerinde yilBas < yilSon. Ardışık dönemlerde ÇAKIŞMA (sonraki.yilBas < önceki.yilSon) HATA;
      BOŞLUK (sonraki.yilBas > önceki.yilSon) uyarı (veri eksikliği olabilir). yilSon hariç tutulur.
  K5  İsim havuzu 'topluluk' alanı 'genel' ya da topluluklar[].id; 'din' alanı null ya da din.dagilim[].id.
  K6  topluluklar[].isimHavuzlari tanımlı havuzlara işaret eder. havuzHazir true ancak: kendi havuzları var ve hepsi
      dolu, YA DA yedekHavuz.havuz == 'genel' ve topluluk='genel' olan bütün havuzlar dolu. yedekHavuz 'genel' ise gerekçe zorunlu.
  K7  din.dagilim[].ustGrup tanımlı bir kayda işaret eder; aynı altGrup adı iki kayıtta geçemez (çift sayım).
  K8  durum == 'dogrulandi' olan kaydın kaynak listesi boş olamaz ve 'kaynaksiz' içeremez (oyunda_kullanilabilir'den bağımsız).
  U1  (uyarı) Dolu havuzda 30'dan az isim.
"""
import json, sys, glob, os

try:
    import jsonschema
except ImportError:
    sys.exit("jsonschema paketi gerekli: pip install jsonschema")

KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEMA = os.path.join(KOK, "content", "countries", "_sablon.schema.json")
GUC = {"dogrulandi": 3, "dogrulanmali": 2, "tahmin": 1}


def gez(x, yol=""):
    if isinstance(x, dict):
        yield yol, x
        for k, v in x.items():
            if not k.startswith("_"):
                yield from gez(v, f"{yol}.{k}")
    elif isinstance(x, list):
        for i, v in enumerate(x):
            yield from gez(v, f"{yol}[{i}]")


def alt_gucler(x):
    """x'in içindeki (kendisi hariç) en üst seviye durumlu alt kayıtların güçleri."""
    sonuc = []
    def ic(y):
        if isinstance(y, dict):
            for k, v in y.items():
                if k.startswith("_"):
                    continue
                if isinstance(v, dict) and "durum" in v:
                    if v["durum"] in GUC:
                        sonuc.append(GUC[v["durum"]])
                    else:
                        ic(v)
                elif isinstance(v, (dict, list)):
                    ic(v)
        elif isinstance(y, list):
            for v in y:
                if isinstance(v, dict) and "durum" in v:
                    if v["durum"] in GUC:
                        sonuc.append(GUC[v["durum"]])
                    else:
                        ic(v)
                else:
                    ic(v)
    ic(x)
    return sonuc


def denetle(yol, sema):
    hatalar, uyarilar = [], []
    d = json.load(open(yol, encoding="utf-8"))
    v = jsonschema.Draft202012Validator(sema)
    for h in sorted(v.iter_errors(d), key=lambda e: list(e.absolute_path)):
        hatalar.append(f"ŞEMA {'/'.join(map(str, h.absolute_path))}: {h.message}")
    if hatalar:
        return hatalar, uyarilar  # yapı bozuksa ek kurallar anlamsız

    kaynaklar = {k["id"]: k["tur"] for k in d["kaynaklar"]}
    for p, x in gez(d):
        if "kaynak" in x and isinstance(x["kaynak"], list):
            for s in x["kaynak"]:
                if s not in kaynaklar:
                    hatalar.append(f"K1 {p}: tanımsız kaynak '{s}'")
        if "oyunda_kullanilabilir" in x:
            ks = x.get("kaynak", [])
            olmali = x.get("durum") == "dogrulandi" and bool(ks) and all(kaynaklar.get(s) != "kaynaksiz" for s in ks)
            if x["oyunda_kullanilabilir"] and not olmali:
                hatalar.append(f"K2 {p}: oyunda_kullanilabilir true olamaz (durum={x.get('durum')}, kaynak={ks})")
        if x.get("durum") == "dogrulandi" and isinstance(x.get("kaynak"), list):
            if not x["kaynak"]:
                hatalar.append(f"K8 {p}: 'dogrulandi' ama kaynak yok")
            elif any(kaynaklar.get(s) == "kaynaksiz" for s in x["kaynak"]):
                hatalar.append(f"K8 {p}: 'dogrulandi' kayıtta kaynaksız kaynak var")
        if x.get("durum") in GUC:
            g = alt_gucler(x)
            if g and GUC[x["durum"]] > min(g):
                hatalar.append(f"K3 {p}: durum '{x['durum']}' alt kayıtlardan güçlü")
        for k, v in x.items():
            if k == "donemler" and isinstance(v, list):
                for i, dn in enumerate(v):
                    if dn.get("yilSon") is not None and dn["yilBas"] >= dn["yilSon"]:
                        hatalar.append(f"K4 {p}.donemler[{i}]: yilBas >= yilSon")
                    if i:
                        onceki = v[i - 1].get("yilSon")
                        if onceki is None or dn["yilBas"] < onceki:
                            hatalar.append(f"K4 {p}.donemler[{i}]: önceki dönemle çakışıyor (önceki yilSon={onceki}, yilBas={dn['yilBas']})")
                        elif dn["yilBas"] > onceki:
                            uyarilar.append(f"K4 {p}.donemler[{i}]: önceki dönemle arada boşluk ({onceki}-{dn['yilBas']})")
        if "yilBas" in x and "yilSon" in x and x["yilSon"] is not None and x["yilBas"] is not None and x["yilBas"] > x["yilSon"]:
            hatalar.append(f"K4 {p}: yilBas > yilSon")

    toplulukIds = {t["id"] for t in d["topluluklar"]}
    dinIds = {r["id"] for r in d["din"]["dagilim"]}
    havuzlar = {h["id"]: h for h in d["isimler"]["havuzlar"]}
    for h in havuzlar.values():
        if h["topluluk"] != "genel" and h["topluluk"] not in toplulukIds:
            hatalar.append(f"K5 havuz {h['id']}: tanımsız topluluk '{h['topluluk']}'")
        if h["din"] is not None and h["din"] not in dinIds:
            hatalar.append(f"K5 havuz {h['id']}: tanımsız din '{h['din']}'")
        if h["isimler"] and len(h["isimler"]) < 30:
            uyarilar.append(f"U1 havuz {h['id']}: {len(h['isimler'])} isim (hedef en az 30)")
    genelDolu = all(h["isimler"] for h in havuzlar.values() if h["topluluk"] == "genel")
    for t in d["topluluklar"]:
        for hid in t["isimHavuzlari"]:
            if hid not in havuzlar:
                hatalar.append(f"K6 topluluk {t['id']}: tanımsız havuz '{hid}'")
        kendiDolu = bool(t["isimHavuzlari"]) and all(havuzlar.get(h, {}).get("isimler") for h in t["isimHavuzlari"])
        yedek = t["yedekHavuz"]["havuz"] == "genel"
        if yedek and not t["yedekHavuz"]["gerekce"].strip():
            hatalar.append(f"K6 topluluk {t['id']}: yedekHavuz 'genel' ama gerekçe yok")
        if t["havuzHazir"] and not (kendiDolu or (yedek and genelDolu)):
            hatalar.append(f"K6 topluluk {t['id']}: havuzHazir true ama ne kendi havuzları dolu ne de (yedek genel + genel havuzlar dolu)")
        for dn in t["dinler"]:
            if dn not in dinIds:
                hatalar.append(f"K6 topluluk {t['id']}: tanımsız din '{dn}'")
    gorulen = {}
    for r in d["din"]["dagilim"]:
        if r["ustGrup"] is not None and r["ustGrup"] not in dinIds:
            hatalar.append(f"K7 din {r['id']}: tanımsız ustGrup '{r['ustGrup']}'")
        for a in [r["grup"]] + r["altGruplar"]:
            if a in gorulen and gorulen[a] != r["id"]:
                hatalar.append(f"K7 din: '{a}' hem {gorulen[a]} hem {r['id']} kaydında (çift sayım)")
            gorulen[a] = r["id"]
    return hatalar, uyarilar


def main():
    sema = json.load(open(SEMA, encoding="utf-8"))
    jsonschema.Draft202012Validator.check_schema(sema)
    dosyalar = sys.argv[1:] or sorted(
        f for f in glob.glob(os.path.join(KOK, "content", "countries", "*.json"))
        if not os.path.basename(f).startswith("_"))
    hata_var = False
    for f in dosyalar:
        h, u = denetle(f, sema)
        print(f"== {os.path.relpath(f, KOK)}: {len(h)} hata, {len(u)} uyarı")
        for x in h:
            print("  HATA ", x)
        for x in u:
            print("  uyarı", x)
        hata_var |= bool(h)
    sys.exit(1 if hata_var else 0)


if __name__ == "__main__":
    main()
