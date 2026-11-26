// Kim sahnede, kim kimin yanında? Güvenlik kuralları (Kalite denetimi K1):
//  - 6 yaş altı çocuk dışarıda HER ZAMAN aileden bir büyükle (16+) birliktedir.
//  - Hanede böyle bir büyük yoksa yönetmen sahneyi eve alır.
import { hash, hashStr } from "./palette";
import type { SceneFamilyMember, SceneState } from "./types";

export const GUARDIAN_MIN_AGE = 16;
export const NEEDS_GUARDIAN_UNDER = 6;

/** Aynı evde yaşıyor mu? Motor açıkça söylemediyse yaşa ve role göre tahmin. */
export function livesWithPlayer(m: SceneFamilyMember, selfAge: number, lifeSeed: number): boolean {
  if (m.livesTogether !== undefined) return m.livesTogether;
  switch (m.role) {
    case "mother": case "father": return selfAge < 20 || (m.age >= 78 && hash(lifeSeed, hashStr(m.id)) % 2 === 0);
    case "sibling": return selfAge < 19 && m.age < 21;
    case "partner": case "pet": return true;
    case "child": return m.age < 20;
    default: return false;
  }
}

/** Aynı evde yaşayan, hayatta, çocuğa göz kulak olabilecek aile büyükleri (tercih sırasıyla). */
export function guardians(s: SceneState): SceneFamilyMember[] {
  const pref: Record<string, number> = { mother: 0, father: 1, partner: 2, sibling: 3, child: 4 };
  return s.family
    .filter((m) => m.alive && m.role !== "pet" && m.role !== "friend" && m.role !== "ex" && m.age >= GUARDIAN_MIN_AGE && livesWithPlayer(m, s.age, s.lifeSeed))
    .sort((a, b) => (pref[a.role] ?? 9) - (pref[b.role] ?? 9));
}

/** Oyuncu dışarı çıkabilir mi? Küçük çocuk + yanında büyük yoksa hayır. */
export function canGoOutside(s: SceneState): boolean {
  return s.age >= NEEDS_GUARDIAN_UNDER || guardians(s).length > 0;
}
