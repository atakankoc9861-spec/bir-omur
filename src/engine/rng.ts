// Tohumlu rastgele sayı üreteci (mulberry32).
// Aynı tohum = aynı hayat. Test ve "bu hayatı tekrar izle" için gerekli.

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Ağırlıklı seçim: ör. ülkeleri doğum sayısına göre çekmek. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T {
    if (items.length === 0) throw new Error("weighted: boş liste");
    let total = 0;
    for (const it of items) total += weight(it);
    let r = this.next() * total;
    for (const it of items) {
      r -= weight(it);
      if (r < 0) return it;
    }
    return items[items.length - 1];
  }
}
