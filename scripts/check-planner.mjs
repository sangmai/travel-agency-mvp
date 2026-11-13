#!/usr/bin/env node
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
