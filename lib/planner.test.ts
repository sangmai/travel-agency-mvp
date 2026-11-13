import { test } from "node:test";
import assert from "node:assert/strict";
import { region, verdictSaison, bilan, trouverLeg, modeDefaut } from "./planner.ts";
import type { Leg, Plan } from "./planner.ts";

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
