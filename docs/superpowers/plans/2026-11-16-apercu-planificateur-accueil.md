# Aperçu du planificateur sur la page d'accueil — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a section on the home page, between `<Circuits />` and `<Story />`, that shows what the planner does using numbers computed at build time from real data, and links to it — so the tool stops being reachable only from the footer.

**Architecture:** One async server component, `components/Apercu.tsx`, following the shape of `components/Circuits.tsx`: it loads its own content, renders through `<SectionHead>`, and ships no client JavaScript. It inserts Sapa into the 15-day itinerary at that place's latitude and calls the planner's own `bilan()` to get the figures it prints. A guard inside the component throws — failing `next build` — if that worked example ever stops being short of days.

**Tech Stack:** Next.js 15 App Router with `output: "export"`, React 19 server components, TypeScript strict. No test runner involved: this component has no logic of its own worth unit-testing, and the arithmetic it calls is already covered by `lib/planner.test.ts`. Its correctness is enforced by the build-time guard and checked in a browser.

**Spec:** [`docs/superpowers/specs/2026-11-16-apercu-planificateur-accueil-design.md`](../specs/2026-11-16-apercu-planificateur-accueil-design.md)

## Global Constraints

- **No new npm dependency.** Runtime deps stay exactly: `next`, `react`, `react-dom`, `sharp`.
- **The home page keeps zero client components.** `components/Planner.tsx` is currently the only `"use client"` file in the repo and it is only used on `/organiser-son-voyage-au-vietnam/`. Do not add `"use client"` to anything in this plan, and do not import `Planner` here.
- **All site-facing copy in French. All code comments in English**, matching every existing file in the repo.
- **French typography:** a narrow non-breaking space before `: ; ! ? »`, written as the literal character ` ` (U+202F). It goes directly in the JSON strings. `« Vous organisez vous-même ? »` needs one before the `?`.
- **Every internal href ends with `/`.** Use `lien()` from `@/lib/content`; `scripts/check-links.mjs` runs in `postbuild` and fails otherwise.
- **The figures printed on the page are never hardcoded.** They come from `bilan()` at build time. This is the spec's hard constraint (§4), not a style preference.
- **`.pages.yml` is generated, never hand-edited.** It is produced by `scripts/make-cms-config.mjs`. Editing it by hand will be silently overwritten on the next `npm run cms`, which also runs in `prebuild`.
- **A field in `content/*.json` that is missing from the CMS config gets DELETED** the first time an editor presses Publish. `scripts/check-cms.mjs` fails the build to prevent that; it is why Task 1 touches the generator and not just the JSON.
- **TypeScript is `strict`.** No `any`, no non-null assertions.

---

## File Structure

| File | Responsibility |
|---|---|
| `content/home.json` | **modify** — the section's French copy, under a new `planificateur` key. |
| `lib/content/types.ts` | **modify** — `Home` gains `planificateur`. |
| `scripts/make-cms-config.mjs` | **modify** — declare the new fields in both generated configs. |
| `.pages.yml` | **regenerated** by `npm run cms`. Never edited by hand. |
| `components/Apercu.tsx` | **new** — the section. Loads content, computes the figures, renders, and guards. |
| `app/globals.css` | **modify** — `.apercu__*` layout. The gauge itself reuses `.plan__g`. |
| `app/page.tsx` | **modify** — one import and one line in the body. |

### One deliberate deviation from the spec

Spec §7 puts the build-time guard in `scripts/check-planner.mjs`. **This plan puts it inside `components/Apercu.tsx` instead**, for a reason found after the spec was written:

`check-planner.mjs` is plain Node ESM that today reads only JSON. Asserting the Sapa example requires `bilan()` from `lib/planner.ts`, so the script would have to import a TypeScript module. That works locally on Node 22.19, but the repo pins no `engines` field and Cloudflare Workers Builds is configured with `NODE_VERSION=22` — which can resolve to a Node 22 older than 22.18, where type stripping is not enabled by default. The build would then fail on Cloudflare while passing on every developer machine.

Inside the component there is no such risk: Next compiles the TypeScript anyway, and a thrown error during static generation fails `next build` just as hard. The guard is also closer to the thing it protects.

The spec's intent — *the build goes red rather than the home page printing a false number* — is preserved exactly.

---

### Task 1: The copy, its type, and the CMS schema that keeps it alive

**Files:**
- Modify: `content/home.json`
- Modify: `lib/content/types.ts`
- Modify: `scripts/make-cms-config.mjs`
- Regenerate: `.pages.yml`

