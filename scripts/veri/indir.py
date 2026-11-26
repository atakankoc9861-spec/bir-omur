"""Veri v1 ham dosyalarını indirir ve data/raw/MANIFEST.json yazar.

Çalıştırma (repo kökünden):  python3 -I scripts/veri/indir.py
Var olan dosyalar tekrar indirilmez (yeniden indirmek için --yeniden).
Ham dosyalar indirildikten sonra DEĞİŞTİRİLMEZ (departman kuralı).

Parmak izi sabitleme: --yeniden ile indirilen dosyanın sha256'sı MANIFEST'tekinden farklıysa
eski dosyanın üzerine YAZILMAZ. Yeni hâli "<dosya>.yeni-<tarih>" adıyla yanına konur, uyarı verilir
ve çıkış kodu 2 olur. Bu özellikle canlı API'ler (Dünya Bankası WDI/PIP) için önemli: aynı adres
zamanla farklı rakam döndürebilir. Yeni rakamlar ancak yeni veri sürümüyle (v2) kullanılır.

Erişim: Atakan'ın bilgisayarından da aynı komutla çalışır (Python 3.9+, ek paket gerekmez).
"""

from __future__ import annotations

import datetime as dt
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

KOK = Path(__file__).resolve().parents[2]
HAM = KOK / "data" / "raw"

WPP = "https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)"
WB = "https://api.worldbank.org/v2"
MVP = ["TUR", "IND", "NGA", "CHN", "USA"]

# Dünya Bankası WDI göstergeleri. "tum" = bütün ülkeler, "mvp" = sadece 5 ülke.
WB_GOSTERGELER = {
    "NY.GDP.PCAP.PP.KD": "tum",  # Kişi başı GSYH, SAGP (sabit 2021 uluslararası $)
    "SI.POV.GINI": "tum",  # Gini endeksi (0-100)
    "SP.URB.TOTL.IN.ZS": "tum",  # Kentli nüfus (% toplam)
    "SE.PRM.NENR": "mvp",  # İlkokul net okullaşma (%)
    "SE.SEC.ENRR": "mvp",  # Ortaöğretim brüt okullaşma (%)
    "SE.TER.ENRR": "mvp",  # Yükseköğretim brüt okullaşma (%)
    "SL.AGR.EMPL.ZS": "mvp",  # Tarımda istihdam (% toplam istihdam)
}

