import { describe, expect, it } from "vitest";
import { SceneDirector, homeSeedFor, renderScene, renderStill, KITS, thumbnail, visualDiff, GORSEL_AYAR, sceneStateFromLife } from "../src/scene";
import { drawFigure, ensureHeadContrast, type Figure } from "../src/scene/people";
import { Sprite } from "../src/scene/raster";
import type { Life } from "../src/engine/types";
import { livesWithPlayer } from "../src/scene/render";
import type { Activity, Place, RegionId, SceneFamilyMember, SceneState, ScenePlan, TimeOfDay } from "../src/scene";
import { Rng } from "../src/engine/rng";

const fam = (id: string, role: SceneFamilyMember["role"], sex: "female" | "male", age: number, alive = true): SceneFamilyMember => ({ id, role, sex, age, alive });

const base = (o: Partial<SceneState> = {}): SceneState => ({
  lifeSeed: 7, region: "akdeniz", income: 3, urban: true, age: 30, sex: "female", year: 2026,
  season: "spring", timeOfDay: "day", family: [fam("m", "mother", "female", 58), fam("p", "partner", "male", 32), fam("c", "child", "female", 4)], ...o,
});

function digest(d: Uint8ClampedArray): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < d.length; i += 3) h = Math.imul(h ^ d[i], 0x01000193);
  return h >>> 0;
}

function manualPlan(s: SceneState, place: Place, activity: Activity, variant = 1): ScenePlan {
  return { place, activity, weather: "clear", variant, homeSeed: homeSeedFor(s), signature: "" };
}

