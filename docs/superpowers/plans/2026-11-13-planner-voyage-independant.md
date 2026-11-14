# Planner « voyage indépendant » v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/organiser-son-voyage-au-vietnam/` — a static, indexable page carrying an interactive tool that composes an itinerary from curated bases, shows what it costs in days and in rhythm, refuses what does not fit, and routes the traveller either to booking links or to an agency quote.

**Architecture:** A pure TypeScript engine (`lib/planner.ts`) that imports nothing, so `node --test` runs it directly and the UI can be replaced without touching the arithmetic. Data lives in `content/*.json` and reaches the page through `lib/content/source.ts`, the repo's single content boundary. The UI is the repo's first `"use client"` component; its state lives in the URL hash, so a plan is shareable and re-openable with no server and no database.

**Tech Stack:** Next.js 15 App Router with `output: "export"`, React 19, TypeScript strict, `node:test` for unit tests (built into Node 22.19 — **no new dependency**), and a build-time validator following the repo's existing `scripts/check-*.mjs` pattern.

## Global Constraints

- **No new npm dependency.** Runtime deps stay exactly: `next`, `react`, `react-dom`, `sharp`. Dev deps stay exactly: `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `wrangler`, `yaml`.
- **`lib/planner.ts` must import nothing** — no `@/` alias, no JSON, no React. `node --test` does not resolve the `@/*` path alias, and the engine must stay testable standalone. All data arrives as function arguments.
- **All site-facing copy in French. All code comments in English**, matching every existing file in the repo.
- **French typography:** a non-breaking space before `: ; ! ? »`, written ` `. Reuse `typo()` exported from `components/Article.tsx` for any prose rendered from data.
- **Every internal href ends with `/`.** `scripts/check-links.mjs` runs in `postbuild` and fails the build otherwise.
- **Identifiers use French domain nouns** (`bilan`, `rythme`, `retraits`, `etapes`), matching `worker/leads.ts` (`enregistrerLead`, `anonymiserAnciens`) and `lib/content/index.ts` (`lien`).
- **Page title ≤ 60 characters, meta description ≤ 155 characters.** Both have overrun on this repo before and were fixed pre-deploy.
- **The landing page is indexable; the generated plan view is not.** The plan lives in the URL hash, which crawlers do not index, so no extra `noindex` tag is needed — but never move plan state into a path or query string.
- **Affiliate links are plain `<a href>`** — no script, no pixel, no iframe. This preserves the no-cookie architecture documented in `app/layout.tsx`. A disclosure line sits next to every affiliate block.
- **TypeScript is `strict`.** No `any`, no non-null assertions.
- **The `.ts` extension in an import belongs only in a test file.** Task 2 added
  `allowImportingTsExtensions` to `tsconfig.json` because `node --test` requires
  the explicit extension and the brief's test code uses it. That flag now permits
  the style everywhere, which is a trap: application code written
  `from "./foo.ts"` would compile here and rely on bundler-mode resolution to
  survive. In `app/`, `components/` and non-test `lib/`, import without the
  extension, as every existing file does.

---

## File Structure

| File | Responsibility |
|---|---|
| `content/legs.json` | **exists** — travel legs. Modified in Task 1 to mark overnight modes. |
| `content/places.json` | **exists** — modified in Task 1 to add `nuits` per place. |
| `content/seasons.json` | **exists, untouched** — 12 months × 3 regions. |
| `lib/content/types.ts` | modified — `Leg`, `LegMode`, `Regle`, `LegsFile`; extend `Place`. |
| `lib/content/source.ts` | modified — add `legs()`. |
| `lib/content/index.ts` | modified — add `getLegs()`. |
| `lib/planner.ts` | **new** — the engine. Imports nothing. |
| `lib/planner.test.ts` | **new** — `node:test` unit tests. |
| `lib/booking.ts` | **new** — affiliate link builder, the swap point for a future API. |
| `lib/booking.test.ts` | **new** — unit tests. |
| `components/Planner.tsx` | **new** — the client component. |
| `app/organiser-son-voyage-au-vietnam/page.tsx` | **new** — the static host page. |
| `app/globals.css` | modified — planner styles. |
| `scripts/check-planner.mjs` | **new** — build-time data validation. |
| `package.json` | modified — `test` script, `check-planner` in `prebuild`. |
| `lib/routes.ts` | modified — one entry. `app/sitemap.ts` reads `publishedRoutes()` from it, so the sitemap needs no edit. |

**One naming collision to expect.** `lib/content/types.ts` already exports
`SeasonRow`; `lib/planner.ts` declares its own `SaisonRow` with the same shape,
because the engine imports nothing. They are structurally identical, so
TypeScript accepts passing one where the other is expected. Do not "fix" this by
importing across the boundary — that would break `node --test`.

---

### Task 1: Data — nights per place, overnight legs, types, loader, validator

**Files:**
- Modify: `content/places.json`
- Modify: `content/legs.json`
- Modify: `lib/content/types.ts`
- Modify: `lib/content/source.ts`
- Modify: `lib/content/index.ts`
- Create: `scripts/check-planner.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing.
- Produces: `Place` gains `nuits: { min: number; ideal: number }`. New exported types `LegMode`, `Leg`, `Regle`, `LegsFile`. New loader `getLegs(): Promise<LegsFile>`.

- [ ] **Step 1: Add `nuits` to every place in `content/places.json`**

Every one of the 23 entries gains a `nuits` object. Values below are derived from the six hand-written itineraries in `content/itineraries/` (`min` = the shortest stay any of them uses, `ideal` = the most common). Places absent from all six take `min: 1, ideal: 2`, flagged by the validator as a guess to revisit.

```json
{ "id": "hanoi", "fr": "Hanoï", "map": "Hanoï", "lat": 21.028, "lon": 105.854, "nuits": { "min": 2, "ideal": 3 } }
```

Apply these values (keep each entry's existing `fr`, `map`, `lat`, `lon` untouched):

| id | min | ideal | | id | min | ideal |
|---|---|---|---|---|---|---|
| hanoi | 2 | 3 | | hoi-an | 2 | 4 |
| ninh-binh | 1 | 2 | | hcmc | 1 | 2 |
| lan-ha | 1 | 1 | | can-tho | 1 | 2 |
| ha-long | 1 | 1 | | chau-doc | 1 | 1 |
| pu-luong | 1 | 2 | | phu-quoc | 2 | 3 |
| mai-chau | 1 | 1 | | con-dao | 2 | 3 |
| ha-giang | 1 | 1 | | phnom-penh | 1 | 2 |
| dong-van | 1 | 1 | | siem-reap | 2 | 3 |
| cao-bang | 1 | 2 | | sapa | 1 | 2 |
| ban-gioc | 1 | 1 | | da-nang | 1 | 1 |
| ba-be | 1 | 2 | | hue | 1 | 2 |
| phong-nha | 1 | 2 | | | | |

- [ ] **Step 2: Mark overnight modes in `content/legs.json`**

A mode that carries its own bed consumes one of the traveller's nights. It may
*also* eat some daytime — the two are independent, and three of the five below
already carry a non-zero `days` for good researched reasons. **Add `"nuit": true`
and change nothing else. In particular do not touch `days`:** the Hanoï–Da Nang
train keeps `0.5` because it arrives mid-morning, and its own `note` says so;
zeroing it would make the file contradict itself and make the planner promise a
free day it cannot deliver.

Add `"nuit": true` to exactly these five modes:

- `hanoi → ha-giang`, mode `bus-nuit`
- `hanoi → hue`, mode `train-nuit`
- `hanoi → da-nang`, mode `train-nuit`
- `hanoi → phong-nha`, mode `train-nuit`
- `hanoi → sapa`, mode `train-nuit`

- [ ] **Step 3: Add the types to `lib/content/types.ts`**

Append at the end of the file:

```ts
/** One way of getting between two étapes. */
export type LegMode = {
  mode: string;
  hours: number;
  /** Daytime this mode consumes, in days. A night train costs zero. */
  days: number;
  /** `perdue` is time in a van; `vecue` is the Hai Van pass, which IS the trip. */
  journee: "perdue" | "vecue";
  /** True when the mode carries its own bed, so it uses a night and no daytime. */
  nuit?: boolean;
  note: string;
  source: string;
};

export type Leg = { from: PlaceId; to: PlaceId; modes: LegMode[] };

/** A rule that applies to every leg, not to one of them. */
export type Regle = { id: string; texte: string; source: string };

export type LegsFile = { regles: Regle[]; legs: Leg[] };
```

And extend `Place` in the same file — add the field to the existing type, do not duplicate the type:

```ts
  /** How long to stay. Derived from the six hand-written itineraries. */
  nuits: { min: number; ideal: number };
```

- [ ] **Step 4: Add the loader to `lib/content/source.ts`**

Add the import beside the other `content/` imports:

```ts
import legsJson from "@/content/legs.json";
```

And the accessor inside the `source` object, beside `seasons`:

```ts
  legs: async (): Promise<LegsFile> => legsJson,
```

Add `LegsFile` to the existing `import type { ... } from "./types"` list.

> `content/legs.json` has a leading `"_"` key holding a prose explanation. TypeScript's `resolveJsonModule` will type it as `string[]`, which is harmless — `LegsFile` simply does not mention it. Do not delete it; it is the file's documentation.

- [ ] **Step 5: Export `getLegs` and `getPlaces` from `lib/content/index.ts`**

`getPlaces` does not exist yet — places have only ever been reached through
`resolveStops`, which resolves a trip's stops and throws on an unknown one. The
planner needs the whole list, so add a plain accessor beside the others:

```ts
export const getLegs = () => source.legs();
export const getPlaces = () => source.places();
```

- [ ] **Step 6: Write the validator `scripts/check-planner.mjs`**

Follow the style of the existing `scripts/check-cms.mjs`: plain Node ESM, no dependency, `process.exit(1)` on failure with a message that names the offending entry.

```js
/**
 * Fails the build when the planner's data cannot hold together.
 *
 * These are the mistakes that would otherwise surface as a silently wrong
 * itinerary rather than as an error: a leg pointing at a place that does not
 * exist, a place with no stay length, a mode that claims to consume both a
 * night and a day.
 */
import { readFileSync } from "node:fs";

const lire = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const places = lire("../content/places.json");
const { legs } = lire("../content/legs.json");

const ids = new Set(places.map((p) => p.id));
const fautes = [];

