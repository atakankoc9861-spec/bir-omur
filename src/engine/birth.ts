import { Rng } from "./rng";
import type { CountryData } from "./types";

export type BirthWeighting = "births" | "population";

/** Doğum yerini gerçek doğum (veya nüfus) payına göre çeker. */
export function drawCountry(
  rng: Rng,
  countries: readonly CountryData[],
  weighting: BirthWeighting = "births",
): CountryData {
  return rng.weighted(countries, (c) =>
    weighting === "births" ? c.annualBirths : c.population,
  );
}

/** Bir ülkenin dünya doğumlarındaki payı (0-1). "1/N" gösterimi için. */
export function birthShare(country: CountryData, all: readonly CountryData[]): number {
  const total = all.reduce((s, c) => s + c.annualBirths, 0);
  return country.annualBirths / total;
}