KAYNAKLAR: list[dict] = [
    # --- BM WPP 2024 (ana kaynak) ---
    {
        "dosya": "un-wpp-2024/WPP2024_Demographic_Indicators_Medium.csv.gz",
        "url": f"{WPP}/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz",
        "kurum": "UN DESA Population Division",
        "ad": "World Population Prospects 2024, Demographic Indicators, Medium variant (1950-2100)",
        "lisans": "CC BY 3.0 IGO",
    },
    {
        "dosya": "un-wpp-2024/WPP2024_Fertility_by_Age5.csv.gz",
        "url": f"{WPP}/CSV_FILES/WPP2024_Fertility_by_Age5.csv.gz",
        "kurum": "UN DESA Population Division",
        "ad": "WPP 2024, Fertility by 5-year age group of mother (1950-2100)",
        "lisans": "CC BY 3.0 IGO",
    },
    *[
        {
            "dosya": f"un-wpp-2024/WPP2024_Life_Table_Complete_Medium_{cins}_{donem}.csv.gz",
            "url": f"{WPP}/CSV_FILES/WPP2024_Life_Table_Complete_Medium_{cins}_{donem}.csv.gz",
            "kurum": "UN DESA Population Division",
            "ad": f"WPP 2024, Complete (single-age) life table, Medium, {cins}, {donem}",
            "lisans": "CC BY 3.0 IGO",
        }
        for cins in ("Female", "Male")
        for donem in ("1950-2023", "2024-2100")
    ],
    {
        "dosya": "un-wpp-2024-interim-togo/WPP2024_CSV_files_update.zip",
        "url": f"{WPP}/WPP2024_CSV_files_update.zip",
        "kurum": "UN DESA Population Division",
        "ad": "WPP 2024 Interim Update (2026-01-19): Togo için yenilenmiş orta varyant tahmin ve projeksiyonları",
        "lisans": "CC BY 3.0 IGO",
    },
    # --- OWID (karşılaştırma; Dünya ve Kültür'ün K1 hesabındaki dosya) ---
    {
        "dosya": "owid/number-of-births-per-year.csv",
        "url": "https://ourworldindata.org/grapher/number-of-births-per-year.csv",
        "kurum": "Our World in Data (kaynak: UN WPP 2024 + Interim Update)",
        "ad": "Number of births per year",
        "lisans": "CC BY 4.0 (OWID işlemesi); asıl veri BM lisansına tabi",
    },
    {
        "dosya": "owid/number-of-births-per-year.metadata.json",
        "url": "https://ourworldindata.org/grapher/number-of-births-per-year.metadata.json",
        "kurum": "Our World in Data",
        "ad": "Number of births per year, metadata",
        "lisans": "CC BY 4.0",
    },
    # --- UNDP İnsani Gelişme Raporu 2025 (eğitim yılı) ---
    {
        "dosya": "undp-hdr/HDR25_Composite_indices_complete_time_series.csv",
        "url": "https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Composite_indices_complete_time_series.csv",
        "kurum": "UNDP Human Development Report Office",
        "ad": "HDR 2025 Composite indices complete time series (1990-2023)",
        "lisans": "CC BY 3.0 IGO",
    },
    # --- DSÖ Küresel Sağlık Tahminleri (GHE 2023 sürümü, Eylül/Ekim 2026) ---
    *[
        {
            "dosya": f"who-ghe/deaths_bycountry_age_sex_{yil}_2026-10-01.xlsx",
            "url": url,
            "kurum": "World Health Organization, Department of Data and Analytics",
            "ad": f"Global Health Estimates 2023: deaths by cause, age, sex, by country, {yil}",
            "lisans": "NET DEĞİL: data.who.int şartları CC BY 4.0 + DSÖ ek şartları; who.int veri politikası 'kamu sağlığı "
            "amaçlı' kullanım, ticari tanıtım yok, küçük biçim uyarlaması dışında değişiklik için yazılı izin. "
            "Ayrıntı: data/eksikler.md bölüm 3.8",
        }
        for yil, url in (
            (
                2023,
                "https://cdn.who.int/media/docs/default-source/gho-documents/global-health-estimates/"
                "deaths_bycountry_age_sex_2023_2026-10-01e7663d9c-6384-479a-bb37-b58b127e7288.xlsx?sfvrsn=3ede9d95_2",
            ),
            (
                2019,
                "https://cdn.who.int/media/docs/default-source/gho-documents/global-health-estimates/"
                "deaths_bycountry_age_sex_2019_2026-10-01.xlsx?sfvrsn=65519f95_2",
            ),
        )
    ],
    # --- Türkçe ülke adları (Unicode CLDR) ---
    {
        "dosya": "cldr/tr-territories.json",
        "url": "https://raw.githubusercontent.com/unicode-org/cldr-json/main/cldr-json/cldr-localenames-full/main/tr/territories.json",
        "kurum": "Unicode CLDR",
        "ad": "CLDR Türkçe bölge/ülke adları",
        "lisans": "Unicode License v3",
    },
    # --- Dünya Bankası WDI (API) ---
    *[
        {
            "dosya": f"worldbank-wdi/{kod}.json",
            "url": (
                f"{WB}/country/{'all' if kapsam == 'tum' else ';'.join(MVP)}/indicator/{kod}"
                f"?format=json&per_page=30000&date=1960:2025"
            ),
            "kurum": "World Bank, World Development Indicators",
            "ad": f"WDI {kod}",
            "lisans": "CC BY 4.0",
        }
        for kod, kapsam in WB_GOSTERGELER.items()
    ],
    *[
        {
            "dosya": f"worldbank-wdi/meta-{kod}.json",
            "url": f"{WB}/indicator/{kod}?format=json",
            "kurum": "World Bank, World Development Indicators",
            "ad": f"WDI {kod} gösterge tanımı",
            "lisans": "CC BY 4.0",
        }
        for kod in WB_GOSTERGELER
    ],
    # --- Dünya Bankası PIP (Gini + ondalık gelir/tüketim payları) ---
    *[
        {
            "dosya": f"worldbank-pip/{iso}.json",
            "url": f"https://api.worldbank.org/pip/v1/pip?country={iso}&year=all&fill_gaps=false&ppp_version=2021",
            "kurum": "World Bank, Poverty and Inequality Platform",
            "ad": f"PIP anket yılları, {iso} (Gini, ondalık paylar)",
            "lisans": "CC BY 4.0",
        }
        for iso in MVP
    ],
]


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for blok in iter(lambda: f.read(1 << 20), b""):
            h.update(blok)
    return h.hexdigest()