**Interfaces:**
- Consumes: nothing.
- Produces: `Home` gains
  `planificateur: Head & { argument: string; force: string; cta: string; repli: string }`,
  reachable as `(await getHome()).planificateur`. `Head` is the existing
  `{ kicker: string; title: string; lede?: string }`.

- [ ] **Step 1: Add the copy to `content/home.json`**

Insert this key **after** the existing `"circuits"` object and before `"process"`, so the file reads in the order the page renders.

The ` ` characters before `?` are literal U+202F narrow no-break spaces — copy them, do not type a normal space:

```json
  "planificateur": {
    "kicker": "Vous organisez vous-même ?",
    "title": "Est-ce que votre voyage *tient vraiment* dans vos quinze jours ?",
    "lede": "Ajoutez Sapa à notre circuit de quinze jours, et il n'y tient plus.",
    "argument": "Notre planificateur vous le dit maintenant, pas sur place — et vous dit ce qu'il faut retirer. Gratuit, sans inscription, sans adresse e-mail.",
    "force": "C'est le seul outil de ce site qui vous dira non.",
    "cta": "Organiser mon voyage",
    "repli": "Et si vous préférez qu'on s'en occupe, nos circuits sont juste au-dessus."
  },
```

`repli` is the line that sends an undecided reader back to the tour funnel. Spec §5 marks it as not removable when the copy is edited.

- [ ] **Step 2: Add the field to the `Home` type**

In `lib/content/types.ts`, inside the existing `export type Home = {` block, add the line directly after `circuits: Head;`:

```ts
  /**
   * The planner teaser. Carries more than a Head because the section argues:
   * `force` is the one-line claim, `cta` the button, and `repli` the sentence
   * that points an undecided reader back up to the circuits rather than away.
   */
  planificateur: Head & {
    argument: string;
    force: string;
    cta: string;
    repli: string;
  };
```

- [ ] **Step 3: Run the build and watch the CMS check fail**

Run: `npm run cms`

Expected: **FAIL.** `scripts/check-cms.mjs` reports that `content/home.json` has fields absent from the CMS config. This is the check doing its job — the dangerous direction is a field in content that the CMS does not know about, because Sveltia rewrites the whole file and would delete it on the first Publish.

Read the error. It names the missing fields.

- [ ] **Step 4: Declare the fields in the Sveltia config**

In `scripts/make-cms-config.mjs`, find this line inside the `accueil` file collection:

```js
${SECTIONS.map(([c, l]) => headSveltia(c, l, 10)).join("\n")}
```

It is immediately followed by `          - name: devis`. Insert this block **between** them, at the same ten-space indentation:

```js
          - name: planificateur
            label: Aperçu du planificateur
            widget: object
            collapsed: true
            fields:
              - { name: kicker, label: Surtitre, widget: string }
              - { name: title, label: Titre, widget: string, hint: "${HINT_ACCENT}" }
              - { name: lede, label: Chapô, widget: text }
              - { name: argument, label: Argument, widget: text }
              - { name: force, label: Phrase forte, widget: string }
              - { name: cta, label: Libellé du bouton, widget: string }
              - { name: repli, label: Renvoi vers les circuits, widget: text, hint: "Renvoie le lecteur indécis vers les circuits plus haut. Ne pas supprimer : sans cette phrase la section envoie les clients ailleurs sans rien proposer en retour." }
```

This is a bespoke block rather than an entry in `SECTIONS` because the section has four fields beyond the standard kicker/title/lede. `devis`, just below, is the existing precedent for that.

- [ ] **Step 5: Declare the same fields in the `.pages.yml` config**

Further down the same file, find:

```js
${SECTIONS.map(([c, l]) => headPages(c, l, 6)).join("\n")}
```

It is immediately followed by `      - name: devis`. Insert between them, at six-space indentation:

```js
      - name: planificateur
        label: Aperçu du planificateur
        type: object
        fields:
          - { name: kicker, label: Surtitre, type: string, required: true }
          - { name: title, label: Titre, type: string, required: true, description: "${HINT_ACCENT}" }
          - { name: lede, label: Chapô, type: text }
          - { name: argument, label: Argument, type: text, required: true }
          - { name: force, label: Phrase forte, type: string, required: true }
          - { name: cta, label: Libellé du bouton, type: string, required: true }
          - { name: repli, label: Renvoi vers les circuits, type: text, required: true, description: "Renvoie le lecteur indécis vers les circuits plus haut. Ne pas supprimer." }
```

There are **two** generated configs and they must agree. Editing only one is the mistake this step exists to prevent.

