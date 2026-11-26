"""Ham dosyalardan data/processed/v1/ çıktılarını üretir.

Çalıştırma (repo kökünden):  python3 -I scripts/veri/donustur.py
Gerekenler: Python 3.10+, pandas, openpyxl. Önce: python3 -I scripts/veri/indir.py

Üretilenler (data/processed/v1/):
  dogumlar.json        237 ülke, 1950-2100 yıllık doğum ve nüfus (doğum çekilişi)
  countries.json       237 ülke, 2023 için CountryData (src/engine/types.ts)
  ulke-kodlari.json    ISO3 / ISO2 / BM LocID / OWID kodu / Türkçe ad tablosu
  mvp/<ISO3>.json      5 MVP ülkesi derin veri (yaşam tablosu, doğurganlık, gelir, eğitim, ölüm nedenleri)
  rapor.json           dönüştürme sırasında yapılan kontroller (dünya toplamı farkı vb.)

Hiçbir değer tahmin edilmez ya da doldurulmaz: kaynakta yoksa null yazılır ve
data/eksikler.md'de listelenir.
"""

from __future__ import annotations

import datetime as dt
import io
import json
import math
import sys
import zipfile
from pathlib import Path

import openpyxl
import pandas as pd

KOK = Path(__file__).resolve().parents[2]
HAM = KOK / "data" / "raw"
CIKTI = KOK / "data" / "processed" / "v1"
MVP = ["TUR", "IND", "NGA", "CHN", "USA"]
YIL_BAS, YIL_SON = 1950, 2100
TAHMIN_SON_YIL = 2023  # WPP 2024'te 2023'e kadar tahmin, 2024'ten sonrası projeksiyon
REFERANS_YIL = 2023  # countries.json yılı: WPP'nin son tahmin yılı
SURUM = "v1"

# Kaynak kimlikleri: her alan bunlardan birine bağlanır.
KAYNAKLAR = {
    "wpp2024": {
        "ad": "World Population Prospects 2024, Medium variant",
        "kurum": "UN DESA Population Division",
        "yayin": "2024-07-11 (CSV dosyaları 2024-12-13)",
        "adres": "https://population.un.org/wpp/downloads",
        "lisans": "CC BY 3.0 IGO",
    },
    "wpp2024-togo": {
        "ad": "World Population Prospects 2024 – Interim Update (Togo)",
        "kurum": "UN DESA Population Division",
        "yayin": "2026-01-19",
        "adres": "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/WPP2024_CSV_files_update.zip",
        "lisans": "CC BY 3.0 IGO",
        "not": "Togo nüfus sayımı (RGPH-5) sonrası BM'nin Togo için yayımladığı düzeltme; sadece Togo satırları.",
    },
    "wdi": {
        "ad": "World Development Indicators",
        "kurum": "World Bank",
        "yayin": "API, son güncelleme 2026-11-11",
        "adres": "https://data.worldbank.org/",
        "lisans": "CC BY 4.0",
    },
    "pip": {
        "ad": "Poverty and Inequality Platform (2021 PPP)",
        "kurum": "World Bank",
        "yayin": "API",
        "adres": "https://pip.worldbank.org/",
        "lisans": "CC BY 4.0",
    },
    "hdr2025": {
        "ad": "Human Development Report 2025, composite indices time series",
        "kurum": "UNDP Human Development Report Office",
        "yayin": "2025",
        "adres": "https://hdr.undp.org/data-center/documentation-and-downloads",
        "lisans": "CC BY 3.0 IGO",
    },
    "ghe2023": {
        "ad": "Global Health Estimates 2023: Deaths by cause, age, sex, by country",
        "kurum": "World Health Organization",
        "yayin": "2026-09 (dosya tarihi 2026-10-01)",
        "adres": "https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates/ghe-leading-causes-of-death",
        "lisans": "NET DEĞİL: DSÖ'nün iki resmî sayfası farklı. (1) data.who.int şartları: CC BY 4.0 + DSÖ ek şartları "
        "(DSÖ onayı ima edilemez, DSÖ adı/amblemi izinsiz kullanılamaz). (2) who.int veri politikası şartları: kullanım hakkı "
        "'kamu sağlığı amaçlı'; ticari bir girişimin tanıtımında kullanılamaz, satılamaz; biçimsel küçük uyarlamalar dışında "
        "değiştirmek DSÖ'nün yazılı iznini ister; DSÖ'ye ve veriyi sağlayan ülkelere atıf zorunlu. CC BY-NC-SA 3.0 IGO DSÖ'nün "
        "yayınlarının lisansıdır, bu veri dosyası için yazılı değildir.",
        "lisansAdresleri": [
            "https://data.who.int/redirect-pages/footer/learn-more/terms-and-conditions",
            "https://www.who.int/about/policies/publishing/data-policy/terms-and-conditions",
        ],
    },
    "cldr": {
        "ad": "Unicode CLDR, Türkçe ülke adları",
        "kurum": "Unicode Consortium",
        "yayin": "cldr-json main dalı",
        "adres": "https://github.com/unicode-org/cldr-json",
        "lisans": "Unicode License v3",
    },
}

