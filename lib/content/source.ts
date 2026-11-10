/**
 * The only layer that knows where content comes from. Moving to a CMS means
 * rewriting this file and nothing else.
 *
 * Everything is async even though a JSON import is synchronous: otherwise the
 * switch would touch every caller instead of this one file.
 *
 * WARNING: JSON imports are typed at compile time (`resolveJsonModule`), so an
 * invalid shape breaks the build. That guarantee disappears the moment the
 * source becomes a `fetch`: validation will then belong here, and nowhere else.
 */
/* Lists edited from the CMS are wrapped in a root object: Decap and Sveltia
   cannot edit a top-level array. */
import type {
  Guide,
  Home,
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
  Article,
} from "./types";

import siteJson from "@/content/site.json";
import homeJson from "@/content/home.json";
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

import gQuandPartirAuVietnam from "@/content/guides/quand-partir-au-vietnam.json";
import gBudgetVoyageVietnam from "@/content/guides/budget-voyage-vietnam.json";
import gVisaVietnam from "@/content/guides/visa-vietnam.json";
import gNordOuSudVietnam from "@/content/guides/nord-ou-sud-vietnam.json";
import gItineraireVietnam from "@/content/guides/itineraire-vietnam.json";
import gQueFaireAuVietnam from "@/content/guides/que-faire-au-vietnam.json";
import gAgenceDeVoyageVietnam from "@/content/guides/agence-de-voyage-vietnam.json";
import gHalongOuLanHa from "@/content/guides/halong-ou-lan-ha.json";
import gAgenceLocaleOuTourOperateur from "@/content/guides/agence-locale-ou-tour-operateur.json";
import gVietnamOuThailande from "@/content/guides/vietnam-ou-thailande.json";
import gVietnamCuisine from "@/content/guides/vietnam-cuisine.json";
import gCarteVietnam from "@/content/guides/carte-vietnam.json";
import gTrekVietnam from "@/content/guides/trek-vietnam.json";
import gVoyageVietnamFamille from "@/content/guides/voyage-vietnam-famille.json";
import gVietnamHorsSentiers from "@/content/guides/vietnam-hors-sentiers.json";
import gVoyageLuxeVietnam from "@/content/guides/voyage-luxe-vietnam.json";
import gTetVietnam from "@/content/guides/tet-vietnam.json";
import gCircuitVietnam from "@/content/guides/circuit-vietnam.json";
import gVoyageNocesVietnam from "@/content/guides/voyage-noces-vietnam.json";
import gCircuitVietnam15Jours from "@/content/guides/circuit-vietnam-15-jours.json";
import gRizieresVietnam from "@/content/guides/rizieres-vietnam.json";
import aVietnamCambodge from "@/content/blog/vietnam-cambodge-combiner.json";
import nordSud from "@/content/itineraries/vietnam-du-nord-au-sud.json";
import montagnes from "@/content/itineraries/montagnes-et-baies-du-nord.json";
import famille from "@/content/itineraries/vietnam-en-famille.json";
import cambodge from "@/content/itineraries/vietnam-et-cambodge.json";
import horsSentiers from "@/content/itineraries/vietnam-authentique-hors-sentiers.json";
import signature from "@/content/itineraries/vietnam-collection-signature.json";

/**
 * Default display order. A CMS would provide this ordering; until then it is
 * explicit here rather than dependent on import order.
 */
const TRIPS = [nordSud, montagnes, famille, cambodge, horsSentiers, signature] as Trip[];

/* Guide pages: one entry per page, the same shape for all of them. */
const GUIDES: Guide[] = [gQuandPartirAuVietnam, gBudgetVoyageVietnam, gVisaVietnam, gNordOuSudVietnam, gItineraireVietnam, gQueFaireAuVietnam, gAgenceDeVoyageVietnam, gHalongOuLanHa, gAgenceLocaleOuTourOperateur, gVietnamOuThailande, gVietnamCuisine, gCarteVietnam, gTrekVietnam, gVoyageVietnamFamille, gVietnamHorsSentiers, gVoyageLuxeVietnam, gTetVietnam, gCircuitVietnam, gVoyageNocesVietnam, gCircuitVietnam15Jours, gRizieresVietnam];

/* Articles, newest first: the index shows them in that order and the sitemap
   reads their real modification date. */
const ARTICLES: Article[] = [aVietnamCambodge];

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
  guides: async (): Promise<Guide[]> => GUIDES,
  articles: async (): Promise<Article[]> => ARTICLES,
  home: async (): Promise<Home> => homeJson,
  reviews: async (): Promise<Review[]> => reviewsJson.reviews,
  story: async (): Promise<Story> => storyJson,
  carnet: async (): Promise<string[]> => carnetJson,
};
