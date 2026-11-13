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