# countries.json referans yılının (2023) olağan dışı olduğu ülkeler. Ek alan; mevcut alanlar değişmez.
YIL_NOTLARI = {
    "TUR": {
        "olaganDisi": True,
        "not": "Deprem yılı, olağan dışı (6 Şubat 2023 depremleri). 2023 değerleri bugünün Türkiye'si diye gösterilmemeli: "
        "kadın e0 79,86 (2022: 80,72; 2024: 80,34), 5 yaş altı ölüm binde 13,1 (2022: 9,6; 2024: 11,3). Kaynak: BM WPP 2024; "
        "Kalite denetimi 2026-11-26 (O3).",
        "alanlar": ["lifeExpectancy", "under5Mortality"],
    }
}

EKSIKLER: list[str] = []  # eksikler.md'nin otomatik bölümü
RAPOR: dict = {}


def sig(x: float, n: int = 6) -> float:
    """n anlamlı basamağa yuvarla (dosya boyutu için). Değer değişmez, sadece kısalır."""
    if x == 0 or x is None or (isinstance(x, float) and math.isnan(x)):
        return x
    return float(f"{x:.{n}g}")


def yaz(ad: str, veri) -> None:
    p = CIKTI / ad
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(veri, ensure_ascii=False, separators=(",", ":")) + "\n", "utf-8")
    print(f"yazıldı: {p.relative_to(KOK)} ({p.stat().st_size // 1024} KB)")


# --------------------------------------------------------------------------- WPP
def wpp_gostergeler() -> pd.DataFrame:
    # keep_default_na=False: Namibya'nın ISO2 kodu "NA" boş değer sanılmasın.
    d = pd.read_csv(HAM / "un-wpp-2024/WPP2024_Demographic_Indicators_Medium.csv.gz", low_memory=False,
                    keep_default_na=False, na_values=[""])
    return d


def togo_guncelleme() -> pd.DataFrame:
    z = zipfile.ZipFile(HAM / "un-wpp-2024-interim-togo/WPP2024_CSV_files_update.zip")
    return pd.read_csv(io.BytesIO(z.read("WPP2024_Demographic_Indicators_Medium_Update.csv")),
                       keep_default_na=False, na_values=[""])


def ulkeler_tablosu(d: pd.DataFrame, togo: pd.DataFrame) -> pd.DataFrame:
    c = d[d.LocTypeName == "Country/Area"].copy()
    c = c[c.ISO3_code.notna()]
    # Togo satırlarını BM'nin 2026-01-19 ara güncellemesiyle değiştir.
    t = togo[togo.Variant == "Medium"].copy()
    c = pd.concat([c[c.ISO3_code != "TGO"], t[c.columns.intersection(t.columns)]], ignore_index=True)
    c["kaynak"] = c.ISO3_code.map(lambda i: "wpp2024-togo" if i == "TGO" else "wpp2024")
    return c


def dunya_farki(d: pd.DataFrame, c: pd.DataFrame) -> None:
    """Dünya ve Kültür'ün sorduğu ~21.308 doğumluk farkı açıklar ve rapora yazar."""
    w = d[(d.Location == "World")].set_index("Time")
    orijinal = d[(d.LocTypeName == "Country/Area")].groupby("Time").Births.sum()
    guncel = c.groupby("Time").Births.sum()
    satir = []
    for y in (2023, 2024, 2025, 2026):
        dunya = round(w.loc[y, "Births"] * 1000)
        satir.append(
            {
                "yil": y,
                "dunyaSatiri": dunya,
                "ulkeToplamiOrijinalWpp": round(orijinal.loc[y] * 1000),
                "ulkeToplamiTogoGuncel": round(guncel.loc[y] * 1000),
                "fark_dunyaEksiOrijinal": dunya - round(orijinal.loc[y] * 1000),
                "fark_dunyaEksiTogoGuncel": dunya - round(guncel.loc[y] * 1000),
            }
        )
    o = pd.read_csv(HAM / "owid/number-of-births-per-year.csv")
    o23 = o[o.Year == 2023]
    owid_dunya = int(o23[o23.Entity == "World"]["Number of births"].iloc[0])
    owid_ulke = o23[o23.Code.notna() & ~o23.Code.astype(str).str.match(r"^(OWID_|UN_)")]
    owid_kos = int(o23[o23.Code == "OWID_KOS"]["Number of births"].iloc[0])
    owid_tgo = int(o23[o23.Code == "TGO"]["Number of births"].iloc[0])
    wpp_tgo_eski = round(d[(d.ISO3_code == "TGO") & (d.Time == 2023)].Births.iloc[0] * 1000)
    RAPOR["dunyaToplamiFarki"] = {
        "aciklama": (
            "BM'nin 'World' satırı 2024-07 orijinal hesaplamasıdır. BM 2026-01-19'da yalnız Togo'yu düzeltti "
            "(sayım sonrası nüfus ~%10 aşağı); bölge ve dünya toplamlarını yeniden yayımlamadı. OWID ülke satırına "
            "düzeltilmiş Togo'yu, dünya satırına BM'nin eski toplamını koyuyor. Fark = Togo düzeltmesi + binlik "
            "birimden gelen yuvarlama. Çekilişte dünya satırı değil ülke satırlarının toplamı kullanılır."
        ),
        "owid2023": {
            "dunya": owid_dunya,
            "iso3Satirlari236": int(owid_ulke["Number of births"].sum()),
            "kosova_OWID_KOS": owid_kos,
            "kalan": owid_dunya - int(owid_ulke["Number of births"].sum()) - owid_kos,
            "togo_owid": owid_tgo,
            "togo_wppOrijinal": wpp_tgo_eski,
            "togoFarki": wpp_tgo_eski - owid_tgo,
        },
        "wpp": satir,
    }