for (const p of places) {
  if (!p.nuits) fautes.push(`place ${p.id}: no nuits`);
  else if (p.nuits.min < 1 || p.nuits.ideal < p.nuits.min)
    fautes.push(`place ${p.id}: nuits ${p.nuits.min}/${p.nuits.ideal} makes no sense`);
}

for (const l of legs) {
  if (!ids.has(l.from)) fautes.push(`leg ${l.from}->${l.to}: unknown from`);
  if (!ids.has(l.to)) fautes.push(`leg ${l.from}->${l.to}: unknown to`);
  if (!l.modes?.length) fautes.push(`leg ${l.from}->${l.to}: no mode`);
  for (const m of l.modes ?? []) {
    /* `nuit` and `days` are independent, and conflating them loses real
       information. The Hanoï–Da Nang night train gives you a bed AND eats half
       the next morning, because it arrives at eleven. What is impossible is a
       mode you sleep through that also costs a WHOLE day. */
    if (m.nuit && m.days >= 1)
      fautes.push(`leg ${l.from}->${l.to} ${m.mode}: sleeps aboard yet costs a whole day`);
    if (m.journee !== "perdue" && m.journee !== "vecue")
      fautes.push(`leg ${l.from}->${l.to} ${m.mode}: journee is "${m.journee}"`);
    if (!m.source || m.source === "a-confirmer")
      fautes.push(`leg ${l.from}->${l.to} ${m.mode}: no source`);
  }
}

if (fautes.length) {
  console.error("[planner] data is inconsistent:\n  " + fautes.join("\n  "));
  process.exit(1);
}
console.log(`[planner] ${places.length} places, ${legs.length} legs, all sourced`);
```

- [ ] **Step 7: Run the validator and watch it fail, then pass**

Run: `node scripts/check-planner.mjs`

Run it **before** finishing Steps 1 and 2 to see it fail with `no nuits`; after Steps 1–2 it must print `23 places, 16 legs, all sourced`.

- [ ] **Step 8: Wire it into `package.json`**

Add `check-planner` to the end of the existing `prebuild` chain, and add a `test` script:

```json
"prebuild": "node scripts/make-cms-config.mjs && node scripts/check-cms.mjs && node scripts/check-tet.mjs && node scripts/make-redirects.mjs && node scripts/make-icons.mjs && node scripts/make-images.mjs && node scripts/check-planner.mjs",
"test": "node --test lib/*.test.ts",
```

- [ ] **Step 9: Verify the build still passes**

Run: `npm run build`
Expected: the prebuild chain prints `[planner] 23 places, 16 legs, all sourced`, and the build completes.

- [ ] **Step 10: Commit**

```bash
git add content/places.json content/legs.json lib/content/types.ts lib/content/source.ts lib/content/index.ts scripts/check-planner.mjs package.json
git commit -m "Give every place a stay length, and every overnight leg its bed"
```

---

### Task 2: Engine — region from latitude, and the season verdict

**Files:**
- Create: `lib/planner.ts`
- Create: `lib/planner.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Region = "nord" | "centre" | "sud"`; `type Lieu`; `type SaisonRow`; `region(lat: number): Region`; `verdictSaison(saisons: SaisonRow[], mois: string, r: Region): string`.

- [ ] **Step 1: Write the failing test**

Create `lib/planner.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { region, verdictSaison } from "./planner.ts";

test("region is read off the latitude, because Vietnam's climate is", () => {
  assert.equal(region(21.028), "nord");   // Hanoï
  assert.equal(region(20.254), "nord");   // Ninh Binh
  assert.equal(region(17.59), "centre");  // Phong Nha
  assert.equal(region(16.463), "centre"); // Hué
  assert.equal(region(15.88), "centre");  // Hoi An
  assert.equal(region(10.823), "sud");    // Hô Chi Minh-Ville
  assert.equal(region(8.69), "sud");      // Con Dao
});

test("the season verdict comes from the month and the region", () => {
  const saisons = [
    { month: "Octobre", nord: "ideal", centre: "deconseille", sud: "bon", note: "" },
    { month: "Mars", nord: "ideal", centre: "ideal", sud: "ideal", note: "" },
  ];
  assert.equal(verdictSaison(saisons, "Octobre", "centre"), "deconseille");
  assert.equal(verdictSaison(saisons, "Mars", "nord"), "ideal");
  assert.equal(verdictSaison(saisons, "Décembre", "nord"), "");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test lib/planner.test.ts`
Expected: FAIL — `Cannot find module './planner.ts'`

- [ ] **Step 3: Write the implementation**

Create `lib/planner.ts`:

```ts
/**
 * The planner's arithmetic, and nothing else.
 *
 * This file imports nothing on purpose. `node --test` does not resolve the
 * `@/*` alias, so an import here would cost the ability to test the only part
 * of the planner where a mistake is silent — a wrong sum does not throw, it
 * just sends someone to Ha Giang with four days too few.
 *
 * Every function takes its data as an argument. The page loads JSON through
 * lib/content and passes it in.
 */

export type Region = "nord" | "centre" | "sud";

export type SaisonRow = {
  month: string;
  nord: string;
  centre: string;
  sud: string;
  note: string;
};

export type Lieu = {
  id: string;
  fr: string;
  lat: number;
  nuits: { min: number; ideal: number };
};

/**
 * Vietnam's three climates are latitudinal bands, which is why seasons.json is
 * organised by them and why a coordinate is enough to place a town in one. The
 * boundaries sit in empty space: no place in places.json falls between 13 and
 * 15.88, nor between 17.59 and 19.
 *
 * Cambodia would come out as "sud" and be wrong about it; v1 is Vietnam only,
 * and the caller passes Vietnamese places.
 */
export function region(lat: number): Region {
  if (lat >= 19) return "nord";
  if (lat >= 13) return "centre";
  return "sud";
}

/** Empty string when the month is unknown: a missing verdict must not read as a bad one. */
export function verdictSaison(
  saisons: SaisonRow[],
  mois: string,
  r: Region,
): string {
  const ligne = saisons.find((s) => s.month === mois);
  return ligne ? ligne[r] : "";
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test lib/planner.test.ts`
Expected: PASS — `# pass 2`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add lib/planner.ts lib/planner.test.ts
git commit -m "Read a place's climate off its latitude"
```

---

### Task 3: Engine — the day arithmetic

**Files:**
- Modify: `lib/planner.ts`
- Modify: `lib/planner.test.ts`

**Interfaces:**
- Consumes: `Lieu` from Task 2.
- Produces: `type LegMode`, `type Leg`, `type Etape`, `type Plan`, `type Bilan`; `trouverLeg(legs, a, b): Leg | null`; `modeDefaut(leg): LegMode | null`; `bilan(plan, legs): Bilan`.

- [ ] **Step 1: Write the failing test**

Append to `lib/planner.test.ts`:

```ts
import { bilan, trouverLeg, modeDefaut } from "./planner.ts";
import type { Leg, Plan } from "./planner.ts";

const LEGS: Leg[] = [
  { from: "hanoi", to: "hue", modes: [
    { mode: "train-nuit", hours: 12.6, days: 0, journee: "perdue", nuit: true, note: "", source: "x" },
    { mode: "avion", hours: 1.25, days: 0.5, journee: "perdue", note: "", source: "x" },
  ] },
  { from: "hue", to: "hoi-an", modes: [
    { mode: "route-directe", hours: 2.75, days: 0.5, journee: "perdue", note: "", source: "x" },
  ] },
];

test("a leg is found in either direction", () => {
  assert.equal(trouverLeg(LEGS, "hanoi", "hue")?.to, "hue");
  assert.equal(trouverLeg(LEGS, "hue", "hanoi")?.to, "hue");
  assert.equal(trouverLeg(LEGS, "hanoi", "sapa"), null);
});

test("the default mode is the one costing fewest days", () => {
  assert.equal(modeDefaut(LEGS[0])?.mode, "train-nuit");
});

test("at equal cost in days, a day worth living beats a quicker dull one", () => {
  // The real Hué–Da Nang leg. Both cost a quarter-day; the tunnel is 36 minutes
  // quicker and the coastal train is the finest railway in the country.
  const hueDaNang: Leg = { from: "hue", to: "da-nang", modes: [
    { mode: "route-tunnel", hours: 2, days: 0.25, journee: "perdue", note: "", source: "x" },
    { mode: "train", hours: 2.6, days: 0.25, journee: "vecue", note: "", source: "x" },
  ] };
  assert.equal(modeDefaut(hueDaNang)?.mode, "train");
});

test("hours still break the tie when the days and the journée are equal", () => {
  const leg: Leg = { from: "a", to: "b", modes: [
    { mode: "lent", hours: 5, days: 0.5, journee: "perdue", note: "", source: "x" },
    { mode: "rapide", hours: 2, days: 0.5, journee: "perdue", note: "", source: "x" },
  ] };
  assert.equal(modeDefaut(leg)?.mode, "rapide");
});

test("a night train uses a night and no daytime", () => {
  const plan: Plan = { jours: 10, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 },
    { place: "hue", nuits: 2 },
    { place: "hoi-an", nuits: 3 },
  ] };
  const b = bilan(plan, LEGS);
  // 8 nights in beds + 1 aboard the train = 9, and a 10-day trip holds 9.
  assert.equal(b.nuitsPlacees, 9);
  assert.equal(b.nuitsDisponibles, 9);
  assert.equal(b.reste, 0);
  // Only Hué → Hoi An burns daytime.
  assert.equal(b.joursPerdus, 0.5);
});

test("an itinerary that does not fit reports a negative remainder", () => {
  const plan: Plan = { jours: 7, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 },
    { place: "hue", nuits: 2 },
    { place: "hoi-an", nuits: 3 },
  ] };
  assert.equal(bilan(plan, LEGS).reste, -3);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test lib/planner.test.ts`
Expected: FAIL — `bilan is not a function` (or an export error)

- [ ] **Step 3: Write the implementation**

Append to `lib/planner.ts`:

```ts
export type LegMode = {
  mode: string;
  hours: number;
  days: number;
  journee: "perdue" | "vecue";
  nuit?: boolean;
  note: string;
  source: string;
};

export type Leg = { from: string; to: string; modes: LegMode[] };

export type Etape = { place: string; nuits: number };

export type Plan = {
  jours: number;
  mois: string;
  voyageurs: number;
  etapes: Etape[];
};

export type Bilan = {
  /** Nights needing a bed, including nights spent aboard a train or bus. */
  nuitsPlacees: number;
  /** A trip of N days holds N − 1 nights. */
  nuitsDisponibles: number;
  /** Negative when the itinerary does not fit. */
  reste: number;
  /** Daytime eaten by transport, in days. Does not include `vecue` legs. */
  joursPerdus: number;
};

/** Legs are stored one way round; travellers go both. */
export function trouverLeg(legs: Leg[], a: string, b: string): Leg | null {
  return (
    legs.find(
      (l) => (l.from === a && l.to === b) || (l.from === b && l.to === a),
    ) ?? null
  );
}

/** `vecue` sorts ahead of `perdue`. */
const RANG_JOURNEE: Record<"vecue" | "perdue", number> = { vecue: 0, perdue: 1 };

/**
 * The mode a traveller is offered first, decided on three levels in order:
 * fewest days, then a day worth living over a day merely endured, then fewest
 * hours.
 *
 * The first level is what puts the Hanoï–Hué night train ahead of the plane
 * despite taking ten times longer: it consumes no daytime and replaces a hotel
 * night.
 *
 * The second exists because sorting on hours alone sent travellers through the
 * Hai Van tunnel. Tunnel and coastal train cost the same quarter-day; the
 * tunnel is thirty-six minutes quicker and the train is the finest stretch of
 * railway in the country. A tool optimising for speed would save the half-hour
 * and quietly take the journey away, which is the exact failure the `journee`
 * field was added to prevent — it was guarding the rhythm gauge, and the
 * default mode walked into the trap behind its back.
 */
export function modeDefaut(leg: Leg): LegMode | null {
  if (!leg.modes.length) return null;
  return [...leg.modes].sort(
    (x, y) =>
      x.days - y.days ||
      RANG_JOURNEE[x.journee] - RANG_JOURNEE[y.journee] ||
      x.hours - y.hours,
  )[0];
}

export function bilan(plan: Plan, legs: Leg[]): Bilan {
  let nuitsPlacees = 0;
  let joursPerdus = 0;

  for (const e of plan.etapes) nuitsPlacees += e.nuits;

  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const leg = trouverLeg(legs, plan.etapes[i].place, plan.etapes[i + 1].place);
    const m = leg ? modeDefaut(leg) : null;
    if (!m) continue;
    if (m.nuit) nuitsPlacees += 1;
    if (m.journee === "perdue") joursPerdus += m.days;
  }

  const nuitsDisponibles = plan.jours - 1;
  return {
    nuitsPlacees,
    nuitsDisponibles,
    reste: nuitsDisponibles - nuitsPlacees,
    joursPerdus,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test lib/planner.test.ts`
Expected: PASS — `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add lib/planner.ts lib/planner.test.ts
git commit -m "Count nights, and let a night train pay for its own bed"
```

---

### Task 4: Engine — the rhythm gauge

**Files:**
- Modify: `lib/planner.ts`
- Modify: `lib/planner.test.ts`

**Interfaces:**
- Consumes: `Plan`, `Leg`, `trouverLeg`, `modeDefaut` from Task 3.
- Produces: `type Rythme`; `rythme(plan: Plan, legs: Leg[]): Rythme`.

- [ ] **Step 1: Write the failing test**

The two fixtures are the itineraries compared during design: both fit in fifteen days, only one is a holiday.

Append to `lib/planner.test.ts`:

```ts
import { rythme } from "./planner.ts";

const LEGS_15: Leg[] = [
  ...LEGS,
  { from: "hanoi", to: "ninh-binh", modes: [{ mode: "route", hours: 1.6, days: 0.25, journee: "perdue", note: "", source: "x" }] },
  { from: "ninh-binh", to: "lan-ha", modes: [{ mode: "navette", hours: 4.75, days: 0.75, journee: "perdue", note: "", source: "x" }] },
  { from: "lan-ha", to: "hue", modes: [{ mode: "avion", hours: 1.5, days: 0.5, journee: "perdue", note: "", source: "x" }] },
  { from: "hoi-an", to: "hcmc", modes: [{ mode: "avion", hours: 1.33, days: 0.5, journee: "perdue", note: "", source: "x" }] },
  { from: "hcmc", to: "can-tho", modes: [{ mode: "route", hours: 2.75, days: 0.5, journee: "perdue", note: "", source: "x" }] },
];

test("a packed itinerary is reported as strained", () => {
  const charge: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "ninh-binh", nuits: 1 },
    { place: "lan-ha", nuits: 1 }, { place: "hue", nuits: 2 },
    { place: "hoi-an", nuits: 3 }, { place: "hcmc", nuits: 2 },
    { place: "can-tho", nuits: 2 },
  ] };
  const r = rythme(charge, LEGS_15);
  assert.equal(r.etapes, 7);
  assert.equal(r.changements, 6);
  assert.equal(r.tendu, true);
});

