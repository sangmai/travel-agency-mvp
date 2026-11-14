import { test } from "node:test";
import assert from "node:assert/strict";
import { hebergement, experiences, aReserver } from "./booking.ts";

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

test("only genuinely scarce places are flagged, and the reason is given", () => {
  assert.match(aReserver("lan-ha") ?? "", /cabines/);
  assert.match(aReserver("phong-nha") ?? "", /permis/);
  assert.equal(aReserver("hanoi"), null);
  assert.equal(aReserver("hoi-an"), null);
});