def dogumlar(c: pd.DataFrame, d: pd.DataFrame, adlar: dict) -> None:
    yillar = list(range(YIL_BAS, YIL_SON + 1))
    ulkeler = {}
    for iso, g in c.groupby("ISO3_code"):
        g = g.set_index("Time").reindex(yillar)
        if g.Births.isna().any() or g.TPopulation1July.isna().any():
            raise SystemExit(f"{iso}: yıl eksik")
        ulkeler[iso] = {
            "nameTr": adlar[iso]["nameTr"],
            "kaynak": g.kaynak.iloc[0],
            "births": [round(v * 1000) for v in g.Births],
            "population": [round(v * 1000) for v in g.TPopulation1July],
        }
    w = d[d.Location == "World"].set_index("Time").reindex(yillar)
    yaz(
        "dogumlar.json",
        {
            "meta": {
                "surum": SURUM,
                "uretildi": dt.date.today().isoformat(),
                "aciklama": "Yıllık canlı doğum (takvim yılı) ve 1 Temmuz nüfusu, kişi. Doğum çekilişi için (karar 16).",
                "yilBas": YIL_BAS,
                "yilSon": YIL_SON,
                "tahminSonYil": TAHMIN_SON_YIL,
                "not": f"{TAHMIN_SON_YIL + 1} ve sonrası BM orta varyant projeksiyonudur (tahmin değil, senaryo).",
                "kaynaklar": {k: KAYNAKLAR[k] for k in ("wpp2024", "wpp2024-togo")},
                "dunyaSatiri": "Karşılaştırma içindir; çekilişte ülke toplamı kullanılır (bkz. rapor.json).",
            },
            "dunya": {
                "births": [round(v * 1000) for v in w.Births],
                "population": [round(v * 1000) for v in w.TPopulation1July],
            },
            "ulkeler": ulkeler,
        },
    )


# --------------------------------------------------------------------------- Adlar / kodlar
ADLAR_OZEL = {
    # CLDR varsayılanı "Kongo - Kinşasa" / "Kongo - Brazavil"; CLDR'nin kendi alt-variant adları kullanılır.
    "COD": "CD-alt-variant",
    "COG": "CG-alt-variant",
}


def adlar_ve_kodlar(c: pd.DataFrame) -> dict:
    tr = json.loads((HAM / "cldr/tr-territories.json").read_text("utf-8"))
    tr = tr["main"]["tr"]["localeDisplayNames"]["territories"]
    o = pd.read_csv(HAM / "owid/number-of-births-per-year.csv")
    owid_kodlari = set(o.Code.dropna())
    sonuc = {}
    son = c[c.Time == REFERANS_YIL]
    for _, r in son.iterrows():
        iso3, iso2 = r.ISO3_code, r.ISO2_code
        anahtar = ADLAR_OZEL.get(iso3, iso2)
        ad = tr.get(anahtar) or tr.get(iso2)
        if ad is None:
            EKSIKLER.append(f"- Türkçe ad yok (CLDR): {iso3} {r.Location}")
        owid = iso3 if iso3 in owid_kodlari else ("OWID_KOS" if iso3 == "XKX" else None)
        sonuc[iso3] = {
            "iso3": iso3,
            "iso2": iso2,
            "bmLocId": int(r.LocID),
            "owid": owid,
            "dunyaBankasi": iso3,
            "nameEn": r.Location,
            "nameTr": ad,
        }
    yaz(
        "ulke-kodlari.json",
        {
            "meta": {
                "surum": SURUM,
                "aciklama": "Ülke kodu tablosu. Oyun kodu = BM WPP ISO3 kodu. Kosova BM WPP'de XKX (LocID 412) "
                "olarak ayrı satır; OWID'de OWID_KOS. Dünya Bankası kodu ISO3 ile aynı varsayılır, "
                "bulunamayanlar countries.json'da null.",
                "kaynaklar": {k: KAYNAKLAR[k] for k in ("wpp2024", "cldr")},
            },
            "ulkeler": list(sonuc.values()),
        },
    )
    return sonuc


# --------------------------------------------------------------------------- Dünya Bankası
def wdi(kod: str) -> pd.DataFrame:
    _, kayit = json.loads((HAM / f"worldbank-wdi/{kod}.json").read_text("utf-8"))
    rows = [
        {"iso3": r["countryiso3code"], "yil": int(r["date"]), "deger": r["value"]}
        for r in kayit
        if r["value"] is not None and r["countryiso3code"]
    ]
    return pd.DataFrame(rows)


