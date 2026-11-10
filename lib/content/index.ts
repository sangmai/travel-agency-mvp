/**
 * Content API used by pages and components.
 *
 * Everything is async: see source.ts for why. Components never import `source`
 * or the JSON files directly.
 */
import { source } from "./source";
import { ROUTES } from "../routes";
import type { PhotoId, PlaceId, Review, Stop, Trip } from "./types";

export type * from "./types";

export const getSite = source.site;
export const getHome = source.home;

/** Throws when the page has no content: a red build beats a guide page served
 *  with no title and no questions. */
/** Toutes les pages guides. `getGuide` en isole une ; le sitemap les veut
 *  toutes, pour lire leur date de modification réelle. */
export const getGuides = source.guides;

export async function getGuide(slug: string) {
  const g = (await source.guides()).find((x) => x.slug === slug);
  if (!g) throw new Error(`content/guides/${slug}.json not found.`);
  return g;
}
/** Blog posts, newest first — the order they are declared in. */
export const getArticles = source.articles;

export async function getArticle(slug: string) {
  const a = (await source.articles()).find((x) => x.slug === slug);
  if (!a) throw new Error(`content/blog/${slug}.json not found.`);
  return a;
}

export const BLOG_BASE = "/blog";
export const articleUrl = (slug: string) => lien(`${BLOG_BASE}/${slug}`);

export const getProcess = source.process;
export const getComparison = source.comparison;
export const getSeasons = source.seasons;
export const getBudget = source.budget;
export const getFaq = source.faq;
export const getStory = source.story;
export const getPhotoMeta = source.photos;
export const getCarnet = source.carnet;

/**
 * Regions and travel themes each carry a link. Nothing stopped anyone writing
 * the address of a page that does not exist: compilation passed, and the
 * visitor hit a 404 — internal links pointing at dead pages being precisely
 * what makes a site look unfinished to a search engine.
 *
 * The link is therefore checked at build time against published routes and
 * existing trips. An editor who mistypes an address in the CMS gets a red
 * build, which gets fixed, rather than a dead page online, which goes
 * unnoticed.
 */
async function verifierLiens<T extends { route: string }>(
  entrees: T[],
  fichier: string,
): Promise<T[]> {
  /* Identities, not links: the bare form, which is what lib/routes.ts stores
     and what the content files are written with. `tripUrl` belongs on the other
     side of that line — it produces the address a browser follows, slash
     included — so composing the slug here keeps the two from drifting into each
     other, which is exactly what broke the build when tripUrl gained its
     slash. */
  const connues = new Set<string>([
    "/",
    TRIP_BASE,
    ...ROUTES.filter((r) => r.published).map((r) => r.path),
    ...(await source.trips()).map((t) => `${TRIP_BASE}/${t.slug}`),
  ]);

  for (const e of entrees) {
    const chemin = e.route.replace(/\/$/, "") || "/";
    if (!connues.has(chemin)) {
      throw new Error(
        `content/${fichier} links to "${e.route}", which does not exist.\n` +
          `Available addresses: ${[...connues].sort().join(", ")}`,
      );
    }
  }
  return entrees;
}

export async function getRegions() {
  return verifierLiens(await source.regions(), "regions.json");
}

export async function getEnvies() {
  return verifierLiens(await source.envies(), "envies.json");
}

export async function getTrips(): Promise<Trip[]> {
  return source.trips();
}

export async function getTrip(slug: string): Promise<Trip | undefined> {
  return (await source.trips()).find((t) => t.slug === slug);
}

export async function getReviews(opts: { trip?: string; featured?: boolean } = {}) {
  const all = await source.reviews();
  return all.filter(
    (r) =>
      (opts.trip === undefined || r.trip === opts.trip) &&
      (opts.featured === undefined || Boolean(r.featured) === opts.featured),
  );
}

/** Average rating and count — one implementation for the cards, the trip pages
 *  and the JSON-LD, which each used to recompute it on their own. */
export function aggregate(reviews: Review[]) {
  if (reviews.length === 0) return { value: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { value: Number((sum / reviews.length).toFixed(1)), count: reviews.length };
}

/** Throws on an unknown place: a map silently missing a stop would be worse. */
export async function resolveStops(stops: Stop[]) {
  const places = await source.places();
  const byId = new Map(places.map((p) => [p.id, p]));
  return stops.map((s) => {
    const place = byId.get(s.place);
    if (!place) {
      throw new Error(
        `Place "${s.place}" missing from content/places.json. Add its coordinates.`,
      );
    }
    return { ...place, label: s.label ?? place.fr };
  });
}

export type ResolvedStop = Awaited<ReturnType<typeof resolveStops>>[number];

export async function getPhotoCredits() {
  const photos = await source.photos();
  return Object.entries(photos).map(([id, p]) => ({ id, ...p }));
}

/**
 * Canonical form of an internal address.
 *
 * `trailingSlash: true` means every page exists at one address and one only,
 * the one ending in a slash — that is the form the canonical tags and the
 * sitemap declare. The links did not: all thirty-eight of them pointed at the
 * bare form, which answers 301. Every visitor paid a round trip, and Google
 * discovered twenty-eight redirecting addresses it had been handed by the site
 * itself, then reported them back as "Page with redirect".
 *
 * Paths used as identifiers — the keys in lib/routes.ts, TRIP_BASE — keep their
 * bare form, because that is what they are compared against. The slash belongs
 * to the href, so it is added here, at the moment an address becomes a link.
 */
export const lien = (path: string) =>
  path === "/" || /[#?]/.test(path) ? path : path.replace(/\/?$/, "/");

/** URL publique d'une fiche voyage. */
export const TRIP_BASE = "/circuit-vietnam";
export const tripUrl = (slug: string) => lien(`${TRIP_BASE}/${slug}`);

export type { PhotoId, PlaceId };
