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
       the next morning, because it arrives at eleven. A composite leg can
       legitimately cost a WHOLE day too — e.g. Sapa–Hué spends a full day on
       the road to Hanoï before boarding the night train in the evening. What
       is impossible is a mode that claims to cost MORE than a whole day while
       also putting you to sleep in a bed for part of it. */
    if (m.nuit && m.days > 1)
      fautes.push(`leg ${l.from}->${l.to} ${m.mode}: sleeps aboard yet costs more than a whole day`);
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