def son_deger(df: pd.DataFrame, iso3: str, en_gec: int):
    g = df[(df.iso3 == iso3) & (df.yil <= en_gec)]
    if g.empty:
        return None, None
    r = g.sort_values("yil").iloc[-1]
    return float(r.deger), int(r.yil)


def seri(df: pd.DataFrame, iso3: str, olcek: float = 1.0, basamak: int = 6) -> dict:
    g = df[df.iso3 == iso3].sort_values("yil")
    return {"yillar": g.yil.astype(int).tolist(), "degerler": [sig(v * olcek, basamak) for v in g.deger]}


# --------------------------------------------------------------------------- countries.json
def countries(c: pd.DataFrame, adlar: dict) -> None:
    gdp, gini, urb = wdi("NY.GDP.PCAP.PP.KD"), wdi("SI.POV.GINI"), wdi("SP.URB.TOTL.IN.ZS")
    son = c[c.Time == REFERANS_YIL].sort_values("ISO3_code")
    liste = []
    eski_esik = REFERANS_YIL - 10
    for _, r in son.iterrows():
        iso = r.ISO3_code
        g_v, g_y = son_deger(gdp, iso, REFERANS_YIL)
        gi_v, gi_y = son_deger(gini, iso, REFERANS_YIL)
        u_v, u_y = son_deger(urb, iso, REFERANS_YIL)
        wk = r.kaynak
        for alan, v, y in (("gdpPerCapitaPpp", g_v, g_y), ("gini", gi_v, gi_y), ("urbanShare", u_v, u_y)):
            if v is None:
                EKSIKLER.append(f"- {iso} ({adlar[iso]['nameTr']}): `{alan}` Dünya Bankası'nda yok → null")
            elif y < eski_esik:
                EKSIKLER.append(f"- {iso} ({adlar[iso]['nameTr']}): `{alan}` en son {y} yılına ait (eski)")
        liste.append(
            {
                "iso3": iso,
                "nameTr": adlar[iso]["nameTr"],
                "year": REFERANS_YIL,
                "annualBirths": round(r.Births * 1000),
                "population": round(r.TPopulation1July * 1000),
                "lifeExpectancy": {"female": float(r.LExFemale), "male": float(r.LExMale)},
                "under5Mortality": float(r.Q5),
                "gdpPerCapitaPpp": None if g_v is None else round(g_v, 1),
                "gini": None if gi_v is None else gi_v,
                "urbanShare": None if u_v is None else round(u_v / 100, 4),
                "source": "UN WPP 2024" + (" (Togo: 2026-01-19 ara güncelleme)" if wk == "wpp2024-togo" else "")
                + "; World Bank WDI",
                **({"yearNote": YIL_NOTLARI[iso]} if iso in YIL_NOTLARI else {}),
                "fieldSources": {
                    "annualBirths": {"kaynak": wk, "yil": REFERANS_YIL, "seri": "Births"},
                    "population": {"kaynak": wk, "yil": REFERANS_YIL, "seri": "TPopulation1July"},
                    "lifeExpectancy": {"kaynak": wk, "yil": REFERANS_YIL, "seri": "LExFemale, LExMale"},
                    "under5Mortality": {"kaynak": wk, "yil": REFERANS_YIL, "seri": "Q5 (1000 canlı doğumda)"},
                    "gdpPerCapitaPpp": {"kaynak": "wdi" if g_v is not None else None, "yil": g_y,
                                        "seri": "NY.GDP.PCAP.PP.KD (sabit 2021 uluslararası $)"},
                    "gini": {"kaynak": "wdi" if gi_v is not None else None, "yil": gi_y,
                             "seri": "SI.POV.GINI (0-100; ülkeye göre gelir ya da tüketim anketi)"},
                    "urbanShare": {"kaynak": "wdi" if u_v is not None else None, "yil": u_y,
                                   "seri": "SP.URB.TOTL.IN.ZS / 100 (ulusal kent tanımları, BM WUP)"},
                },
            }
        )
    yaz(
        "countries.json",
        {
            "meta": {
                "surum": SURUM,
                "uretildi": dt.date.today().isoformat(),
                "yil": REFERANS_YIL,
                "aciklama": "CountryData (src/engine/types.ts). Demografi BM WPP 2024'ün son tahmin yılı (2023). "
                "Dünya Bankası alanları 2023 ya da öncesindeki en son yıl; yılı fieldSources'ta.",
                "kaynaklar": {k: KAYNAKLAR[k] for k in ("wpp2024", "wpp2024-togo", "wdi", "cldr")},
            },
            "countries": liste,
        },
    )
    RAPOR["countries"] = {
        "ulkeSayisi": len(liste),
        "nullSayisi": {
            a: sum(1 for x in liste if x[a] is None) for a in ("gdpPerCapitaPpp", "gini", "urbanShare")
        },
    }


