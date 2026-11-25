import { describe, expect, it } from "vitest";
import { Rng } from "../src/engine/rng";
import { drawCountry } from "../src/engine/birth";
import type { CountryData } from "../src/engine/types";

// Test için yapay iki ülke (gerçek veri değil).
const fake = (iso3: string, births: number): CountryData => ({
  iso3,
  nameTr: iso3,
  year: 2024,
  annualBirths: births,
  population: births * 50,
  lifeExpectancy: { female: 75, male: 70 },
  under5Mortality: 10,
  gdpPerCapitaPpp: 10000,
  gini: 35,
  urbanShare: 0.5,
  source: "test",
});

describe("drawCountry", () => {
  it("aynı tohum aynı sonucu verir", () => {
    const list = [fake("AAA", 900), fake("BBB", 100)];
    expect(drawCountry(new Rng(42), list).iso3).toBe(drawCountry(new Rng(42), list).iso3);
  });

  it("doğum payına yakın oranda çeker", () => {
    const list = [fake("AAA", 900), fake("BBB", 100)];
    const rng = new Rng(1);
    let a = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) if (drawCountry(rng, list).iso3 === "AAA") a++;
    expect(a / n).toBeGreaterThan(0.88);
    expect(a / n).toBeLessThan(0.92);
  });
});
