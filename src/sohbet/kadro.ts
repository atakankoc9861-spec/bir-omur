// Demo kadrosu: isimler content/countries/TUR.json havuzlarından (yalnız oyunda_kullanilabilir: true).
import TUR from "../../content/countries/TUR.json";
import type { Rng } from "./rng";

export type Sex = "female" | "male";

interface Havuz { cinsiyet: string; yilBas: number; topluluk: string; din: string | null; isimler: string[]; oyunda_kullanilabilir: boolean }
const T = TUR as { isimler: { havuzlar: Havuz[]; soyadlari: { isimler: string[] }[] } };

function havuz(sex: Sex, decade: number): string[] {
  const c = sex === "female" ? "kadin" : "erkek";
  const h = T.isimler.havuzlar.find((p) => p.oyunda_kullanilabilir && p.cinsiyet === c && p.yilBas === decade && p.topluluk === "genel" && !p.din);
  if (!h || h.isimler.length === 0) throw new Error(`İsim havuzu yok: ${c} ${decade}`);
  return h.isimler.filter((n) => !n.includes(" ")); // iki adlıları demo için ayıkla (mesajda tek ad doğal)
}
const SOYAD = T.isimler.soyadlari[0].isimler;

export interface Kisi { ad: string; sex: Sex }
export interface Kadro {
  me: Kisi;
  soyad: string;
  anne: Kisi;
  baba: Kisi;
  kardes: Kisi;
  teyze: Kisi;
  kanka: Kisi;
  ilgi: Kisi;
  etut: Kisi;
  patron: Kisi;
  rehber: Kisi;
  /** Sınıf grubundaki diğerleri (c0..c4) */
  sinif: Kisi[];
  ilgiEmoji: string;
  ilgiSehir: string;
}

const SEHIRLER = ["İzmir", "Ankara", "Eskişehir"];
const EMOJI = ["🌙", "🍓", "☀️", "🫶", "🌻"];

export function kadroKur(rng: Rng): Kadro {
  const used = new Set<string>();
  const pick = (sex: Sex, decade: number): Kisi => {
    const pool = havuz(sex, decade).filter((n) => !used.has(n));
    const ad = rng.pick(pool);
    used.add(ad);
    return { ad, sex };
  };
  const meSex: Sex = rng.chance(0.5) ? "female" : "male";
  const other: Sex = meSex === "female" ? "male" : "female";
  const me = pick(meSex, 2000);
  const sinif: Kisi[] = [];
  // c0 bağıran, c1 sınıf başkanı, c2 espri, c3 her şeyi soran, c4 gece yazan sessiz
  const sx: Sex[] = ["male", "female", rng.chance(0.5) ? "male" : "female", rng.chance(0.5) ? "male" : "female", rng.chance(0.5) ? "male" : "female"];
  const kanka = pick(meSex, 2000);
  const ilgi = pick(other, 2000);
  const etut = pick(rng.chance(0.5) ? "female" : "male", 2000);
  for (const s of sx) sinif.push(pick(s, 2000));
  const ilgiSehir = rng.pick(SEHIRLER);
  return {
    me,
    soyad: rng.pick(SOYAD),
    anne: pick("female", 1970),
    baba: pick("male", rng.chance(0.5) ? 1970 : 1960),
    kardes: pick(rng.chance(0.5) ? "female" : "male", 2010),
    teyze: pick("female", rng.chance(0.5) ? 1970 : 1980),
    kanka,
    ilgi,
    etut,
    patron: pick("male", 1980),
    rehber: pick("female", 1980),
    sinif,
    ilgiEmoji: rng.pick(EMOJI),
    ilgiSehir,
  };
}
