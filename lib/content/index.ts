/**
 * API de contenu utilisée par les pages et les composants.
 *
 * Tout est asynchrone : voir source.ts pour la raison. Les composants
 * n'importent jamais `source` ni les JSON directement.
 */
import { source } from "./source";
import type { PhotoId, PlaceId, Review, Stop, Trip } from "./types";

export type * from "./types";

export const getSite = source.site;
export const getRegions = source.regions;
export const getEnvies = source.envies;
export const getProcess = source.process;
export const getComparison = source.comparison;
export const getSeasons = source.seasons;
export const getBudget = source.budget;
export const getFaq = source.faq;
export const getStory = source.story;
export const getPhotoMeta = source.photos;
export const getCarnet = source.carnet;

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