describe("yaşayan sahne", () => {
  it("aynı durum ve plan piksel piksel aynı sahneyi verir", () => {
    const s = base();
    const p = manualPlan(s, "home", "rest");
    expect(digest(renderStill(s, p).data)).toBe(digest(renderStill(s, p).data));
  });

  it("tüm bölge × gelir × yerleşim × mekân × etkinlik × saat kombinasyonları hatasız çizilir", () => {
    const times: TimeOfDay[] = ["dawn", "day", "dusk", "night"];
    let n = 0;
    for (const region of Object.keys(KITS) as RegionId[])
      for (const income of [1, 2, 3, 4, 5] as const)
        for (const urban of [true, false])
          for (const place of ["home", "outside"] as Place[]) {
            const s0 = base({ region, income, urban, place });
            for (const activity of KITS[region].activities(place, s0))
              for (const timeOfDay of times) {
                const s = { ...s0, timeOfDay };
                const r = renderStill(s, manualPlan(s, place, activity, n++));
                // boş/tek renk kare olmamalı
                const colors = new Set<number>();
                for (let i = 0; i < r.data.length; i += 4 * 37) colors.add((r.data[i] << 16) | (r.data[i + 1] << 8) | r.data[i + 2]);
                expect(colors.size).toBeGreaterThan(12);
              }
          }
    expect(n).toBeGreaterThan(300);
  });

  it("bir hayat boyunca (0-95 yaş, her yıl) aynı sahne imzası tekrar etmez", () => {
    for (const region of ["akdeniz", "bati-afrika"] as RegionId[]) {
      const d = new SceneDirector(99);
      const sigs: string[] = [];
      for (let age = 0; age <= 95; age++) {
        // bilerek değişmeyen durum: hep aynı mevsim/saat/gelir — en zor tekrar senaryosu
        const s = base({ region, lifeSeed: 99, age, year: 1950 + age, season: "summer", timeOfDay: "day" });
        sigs.push(d.plan(s).signature);
      }
      expect(new Set(sigs).size).toBe(sigs.length);
    }
  });

  it("aynı yılda tekrar istenen sahne de farklı olur", () => {
    const d = new SceneDirector(5);
    const s = base({ lifeSeed: 5 });
    const a = d.plan(s), b = d.plan(s);
    expect(a.signature).not.toBe(b.signature);
  });

  it("ev kimliği gelir ve yerleşim aynı kaldıkça sabit, değişince yeni ev", () => {
    expect(homeSeedFor(base({ age: 20 }))).toBe(homeSeedFor(base({ age: 45 })));
    expect(homeSeedFor(base({ income: 4 }))).not.toBe(homeSeedFor(base({ income: 3 })));
    expect(homeSeedFor(base({ urban: false }))).not.toBe(homeSeedFor(base()));
  });

  it("bölge kiti sahneyi gerçekten değiştirir", () => {
    const a = base({ region: "akdeniz" }), b = base({ region: "bati-afrika" });
    expect(digest(renderStill(a, manualPlan(a, "outside", "walk")).data)).not.toBe(digest(renderStill(b, manualPlan(b, "outside", "walk")).data));
  });

  it("yaş sahneyi değiştirir (karakter büyür)", () => {
    const a = base({ age: 6, family: [] }), b = base({ age: 70, family: [] });
    const pa = manualPlan(a, "home", "rest"), pb = { ...pa };
    expect(digest(renderStill(a, pa).data)).not.toBe(digest(renderStill(b, pb).data));
  });

  it("kimin aynı evde yaşadığı yaşa göre tahmin edilir", () => {
    expect(livesWithPlayer(fam("m", "mother", "female", 40), 10, 1)).toBe(true);
    expect(livesWithPlayer(fam("m", "mother", "female", 60), 35, 1)).toBe(false);
    expect(livesWithPlayer(fam("c", "child", "male", 25), 52, 1)).toBe(false);
    expect(livesWithPlayer({ ...fam("c", "child", "male", 25), livesTogether: true }, 52, 1)).toBe(true);
  });

  it("çizim bütçesi: ortalama tam sahne masaüstünde 25 ms altında", () => {
    const d = new SceneDirector(3);
    const s = base();
    for (let i = 0; i < 5; i++) renderScene(s, d.plan(s));
    const t0 = performance.now();
    for (let i = 0; i < 40; i++) renderScene({ ...s, age: i }, d.plan({ ...s, age: i }));
    expect((performance.now() - t0) / 40).toBeLessThan(25);
  });

  // ---------------------------------------------------------------- Kalite denetimi düzeltmeleri

  const outsideCases = (ages: number[], extra: (i: number) => Partial<SceneState> = () => ({})) => {
    const out: { s: SceneState; p: ScenePlan }[] = [];
    let i = 0;
    for (const region of Object.keys(KITS) as RegionId[])
      for (const age of ages)
        for (const urban of [true, false])
          for (let k = 0; k < 6; k++, i++) {
            const s = base({ region, age, urban, lifeSeed: 1000 + i, income: ((i % 5) + 1) as SceneState["income"], place: "outside", family: [fam("m", "mother", "female", 29)], ...extra(i) });
            const acts = KITS[region].activities("outside", s);
            out.push({ s, p: { place: "outside", activity: acts[i % acts.length], weather: "clear", variant: i * 31 + 7, homeSeed: homeSeedFor(s), signature: "" } });
          }
    return out;
  };

  it("K1: 6 yaş altı oyuncu dışarıda daima bir aile büyüğüyle; bebek dışarıda kucakta", () => {
    for (const { s, p } of outsideCases([0, 0.5, 1, 1.5, 2, 3, 4, 5])) {
      const a = renderScene(s, p).actors;
      expect(a.some((x) => x.family && !x.self && x.age >= 16), `${s.region} ${s.age} ${p.activity}`).toBe(true);
      if (s.age < 2) expect(a.find((x) => x.self)?.carriedBy, `${s.region} ${s.age}`).toBeTruthy();
    }
  });

  it("K1: dışarıdaki küçük kardeş de büyük olmadan çizilmez", () => {
    for (const { s, p } of outsideCases([9, 12], () => ({ family: [fam("m", "mother", "female", 40), fam("k", "sibling", "male", 3)] }))) {
      const a = renderScene(s, p).actors;
      if (a.some((x) => !x.self && x.age < 6)) expect(a.some((x) => x.family && x.age >= 16)).toBe(true);
    }
  });

  it("K1: yanında aile büyüğü olmayan küçük çocuk için yönetmen sahneyi eve alır", () => {
    const d = new SceneDirector(1);
    for (let i = 0; i < 50; i++) {
      const s = base({ age: 3, place: "outside", family: [fam("s", "sibling", "female", 9)] });
      expect(d.plan(s).place).toBe("home");
    }
  });

  it("K2: oyuncu her sahnede çizilir (bebek, kalabalık aile, sağlığı düşük, her mekân)", () => {
    const crowd = [fam("m", "mother", "female", 60), fam("f", "father", "male", 62), fam("p", "partner", "male", 34), ...[1, 3, 5, 8, 11, 14].map((a, i) => fam(`c${i}`, "child", "female", a))];
    const cases = [
      ...outsideCases([0, 0.4, 1.3, 4]),
      ...outsideCases([70, 88], () => ({ health: 15, family: [] })),
      ...outsideCases([33], () => ({ family: crowd })),
    ];
    for (const place of ["home", "outside"] as Place[])
      for (const region of Object.keys(KITS) as RegionId[])
        for (const age of [0, 30, 80]) {
          const s = base({ region, age, place, health: 10, family: age === 30 ? crowd : [fam("m", "mother", "female", age + 28)] });
          for (const activity of KITS[region].activities(place, s)) cases.push({ s, p: { place, activity, weather: "clear", variant: age * 3 + 1, homeSeed: homeSeedFor(s), signature: "" } });
        }
    for (const { s, p } of cases) {
      const me = renderScene(s, p).actors.find((x) => x.self);
      const tag = `${s.region} ${p.place} ${p.activity} yaş ${s.age} sağlık ${s.health}`;
      expect(me, tag).toBeTruthy();
      // Y1: listede olmak yetmez; figür ekranın içinde olmalı (yarı genişlik ~7 px)
      expect(me!.x, tag).toBeGreaterThanOrEqual(8);
      expect(me!.x, tag).toBeLessThanOrEqual(152);
      expect(me!.y, tag).toBeLessThanOrEqual(119);
      expect(me!.y - 32, tag).toBeGreaterThanOrEqual(0);
    }
  });

  it("Y1: kapı önü ve tüm dış sahnelerde hiçbir aile üyesi ekran dışına konmaz (600 dizilim)", () => {
    for (const region of Object.keys(KITS) as RegionId[])
      for (let i = 0; i < 300; i++) {
        const s = base({ region, lifeSeed: 5000 + i, urban: i % 3 !== 0, age: 20 + (i % 60), place: "outside",
          family: [fam("p", "partner", "male", 40), fam("k", "child", "female", 8), fam("m", "mother", "female", 70)] });
        const acts = KITS[region].activities("outside", s);
        const p: ScenePlan = { place: "outside", activity: i % 2 ? "doorstep" : acts[i % acts.length], weather: "clear", variant: i * 7919 + 3, homeSeed: homeSeedFor(s), signature: "" };
        const sc = renderScene(s, p);
        expect(sc.actors.some((x) => x.self)).toBe(true);
        for (const a of sc.actors) {
          expect(a.x, `${region} ${p.activity} ${i} ${a.id}`).toBeGreaterThanOrEqual(8);
          expect(a.x, `${region} ${p.activity} ${i} ${a.id}`).toBeLessThanOrEqual(152);
        }
      }
  });

  it("Y2: çok koyu tenli, ak sakallı yaşlı erkekte gözler seçilir ve sakal gözü çevrelemez", () => {
    const s = base({ region: "bati-afrika" });
    const look = KITS["bati-afrika"].look({ identity: new Rng(3), outfit: new Rng(4), sex: "male", age: 80, stage: "elder", role: "self",
      household: { skinBase: 9, headCover: 0, traditional: 0 }, state: s, plan: manualPlan(s, "outside", "walk") });
    look.skin = 0x472818; look.hair = 0xe4e2dc; look.facial = "beard"; look.headwear = "none"; look.hairStyle = "cropped";
    const sp = new Sprite(40, 60);
    drawFigure(sp, { look, stage: "elder", sex: "male", age: 80, pose: "stand" }, 20, 55);
    const eyes: [number, number][] = [];
    for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) if (sp.get(x, y) === 0x050302) eyes.push([x, y]);
    expect(eyes.length).toBe(2);
    for (const [x, y] of eyes) {
      // gözün sağı/solu ve altı sakal (ak) değil
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, 1]]) expect(sp.get(x + dx, y + dy)).not.toBe(0xe4e2dc);
    }
  });

  it("Y4: başörtüsü rengi tene çok yakınsa tenden uzaklaştırılır", () => {
    const s = base();
    const sc = renderScene(s, manualPlan(s, "home", "rest"));
    expect(sc.actors.length).toBeGreaterThan(0);
    const look = KITS.akdeniz.look({ identity: new Rng(1), outfit: new Rng(2), sex: "female", age: 40, stage: "adult", role: "self",
      household: { skinBase: 3, headCover: 1, traditional: 0 }, state: s, plan: manualPlan(s, "home", "rest") });
    look.headwear = "scarf"; look.headCloth = { c1: look.skin, c2: look.skin, pattern: "solid" };
    const fixed = ensureHeadContrast(look);
    const dist = (a: number, b: number) => Math.abs((a >> 16) - (b >> 16)) + Math.abs(((a >> 8) & 255) - ((b >> 8) & 255)) + Math.abs((a & 255) - (b & 255));
    expect(dist(fixed.headCloth.c1, look.skin)).toBeGreaterThanOrEqual(60);
  });

  it("O1: bir hayat boyunca hiçbir kare öncekilerden birine görsel olarak çok benzemez", () => {
    for (const region of Object.keys(KITS) as RegionId[]) {
      const d = new SceneDirector(77);
      const seen: Uint8Array[] = [];
      for (let age = 0; age <= 90; age += 1) {
        // en zor durum: hep aynı mevsim ve saat
        const s = base({ region, lifeSeed: 77, age, year: 1950 + age, season: "summer", timeOfDay: "day",
          family: [fam("m", "mother", "female", age + 27, age < 60), fam("p", "partner", "male", age - 1, age >= 25)].filter((m) => m.age >= 0) });
        const t = thumbnail(d.compose(s).base);
        for (const o of seen) expect(visualDiff(t, o), `${region} yaş ${age}`).toBeGreaterThanOrEqual(0.08);
        seen.push(t);
      }
    }
  });

  it("O2: başörtülü kadının 25/40/55/75 yaş figürleri birbirinden ayrılır", () => {
    const s = base();
    const kit = KITS.akdeniz;
    const hh = { skinBase: 3, headCover: 1, traditional: 0.5 };
    const sprites = [25, 40, 55, 75].map((age) => {
      const look = kit.look({ identity: new Rng(5), outfit: new Rng(9), sex: "female", age, stage: age >= 62 ? "elder" : "adult", role: "self", household: hh, state: s, plan: manualPlan(s, "home", "rest") });
      look.headwear = "scarf";
      const fig: Figure = { look, stage: age >= 62 ? "elder" : "adult", sex: "female", age, pose: "stand" };
      const sp = new Sprite(40, 60);
      drawFigure(sp, fig, 20, 55);
      return Array.from(sp.px).join(",");
    });
    expect(new Set(sprites).size).toBe(4);
  });

  it("O2: oyuncu işareti varsayılan kapalı, istenince çizilir", () => {
    const s = base();
    const p = manualPlan(s, "outside", "walk");
    const plain = digest(renderScene(s, p).base.data);
    expect(digest(renderScene(s, p, { marker: false }).base.data)).toBe(plain);
    expect(digest(renderScene(s, p, { marker: true }).base.data)).not.toBe(plain);
  });

  it("O3: tüm görsel oranlar tek dosyada ve kaynaksız diye işaretli", () => {
    for (const v of Object.values(GORSEL_AYAR)) expect(v.kaynak).toMatch(/^YOK/);
  });

  it("O4: Güney Avrupa ayrı profil; kiti olmayan ülke sessizce bir kite düşmez", () => {
    const life = (iso3: string): Life => ({
      seed: 1, name: "x", sex: "female", birthYear: 2000, countryIso3: iso3, urban: true, incomeQuintile: 3, age: 20, alive: true,
      meters: { health: 80, happiness: 50, knowledge: 50, relationships: 50 }, budget: { cash: 0, debt: 0, annualIncome: 0, annualExpenses: 0 }, people: [], events: [],
    });
    const m = { year: 2020, season: "summer" as const, timeOfDay: "day" as const };
    expect(sceneStateFromLife(life("ESP"), m)).toMatchObject({ region: "akdeniz", profile: "guney-avrupa", kitStatus: "gecici" });
    expect(sceneStateFromLife(life("TUR"), m)).toMatchObject({ region: "akdeniz", profile: "dogu-akdeniz", kitStatus: "tam" });
    expect(sceneStateFromLife(life("NGA"), m)).toMatchObject({ region: "bati-afrika", kitStatus: "tam" });
    expect(() => sceneStateFromLife(life("IND"), m)).toThrow(/Görsel kit yok/);
    // Y5: İsrail bölge adlı profile değil nötr geçici profile; çıkarılan 5 ülke geri ve "geçici"
    expect(sceneStateFromLife(life("ISR"), m)).toMatchObject({ profile: "dusuk-basortusu-gecici", kitStatus: "gecici" });
    for (const c of ["ARM", "GEO", "ALB", "HRV", "MNE"]) expect(sceneStateFromLife(life(c), m).kitStatus).toBe("gecici");
    expect(sceneStateFromLife(life("IND"), { ...m, fallbackRegion: "akdeniz" })).toMatchObject({ profile: "yedek", kitStatus: "yedek" });
    // Güney Avrupa profili başörtüsünü Doğu Akdeniz'den belirgin az çizer
    expect(GORSEL_AYAR["guney-avrupa"].headCover.householdShare).toBeLessThan(GORSEL_AYAR["dogu-akdeniz"].headCover.householdShare / 5);
  });
});