- [ ] **Step 6: Regenerate and verify the check now passes**

Run: `npm run cms`

Expected: PASS. The script regenerates `public/admin/config.yml` and `.pages.yml`, then `check-cms.mjs` reports no gaps.

- [ ] **Step 7: Verify the type compiles**

Run: `npx tsc --noEmit`
Expected: no error.

- [ ] **Step 8: Commit**

```bash
git add content/home.json lib/content/types.ts scripts/make-cms-config.mjs .pages.yml public/admin/config.yml
git commit -m "Give the planner teaser its words, and the CMS a schema for them"
```

---

### Task 2: The section, with figures it computes rather than claims

**Files:**
- Create: `components/Apercu.tsx`
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `(await getHome()).planificateur` from Task 1. `bilan` and the `Etape` type from `@/lib/planner`. `getTrips`, `getPlaces`, `getLegs`, `lien` from `@/lib/content`. `SectionHead` from `./ui`, `Accent` from `@/lib/text`.
- Produces: `export async function Apercu()`, rendered by `app/page.tsx`.

- [ ] **Step 1: Write the component**

Create `components/Apercu.tsx`:

```tsx
import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { bilan } from "@/lib/planner";
import type { Etape } from "@/lib/planner";
import { getHome, getTrips, getPlaces, getLegs, lien } from "@/lib/content";

/**
 * The planner, argued for on the page everyone lands on.
 *
 * The tool shipped reachable only from the footer, and being linked to is the
 * first reason the spec gave for building it — nobody links to a sales page,
 * people do link to a free tool. A section nobody can find serves neither.
 *
 * It sits after the circuits on purpose: a visitor who has just read six
 * packaged itineraries and wants none of them has, at that exact moment,
 * revealed which of the two audiences they belong to.
 *
 * No client JavaScript. The home page has none today, its mobile LCP is 3.1 s
 * in the lab, and the audit's instruction was to leave the hero alone until
 * CrUX returns field data — so at the very least do not make it heavier. The
 * real tool is one click away and is better than any teaser could be.
 */

/** The itinerary the example starts from, found by its length. */
const BASE_JOURS = 15;

/**
 * What gets added to it. Chosen because it is the strongest example that is
 * also fully costed: adding Sapa leaves the trip two days short with no
 * unknown legs, so every number below can be defended. Ha Giang is only one
 * day short; Con Dao and Phu Quoc look worse but route through legs the data
 * holds nothing on, which would make the shortfall optimistic and the sentence
 * false. See the spec's table.
 */
const AJOUT = "sapa";

export async function Apercu() {
  const [home, trips, places, legsFile] = await Promise.all([
    getHome(),
    getTrips(),
    getPlaces(),
    getLegs(),
  ]);
  const t = home.planificateur;

  const base = trips.find((x) => x.days === BASE_JOURS);
  const ajout = places.find((p) => p.id === AJOUT);
  if (!base) throw new Error(`[apercu] no ${BASE_JOURS}-day itinerary to build the example from`);
  if (!ajout) throw new Error(`[apercu] place "${AJOUT}" is not in content/places.json`);

  /* Inserted at its latitude, exactly as the planner does it, because an
     example that appended Sapa after the Mekong delta would be showing a trip
     nobody takes. */
  const latitude = (id: string) => places.find((p) => p.id === id)?.lat ?? 0;
  const etapes: Etape[] = base.stops
    .filter((s) => s.nuits > 0)
    .map((s) => ({ place: s.place, nuits: s.nuits }));
  const rang = etapes.findIndex((e) => latitude(e.place) < ajout.lat);
  etapes.splice(rang === -1 ? etapes.length : rang, 0, {
    place: AJOUT,
    nuits: ajout.nuits.ideal,
  });

  /* `mois` and `voyageurs` are required by the Plan type and read by neither
     bilan() nor anything below; only `jours` and `etapes` affect the figures. */
  const b = bilan(
    { jours: base.days, mois: "Mars", voyageurs: 2, etapes },
    legsFile.legs,
  );

  /* The guard. This section's whole claim is that its numbers are real, so a
     data change that makes the example fit — or that routes it through a leg
     nobody has costed — must stop the build rather than quietly print
     "Il vous manque 0 jours" above a sentence promising the tool tells the
     truth. Whoever hits this picks a new AJOUT from the spec's table. */
  if (b.reste >= 0) {
    throw new Error(
      `[apercu] adding ${AJOUT} to the ${base.days}-day trip now leaves ${b.reste} night(s) spare, ` +
        `so the example no longer shows a shortfall. Pick another AJOUT.`,
    );
  }
  if (b.inconnus.length > 0) {
    throw new Error(
      `[apercu] the example routes through leg(s) with no data: ${b.inconnus.join(", ")}. ` +
        `The shortfall would be understated. Pick another AJOUT or add the leg.`,
    );
  }

  const manque = -b.reste;
  const barres = Math.max(b.nuitsDisponibles, b.nuitsPlacees);

  return (
    <section className="sec sec--sand" id="planificateur">
      <div className="wrap">
        <SectionHead
          kicker={t.kicker}
          title={<Accent>{t.title}</Accent>}
          lede={t.lede}
        />

        <div className="apercu">
          {/* aria-hidden because the sentence under it says the same thing in
              words. Left readable, a screen reader would hear the itinerary
              twice — the same reason TripMap is hidden beside its étape list. */}
          <div className="apercu__demo" aria-hidden="true">
            <span className="apercu__compte">
              {b.nuitsPlacees} / {b.nuitsDisponibles} nuits
            </span>
            <div className="plan__g">
              {Array.from({ length: barres }, (_, i) => (
                <i
                  key={i}
                  className={
                    i < b.nuitsPlacees
                      ? i < b.nuitsDisponibles
                        ? "ok"
                        : "over"
                      : "nil"
                  }
                />
              ))}
            </div>
            <p className="apercu__verdict">
              Il vous manque {manque} {manque > 1 ? "jours" : "jour"}.
            </p>
          </div>

          <div>
            <p>{t.argument}</p>
            <p className="apercu__force">{t.force}</p>
            <a
              className="btn btn--amber"
              href={lien("/organiser-son-voyage-au-vietnam")}
            >
              {t.cta}
            </a>
            <p className="apercu__repli">{t.repli}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add the styles**

Append to `app/globals.css`:

```css
/* The planner teaser. The gauge deliberately reuses .plan__g rather than
   declaring its own: one gauge definition in the codebase means the home page
   cannot drift away from what the real tool looks like. */
