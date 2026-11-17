import { test } from "node:test";
import assert from "node:assert/strict";
import { hebergement, experiences, aReserver, AFFILIE } from "./booking.ts";

test("an accommodation link carries the dates and the party", () => {
  const l = hebergement("Hoi An", "2027-03-12", "2027-03-15", 2);
  assert.ok(l.url.startsWith("https://www.booking.com/searchresults.html?"));
  assert.ok(l.url.includes("ss=Hoi+An"));
  assert.ok(l.url.includes("checkin=2027-03-12"));
  assert.ok(l.url.includes("checkout=2027-03-15"));
  assert.ok(l.url.includes("group_adults=2"));
});

test("Booking has no account yet, so its link earns nothing and says nothing", () => {
  const l = hebergement("Hué", "2027-03-01", "2027-03-03", 2);
  assert.equal(l.partenaire, null);
  assert.ok(!l.url.includes("aid="));
});

test("experiences are linked, because they pay more than beds and are what people want", () => {
  const e = experiences("hoi-an", "Hoi An");
  assert.ok(e.length > 0);
  for (const x of e) assert.ok(x.url.startsWith("https://"));
});

test("only genuinely scarce places are flagged, and the reason is given", () => {
  assert.match(aReserver("lan-ha") ?? "", /cabines/);
  assert.match(aReserver("phong-nha") ?? "", /permis/);
  assert.equal(aReserver("hanoi"), null);
  assert.equal(aReserver("hoi-an"), null);
});

test("a place name with an accent or an apostrophe survives the URL", () => {
  /* Both are real values in content/places.json. A link that mangles them
     sends a traveller to a broken search page, and nothing on our side fails. */
  for (const ville of ["Hô Chi Minh-Ville", "Baie d'Halong", "Hué"]) {
    const u = new URL(hebergement(ville, "2027-03-01", "2027-03-04", 2).url);
    assert.equal(u.searchParams.get("ss"), ville);
    const e = new URL(experiences("x", ville)[0].url);
    assert.equal(e.searchParams.get("q"), ville);
  }
});

test("the GetYourGuide link carries the partner id and the campaign tag", () => {
  const u = new URL(experiences("hoi-an", "Hoi An")[0].url);
  assert.equal(u.searchParams.get("partner_id"), "GX9EJC1");
  /* Tagged so a booking traced to the planner can be told apart, in
     GetYourGuide's own dashboard, from one that came off a guide page. */
  assert.equal(u.searchParams.get("cmp"), "planificateur");
  /* And now that a commission is genuinely earned, the page may say so. */
  assert.equal(experiences("hoi-an", "Hoi An")[0].partenaire, "GetYourGuide");
});

test("AFFILIE turns true the moment one account exists, and not before", () => {
  assert.equal(AFFILIE, true);
});

test("a hand-picked activity wins over the search page, and keeps the tracking", () => {
  const choisies = {
    "hoi-an": [{ titre: "My Son et la montagne de Marbre",
                 url: "https://www.getyourguide.com/hoi-an-l831/my-son-t551707/" }],
  };
  const [x] = experiences("hoi-an", "Hoi An", choisies);
  assert.equal(x.libelle, "My Son et la montagne de Marbre");
  const u = new URL(x.url);
  assert.equal(u.pathname, "/hoi-an-l831/my-son-t551707/");
  assert.equal(u.searchParams.get("partner_id"), "GX9EJC1");
  assert.equal(u.searchParams.get("cmp"), "planificateur");
});

test("a place nobody has chosen for still earns, through the search page", () => {
  /* The fallback is what makes an incomplete list safe: a gap would cost the
     commission outright, where a search link merely converts less well. */
  const [x] = experiences("hanoi", "Hanoï", { "hoi-an": [] });
  assert.match(x.url, /getyourguide\.com\/s\/\?/);
  assert.equal(new URL(x.url).searchParams.get("q"), "Hanoï");
  assert.equal(new URL(x.url).searchParams.get("partner_id"), "GX9EJC1");
});

test("a Klook activity goes through the redirect, destination intact", () => {
  /* Klook does not read tracking parameters on its own pages: the link has to
     pass through affiliate.klook.com carrying the destination in k_site. The
     shape below is byte-identical to one Klook's own tool generated — the form
     inferred from third-party write-ups tracked nothing at all. */
  const dest = "https://www.klook.com/activity/13283-ba-na-hills-ticket-da-nang/";
  const [x] = experiences("da-nang", "Da Nang", {
    "da-nang": [{ titre: "Les collines de Ba Na et le pont d'Or", url: dest }],
  });
  const u = new URL(x.url);
  assert.equal(u.host, "affiliate.klook.com");
  assert.equal(u.searchParams.get("aid"), "143639");
  assert.equal(u.searchParams.get("aff_adid"), "1572853");
  assert.equal(u.searchParams.get("k_site"), dest);
  assert.equal(x.partenaire, "Klook");
});

test("the search fallback goes to GetYourGuide, which the French know", () => {
  const [x] = experiences("sapa", "Sapa");
  assert.match(x.url, /getyourguide\.com\/s\//);
  assert.equal(new URL(x.url).searchParams.get("q"), "Sapa");
});

import { tourIdGyg } from "./booking.ts";

test("the activity number is read off the address, so a chosen tour can be shown with its photo", () => {
  assert.equal(
    tourIdGyg("https://www.getyourguide.com/hoi-an-l831/my-son-sanctuary-and-marble-mountain-t551707/"),
    "551707",
  );
  assert.equal(tourIdGyg("https://www.getyourguide.com/x/y-t42"), "42");
  assert.equal(tourIdGyg("https://www.getyourguide.com/x/y-t42/?ref=a"), "42");
});

test("anything that is not a GetYourGuide activity has no number, and says so", () => {
  assert.equal(tourIdGyg("https://www.klook.com/activity/13283-ba-na-hills-ticket-da-nang/"), null);
  assert.equal(tourIdGyg("https://www.getyourguide.com/s/?q=Hanoi"), null);
  assert.equal(tourIdGyg("https://www.getyourguide.com/hoi-an-l831/"), null);
  assert.equal(tourIdGyg(""), null);
});
