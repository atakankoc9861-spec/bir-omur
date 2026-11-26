"""sigpwned/popular-names-by-country-dataset (CC0) -> content/names/sigpwned-cc0.json

Kullanım: python3 -I scripts/isimler/donustur.py <klon-klasoru> <commit>
Sadece MVP ülkeleri (IND, CHN, USA; NGA kaynakta yok). Romanize ad kullanılır,
Pinyin ton işaretleri okunurluk için kaldırılır (ör. Ruòxī -> Ruoxi), aynı yazılan tekrarlar birleşir.
"""
import csv, json, sys, unicodedata, datetime, pathlib

src = pathlib.Path(sys.argv[1]); commit = sys.argv[2]
ISO = {"IN": "IND", "CN": "CHN", "US": "USA", "NG": "NGA"}

def plain(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

out = {}
with open(src / "common-forenames-by-country.csv", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        iso = ISO.get(r["Country"])
        if not iso: continue
        name = r["Romanized Name"].strip()
        if r["Country"] == "CN": name = plain(name)
        if not name: continue
        sex = "female" if r["Gender"] == "F" else "male"
        key = f'{r["Year"]}|{sex}'
        c = out.setdefault(iso, {"forenames": {}, "surnames": [], "notes": set()})
        lst = c["forenames"].setdefault(key, [])
        if name not in lst: lst.append(name)
        if r["Note"]: c["notes"].add(r["Note"])
with open(src / "common-surnames-by-country.csv", encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        iso = ISO.get(r["Country"])
        if not iso: continue
        name = r["Romanized Name"].strip()
        if r["Country"] == "CN":
            # Kaynakta her Çince soyadı için iki satır var: Pinyin ve Kantonca/Hong Kong yazımı.
            # Anakara Çin için Pinyin satırı (Localized Name dolu ve sadeleştirilmiş) alınır: her sıradaki ilk satır.
            if any(x["rank"] == r["Rank"] for x in out.setdefault(iso, {"forenames": {}, "surnames": [], "notes": set()})["surnames"]):
                continue
            name = plain(name)
        c = out.setdefault(iso, {"forenames": {}, "surnames": [], "notes": set()})
        if name and all(x["name"] != name for x in c["surnames"]):
            c["surnames"].append({"name": name, "rank": r["Rank"]})

res = {
    "meta": {
        "ad": "Popular Names by Country Dataset",
        "adres": "https://github.com/sigpwned/popular-names-by-country-dataset",
        "commit": commit,
        "lisans": "CC0 1.0",
        "erisim": datetime.date.today().isoformat(),
        "kaynakNotu": "Veri setinin kendi beyanı: Wikipedia 'List of most popular given names' ve 'Lists of most common surnames' sayfalarından, Temmuz 2023. Ad listeleri o yıl doğan bebeklerin adları ya da (ABD 1990) nüfus sayımıdır.",
        "sinirlar": "Doğum yılı boyutu yok (ABD hariç: 1990 sayımı ve 2022 bebek adları). Hindistan ve Çin listeleri yalnız yeni doğan bebeklerin popüler adları; anne-baba kuşağı için de kullanılıyor (tahmin). Nijerya kaynakta yok.",
    },
    "ulkeler": {},
}
for iso, c in out.items():
    res["ulkeler"][iso] = {
        "forenames": [{"yil": int(k.split("|")[0]), "cinsiyet": k.split("|")[1], "isimler": v} for k, v in sorted(c["forenames"].items())],
        "surnames": [s["name"] for s in c["surnames"]],
        "kaynakNotu": sorted(c["notes"]),
    }
pathlib.Path("content/names/sigpwned-cc0.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
for iso, c in res["ulkeler"].items():
    print(iso, [(f["yil"], f["cinsiyet"], len(f["isimler"])) for f in c["forenames"]], "soyad", len(c["surnames"]))
