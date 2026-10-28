/**
 * API de contenu utilisée par les pages et les composants.
 *
 * Tout est asynchrone : voir source.ts pour la raison. Les composants
 * n'importent jamais `source` ni les JSON directement.
 */
import { source } from "./source";
import { ROUTES } from "../routes";
import type { PhotoId, PlaceId, Review, Stop, Trip } from "./types";

export type * from "./types";

export const getSite = source.site;
export const getHome = source.home;

/** Lève si la page n'a pas de contenu : mieux vaut un build rouge qu'une
 *  page guide servie sans titre ni questions. */
export async function getGuide(slug: string) {
  const g = (await source.guides()).find((x) => x.slug === slug);
  if (!g) throw new Error(`content/guides/${slug}.json est introuvable.`);
  return g;
}
export const getProcess = source.process;
export const getComparison = source.comparison;
export const getSeasons = source.seasons;
export const getBudget = source.budget;
export const getFaq = source.faq;
export const getStory = source.story;
export const getPhotoMeta = source.photos;
export const getCarnet = source.carnet;

/**
 * Les régions et les envies portent chacune un lien. Rien n'empêchait d'y
 * écrire l'adresse d'une page qui n'existe pas : la compilation passait, et
 * le visiteur tombait sur un 404 — un maillage interne vers des pages mortes
 * étant précisément ce qui fait passer un site pour inachevé aux yeux d'un
 * moteur.
 *
 * Le lien est donc vérifié au build contre les routes publiées et les fiches
 * voyage existantes. Un éditeur qui se trompe d'adresse dans le CMS obtient
 * un build rouge, ce qui se corrige, plutôt qu'une page morte en ligne, ce
 * qui ne se remarque pas.
 */
async function verifierLiens<T extends { route: string }>(
  entrees: T[],
  fichier: string,
): Promise<T[]> {
  const connues = new Set<string>([
    "/",
    TRIP_BASE,
    ...ROUTES.filter((r) => r.published).map((r) => r.path),
    ...(await source.trips()).map((t) => tripUrl(t.slug)),
  ]);

  for (const e of entrees) {
    const chemin = e.route.replace(/\/$/, "") || "/";
    if (!connues.has(chemin)) {
      throw new Error(
        `content/${fichier} renvoie vers « ${e.route} », qui n'existe pas.\n` +
          `Adresses disponibles : ${[...connues].sort().join(", ")}`,
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

/** Note moyenne et effectif — une seule implémentation pour les cartes,
 *  les fiches et le JSON-LD, qui la recalculaient chacun de leur côté. */
export function aggregate(reviews: Review[]) {
  if (reviews.length === 0) return { value: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { value: Number((sum / reviews.length).toFixed(1)), count: reviews.length };
}

/** Lève si le lieu est inconnu : une carte amputée en silence serait pire. */
export async function resolveStops(stops: Stop[]) {
  const places = await source.places();
  const byId = new Map(places.map((p) => [p.id, p]));
  return stops.map((s) => {
    const place = byId.get(s.place);
    if (!place) {
      throw new Error(
        `Lieu « ${s.place} » absent de content/places.json. Ajoutez ses coordonnées.`,
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

/** URL publique d'une fiche voyage. */
export const TRIP_BASE = "/circuit-vietnam";
export const tripUrl = (slug: string) => `${TRIP_BASE}/${slug}`;

export type { PhotoId, PlaceId };