test("a restful itinerary of the same length is not", () => {
  const reposant: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "ninh-binh", nuits: 2 },
    { place: "lan-ha", nuits: 1 }, { place: "hoi-an", nuits: 5 },
    { place: "hcmc", nuits: 3 },
  ] };
  const r = rythme(reposant, LEGS_15);
  assert.equal(r.etapes, 5);
  assert.equal(r.changements, 4);
  assert.equal(r.tendu, false);
});

test("a day on the Hai Van pass is not counted against the traveller", () => {
  const legs: Leg[] = [{ from: "hue", to: "hoi-an", modes: [
    { mode: "route-col", hours: 6, days: 1, journee: "vecue", note: "", source: "x" },
  ] }];
  const plan: Plan = { jours: 6, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hue", nuits: 2 }, { place: "hoi-an", nuits: 3 },
  ] };
  assert.equal(rythme(plan, legs).joursLibres, 5);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test lib/planner.test.ts`
Expected: FAIL — `rythme is not a function`

- [ ] **Step 3: Write the implementation**

Append to `lib/planner.ts`:

```ts
export type Rythme = {
  etapes: number;
  /** Suitcases packed. One fewer than the number of étapes. */
  changements: number;
  heuresTransport: number;
  /** Days with no transport at all. The point of a holiday. */
  joursLibres: number;
  tendu: boolean;
};

/**
 * The second gauge, and the one no competitor has.
 *
 * An itinerary can fit its days exactly and still be a bad holiday: seven
 * étapes in fifteen days means a suitcase every two mornings. Days are
 * arithmetic; rhythm is whether the arithmetic was worth doing.
 *
 * Only `perdue` days count against the traveller. A day on the Hai Van pass IS
 * the journey, and penalising it would push people through the tunnel to save
 * ninety minutes and rob them of the best road in the country.
 *
 * The three thresholds are judgements, not measurements. They are set so that
 * the two itineraries weighed during design fall on opposite sides, and they
 * belong in one place so they can be argued with.
 */
export function rythme(plan: Plan, legs: Leg[]): Rythme {
  let heuresTransport = 0;
  let joursPerdus = 0;

  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const leg = trouverLeg(legs, plan.etapes[i].place, plan.etapes[i + 1].place);
    const m = leg ? modeDefaut(leg) : null;
    if (!m) continue;
    heuresTransport += m.hours;
    if (m.journee === "perdue") joursPerdus += m.days;
  }

  const etapes = plan.etapes.length;
  const joursLibres = Math.max(0, Math.round(plan.jours - joursPerdus - 1));

  return {
    etapes,
    changements: Math.max(0, etapes - 1),
    heuresTransport: Math.round(heuresTransport * 10) / 10,
    joursLibres,
    tendu: etapes - 1 > 5 || heuresTransport > 20 || joursLibres < 2,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test lib/planner.test.ts`
Expected: PASS — `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add lib/planner.ts lib/planner.test.ts
git commit -m "Measure whether an itinerary that fits is still a holiday"
```

---

### Task 5: Engine — the refusal

**Files:**
- Modify: `lib/planner.ts`
- Modify: `lib/planner.test.ts`

**Interfaces:**
- Consumes: `Plan`, `Lieu`, `region` from Tasks 2–3.
- Produces: `type Retrait`; `retraits(plan: Plan, lieux: Lieu[], manque: number): Retrait[]`.

- [ ] **Step 1: Write the failing test**

Append to `lib/planner.test.ts`:

```ts
import { retraits } from "./planner.ts";

const LIEUX: Lieu[] = [
  { id: "hanoi", fr: "Hanoï", lat: 21.028, nuits: { min: 2, ideal: 3 } },
  { id: "ninh-binh", fr: "Ninh Binh", lat: 20.254, nuits: { min: 1, ideal: 2 } },
  { id: "hue", fr: "Hué", lat: 16.463, nuits: { min: 1, ideal: 2 } },
  { id: "hoi-an", fr: "Hoi An", lat: 15.88, nuits: { min: 2, ideal: 4 } },
  { id: "hcmc", fr: "Hô Chi Minh-Ville", lat: 10.823, nuits: { min: 1, ideal: 2 } },
];

test("the tool names what to drop, by region, and never decides alone", () => {
  const plan: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "ninh-binh", nuits: 2 },
    { place: "hue", nuits: 2 }, { place: "hoi-an", nuits: 5 },
    { place: "hcmc", nuits: 3 },
  ] };
  const r = retraits(plan, LIEUX, 4);

  // The Centre frees 7 nights, the South 3, the North 5 — all offered.
  const centre = r.find((x) => x.libelle.includes("Centre"));
  assert.ok(centre, "the Centre must be offered");
  assert.equal(centre?.nuits, 7);
  assert.deepEqual(centre?.places, ["hue", "hoi-an"]);

  // Sorted by how well each fits the shortfall: smallest sufficient first.
  assert.equal(r[0].nuits, 5);
});