# --------------------------------------------------------------------------- MVP: yaşam tabloları
def yasam_tablolari() -> dict:
    """Tek yaş (0-99, 100+ açık) qx, a0 ve açık yaştaki ex. Her MVP ülkesi, her cinsiyet, 1950-2100."""
    cols = ["ISO3_code", "Time", "AgeGrpStart", "qx", "ax", "ex"]
    sonuc = {iso: {} for iso in MVP}
    for cins, anahtar in (("Female", "female"), ("Male", "male")):
        parcalar = []
        for donem in ("1950-2023", "2024-2100"):
            yol = HAM / f"un-wpp-2024/WPP2024_Life_Table_Complete_Medium_{cins}_{donem}.csv.gz"
            tipler = {"ISO3_code": str, "AgeGrpStart": "Int64", "qx": float, "ax": float, "ex": float}
            for ch in pd.read_csv(yol, usecols=cols, chunksize=1_000_000, dtype=tipler):
                parcalar.append(ch[ch.ISO3_code.isin(MVP)])
        d = pd.concat(parcalar)
        for iso, g in d.groupby("ISO3_code"):
            qx, a0, e_acik, yillar = [], [], [], []
            for yil, gy in g.groupby("Time"):
                gy = gy.sort_values("AgeGrpStart")
                if list(gy.AgeGrpStart) != list(range(101)):
                    raise SystemExit(f"{iso} {yil} {cins}: yaş 0-100 tam değil")
                ara = gy[(gy.AgeGrpStart >= 1) & (gy.AgeGrpStart <= 99)].ax
                if not (ara == 0.5).all():
                    raise SystemExit(f"{iso} {yil}: 1-99 yaşta ax 0,5 değil; şema bunu varsayıyor")
                yillar.append(int(yil))
                qx.append([sig(v) for v in gy.qx.iloc[:100]])  # 100+ açık yaşta qx = 1
                a0.append(sig(float(gy.ax.iloc[0])))
                e_acik.append(sig(float(gy.ex.iloc[100])))
            if yillar != list(range(YIL_BAS, YIL_SON + 1)):
                raise SystemExit(f"{iso} {cins}: yıl eksik")
            sonuc[iso][anahtar] = {"qx": qx, "a0": a0, "eAcik": e_acik}
    return sonuc


def dogurganlik_yasa_gore() -> dict:
    cols = ["ISO3_code", "Variant", "Time", "AgeGrp", "ASFR"]
    parcalar = []
    for ch in pd.read_csv(HAM / "un-wpp-2024/WPP2024_Fertility_by_Age5.csv.gz", usecols=cols, chunksize=1_000_000):
        parcalar.append(ch[ch.ISO3_code.isin(MVP) & (ch.Variant == "Medium")])
    d = pd.concat(parcalar)
    gruplar = ["10-14", "15-19", "20-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50-54"]
    sonuc = {}
    for iso, g in d.groupby("ISO3_code"):
        p = g.pivot(index="Time", columns="AgeGrp", values="ASFR").reindex(columns=gruplar)
        if p.isna().any().any():
            raise SystemExit(f"{iso}: ASFR eksik")
        sonuc[iso] = {
            "kaynak": "wpp2024",
            "birim": "1000 kadında yıllık doğum (yaşa özel doğurganlık hızı, ASFR)",
            "yasGruplari": gruplar,
            "yillar": [int(y) for y in p.index],
            "degerler": [[sig(v, 5) for v in row] for row in p.values],
        }
    return sonuc


# --------------------------------------------------------------------------- MVP: ölüm nedenleri
GHE_VARSAYILAN_YIL = "2019"
TUR_2023_NOT = (
    "Türkiye 2023: 6 Şubat depremleri yılı, olağan dışı. DSÖ 'Natural disasters' toplamı 52,8 bin ölüm (resmî deprem "
    "kaybıyla aynı düzey). Ama 15-29 yaşta toplam ölüm 2019'da 8,75 bin, 2023'te 33,98 bin: kadın 2,35 → 16,64 bin (×7, "
    "afet 5,38 bin), erkek 6,40 → 17,34 bin (afet 1,63 bin). Afet dışındaki ~18 bin fazla ölüm başka nedenlere dağılmış "
    "(ör. 'Other neurological conditions', epilepsi, solunum enfeksiyonları). BM WPP 2023 yaşam tablosundan 15-29 yaşta "
    "~5,7 bin (K) ve ~6,1 bin (E) ölüm çıkıyor; DSÖ yaş dağılımı bununla uyuşmuyor. Nedeni kaynakta açıklanmıyor. "
    "Bu yılın neden payları kullanılmaz; deprem ayrı olay olarak işlenir. Kaynak: Kalite denetimi docs/denetim/2026-11-26-veri.md (O1)."
)
OLAGAN_DISI_GHE = {("TUR", 2023): TUR_2023_NOT}
GHE_YAS = ["0-4", "5-14", "15-29", "30-49", "50-59", "60-69", "70+"]
GHE_CINS = {"Females": "female", "Males": "male"}