.apercu {
  display: grid;
  gap: 1.5rem;
  align-items: center;
}
@media (min-width: 56rem) {
  .apercu {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
  }
}
.apercu__demo {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1.25rem;
  background: var(--paper);
}
.apercu__compte {
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  font-variant-numeric: tabular-nums;
}
.apercu__verdict {
  color: var(--brique);
  font-weight: 600;
  margin: 0.6rem 0 0;
}
.apercu__force {
  font-weight: 600;
  margin: 1rem 0 1.25rem;
}
.apercu__repli {
  font-size: 0.85rem;
  color: var(--ink-3);
  margin: 1rem 0 0;
}
```

`--line`, `--paper`, `--ink-3` and `--brique` are all already declared at the top of the file. Do not introduce new colours.

- [ ] **Step 3: Render it on the home page**

In `app/page.tsx`, add the import beside the other component imports:

```tsx
import { Apercu } from "@/components/Apercu";
```

and add the element between `<Circuits />` and `<Story />`:

```tsx
        <Circuits />
        <Apercu />
        <Story />
```

The order matters twice. It is the right point in the funnel, and it keeps the
background rhythm legal: `Circuits` is `sec`, `Apercu` is `sec--sand`, `Story`
is `sec--jade`. Two sections with the same ground side by side read as one
section, which is why the repo never does it.

- [ ] **Step 4: Verify it compiles and builds**

Run: `npx tsc --noEmit`
Expected: no error.

Run: `npm run build`
Expected: the build completes. `postbuild` prints the `liens :` and `markdown :` lines with no broken address.

- [ ] **Step 5: Check the rendered numbers are the real ones**

Run:

```bash
grep -o 'Il vous manque [0-9]* jours\?\|[0-9]* / [0-9]* nuits' out/index.html
```

Expected, exactly:

```
16 / 14 nuits
Il vous manque 2 jours
```

If the numbers differ from these, **do not edit the component to force them**. The data changed; report the new figures and stop. These two lines are the whole reason this task exists.

- [ ] **Step 6: Look at it in a browser**

Run: `npx wrangler dev` and open `http://localhost:8787/`, then check:

1. The section appears between the circuits list and the dark "Carnet de route" band, on a sand background.
2. The gauge shows fourteen green bars followed by two red ones.
3. *« Il vous manque 2 jours. »* is printed under it in brick red.
4. The button reads *« Organiser mon voyage »* and goes to `/organiser-son-voyage-au-vietnam/` — with the trailing slash.
5. The last line points back to the circuits.
6. At a 390 px viewport the two columns stack and nothing overflows horizontally.

