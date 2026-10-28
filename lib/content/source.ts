/**
 * La seule couche qui sache d'où vient le contenu. Pour passer à un CMS, on
 * ne réécrit que ce fichier.
 *
 * Tout est asynchrone bien qu'un import JSON soit synchrone : sinon la
 * bascule toucherait chaque appelant au lieu de ce seul fichier.
 *
 * ⚠️ Les imports JSON sont typés à la compilation (`resolveJsonModule`), donc
 * une forme invalide casse le build. Cette garantie disparaît dès que la
 * source devient un `fetch` : il faudra alors valider ici, et nulle part
 * ailleurs.
 */
/* Les listes éditées depuis le CMS sont enveloppées dans un objet racine :
   Decap et Sveltia ne savent pas éditer un tableau au premier niveau. */
import type {
  BudgetRow,
  Comparison,
  Envie,
  Faq,
  PhotoMeta,
  Place,
  Region,
  Review,
  SeasonRow,
  Site,
  Step,
  Story,
  Trip,
} from "./types";

import siteJson from "@/content/site.json";
import placesJson from "@/content/places.json";
import photosJson from "@/content/photos.json";
import regionsJson from "@/content/regions.json";
import enviesJson from "@/content/envies.json";
import processJson from "@/content/process.json";
import comparisonJson from "@/content/comparison.json";
import seasonsJson from "@/content/seasons.json";
import budgetJson from "@/content/budget.json";
import faqJson from "@/content/faq.json";
import reviewsJson from "@/content/reviews.json";
import storyJson from "@/content/story.json";
import carnetJson from "@/content/carnet.json";

import nordSud from "@/content/itineraries/vietnam-du-nord-au-sud.json";
import montagnes from "@/content/itineraries/montagnes-et-baies-du-nord.json";
import famille from "@/content/itineraries/vietnam-en-famille.json";
import cambodge from "@/content/itineraries/vietnam-et-cambodge.json";
import horsSentiers from "@/content/itineraries/vietnam-authentique-hors-sentiers.json";
import signature from "@/content/itineraries/vietnam-collection-signature.json";

/**
 * Ordre d'affichage par défaut. Un CMS fournirait ce classement ; en attendant
 * il est explicite ici plutôt que dépendant de l'ordre des imports.
 */
const TRIPS = [nordSud, montagnes, famille, cambodge, horsSentiers, signature] as Trip[];

export const source = {
  site: async (): Promise<Site> => siteJson,
  places: async (): Promise<Place[]> => placesJson,
  photos: async (): Promise<Record<string, PhotoMeta>> => photosJson,
  trips: async (): Promise<Trip[]> => TRIPS,
  regions: async (): Promise<Region[]> => regionsJson.regions,
  envies: async (): Promise<Envie[]> => enviesJson.envies,
  process: async (): Promise<Step[]> => processJson,
  comparison: async (): Promise<Comparison> => comparisonJson,
  seasons: async (): Promise<SeasonRow[]> => seasonsJson,
  budget: async (): Promise<BudgetRow[]> => budgetJson,
  faq: async (): Promise<Faq[]> => faqJson.faq,
  reviews: async (): Promise<Review[]> => reviewsJson.reviews,
  story: async (): Promise<Story> => storyJson,
  carnet: async (): Promise<string[]> => carnetJson,
};
