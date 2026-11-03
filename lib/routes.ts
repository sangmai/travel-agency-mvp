/**
 * Single table of routes: both the footer and the sitemap read from it.
 * `published` makes the guarantee checkable — only published routes reach the
 * sitemap.
 */
export type RouteGroup = "circuits" | "envies" | "preparer" | "comparer" | "agence" | "legal";

export type Route = {
  path: string;
  label: string;
  group: RouteGroup;
  published: boolean;
};

export const ROUTES: Route[] = [
  { path: "/circuit-vietnam", label: "Tous nos circuits", group: "circuits", published: true },
  { path: "/circuit-nord-vietnam", label: "Circuit Nord Vietnam", group: "circuits", published: false },
  { path: "/circuit-centre-vietnam", label: "Circuit Centre Vietnam", group: "circuits", published: false },
  { path: "/circuit-sud-vietnam", label: "Circuit Sud Vietnam", group: "circuits", published: false },
  { path: "/circuit-vietnam-nord-sud", label: "Du Nord au Sud", group: "circuits", published: false },
  { path: "/circuit-vietnam-cambodge", label: "Vietnam et Cambodge", group: "circuits", published: false },

  { path: "/voyage-vietnam-famille", label: "Voyage en famille", group: "envies", published: true },
  { path: "/voyage-luxe-vietnam", label: "Voyage de luxe", group: "envies", published: true },
  { path: "/voyage-noces-vietnam", label: "Voyage de noces", group: "envies", published: true },
  { path: "/circuit-prive-vietnam", label: "Circuit privé", group: "envies", published: false },
  { path: "/trek-vietnam", label: "Trek et randonnée", group: "envies", published: true },
  { path: "/vietnam-hors-sentiers", label: "Hors des sentiers battus", group: "envies", published: true },
  { path: "/vietnam-cuisine", label: "Cuisine et marchés", group: "envies", published: true },

  { path: "/quand-partir-au-vietnam", label: "Quand partir", group: "preparer", published: true },
  { path: "/tet-vietnam", label: "Tết, le Nouvel An", group: "preparer", published: true },
  { path: "/budget-voyage-vietnam", label: "Budget du voyage", group: "preparer", published: true },
  { path: "/visa-vietnam", label: "Visa et formalités", group: "preparer", published: true },
  { path: "/itineraire-vietnam", label: "Idées d'itinéraires", group: "preparer", published: true },
  { path: "/carte-vietnam", label: "Carte du Vietnam", group: "preparer", published: true },
  { path: "/que-faire-au-vietnam", label: "Que faire au Vietnam", group: "preparer", published: true },

  { path: "/nord-ou-sud-vietnam", label: "Nord ou Sud ?", group: "comparer", published: true },
  { path: "/vietnam-ou-thailande", label: "Vietnam ou Thaïlande ?", group: "comparer", published: true },
  { path: "/agence-locale-ou-tour-operateur", label: "Agence locale ou TO ?", group: "comparer", published: true },
  { path: "/halong-ou-lan-ha", label: "Halong ou Lan Ha ?", group: "comparer", published: true },
  { path: "/avis", label: "Nos avis clients", group: "comparer", published: false },
  { path: "/carnets-de-voyage", label: "Carnets de voyage", group: "comparer", published: false },
  { path: "/agence-de-voyage-vietnam", label: "Qui sommes-nous", group: "agence", published: true },

  { path: "/mentions-legales", label: "Mentions légales", group: "legal", published: false },
  { path: "/conditions-generales-de-vente", label: "CGV", group: "legal", published: false },
  { path: "/politique-de-confidentialite", label: "Confidentialité", group: "legal", published: false },
  { path: "/plan-du-site", label: "Plan du site", group: "legal", published: false },
  { path: "/credits-photos", label: "Crédits photo", group: "legal", published: true },
];

/**
 * Returns only what exists. The footer used to describe the intended tree
 * rather than the real site, and linked to twenty-eight missing pages: to a
 * search engine, links leading to 404s do not sketch an ambition, they signal
 * an unfinished site. Flipping a route to `published: true` makes it appear
 * here and in the sitemap in one move.
 */
export const routesIn = (group: RouteGroup) =>
  ROUTES.filter((r) => r.group === group && r.published);

export const publishedRoutes = () => ROUTES.filter((r) => r.published);