- [ ] **Step 7: Commit**

```bash
git add components/Apercu.tsx app/globals.css app/page.tsx
git commit -m "Show on the home page what the planner refuses, with real figures"
```

---

### Task 3: Prove the guard actually fires

The guard is worth exactly as much as the evidence that it fires. Every defect
found while building the planner was a sentence that was arithmetically right
and false when read aloud, and none of them made a test fail. This task breaks
the data on purpose, watches the build go red, and puts it back.

**Files:**
- Temporarily modify, then restore: `content/places.json`

**Interfaces:**
- Consumes: the guard written in Task 2.
- Produces: nothing. This task changes no committed file.

- [ ] **Step 1: Confirm the tree is clean before breaking anything**

Run: `git status --short`
Expected: empty. If it is not, stop and commit or stash first — this task relies on `git checkout` to undo its own damage.

- [ ] **Step 2: Make the example fit, which should be refused**

In `content/places.json`, find the `sapa` entry and change its `nuits.ideal` from `2` to `1`. That removes one night from the example and should leave the trip only one night short rather than two — still short, so this alone must **not** trip the guard.

Run: `npm run build`
Expected: the build **succeeds**, and the rendered figure is now one day:

```bash
grep -o 'Il vous manque [0-9]* jours\?' out/index.html
```
Expected: `Il vous manque 1 jour`

Note the singular. If it prints `1 jours`, the agreement is wrong — fix the ternary in the component before continuing.

- [ ] **Step 3: Now make it fit exactly, which must fail the build**

First undo Step 2: restore `sapa`'s `nuits.ideal` to `2` in `content/places.json`.

Then free two nights inside the itinerary instead. In `content/itineraries/vietnam-du-nord-au-sud.json`, change the `hoi-an` stop from `"nuits": 3` to `"nuits": 1`. The example then places exactly fourteen nights into fourteen, and fits.

> Do not try to reach this by setting `sapa`'s `nuits.ideal` to `0`. That value is independently invalid and `scripts/check-planner.mjs` rejects it during `prebuild`, so the build would fail before the component ever runs — a red build, but from the wrong guard, which proves nothing about this one.
>
> Nothing validates the night totals inside `content/itineraries/`, so this edit reaches the component cleanly. That was checked before this plan was written.

Run: `npm run build`
Expected: **FAIL**, during static generation of `/`, with the guard's message:

```
[apercu] adding sapa to the 15-day trip now leaves 0 night(s) spare, so the example no longer shows a shortfall. Pick another AJOUT.
```

If the build *succeeds* here, the guard is not wired up. Go back to Task 2 Step 1 and check the `b.reste >= 0` branch is present and throws rather than warns.

- [ ] **Step 4: Put the data back**

Run:

```bash
git checkout content/places.json content/itineraries/vietnam-du-nord-au-sud.json
git status --short
```

Expected: `git status --short` prints nothing. The working tree is exactly as it was at Step 1.

- [ ] **Step 5: Confirm the real build is green again**

Run: `npm run build`
Expected: success, and the figures are back to the real ones:

```bash
grep -o 'Il vous manque [0-9]* jours\?\|[0-9]* / [0-9]* nuits' out/index.html
```
Expected:
```
16 / 14 nuits
Il vous manque 2 jours
```

- [ ] **Step 6: Nothing to commit**

Run: `git status --short`
Expected: empty. This task deliberately leaves no trace; its output is the knowledge that the guard works.

---

## Out of scope

Named here so nobody adds them by reflex:

- **Embedding a working planner on the home page.** Considered and rejected in spec §6 — it would put the first client component on a page whose mobile LCP is already 3.1 s in the lab.
- **A header nav entry.** Rejected in spec §10: it would place a DIY link next to "Circuits" on *every* page including the tour pages, which is the cannibalisation spec §3 of the planner design exists to prevent.
- **The planner's `hashchange` bug** (pasting a different plan URL into an already-open tab is ignored). Real, found in browser testing, tracked separately.
- **Turning on Cloudflare Web Analytics.** Needed before any of spec §9's three measures can be read, but it is a one-field change in `content/site.json` with no code, and it is not in this plan's file list.

## What this plan cannot tell you

Spec §9 sets a retreat threshold: if home-page quote submissions drop noticeably within eight weeks, this section should become a single line inside the Circuits block, or be removed.

**That threshold is currently unmeasurable.** Search Console is unverified and both `mesure.cloudflare` and `mesure.ga4` are empty, so no analytics run on this site at all. Shipping this section without turning one of them on means nobody will know whether it earned its place or cost a customer.