def ghe(yil: int) -> dict:
    yol = HAM / f"who-ghe/deaths_bycountry_age_sex_{yil}_2026-10-01.xlsx"
    import warnings

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        wb = openpyxl.load_workbook(yol, data_only=True)
    sonuc = {iso: {"female": {}, "male": {}} for iso in MVP}
    nedenler: dict[int, dict] = {}
    kalite = {}
    for yas in GHE_YAS:
        rows = list(wb[yas].iter_rows(values_only=True))
        isorow = list(rows[7])
        sut = {iso: isorow.index(iso) for iso in MVP}
        for iso in MVP:
            kalite[iso] = rows[8][sut[iso]]
        dugumler = []
        for r in rows[9:]:
            if r[0] not in GHE_CINS or r[1] is None:
                continue
            if r[2]:
                lvl, ad = 1, r[3]
            elif r[3] and r[4] and str(r[3]).strip().endswith("."):
                lvl, ad = 2, r[4]
            elif r[4] and r[5] and str(r[4]).strip().endswith("."):
                lvl, ad = 3, r[5]
            elif r[5] and r[6]:
                lvl, ad = 4, r[6]
            else:
                lvl, ad = 0, r[3]
            dugumler.append((r[0], int(r[1]), lvl, str(ad).strip(), r))
        for cins_en, cins in GHE_CINS.items():
            dg = [x for x in dugumler if x[0] == cins_en]
            ust = {1: None, 2: None}
            for i, (_, kod, lvl, ad, r) in enumerate(dg):
                if lvl in (1, 2):
                    ust[lvl] = kod
                    if lvl == 1:
                        ust[2] = None
                if lvl == 0 or lvl > 3:
                    continue
                sonraki = next((m for m in dg[i + 1 :] if m[2] <= 3), None)
                yaprak = sonraki is None or sonraki[2] <= lvl
                grup = kod if lvl == 2 else (ust[2] if lvl == 3 else None)
                if lvl == 2 or yaprak:
                    nedenler.setdefault(
                        kod, {"kod": kod, "adEn": ad, "duzey": lvl, "ustGrup": ust[1] if lvl == 2 else grup}
                    )
                if not yaprak and lvl != 2:
                    continue
                for iso in MVP:
                    v = r[sut[iso]]
                    hucre = sonuc[iso][cins].setdefault(yas, {"toplam": None, "gruplar": {}, "yapraklar": {}})
                    if lvl == 2 or (lvl == 1 and yaprak):
                        hucre["gruplar"][kod] = v
                    if yaprak:
                        hucre["yapraklar"][kod] = v
            # toplam (All Causes) ve nüfus
            for iso in MVP:
                hucre = sonuc[iso][cins][yas]
                hepsi = next(x for x in dg if x[1] == 0)
                hucre["toplam"] = hepsi[4][sut[iso]]
                for p in rows[9:]:
                    if p[0] == cins_en and p[1] is None and p[3] and str(p[3]).startswith("Population"):
                        hucre["nufus"] = p[sut[iso]]
    # Paylara çevir ve kontrol et
    for iso in MVP:
        for cins in ("female", "male"):
            for yas in GHE_YAS:
                h = sonuc[iso][cins][yas]
                t = h["toplam"]
                for anahtar in ("gruplar", "yapraklar"):
                    toplam = sum(h[anahtar].values())
                    kalan = t - toplam
                    if t and abs(kalan) / t > 0.005:
                        raise SystemExit(f"GHE {yil} {iso} {cins} {yas} {anahtar}: toplam tutmuyor {toplam} vs {t}")
                    if t and abs(kalan) / t > 1e-6:
                        # DSÖ tablosunun kendi iç farkı: alt kalemler 'All Causes'tan az/çok. Uydurma dağıtım yok;
                        # fark ayrı kalem olarak yazılır ve rapora geçer.
                        RAPOR.setdefault("gheIcFarklar", []).append(
                            {"yil": yil, "iso3": iso, "cins": cins, "yas": yas, "duzey": anahtar,
                             "farkBin": sig(kalan), "farkPayi": sig(kalan / t)}
                        )
                        h[anahtar]["dagitilmamis"] = kalan
                    h[anahtar] = {
                        str(k): {"olumBin": sig(v), "pay": sig(v / t if t else 0)} for k, v in h[anahtar].items() if v
                    }
                h["toplamOlumBin"] = sig(t)
                h["nufusBin"] = sig(h.pop("nufus"))
                del h["toplam"]
    return {"veriler": sonuc, "nedenler": nedenler, "kaliteKodu": kalite}