test("nothing is proposed when nothing is missing", () => {
  const plan: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 },
  ] };
  assert.deepEqual(retraits(plan, LIEUX, 0), []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test lib/planner.test.ts`
Expected: FAIL — `retraits is not a function`

- [ ] **Step 3: Write the implementation**

Append to `lib/planner.ts`:

```ts
export type Retrait = {
  /** French label shown to the traveller. */
  libelle: string;
  places: string[];
  /** Nights this would free. */
  nuits: number;
};

const NOM_REGION: Record<Region, string> = {
  nord: "le Nord",
  centre: "le Centre",
  sud: "le Sud",
};

/**
 * What has to go, when the itinerary does not fit.
 *
 * This is the whole product. An agency configurator has no reason to tell
 * anyone to do less, which is exactly why a tool that does is believed. It
 * proposes and never applies: the traveller decides, and the options are
 * ordered by how closely each one covers the shortfall, so the cheapest
 * sacrifice is read first.
 *
 * Grouping is by region rather than by étape because that is how the loss is
 * actually felt — nobody drops Hué and keeps Hoi An.
 */
export function retraits(
  plan: Plan,
  lieux: Lieu[],
  manque: number,
): Retrait[] {
  if (manque <= 0) return [];

  const par: Record<string, { places: string[]; nuits: number }> = {};
  for (const e of plan.etapes) {
    const lieu = lieux.find((l) => l.id === e.place);
    if (!lieu) continue;
    const r = region(lieu.lat);
    par[r] ??= { places: [], nuits: 0 };
    par[r].places.push(e.place);
    par[r].nuits += e.nuits;
  }

  return Object.entries(par)
    .map(([r, v]) => ({
      libelle: `Retirer ${NOM_REGION[r as Region]}`,
      places: v.places,
      nuits: v.nuits,
    }))
    .sort((a, b) => {
      // Options that cover the shortfall come first, smallest of them leading;
      // those that fall short follow, largest first.
      const sa = a.nuits >= manque, sb = b.nuits >= manque;
      if (sa !== sb) return sa ? -1 : 1;
      return sa ? a.nuits - b.nuits : b.nuits - a.nuits;
    });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test lib/planner.test.ts`
Expected: PASS — `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add lib/planner.ts lib/planner.test.ts
git commit -m "Say what has to go, and let the traveller be the one to cut"
```

---

### Task 6: Engine — the shareable URL

**Files:**
- Modify: `lib/planner.ts`
- Modify: `lib/planner.test.ts`

**Interfaces:**
- Consumes: `Plan` from Task 3.
- Produces: `encoder(plan: Plan): string`; `decoder(s: string): Plan | null`.

- [ ] **Step 1: Write the failing test**

Append to `lib/planner.test.ts`:

```ts
import { encoder, decoder } from "./planner.ts";

test("a plan survives a round trip through the URL", () => {
  const plan: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "hoi-an", nuits: 5 },
  ] };
  assert.deepEqual(decoder(encoder(plan)), plan);
});

test("the encoding is short and legible", () => {
  assert.equal(
    encoder({ jours: 15, mois: "Mars", voyageurs: 2, etapes: [{ place: "hanoi", nuits: 3 }] }),
    "15/Mars/2/hanoi-3",
  );
});

