import { test } from "node:test";
import assert from "node:assert/strict";
import {
  region, verdictSaison, bilan, trouverLeg, modeDefaut, rythme, retraits,
  encoder, decoder,
} from "./planner.ts";
import type { Leg, Plan, Lieu } from "./planner.ts";

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
  // Only Hué → Hoi An is endured awake; the sleeper's hours are slept through.
  // 12.6 − 8 of train, plus 2.75 of road, rounded to the tenth the page prints.
  assert.equal(rythme(plan, LEGS).heuresSubies, 7.4);
});

test("an itinerary that does not fit reports a negative remainder", () => {
  const plan: Plan = { jours: 7, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 },
    { place: "hue", nuits: 2 },
    { place: "hoi-an", nuits: 3 },
  ] };
  assert.equal(bilan(plan, LEGS).reste, -3);
});


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
  // And it must not have been quietly counted as travelled either: only the
  // known leg's hours may appear.
  assert.equal(rythme(plan, legs).heuresSubies, 1.6);
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
  assert.equal(decoder("99999999/Mars/2/hanoi-3"), null);
  assert.equal(decoder("15/Mars/99/hanoi-3"), null);
  assert.equal(decoder("15/Mars/2/hanoi-999"), null);
});

test("hours slept in a berth are not held against the traveller", () => {
  const plan: Plan = { jours: 6, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 2 }, { place: "hue", nuits: 3 },
  ] };
  const nuit: Leg[] = [{ from: "hanoi", to: "hue", modes: [
    { mode: "train-nuit", hours: 12.6, days: 0, journee: "perdue", nuit: true, note: "", source: "x" },
  ] }];
  const jour: Leg[] = [{ from: "hanoi", to: "hue", modes: [
    { mode: "route", hours: 12.6, days: 1, journee: "perdue", note: "", source: "x" },
  ] }];
  // Both are twelve and a half hours in transit, and both say so.
  assert.equal(rythme(plan, nuit).heuresTransport, 12.6);
  assert.equal(rythme(plan, jour).heuresTransport, 12.6);
  // Only the one spent awake counts against them.
  assert.equal(rythme(plan, nuit).heuresSubies, 4.6);
  assert.equal(rythme(plan, jour).heuresSubies, 12.6);
});

test("when no single region covers the shortfall, the biggest is offered first", () => {
  const plan: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "ninh-binh", nuits: 2 },
    { place: "hue", nuits: 2 }, { place: "hoi-an", nuits: 5 },
    { place: "hcmc", nuits: 3 },
  ] };
  // nord 5, centre 7, sud 3 — none of them frees ten nights on its own.
  const r = retraits(plan, LIEUX, 10);
  assert.deepEqual(r.map((x) => x.nuits), [7, 5, 3]);
});

test("when every region covers it, the cheapest sacrifice is offered first", () => {
  const plan: Plan = { jours: 15, mois: "Mars", voyageurs: 2, etapes: [
    { place: "hanoi", nuits: 3 }, { place: "ninh-binh", nuits: 2 },
    { place: "hue", nuits: 2 }, { place: "hoi-an", nuits: 5 },
    { place: "hcmc", nuits: 3 },
  ] };
  // One night missing: all three would do, so the smallest leads.
  const r = retraits(plan, LIEUX, 1);
  assert.deepEqual(r.map((x) => x.nuits), [3, 5, 7]);
});