def indir(url: str, hedef: Path) -> None:
    hedef.parent.mkdir(parents=True, exist_ok=True)
    gecici = hedef.with_suffix(hedef.suffix + ".part")
    istek = urllib.request.Request(url, headers={"User-Agent": "bir-omur-veri/1.0"})
    with urllib.request.urlopen(istek, timeout=600) as yanit, gecici.open("wb") as f:
        while blok := yanit.read(1 << 20):
            f.write(blok)
    gecici.replace(hedef)


def api_surumu(p: Path) -> str | None:
    """Dünya Bankası WDI yanıtındaki 'lastupdated' alanı (sürüm bilgisi)."""
    if "worldbank-wdi" not in str(p) or p.name.startswith("meta-"):
        return None
    try:
        return json.loads(p.read_text("utf-8"))[0].get("lastupdated")
    except Exception:  # noqa: BLE001
        return None


def main() -> int:
    yeniden = "--yeniden" in sys.argv
    # --sadece <metin>: sadece adında bu metin geçen dosyaları yeniden indir (ör. --sadece worldbank)
    sadece = sys.argv[sys.argv.index("--sadece") + 1] if "--sadece" in sys.argv else None
    manifest_yolu = HAM / "MANIFEST.json"
    eski = {}
    if manifest_yolu.exists():
        eski = {k["dosya"]: k for k in json.loads(manifest_yolu.read_text("utf-8"))["dosyalar"]}
    kayitlar = []
    hata = 0
    degisen = 0
    for k in KAYNAKLAR:
        p = HAM / k["dosya"]
        tarih = eski.get(k["dosya"], {}).get("indirildi")
        eski_iz = eski.get(k["dosya"], {}).get("sha256")
        if (yeniden and (sadece is None or sadece in k["dosya"])) or not p.exists():
            print("indiriliyor:", k["dosya"])
            hedef = p if not p.exists() else p.with_name(p.name + ".indirilen")
            try:
                indir(k["url"], hedef)
            except Exception as e:  # noqa: BLE001
                print("  HATA:", e)
                hata += 1
                continue
            if hedef != p:
                if eski_iz and sha256(hedef) != eski_iz:
                    yeni = p.with_name(f"{p.name}.yeni-{dt.date.today().isoformat()}")
                    hedef.replace(yeni)
                    print(f"  UYARI: kaynak değişmiş (sha256 farklı). Eski dosya korunuyor; yeni hâli {yeni.name}. "
                          "Yeni rakamlar ancak yeni veri sürümüyle kullanılmalı.")
                    degisen += 1
                else:
                    hedef.replace(p)
            tarih = tarih or dt.date.today().isoformat()
            if not eski_iz:
                tarih = dt.date.today().isoformat()
        kayit = {**k, "bayt": p.stat().st_size, "sha256": sha256(p), "indirildi": tarih or dt.date.today().isoformat()}
        kayit["surumSabit"] = not k["dosya"].startswith(("worldbank-wdi/", "worldbank-pip/"))
        if (v := api_surumu(p)) is not None:
            kayit["apiSonGuncelleme"] = v
        kayitlar.append(kayit)
    manifest_yolu.write_text(
        json.dumps({"aciklama": "Ham dosyaların kaynağı ve parmak izi. scripts/veri/indir.py yazar.", "dosyalar": kayitlar},
                   ensure_ascii=False, indent=2) + "\n",
        "utf-8",
    )
    print(f"{len(kayitlar)} dosya kayıtlı, {hata} hata, {degisen} kaynağı değişmiş dosya.")
    return 1 if hata else (2 if degisen else 0)


if __name__ == "__main__":
    sys.exit(main())