test("junk decodes to null rather than to a wrong plan", () => {
  assert.equal(decoder(""), null);
  assert.equal(decoder("15/Mars"), null);
  assert.equal(decoder("quinze/Mars/2/hanoi-3"), null);
  assert.equal(decoder("15/Mars/2/hanoi-zero"), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test lib/planner.test.ts`
Expected: FAIL — `encoder is not a function`

- [ ] **Step 3: Write the implementation**

Append to `lib/planner.ts`:

```ts
/**
 * The plan lives in the URL and nowhere else.
 *
 * A static export has no database to put it in, and that turns out to be the
 * right answer rather than a constraint: a plan in the address bar is
 * shareable, bookmarkable, and still there in six weeks when the traveller is
 * finally ready to book — which matters, because affiliate cookies last about
 * a day and the French book their hotels late.
 *
 * The format stays legible on purpose. Someone pasting it into a message can
 * see it is their trip.
 */
export function encoder(plan: Plan): string {
  const etapes = plan.etapes.map((e) => `${e.place}-${e.nuits}`).join(",");
  return `${plan.jours}/${plan.mois}/${plan.voyageurs}/${etapes}`;
}

const ENTIER = /^\d+$/;

export function decoder(s: string): Plan | null {
  const parts = s.split("/");
  if (parts.length !== 4) return null;
  const [j, mois, v, etapesRaw] = parts;
  if (!ENTIER.test(j) || !ENTIER.test(v) || !mois || !etapesRaw) return null;

  const etapes: Etape[] = [];
  for (const bout of etapesRaw.split(",")) {
    const coupe = bout.lastIndexOf("-");
    if (coupe < 1) return null;
    const place = bout.slice(0, coupe);
    const nuits = bout.slice(coupe + 1);
    if (!place || !ENTIER.test(nuits)) return null;
    etapes.push({ place, nuits: Number(nuits) });
  }

  return { jours: Number(j), mois, voyageurs: Number(v), etapes };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test lib/planner.test.ts`
Expected: PASS — `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add lib/planner.ts lib/planner.test.ts
git commit -m "Put the plan in the address bar, where it outlives the cookie"
```

---

### Task 7: Affiliate links, and the seam for replacing them

**Files:**
- Create: `lib/booking.ts`
- Create: `lib/booking.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type LienPartenaire = { libelle: string; url: string; partenaire: string | null }`; `hebergement(ville, arrivee, depart, voyageurs): LienPartenaire`; `experiences(ville): LienPartenaire[]`.

- [ ] **Step 1: Write the failing test**

Create `lib/booking.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { hebergement, experiences } from "./booking.ts";

test("an accommodation link carries the dates and the party", () => {
  const l = hebergement("Hoi An", "2027-03-12", "2027-03-15", 2);
  assert.ok(l.url.startsWith("https://www.booking.com/searchresults.html?"));
  assert.ok(l.url.includes("ss=Hoi+An"));
  assert.ok(l.url.includes("checkin=2027-03-12"));
  assert.ok(l.url.includes("checkout=2027-03-15"));
  assert.ok(l.url.includes("group_adults=2"));
});

test("with no affiliate account the link still works and claims no commission", () => {
  const l = hebergement("Hué", "2027-03-01", "2027-03-03", 2);
  assert.equal(l.partenaire, null);
  assert.ok(!l.url.includes("aid="));
});

test("experiences are linked, because they pay more than beds and are what people want", () => {
  const e = experiences("Hoi An");
  assert.ok(e.length > 0);
  for (const x of e) assert.ok(x.url.startsWith("https://"));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test lib/booking.test.ts`
Expected: FAIL — `Cannot find module './booking.ts'`

- [ ] **Step 3: Write the implementation**

Create `lib/booking.ts`:

```ts
/**
 * Where the money would come from, kept behind one interface.
 *
 * v1 emits plain deep links and nothing else: no script, no pixel, no iframe.
 * That is deliberate — the site sets no cookie at all, a decision documented in
 * app/layout.tsx and worth more than the commission. A bare <a href> stores
 * nothing on the visitor's machine; whatever Booking does once they arrive
 * happens on Booking's domain under Booking's own consent banner.
 *
 * The identifiers are empty because no affiliate account exists yet: Booking
 * routes applicants through CJ and may refuse a site this new. Until one is
 * approved the links still work and simply earn nothing, and `partenaire` is
 * null so the page knows not to print a disclosure it has not earned.
 *
 * This file is also the swap point. Replacing deep links with Booking's Demand
 * API means rewriting these two functions and nothing else — the planner never
 * learns which it got.
 */

export type LienPartenaire = {
  libelle: string;
  url: string;
  /** null until an affiliate account exists. The page hides the disclosure then. */
  partenaire: string | null;
};

/* Fill in once CJ, Klook and GetYourGuide have approved the account. */
const AID_BOOKING = "";
const AID_GETYOURGUIDE = "";

const q = (params: Record<string, string>) =>
  Object.entries(params)
    .filter(([, v]) => v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");

export function hebergement(
  ville: string,
  arrivee: string,
  depart: string,
  voyageurs: number,
): LienPartenaire {
  return {
    libelle: `Voir les hébergements à ${ville}`,
    url:
      "https://www.booking.com/searchresults.html?" +
      q({
        ss: ville,
        checkin: arrivee,
        checkout: depart,
        group_adults: String(voyageurs),
        aid: AID_BOOKING,
      }),
    partenaire: AID_BOOKING ? "Booking.com" : null,
  };
}

/**
 * Experiences rather than beds, for two reasons that point the same way:
 * GetYourGuide pays roughly twice what a room does, and a traveller who has
 * left room in the itinerary has days to fill. Honest advice and the revenue
 * agree here, which is rare enough to be worth writing down.
 */
export function experiences(ville: string): LienPartenaire[] {
  return [
    {
      libelle: `Activités et excursions à ${ville}`,
      url:
        "https://www.getyourguide.com/s/?" +
        q({ q: ville, partner_id: AID_GETYOURGUIDE }),
      partenaire: AID_GETYOURGUIDE ? "GetYourGuide" : null,
    },
  ];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test lib/booking.test.ts`
Expected: PASS — `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add lib/booking.ts lib/booking.test.ts
git commit -m "Link out without setting a cookie, and ship before approval"
```

---

### Task 8: The composer — the repo's first client component

**Files:**
- Create: `components/Planner.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: everything exported from `lib/planner.ts` and `lib/booking.ts`.
- Produces: `export function Planner(props: { lieux: Lieu[]; legs: Leg[]; saisons: SaisonRow[]; bases: PlanBase[] })`, where `export type PlanBase = { nom: string; jours: number; etapes: Etape[] }`.

- [ ] **Step 1: Write the component**

This is the first `"use client"` file in the repo — every other component is a server component. The directive is required because the planner holds state and reads `location.hash`.

Create `components/Planner.tsx`:

```tsx
"use client";

/**
 * The tool. A budget of days that visibly runs out.
 *
 * Not dropdowns — that is what Evaneos and Marco Vasco already sell, and a
 * fourth copy of it differentiates nothing. Not a map either: a map answers
 * "where is it", and the question a French traveller actually has is whether
 * their trip fits in the leave they have booked.
 *
 * It starts from a hand-written itinerary rather than an empty canvas. A
 * combinatorial generator would emit sequences with no prose, losing the voice
 * that is the site's only real asset and walking straight into the thin-content
 * penalty. Here the traveller adjusts something already good, and watches what
 * each adjustment costs.
 */

import { useEffect, useRef, useState } from "react";
import {
  bilan, rythme, retraits, encoder, decoder, region, verdictSaison,
} from "@/lib/planner";
import type { Etape, Leg, Lieu, Plan, SaisonRow } from "@/lib/planner";

export type PlanBase = { nom: string; jours: number; etapes: Etape[] };

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** The min/max attributes are native hints; a typed value ignores them. */
const borne = (n: number, bas: number, haut: number) =>
  Math.min(haut, Math.max(bas, n));

export function Planner({
  lieux, legs, saisons, bases,
}: {
  lieux: Lieu[];
  legs: Leg[];
  saisons: SaisonRow[];
  bases: PlanBase[];
}) {
  const [plan, setPlan] = useState<Plan>({
    jours: bases[0].jours,
    mois: "Mars",
    voyageurs: 2,
    etapes: bases[0].etapes,
  });

  /* Read the hash once on mount. Doing it in an effect rather than in the
     initial state keeps the server and the first client render identical,
     which is what React hydration requires. */
  useEffect(() => {
    const venu = decoder(decodeURIComponent(location.hash.slice(1)));
    if (venu) setPlan(venu);
  }, []);

  /* Write it back on every change, with replaceState so the back button still
     leaves the page instead of walking through every edit.
     
     The first commit is skipped deliberately. Both effects run in declaration
     order within it, and this one's closure still holds the default plan — the
     setPlan above is queued, not applied — so writing here would stamp the
     default over a shared link's hash before it had been applied. The visitor
     would see their own itinerary arrive a frame after the address bar said
     otherwise, on a feature whose entire premise is that the plan lives in the
     URL and nowhere else. */
  const monte = useRef(false);
  useEffect(() => {
    if (!monte.current) {
      monte.current = true;
      return;
    }
    history.replaceState(null, "", "#" + encoder(plan));
  }, [plan]);

  const b = bilan(plan, legs);
  const r = rythme(plan, legs);
  const aRetirer = b.reste < 0 ? retraits(plan, lieux, -b.reste) : [];
  const nom = (id: string) => lieux.find((l) => l.id === id)?.fr ?? id;

  const absents = lieux.filter((l) => !plan.etapes.some((e) => e.place === l.id));

  const ajouter = (id: string) => {
    const lieu = lieux.find((l) => l.id === id);
    if (!lieu) return;
    setPlan({ ...plan, etapes: [...plan.etapes, { place: id, nuits: lieu.nuits.ideal }] });
  };
  /* Never below one étape: the min and max on the inputs are native hints a
     typed value walks straight past, and an itinerary of nothing is not an
     itinerary the gauges can say anything true about. */
  const retirer = (i: number) =>
    plan.etapes.length > 1 &&
    setPlan({ ...plan, etapes: plan.etapes.filter((_, k) => k !== i) });
  const nuits = (i: number, n: number) =>
    setPlan({
      ...plan,
      etapes: plan.etapes.map((e, k) => (k === i ? { ...e, nuits: Math.max(1, n) } : e)),
    });

  return (
    <div className="plan">
      <div className="plan__barre">
        <label>
          Durée
          <input type="number" min={5} max={30} value={plan.jours}
            onChange={(ev) =>
              setPlan({ ...plan, jours: borne(Number(ev.target.value) || 5, 5, 30) })} />
          jours
        </label>
        <label>
          Départ
          <select value={plan.mois}
            onChange={(ev) => setPlan({ ...plan, mois: ev.target.value })}>
            {MOIS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>
          Voyageurs
          <input type="number" min={1} max={12} value={plan.voyageurs}
            onChange={(ev) =>
              setPlan({ ...plan, voyageurs: borne(Number(ev.target.value) || 1, 1, 12) })} />
        </label>
      </div>

      <div className="plan__jauges">
        <div>
          <span className="plan__label">Jours · {plan.jours}</span>
          <div className="plan__g">
            {Array.from({ length: Math.max(b.nuitsDisponibles, b.nuitsPlacees) }, (_, i) => (
              <i key={i} className={i < b.nuitsPlacees
                ? (i < b.nuitsDisponibles ? "ok" : "over") : "nil"} />
            ))}
          </div>
          <p className={b.reste < 0 ? "plan__mal" : "plan__bien"}>
            {b.reste < 0
              ? `Il vous manque ${-b.reste} ${-b.reste > 1 ? "jours" : "jour"}.`
              : b.reste === 0
                ? "Ça rentre exactement."
                : `Il vous reste ${b.reste} ${b.reste > 1 ? "jours" : "jour"}.`}
          </p>
        </div>

        {/* A single stop has no rhythm to judge, and saying so is better than
            judging it anyway. `tendu` fires on `joursLibres < 2`, so a plan
            emptied to one short étape would otherwise print
            "Soutenu : 0 changement d'hôtel et 0 h de transport." — a sentence
            contradicted by its own two numbers, on the page whose whole claim
            is that its numbers are true. */}
        {plan.etapes.length >= 2 && (
        <div>
          <span className="plan__label">Rythme</span>
          <div className="plan__g">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} className={i < r.changements * 2 ? (r.tendu ? "over" : "ok") : "nil"} />
            ))}
          </div>
          {/* Both sentences agree in number, and both carry the non-breaking
              space French puts before a colon. These are the two most-rendered
              sentences in the component; "1 changements" on a page that claims
              to be written from Da Nang would undo more than it costs to
              prevent. The space is written   rather than &nbsp; because
              these are template literals, not JSX text. */}
          <p className={r.tendu ? "plan__mal" : "plan__bien"}>
            {r.tendu
              ? `Soutenu : ${r.changements} ${r.changements > 1 ? "changements" : "changement"} d'hôtel et ${r.heuresTransport} h de transport.`
              : `Tranquille : ${r.joursLibres} ${r.joursLibres > 1 ? "journées" : "journée"} sans bouger.`}
          </p>
        </div>
        )}
      </div>

      {/* The legs we hold nothing on. They are excluded from every number above,
          which makes those numbers optimistic, and saying so is the whole point
          of collecting them — an engine that knows about seven hundred
          unaccounted kilometres and lets the page stay quiet is worse than one
          that never noticed. */}
      {b.inconnus.length > 0 && (
        <div className="plan__inconnu">
          <p>
            <b>
              Nous ne connaissons pas encore{" "}
              {b.inconnus.length === 1 ? "ce trajet" : "ces trajets"}&nbsp;:
            </b>
          </p>
          <ul>
            {b.inconnus.map((x) => {
              const [a, z] = x.split(" → ");
              return <li key={x}>{nom(a)} → {nom(z)}</li>;
            })}
          </ul>
          <p className="plan__note">
            Ils ne sont comptés ni en heures ni en journées. Les chiffres
            ci-dessus sont donc optimistes.
          </p>
        </div>
      )}

      {aRetirer.length > 0 && (
        <div className="plan__coupe">
          {/* Not "une étape": retraits() groups by region, so one button can
              remove two or three stops at once, and promising a single cut
              understates what pressing it does. */}
          <p><b>Pour que ce voyage tienne, il faut alléger l&apos;itinéraire.</b></p>
          <ul>
            {aRetirer.map((x) => (
              <li key={x.libelle}>
                <button type="button" onClick={() => setPlan({
                  ...plan,
                  etapes: plan.etapes.filter((e) => !x.places.includes(e.place)),
                })}>
                  {x.libelle} — {x.nuits} {x.nuits > 1 ? "nuits" : "nuit"}
                </button>
              </li>
            ))}
          </ul>
          <p className="plan__note">
            Rien ne se décide tout seul&nbsp;: c&apos;est vous qui tranchez.
          </p>
        </div>
      )}

      <ol className="plan__etapes">
        {plan.etapes.map((e, i) => {
          const lieu = lieux.find((l) => l.id === e.place);
          const v = lieu ? verdictSaison(saisons, plan.mois, region(lieu.lat)) : "";
          return (
            <li key={`${e.place}-${i}`}>
              <b>{nom(e.place)}</b>
              <span className="plan__nuits">
                <button type="button" onClick={() => nuits(i, e.nuits - 1)} aria-label="Une nuit de moins">−</button>
                {e.nuits} {e.nuits > 1 ? "nuits" : "nuit"}
                <button type="button" onClick={() => nuits(i, e.nuits + 1)} aria-label="Une nuit de plus">+</button>
              </span>
              {v === "deconseille" && (
                <em className="plan__saison">En {plan.mois.toLowerCase()}, c&apos;est la saison des pluies ici.</em>
              )}
              <button type="button" className="plan__x" onClick={() => retirer(i)}>Retirer</button>
            </li>
          );
        })}
      </ol>

      <div className="plan__ajout">
        <span className="plan__label">Ajouter une étape</span>
        <div>
          {absents.map((l) => (
            <button type="button" key={l.id} onClick={() => ajouter(l.id)}>
              + {l.fr} <small>{l.nuits.ideal} n</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the styles to `app/globals.css`**

Append at the end of the file, following the existing `.art__*` block's conventions (the global reset strips list markers and paragraph margins, so both are restored explicitly here):

```css
/* The planner. The two gauges carry the whole argument, so they are the only
   place colour is used to mean something rather than to decorate. */
.plan { border: 1px solid var(--line); border-radius: 10px; padding: 1.25rem; }
.plan__barre { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; }
.plan__barre label { display: flex; align-items: center; gap: .4rem; font-size: .9rem; }
.plan__barre input { width: 4rem; }
.plan__jauges { display: grid; grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); gap: 1.25rem; }
.plan__label { font-size: .75rem; letter-spacing: .06em; text-transform: uppercase; opacity: .65; }
.plan__g { display: flex; gap: 2px; height: 14px; margin: .4rem 0; }
.plan__g i { flex: 1; border-radius: 2px; background: rgba(128,128,128,.14); }
.plan__g i.ok { background: #2f9e68; }
.plan__g i.over { background: #d9534f; }
.plan__bien { color: #2f9e68; font-size: .85rem; margin: 0; }
.plan__mal { color: #d9534f; font-size: .85rem; margin: 0; }
.plan__inconnu { border: 1px solid #cf9000; border-radius: 8px; padding: .9rem 1rem; margin: 1.25rem 0; }
.plan__inconnu p { margin: 0 0 .4rem; }
/* The global reset strips markers from every ul; this is one of the few lists
   on the site that wants them, so they go back on explicitly. */
.plan__inconnu ul { list-style: disc; margin: 0 0 .4rem; padding-left: 1.1rem; }
.plan__coupe { border: 1px solid #d9534f; border-radius: 8px; padding: .9rem 1rem; margin: 1.25rem 0; }
.plan__coupe p { margin: 0 0 .5rem; }
.plan__coupe ul { list-style: none; margin: 0; padding: 0; }
.plan__coupe li { margin-bottom: .35rem; }
.plan__note { font-size: .82rem; opacity: .7; margin: .6rem 0 0; }
.plan__etapes { list-style: none; margin: 1.25rem 0; padding: 0; }
.plan__etapes li { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; padding: .5rem 0; border-bottom: 1px solid var(--line); }
.plan__nuits { display: inline-flex; align-items: center; gap: .45rem; font-variant-numeric: tabular-nums; }
.plan__saison { flex-basis: 100%; color: #cf9000; font-size: .82rem; font-style: normal; }
.plan__x { margin-left: auto; font-size: .8rem; opacity: .7; }
.plan__ajout > div { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .5rem; }
.plan__ajout button { border: 1px solid var(--line); border-radius: 999px; padding: .3rem .8rem; font-size: .85rem; }
```

`--line: #ded4c3` is already declared at `app/globals.css:9`; use it rather than introducing a second border colour.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no error. If `Lieu` or `SaisonRow` are reported as missing, confirm Task 2 exported them.

- [ ] **Step 4: Commit**

```bash
git add components/Planner.tsx app/globals.css
git commit -m "Build the budget of days, and let it refuse out loud"
```

---

### Task 9: The page

**Files:**
- Create: `app/organiser-son-voyage-au-vietnam/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `lib/routes.ts`

**Interfaces:**
- Consumes: `Planner`, `PlanBase` from Task 8; `getLegs` from Task 1; existing `getSite`, `getPlaces`, `getSeasons`, `getTrips` from `lib/content`.
- Produces: the route `/organiser-son-voyage-au-vietnam/`.

- [ ] **Step 1: Write the page**

The static prose above the tool is not decoration: it is what Google indexes and what other sites link to. The tool alone would be invisible to both.

Create `app/organiser-son-voyage-au-vietnam/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { breadcrumb } from "@/components/JsonLd";
import { Planner } from "@/components/Planner";
import type { PlanBase } from "@/components/Planner";
import { getSite, getPlaces, getSeasons, getLegs, getTrips } from "@/lib/content";

/**
 * The planner, and the page that makes it findable.
 *
 * Someone buying a packaged circuit never searches how long Hanoï to Hué takes
 * — the agency handles that. Only a traveller organising it themselves does,
 * which is why this page and /circuit-vietnam-15-jours/ never compete: they are
 * reached by different questions, and the separation needs no interface trick
 * to hold.
 *
 * The plan the visitor builds lives in the URL hash, which crawlers do not
 * index, so there is no risk of thousands of thin generated pages. What gets
 * indexed is this prose and the table of legs underneath it.
 */

export const metadata: Metadata = {
  title: "Organiser son voyage au Vietnam soi-même",
  description:
    "Combien de jours coûte vraiment chaque trajet, ce qui se réserve à l'avance, et ce qui tient dans le temps dont vous disposez. Écrit depuis Da Nang.",
  alternates: { canonical: "/organiser-son-voyage-au-vietnam" },
};

export default async function OrganiserSonVoyage() {
  const [site, places, seasons, legsFile, trips] = await Promise.all([
    getSite(), getPlaces(), getSeasons(), getLegs(), getTrips(),
  ]);

  /* The bases are the hand-written itineraries, reduced to what the tool needs.
     Starting from one of them is what keeps the output from reading like
     machine output.

     Sorted by fewest stops per day, so the gentlest itinerary is the one the
     tool opens on. Every other configurator defaults to the fullest programme,
     because more stops look like more value for the same price; defaulting to
     the restful one is a commercial decision taken on purpose, and this sort is
     where it lives. */
  const bases: PlanBase[] = [...trips]
    .sort((a, b) => a.stops.length / a.days - b.stops.length / b.days)
    .slice(0, 3)
    .map((t) => ({
      nom: t.name,
      jours: t.days,
      etapes: t.stops.map((s) => {
        const lieu = places.find((p) => p.id === s.place);
        return { place: s.place, nuits: lieu?.nuits.ideal ?? 2 };
      }),
    }));

  const lieux = places.map((p) => ({
    id: p.id, fr: p.fr, lat: p.lat, nuits: p.nuits,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Organiser son voyage", path: "/organiser-son-voyage-au-vietnam" },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />

      <main id="contenu">
        <section className="sec sec--sand">
          <div className="wrap">
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Organiser son voyage" }]} />
            <h1 className="d1">Organiser son voyage au Vietnam</h1>
            <p className="lede">
              <b>Le pays fait 1&nbsp;650 kilomètres et votre congé en fait quinze.</b>{" "}
              Tout le reste en découle. Cet outil ne vous vend rien&nbsp;: il vous
              dit ce qui tient dans le temps dont vous disposez, et ce qu&apos;il
              faut abandonner quand ça ne tient pas.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Trois choses à savoir avant"
              title="Les heures ne sont pas des journées"
              lede="C'est le calcul que personne ne vous donne, et celui qui décide de tout le reste."
            />
            <ol className="art__liste">
              <li>
                <b>Le train de nuit Hanoï–Hué ne coûte aucune journée.</b> Il part
                à 19&nbsp;h&nbsp;20, arrive à 7&nbsp;h&nbsp;55, et remplace une
                nuit d&apos;hôtel. Dix fois plus long que l&apos;avion, et moins
                cher en temps. Celui de Sapa, lui, ne fait pas ce
                cadeau&nbsp;: il faut encore monter de Lao Cai.
              </li>
              <li>
                <b>Une croisière «&nbsp;une nuit&nbsp;» en baie occupe deux
                journées.</b> La navette quitte l&apos;hôtel vers 8&nbsp;h,
                l&apos;embarquement est à midi, et l&apos;on débarque le lendemain
                à 11&nbsp;h&nbsp;30.
              </li>
              <li>
                <b>Un bus-couchettes met 30 à 60&nbsp;% de temps de plus
                qu&apos;une voiture</b> sur la même autoroute&nbsp;: ramassage en
                plusieurs points et pauses obligatoires. Personne ne vous le dit
                avant.
              </li>
            </ol>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="L'outil"
              title="Est-ce que votre voyage tient ?"
              lede="Ajoutez, retirez, changez le mois. La jauge vous dira la vérité avant l'agence."
            />
            <Planner lieux={lieux} legs={legsFile.legs} saisons={seasons} bases={bases} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Les trajets"
              title="Ce que coûte chaque étape, et d'où vient le chiffre"
              lede="Chaque durée porte sa source. Si l'une d'elles est fausse, écrivez-nous : nous la corrigerons."
            />
            <DataTable
              caption="Durée de chaque trajet, et ce qu'il coûte en journées"
              columns={["Trajet", "Mode", "Durée", "Journées", "Source"]}
              rows={legsFile.legs.flatMap((l) =>
                l.modes.map((m) => [
                  `${places.find((p) => p.id === l.from)?.fr} → ${places.find((p) => p.id === l.to)?.fr}`,
                  m.mode.replace(/-/g, " "),
                  `${m.hours} h`,
                  m.days === 0 ? "aucune" : String(m.days),
                  m.source,
                ]),
              )}
              note={legsFile.regles.map((r) => r.texte).join(" ")}
            />

            <ul className="art__liste">
              <li>
                <b>Une durée vous paraît fausse&nbsp;?</b> Écrivez-nous. Nous
                affichons d&apos;où vient chaque chiffre précisément pour qu&apos;on
                puisse nous contredire.
              </li>
            </ul>
          </div>
        </section>

        <Closing
          title="Il reste la part qui ne se réserve pas depuis la France."
          body="Les billets de train intérieurs demandent une carte vietnamienne, et un guide francophone en mars se trouve des mois à l'avance. Envoyez-nous votre plan : nous le chiffrons tel quel, et nous vous dirons franchement si la durée ne suffit pas. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
```

- [ ] **Step 2: Register the route in `lib/routes.ts`**

`app/sitemap.ts` reads `publishedRoutes()` from this file, and so does the
footer, so one entry covers both. **Do not edit `app/sitemap.ts`.** Add it to the
`preparer` group, beside the other planning pages:

```ts
  { path: "/organiser-son-voyage-au-vietnam", label: "Organiser son voyage", group: "preparer", published: true },
```

- [ ] **Step 3: Check the table renders through the shared component**

Run: `grep -n "tbl" app/globals.css components/DataTable.tsx | head`
Expected: `DataTable` emits `<table className="tbl">` and `globals.css` styles it. The page must use `DataTable`, never a hand-rolled `<table>` — the repo has exactly one table style and a second one would drift.

- [ ] **Step 4: Build and check the whole chain**

Run: `npm run build`
Expected: `[planner] 23 places, 16 legs, all sourced`, the export succeeds, and `postbuild` runs `check-links.mjs` and `make-markdown.mjs` without error.

Then check the title and description lengths, which have overrun before:

Run: `node -e "const t='Organiser son voyage au Vietnam soi-même';const d=\"Combien de jours coûte vraiment chaque trajet, ce qui se réserve à l'avance, et ce qui tient dans le temps dont vous disposez. Écrit depuis Da Nang.\";console.log('title',t.length,'desc',d.length)"`
Expected: title ≤ 60, desc ≤ 155.

- [ ] **Step 5: Look at it in a browser**

Run: `npm run dev`
Open `http://localhost:3000/organiser-son-voyage-au-vietnam/` and check, in this order:

1. The page renders with the tool visible.
2. Adding Ha Giang to a 15-day plan turns the day gauge red and prints what to remove.
3. Clicking one of the removal options applies it and the gauge returns to green.
4. The URL hash updates as you edit; copying it into a new tab restores the same plan.
5. Choosing Octobre shows the rainy-season warning on Hué and Hoi An.
6. On a 390&nbsp;px viewport nothing overflows horizontally.

- [ ] **Step 6: Commit**

```bash
git add app/organiser-son-voyage-au-vietnam/page.tsx lib/routes.ts
git commit -m "Publish the planner on a page that can actually be found"
```

---

### Task 10: The result — what to book now, and what can wait

Without this task `lib/booking.ts` is dead code and the spec's §7 is unbuilt.
The order matters and is the spec's: **the plan first, the links afterwards.**
Give before asking.

**Files:**
- Modify: `lib/booking.ts`
- Modify: `lib/booking.test.ts`
- Modify: `components/Planner.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `experiences`, `LienPartenaire` from Task 7; `Plan`, `Etape` from Task 3. **Not `hebergement`** — see Step 5.
- Produces: `aReserver(place: string): string | null`; `AFFILIE: boolean`.

- [ ] **Step 1: Write the failing test**

Append to `lib/booking.test.ts`:

```ts
import { aReserver } from "./booking.ts";

test("only genuinely scarce places are flagged, and the reason is given", () => {
  assert.match(aReserver("lan-ha") ?? "", /cabines/);
  assert.match(aReserver("phong-nha") ?? "", /permis/);
  assert.equal(aReserver("hanoi"), null);
  assert.equal(aReserver("hoi-an"), null);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test lib/booking.test.ts`
Expected: FAIL — `aReserver is not a function`

- [ ] **Step 3: Write the implementation**

Append to `lib/booking.ts`:

```ts
/**
 * The short list of things that genuinely sell out, and why.
 *
 * An explicit list rather than a flag derived from the data, because the honest
 * answer is short and saying so is the point: a tool that marks two items
 * urgent is believed, and one that marks ten is a shop. Hanoï, Hoi An and
 * Saïgon have thousands of rooms between them and belong in "can wait", which
 * costs us most of the accommodation commission and buys the only thing that
 * makes the rest of the page credible.
 *
 * Returns null for everywhere else — and null is the common case on purpose.
 */
export function aReserver(place: string): string | null {
  switch (place) {
    case "lan-ha":
    case "ha-long":
      return "Une trentaine de jonques, une quinzaine de cabines chacune. Elles partent deux mois à l'avance.";
    case "phong-nha":
      return "Les permis d'accès aux grottes sont limités en nombre chaque jour.";
    default:
      return null;
  }
}

/**
 * Whether any affiliate account exists yet. False today, so the page prints no
 * disclosure — claiming a commission we do not earn would be its own small lie,
 * on a page whose whole argument is that it tells the truth.
 */
export const AFFILIE = Boolean(AID_BOOKING || AID_GETYOURGUIDE);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test lib/booking.test.ts`
Expected: PASS — `# fail 0`

- [ ] **Step 5: Render the result inside `components/Planner.tsx`**

Add the imports at the top of the file:

```tsx
import { AFFILIE, aReserver, experiences } from "@/lib/booking";
```

And insert this block **after** the `<ol className="plan__etapes">` list and
before `<div className="plan__ajout">`, so the plan is read before anything is
sold:

```tsx
      {b.reste >= 0 && plan.etapes.length > 1 && (
        <div className="plan__suite">
          {(() => {
            const urgents = plan.etapes
              .map((e) => ({ e, pourquoi: aReserver(e.place) }))
              .filter((x): x is { e: Etape; pourquoi: string } => x.pourquoi !== null);
            const calmes = plan.etapes.filter((e) => aReserver(e.place) === null);

            return (
              <>
                {urgents.length > 0 && (
                  <section>
                    <h3>À réserver maintenant</h3>
                    <p className="plan__note">
                      {urgents.length === 1
                        ? "Une seule chose. Pas dix."
                        : `${urgents.length} choses. Pas dix.`}
                    </p>
                    {urgents.map(({ e, pourquoi }) => (
                      <div className="plan__urgent" key={e.place}>
                        <b>{nom(e.place)}</b>
                        <p>{pourquoi}</p>
                      </div>
                    ))}
                  </section>
                )}

                {/* Only when there is something that can in fact wait. An
                    itinerary of nothing but scarce stops — Lan Ha, Ha Long,
                    Phong Nha — is buildable, and would otherwise print
                    "Vos hôtels à  : rien ne presse." with a hole where the
                    cities should be. The honest answer there is to say nothing
                    at all rather than to reassure about hotels nobody booked. */}
                {calmes.length > 0 && (
                <section className="plan__calme">
                  <h3>Ce qui peut attendre</h3>
                  <p>
                    Vos hôtels à{" "}
                    {calmes.slice(0, 3).map((e) => nom(e.place)).join(", ")}
                    &nbsp;: rien ne presse. Ces villes ont des milliers de
                    chambres. Réservez-les quand vos vols seront pris, pas avant.
                  </p>
                  <p className="plan__note">
                    Ce plan reste à cette adresse. Revenez à ce moment-là.
                  </p>
                </section>
                )}

                <section>
                  <h3>Vos journées libres</h3>
                  <p className="plan__note">
                    Vous avez laissé de la place. Voici ce qu&apos;on y fait — ou
                    rien, c&apos;est permis.
                  </p>
                  <ul className="plan__liens">
                    {plan.etapes.slice(0, 3).flatMap((e) =>
                      experiences(nom(e.place)).map((x) => (
                        <li key={`${e.place}-${x.libelle}`}>
                          <a href={x.url} target="_blank" rel="noopener nofollow sponsored">
                            {x.libelle}
                          </a>
                          {x.partenaire && <small> · {x.partenaire}</small>}
                        </li>
                      )),
                    )}
                  </ul>
                  {AFFILIE && (
                    <p className="plan__note">
                      Liens partenaires — nous percevons une commission, sans
                      surcoût pour vous.
                    </p>
                  )}
                </section>
              </>
            );
          })()}
        </div>
      )}
```

> **Do not import `hebergement` here.** It exists, it is tested, and nothing on
> this page may call it: accommodation belongs in "ce qui peut attendre", and an
> accommodation link printed beside a paragraph telling people not to hurry
> would contradict the paragraph in the same breath. It waits for the day an
> affiliate account exists and a separate decision is taken about where it goes.

- [ ] **Step 6: Add the styles to `app/globals.css`**

```css
.plan__suite { margin-top: 1.5rem; border-top: 1px solid var(--line); padding-top: 1.25rem; }
.plan__suite h3 { font-size: 1rem; margin: 1.25rem 0 .4rem; }
.plan__suite section:first-child h3 { margin-top: 0; }
.plan__urgent { border: 1px solid #cf9000; border-radius: 8px; padding: .7rem .9rem; margin-bottom: .6rem; }
.plan__urgent p { margin: .25rem 0 0; font-size: .87rem; opacity: .8; }
.plan__calme { border: 1px solid #2f9e68; border-radius: 8px; padding: .7rem .9rem; }
.plan__calme p { margin: .25rem 0 0; font-size: .9rem; }
.plan__liens { list-style: none; margin: .5rem 0 0; padding: 0; }
.plan__liens li { padding: .3rem 0; }
```

- [ ] **Step 7: Check it in the browser**

Run: `npm run dev`, open `/organiser-son-voyage-au-vietnam/` and confirm:

1. With Lan Ha in the plan, "À réserver maintenant" lists it and says why.
2. With Lan Ha removed, that section disappears entirely rather than showing an empty heading.
3. "Ce qui peut attendre" names the actual cities in the plan.
4. The affiliate disclosure is **absent** (no account yet, so `partenaire` is null) and the links still work.
5. Nothing appears while the day gauge is red — there is no point selling a trip that does not fit.

- [ ] **Step 8: Commit**

```bash
git add lib/booking.ts lib/booking.test.ts components/Planner.tsx app/globals.css
git commit -m "Tell them what to book, and what not to book yet"
```

---

### Task 11: Stop costing an unknown leg at zero, and count the right free days

Found by running the finished engine over the real `content/legs.json` rather
than over the fixtures — which is the only reason it was found at all. Both
defects are invisible to every test written so far.

**Files:**
- Modify: `content/legs.json`
- Modify: `lib/planner.ts`
- Modify: `lib/planner.test.ts`

**Interfaces:**
- Consumes: `Bilan`, `bilan`, `rythme` from Tasks 3 and 4.
- Produces: `Bilan` gains `inconnus: string[]`. `Rythme.joursLibres` changes meaning.

- [ ] **Step 1: Write the failing tests**

Append to `lib/planner.test.ts`:

```ts
test("a leg we have no data for is named, never silently free", () => {
  const legs: Leg[] = [
    { from: "hanoi", to: "ninh-binh", modes: [
      { mode: "route", hours: 1.6, days: 0.25, journee: "perdue", note: "", source: "x" },
    ] },
  ];
  const plan: Plan = { jours: 10, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 },
    { place: "ninh-binh", nuits: 2 },
    { place: "hue", nuits: 4 },
  ] };
  const b = bilan(plan, legs);
  // Ninh Binh → Hué is 700 km and we hold nothing on it. It must be reported.
  assert.deepEqual(b.inconnus, ["ninh-binh → hue"]);
  // And it must not have been counted as free daytime either.
  assert.equal(b.joursPerdus, 0.25);
});

test("a plan whose every leg is known reports no unknowns", () => {
  const legs: Leg[] = [
    { from: "hanoi", to: "ninh-binh", modes: [
      { mode: "route", hours: 1.6, days: 0.25, journee: "perdue", note: "", source: "x" },
    ] },
  ];
  const plan: Plan = { jours: 6, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "ninh-binh", nuits: 2 },
  ] };
  assert.deepEqual(bilan(plan, legs).inconnus, []);
});

test("free days are the ones that do not involve a suitcase", () => {
  const legs: Leg[] = [];
  // Three nights somewhere buys two whole days there; one night buys none.
  const plan: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "ninh-binh", nuits: 1 },
    { place: "hoi-an", nuits: 5 },
  ] };
  assert.equal(rythme(plan, legs).joursLibres, 2 + 0 + 4);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test lib/planner.test.ts`
Expected: FAIL — `inconnus` is undefined, and `joursLibres` returns the old formula's value.

- [ ] **Step 3: Report unknown legs from `bilan`**

In `lib/planner.ts`, add the field to `Bilan`:

```ts
  /**
   * Legs the data holds nothing about, as `"from → to"`.
   *
   * They used to be skipped in silence, which made Lan Ha → Hué — seven hundred
   * kilometres — cost nothing at all, and let the planner call a trip
   * comfortable that had an unaccounted crossing of the country in it. Silence
   * is the one answer a tool built to say no may never give.
   */
  inconnus: string[];
```

and rewrite the loop inside `bilan` to collect them:

```ts
export function bilan(plan: Plan, legs: Leg[]): Bilan {
  let nuitsPlacees = 0;
  let joursPerdus = 0;
  const inconnus: string[] = [];

  for (const e of plan.etapes) nuitsPlacees += e.nuits;

  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const depuis = plan.etapes[i].place;
    const vers = plan.etapes[i + 1].place;
    const leg = trouverLeg(legs, depuis, vers);
    const m = leg ? modeDefaut(leg) : null;
    if (!m) {
      inconnus.push(`${depuis} → ${vers}`);
      continue;
    }
    if (m.nuit) nuitsPlacees += 1;
    if (m.journee === "perdue") joursPerdus += m.days;
  }

  const nuitsDisponibles = plan.jours - 1;
  return {
    nuitsPlacees,
    nuitsDisponibles,
    reste: nuitsDisponibles - nuitsPlacees,
    joursPerdus,
    inconnus,
  };
}
```

- [ ] **Step 4: Count free days as days without a suitcase**

In `rythme`, replace the `joursLibres` line with:

```ts
  /* A stop of N nights buys N−1 whole days there; a one-night stop buys none.
     The previous formula subtracted travel from the trip length and returned
     twelve or thirteen for every itinerary ever built, which would have printed
     "13 journées sans bouger" above a seven-stop forced march and cost the
     reader's trust in one line. */
  const joursLibres = plan.etapes.reduce((n, e) => n + Math.max(0, e.nuits - 1), 0);
```

Leave the rest of `rythme` exactly as it is, including the three `tendu`
thresholds. `joursLibres < 2` stays: it no longer fires for long trips, but it
still catches a short one chopped into one-night stops.

- [ ] **Step 5: Add the five missing legs to `content/legs.json`**

Every itinerary that crosses the country passes through a hub, and these five
pairs had no entry at all. The figures are **sums of legs already in this file**,
not new research — each `source` says which, so the arithmetic can be rechecked.
Append these to the `legs` array:

```json
    {
      "from": "lan-ha", "to": "hue",
      "modes": [
        { "mode": "navette-train-nuit", "hours": 15.85, "days": 0.5, "journee": "perdue", "nuit": true,
          "note": "Par Hanoï : la navette quitte la jonque vers 11 h 30 et dépose vers 15 h, le train de nuit part à 19 h 20. La correspondance tient, sans marge.",
          "source": "Somme de Hanoï–baie de Lan Ha (route) et Hanoï–Hué (train de nuit), lignes ci-dessus" }
      ]
    },
    {
      "from": "lan-ha", "to": "hoi-an",
      "modes": [
        { "mode": "navette-avion", "hours": 5.38, "days": 1, "journee": "perdue",
          "note": "Par Hanoï puis l'aéroport de Da Nang. Compter la journée entière : on débarque à 11 h 30 et on arrive à Hoi An le soir.",
          "source": "Somme de Hanoï–baie de Lan Ha (route), Hanoï–Da Nang (avion) et Da Nang–Hoi An (route)" }
      ]
    },
    {
      "from": "hoi-an", "to": "hcmc",
      "modes": [
        { "mode": "avion", "hours": 2.13, "days": 0.5, "journee": "perdue",
          "note": "Par l'aéroport de Da Nang, à 45 minutes de Hoi An. Il n'existe pas d'aéroport à Hoi An.",
          "source": "Somme de Da Nang–Hoi An (route) et Da Nang–Hô Chi Minh-Ville (avion)" }
      ]
    },
    {
      "from": "sapa", "to": "hue",
      "modes": [
        { "mode": "bus-train-nuit", "hours": 18.1, "days": 1, "journee": "perdue", "nuit": true,
          "note": "Par Hanoï. Descendre de Sapa le matin pour attraper le train de nuit le soir même.",
          "source": "Somme de Hanoï–Sapa (route) et Hanoï–Hué (train de nuit)" }
      ]
    },
    {
      "from": "ha-giang", "to": "hue",
      "modes": [
        { "mode": "limousine-train-nuit", "hours": 18.35, "days": 1, "journee": "perdue", "nuit": true,
          "note": "Par Hanoï, en limousine le matin puis le train de nuit. Deux nuits de transport d'affilée si l'on arrive de Ha Giang par le bus de nuit — prévoir une journée à Hanoï entre les deux.",
          "source": "Somme de Hanoï–Ha Giang (limousine) et Hanoï–Hué (train de nuit)" }
      ]
    }
```

> `nuit: true` on three of them is correct and the validator permits it: each
> ends with the night train, so a night is spent aboard, and each still costs
> daytime — exactly the independence Task 1 had to be corrected to preserve.

- [ ] **Step 6: Run the tests and the validator**

Run: `node --test lib/planner.test.ts`
Expected: PASS, **fourteen tests**, `# fail 0`.

Run: `node scripts/check-planner.mjs`
Expected: `[planner] 23 places, 21 legs, all sourced`

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add content/legs.json lib/planner.ts lib/planner.test.ts
git commit -m "Refuse to price an unknown leg at zero"
```

---

### Task 12: Give the rhythm gauge back the distinction Task 11 took from it

Task 11 fixed `joursLibres` and, in doing so, removed the last place `rythme()`
consulted `journee`. The gauge now penalises six hours on the Hai Van pass
exactly as hard as six hours on a motorway — the precise failure the `journee`
field was invented to prevent, rebuilt while repairing something else.
`joursPerdus` is computed and never read, and the test named for the pass would
pass identically if `journee` did not exist.

**Files:**
- Modify: `lib/planner.ts`
- Modify: `lib/planner.test.ts`
- Modify: `scripts/check-planner.mjs`

**Interfaces:**
- Consumes: `Rythme`, `rythme` from Task 4; `Leg`, `Plan` from Task 3.
- Produces: `Rythme` gains `heuresSubies: number`; `tendu` keys on it instead of `heuresTransport`.

- [ ] **Step 1: Replace the Hai Van test so it tests the pass again**

In `lib/planner.test.ts`, replace the whole existing
`test("a day on the Hai Van pass is not counted against the traveller", …)`
block with:

```ts
test("a day on the Hai Van pass is not counted against the traveller", () => {
  const plan: Plan = { jours: 6, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hue", nuits: 2 }, { place: "hoi-an", nuits: 3 },
  ] };
  const col: Leg[] = [{ from: "hue", to: "hoi-an", modes: [
    { mode: "route-col", hours: 6, days: 1, journee: "vecue", note: "", source: "x" },
  ] }];
  const tunnel: Leg[] = [{ from: "hue", to: "hoi-an", modes: [
    { mode: "route-tunnel", hours: 6, days: 1, journee: "perdue", note: "", source: "x" },
  ] }];

  // Six hours in a vehicle either way, and the traveller is told so either way.
  assert.equal(rythme(plan, col).heuresTransport, 6);
  assert.equal(rythme(plan, tunnel).heuresTransport, 6);

  // But only the motorway is held against them.
  assert.equal(rythme(plan, col).heuresSubies, 0);
  assert.equal(rythme(plan, tunnel).heuresSubies, 6);

  // Nights per stop are the same in both, so this must not move.
  assert.equal(rythme(plan, col).joursLibres, 3);
});
```

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `node --test lib/planner.test.ts`
Expected: FAIL — `heuresSubies` is `undefined`.

- [ ] **Step 3: Add `heuresSubies` and retire the dead counter**

In `lib/planner.ts`, add the field to `Rythme`, directly after `heuresTransport`:

```ts
  /**
   * The hours held against the traveller: `perdue` only.
   *
   * `heuresTransport` is what to print — a traveller spending six hours on the
   * col des Nuages did spend six hours in a car, and saying otherwise would be
   * a lie. This is what to judge by, and the two differ by exactly the stretch
   * of the trip that was the point of taking it.
   */
  heuresSubies: number;
```

and rewrite the body of `rythme`, dropping `joursPerdus`, which nothing reads
once `joursLibres` is counted from nights:

```ts
export function rythme(plan: Plan, legs: Leg[]): Rythme {
  let heuresTransport = 0;
  let heuresSubies = 0;

  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const leg = trouverLeg(legs, plan.etapes[i].place, plan.etapes[i + 1].place);
    const m = leg ? modeDefaut(leg) : null;
    if (!m) continue;
    heuresTransport += m.hours;
    if (m.journee === "perdue") heuresSubies += m.hours;
  }

  const etapes = plan.etapes.length;
  /* A stop of N nights buys N−1 whole days there; a one-night stop buys none. */
  const joursLibres = plan.etapes.reduce((n, e) => n + Math.max(0, e.nuits - 1), 0);
  const arrondi = (h: number) => Math.round(h * 10) / 10;

  return {
    etapes,
    changements: Math.max(0, etapes - 1),
    heuresTransport: arrondi(heuresTransport),
    heuresSubies: arrondi(heuresSubies),
    joursLibres,
    tendu: etapes - 1 > 5 || heuresSubies > 20 || joursLibres < 2,
  };
}
```

Leave the `changements` line and the three threshold values alone; only the
hours the middle threshold reads have changed.

- [ ] **Step 4: Fix the validator's invariant, which `days` could never express**

In `scripts/check-planner.mjs`, replace the `m.nuit && m.days > 1` check and its
comment with:

```js
    /* A mode that carries its own bed has to be long enough to sleep in.
       The rule used to compare `days`, and broke the moment composite legs
       arrived: Sapa → Hué is a day bus to Hanoï followed by the night train, so
       it genuinely costs a whole day AND provides a bed. No threshold on `days`
       can separate that from an error. Hours can: nobody sleeps a night in a
       forty-five-minute hop. */
    if (m.nuit && m.hours < 6)
      fautes.push(`leg ${l.from}->${l.to} ${m.mode}: ${m.hours} h is not a night`);
```

- [ ] **Step 5: Verify**

Run: `node --test lib/planner.test.ts`
Expected: PASS, **fourteen tests**, `# fail 0`.

Run: `node scripts/check-planner.mjs`
Expected: `[planner] 23 places, 21 legs, all sourced`

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/planner.ts lib/planner.test.ts scripts/check-planner.mjs
git commit -m "Judge the hours endured, not the hours travelled"
```

---

## Out of scope for v1

Named here so nobody adds them by reflex: an interactive map; user accounts; server-side plan storage; Booking's Demand API and in-page hotel cards; accommodation deep links (the "can wait" paragraph argues against them until an affiliate account exists); multi-language; and the Ha Giang loop's internal legs.

## Two facts still missing from `content/legs.json`

Both need somebody living in Vietnam, and neither blocks this plan — the engine reads whatever the file holds:

1. Which legs the rains close or badly slow. `seasons.json` knows which months are wet; it does not know which roads suffer.
2. Where you must not arrive after dark. That is a departure-time constraint, not a duration: a six-hour leg that has to land before five swallows the whole day, and no timetable records it.