# --------------------------------------------------------------------------- MVP: dosyalar
def mvp(c: pd.DataFrame, adlar: dict) -> None:
    print("yaşam tabloları okunuyor (büyük dosyalar)...")
    lt = yasam_tablolari()
    print("yaşa göre doğurganlık okunuyor...")
    asfr = dogurganlik_yasa_gore()
    print("DSÖ GHE okunuyor...")
    gh = {y: ghe(y) for y in (2019, 2023)}
    hdr = pd.read_csv(HAM / "undp-hdr/HDR25_Composite_indices_complete_time_series.csv", encoding="latin-1")
    wd = {k: wdi(k) for k in ("NY.GDP.PCAP.PP.KD", "SP.URB.TOTL.IN.ZS", "SE.PRM.NENR", "SE.SEC.ENRR",
                               "SE.TER.ENRR", "SL.AGR.EMPL.ZS")}
    yillar = list(range(YIL_BAS, YIL_SON + 1))

    for iso in MVP:
        g = c[c.ISO3_code == iso].set_index("Time").reindex(yillar)

        def wpp_seri(sutun: str, b: int = 6) -> list:
            return [sig(float(v), b) for v in g[sutun]]

        # PIP anketleri (sadece ulusal düzey)
        pip = json.loads((HAM / f"worldbank-pip/{iso}.json").read_text("utf-8"))
        anketler = [
            {
                "yil": r["reporting_year"],
                "refahTuru": {"income": "gelir", "consumption": "tuketim"}[r["welfare_type"]],
                "gini": r["gini"],
                "ondalikPaylar": [r[f"decile{i}"] for i in range(1, 11)],
                "anket": r["survey_acronym"],
                "tahminTuru": r.get("estimation_type"),
            }
            for r in sorted(pip, key=lambda r: (r["reporting_year"], r["welfare_type"]))
            if r["reporting_level"] == "national"
        ]
        if not anketler:
            EKSIKLER.append(f"- {iso}: PIP'te ulusal düzey anket yok")
        h = hdr[hdr.iso3 == iso]

        def hdr_seri(on: str) -> dict:
            ys = [y for y in range(1990, 2024) if f"{on}_{y}" in h.columns and pd.notna(h[f"{on}_{y}"].iloc[0])]
            return {"yillar": ys, "degerler": [sig(float(h[f"{on}_{y}"].iloc[0]), 5) for y in ys]}

        olum = {}
        for y, gg in gh.items():
            od = OLAGAN_DISI_GHE.get((iso, y))
            olum[str(y)] = {
                "kaynak": "ghe2023",
                "dsoVeriKaliteKodu": gg["kaliteKodu"][iso],
                "olaganDisi": od is not None,
                "kullanilmasin": od is not None,
                "olaganDisiNot": od,
                **gg["veriler"][iso],
            }
        veri = {
            "meta": {
                "surum": SURUM,
                "uretildi": dt.date.today().isoformat(),
                "iso3": iso,
                "nameTr": adlar[iso]["nameTr"],
                "kaynaklar": {k: KAYNAKLAR[k] for k in ("wpp2024", "wdi", "pip", "hdr2025", "ghe2023")},
                "tahminSonYil": TAHMIN_SON_YIL,
            },
            "yasamTablosu": {
                "kaynak": "wpp2024",
                "aciklama": "Dönem (period) yaşam tablosu, tek yaş. qx[yilIndex][yas] = x yaşına ulaşanın x+1'e "
                "ulaşmadan ölme olasılığı, yaş 0-99. 100+ açık yaş: qx = 1, kalan ömür eAcik. a0 = 0 yaşında ölenlerin "
                "ortalama yaşadığı yıl kesri; 1-99 yaşta BM ax = 0,5 (dönüştürücü kontrol eder).",
                "yilBas": YIL_BAS,
                "yilSon": YIL_SON,
                "acikYas": 100,
                **lt[iso],
            },
            "seriler": {
                "yilBas": YIL_BAS,
                "yilSon": YIL_SON,
                "e0": {"kaynak": "wpp2024", "birim": "yıl", "female": wpp_seri("LExFemale", 5), "male": wpp_seri("LExMale", 5)},
                "under5Mortality": {"kaynak": "wpp2024", "birim": "1000 canlı doğumda", "degerler": wpp_seri("Q5", 5)},
                "infantMortality": {"kaynak": "wpp2024", "birim": "1000 canlı doğumda", "degerler": wpp_seri("IMR", 5)},
                "tfr": {"kaynak": "wpp2024", "birim": "kadın başına çocuk", "degerler": wpp_seri("TFR", 5)},
                "anneOrtalamaYasi": {"kaynak": "wpp2024", "birim": "yıl (MAC)", "degerler": wpp_seri("MAC", 5)},
                "dogumdaCinsiyetOrani": {"kaynak": "wpp2024", "birim": "100 kız doğumuna erkek doğumu (SRB)",
                                         "degerler": wpp_seri("SRB", 5)},
            },
            "dogurganlikYasaGore": asfr[iso],
            "gelir": {
                "gdpPerCapitaPpp": {"kaynak": "wdi", "seri": "NY.GDP.PCAP.PP.KD", "birim": "sabit 2021 uluslararası $",
                                    **seri(wd["NY.GDP.PCAP.PP.KD"], iso, basamak=7)},
                "anketler": {
                    "kaynak": "pip",
                    "aciklama": "Gini 0-1. ondalikPaylar: en yoksul %10'dan en zengin %10'a gelir/tüketim payı (toplam ~1). "
                    "refahTuru gelir ya da tüketim; ikisi doğrudan kıyaslanamaz.",
                    "liste": anketler,
                },
            },
            "kentlesme": {"kaynak": "wdi", "seri": "SP.URB.TOTL.IN.ZS / 100", "birim": "pay (0-1), ulusal kent tanımı",
                          **seri(wd["SP.URB.TOTL.IN.ZS"], iso, olcek=0.01, basamak=5)},
            "egitim": {
                "ortalamaEgitimYili": {"kaynak": "hdr2025", "birim": "yıl (25+ yaş)", "toplam": hdr_seri("mys"),
                                       "female": hdr_seri("mys_f"), "male": hdr_seri("mys_m")},
                "beklenenEgitimYili": {"kaynak": "hdr2025", "birim": "yıl (okula başlayan çocuk için)",
                                       "toplam": hdr_seri("eys"), "female": hdr_seri("eys_f"), "male": hdr_seri("eys_m")},
                "ilkokulNetOkullasma": {"kaynak": "wdi", "seri": "SE.PRM.NENR", "birim": "%",
                                        **seri(wd["SE.PRM.NENR"], iso, basamak=4)},
                "ortaogretimBrutOkullasma": {"kaynak": "wdi", "seri": "SE.SEC.ENRR", "birim": "% (brüt, 100'ü aşabilir)",
                                             **seri(wd["SE.SEC.ENRR"], iso, basamak=4)},
                "yuksekogretimBrutOkullasma": {"kaynak": "wdi", "seri": "SE.TER.ENRR", "birim": "% (brüt, 100'ü aşabilir)",
                                               **seri(wd["SE.TER.ENRR"], iso, basamak=4)},
            },
            "istihdam": {
                "tarimdaIstihdam": {"kaynak": "wdi", "seri": "SL.AGR.EMPL.ZS", "birim": "% (ILO modellenmiş tahmin)",
                                    **seri(wd["SL.AGR.EMPL.ZS"], iso, basamak=4)}
            },
            "olumNedenleri": {
                "kaynak": "ghe2023",
                "varsayilanYil": GHE_VARSAYILAN_YIL,
                "varsayilanYilNot": "Olağan yıl varsayılanı 2019 (COVID-19 öncesi). Motor ölüm nedenini varsayılan olarak bu "
                "yıldan çeker. 'olaganDisi: true' ve 'kullanilmasin: true' olan yıl oyunda kullanılmaz (Kalite denetimi "
                "2026-11-26, şart O1).",
                "aciklama": "DSÖ GHE, ülke düzeyi. Hücre: cinsiyet × yaş grubu. 'gruplar' = 2. düzey neden grupları, "
                "'yapraklar' = 3. düzeyde en ince kırılım; ikisi de ayrı ayrı toplam ölümün tamamını kapsar (pay toplamı 1). "
                "olumBin/nufusBin = bin kişi. Neden adları ve kodları: nedenler. dsoVeriKaliteKodu: DSÖ'nün dosyadaki ülke renk "
                "kodu (ölüm kaydı verisinin kullanılabilirliği; anlamı DSÖ notlarında).",
                "yasGruplari": GHE_YAS,
                "nedenler": {
                    **{str(k): v for k, v in sorted(gh[2023]["nedenler"].items())},
                    "dagitilmamis": {
                        "kod": "dagitilmamis",
                        "adEn": "Unallocated: WHO 'All Causes' minus the sum of its sub-causes in the source table",
                        "duzey": None,
                        "ustGrup": None,
                        "not": "DSÖ tablosunun kendi iç farkı (gerçekte en çok %0,072; %0,5 dönüştürücünün hata eşiği). Uydurma dağıtım yapılmadı; bkz. rapor.json gheIcFarklar.",
                    },
                },
                "yillar": olum,
            },
        }
        for alan, s in (("ilkokulNetOkullasma", veri["egitim"]["ilkokulNetOkullasma"]),
                        ("ortaogretimBrutOkullasma", veri["egitim"]["ortaogretimBrutOkullasma"]),
                        ("yuksekogretimBrutOkullasma", veri["egitim"]["yuksekogretimBrutOkullasma"])):
            if not s["yillar"]:
                EKSIKLER.append(f"- {iso}: `{alan}` Dünya Bankası'nda hiç yıl yok")
            elif s["yillar"][-1] < REFERANS_YIL - 5:
                EKSIKLER.append(f"- {iso}: `{alan}` son yıl {s['yillar'][-1]}")
        yaz(f"mvp/{iso}.json", veri)


# --------------------------------------------------------------------------- ana akış
def main() -> int:
    d = wpp_gostergeler()
    togo = togo_guncelleme()
    c = ulkeler_tablosu(d, togo)
    if c.ISO3_code.nunique() != 237:
        raise SystemExit(f"237 ülke bekleniyordu, {c.ISO3_code.nunique()} var")
    dunya_farki(d, c)
    adlar = adlar_ve_kodlar(c)
    dogumlar(c, d, adlar)
    countries(c, adlar)
    mvp(c, adlar)
    yaz("rapor.json", {"uretildi": dt.date.today().isoformat(), **RAPOR})
    (CIKTI / "eksikler-otomatik.txt").write_text("\n".join(EKSIKLER) + "\n", "utf-8")
    print(f"{len(EKSIKLER)} eksik kaydı → data/processed/v1/eksikler-otomatik.txt")
    return 0


if __name__ == "__main__":
    sys.exit(main())
