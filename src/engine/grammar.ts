// Küçük, tohumlu, tekrar önleyici metin grameri (Tracery deseni; kod bizim).
//  - "#sembol#" kuralın seçeneklerinden biriyle açılır; seçenekler içinde yine #...# olabilir.
//  - Bağlam değişkenleri (ör. #anne#) gramerden önce bakılır.
//  - Ekler: #anne.in# (ilgi), .i (belirtme), .e (yönelme), .de (bulunma), .den (ayrılma), .le (vasıta), .cap (büyük harf).
//  - Tekrar önleme: her sembolde bu hayatta en az kullanılan seçenek tercih edilir; tam cümle
//    daha önce üretildiyse çağıran yeniden dener (TextMemory.used).
import type { Rng } from "./rng";

export type Grammar = Record<string, readonly string[]>;

export class TextMemory {
  readonly used = new Set<string>();
  readonly counts = new Map<string, number>();
  pickIndex(key: string, n: number, rng: Rng): number {
    let best: number[] = [];
    let min = Infinity;
    for (let i = 0; i < n; i++) {
      const c = this.counts.get(`${key}#${i}`) ?? 0;
      if (c < min) { min = c; best = [i]; }
      else if (c === min) best.push(i);
    }
    const i = best[Math.floor(rng.next() * best.length)];
    this.counts.set(`${key}#${i}`, min + 1);
    return i;
  }
}

const VOWELS = "aeıioöuüAEIİOÖUÜ";
const BACK = "aıouAIOU";
const ROUND = "oöuüOÖUÜ";
const HARD = "fstkçşhpFSTKÇŞHP";

function lastVowel(w: string): string {
  for (let i = w.length - 1; i >= 0; i--) if (VOWELS.includes(w[i])) return w[i];
  return "e";
}

/** Türkçe ünlü uyumuyla ek. Son kelime büyük harfle başlıyorsa kesme işareti konur (özel ad). */
export function suffix(word: string, kind: "in" | "i" | "e" | "de" | "den" | "le"): string {
  if (!word) return word;
  const lastWord = word.split(/\s+/).pop() ?? word;
  const proper = /^[A-ZÇĞİÖŞÜ]/.test(lastWord);
  const ap = proper ? "'" : "";
  const v = lastVowel(word);
  const back = BACK.includes(v);
  const round = ROUND.includes(v);
  const i4 = back ? (round ? "u" : "ı") : round ? "ü" : "i";
  const e2 = back ? "a" : "e";
  const endsVowel = VOWELS.includes(word[word.length - 1]);
  const hard = HARD.includes(word[word.length - 1]);
  // Çok kelimeli özel ad tamlaması (ör. "Amerika Birleşik Devletleri"): iyelik eki sonrası "n" kaynaştırması.
  if (proper && word.includes(" ") && /(ları|leri|sı|si|su|sü)$/.test(lastWord)) {
    switch (kind) {
      case "in": return word + ap + "n" + i4 + "n";
      case "i": return word + ap + "n" + i4;
      case "e": return word + ap + "n" + e2;
      case "de": return word + ap + "nd" + e2;
      case "den": return word + ap + "nd" + e2 + "n";
      case "le": return word + ap + "yl" + e2;
    }
  }
  switch (kind) {
    case "in": return word + ap + (endsVowel ? "n" : "") + i4 + "n";
    case "i": return word + ap + (endsVowel ? "y" : "") + i4;
    case "e": return word + ap + (endsVowel ? "y" : "") + e2;
    case "de": return word + ap + (hard ? "t" : "d") + e2;
    case "den": return word + ap + (hard ? "t" : "d") + e2 + "n";
    case "le": return word + ap + (endsVowel ? "y" : "") + "l" + e2;
  }
}

export function cap(s: string): string {
  return s ? s[0].toLocaleUpperCase("tr") + s.slice(1) : s;
}

export function expand(text: string, g: Grammar, vars: Record<string, string>, rng: Rng, mem: TextMemory, depth = 0): string {
  if (depth > 8) return text;
  return text.replace(/#([a-zA-Z0-9_çğıöşüÇĞİÖŞÜ]+)((?:\.[a-z]+)*)#/g, (_m, key: string, mods: string) => {
    let out: string;
    if (key in vars) out = vars[key];
    else if (g[key]) {
      const opts = g[key];
      out = expand(opts[mem.pickIndex(key, opts.length, rng)], g, vars, rng, mem, depth + 1);
    } else out = `#${key}#`;
    for (const m of mods.split(".").filter(Boolean)) {
      if (m === "cap") out = cap(out);
      else if (m === "in" || m === "i" || m === "e" || m === "de" || m === "den" || m === "le") out = suffix(out, m);
    }
    return out;
  });
}

/** Metni üret; bu hayatta daha önce üretilmiş bir cümleyse en çok `tries` kez yeniden dene. Olmazsa null. */
export function expandUnique(text: string, g: Grammar, vars: Record<string, string>, rng: Rng, mem: TextMemory, tries = 6): string | null {
  for (let t = 0; t < tries; t++) {
    const s = cap(expand(text, g, vars, rng, mem).replace(/\s+/g, " ").trim());
    if (!mem.used.has(s)) {
      mem.used.add(s);
      return s;
    }
  }
  return null;
}
