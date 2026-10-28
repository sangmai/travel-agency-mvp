/**
 * Table unique des routes : pied de page et sitemap y lisent tous deux.
 * `published` rend la mise en garde vérifiable — seules les routes publiées
 * entrent au sitemap.
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

  { path: "/voyage-vietnam-famille", label: "Voyage en famille", group: "envies", published: false },
  { path: "/voyage-luxe-vietnam", label: "Voyage de luxe", group: "envies", published: false },
  { path: "/voyage-noces-vietnam", label: "Voyage de noces", group: "envies", published: false },
  { path: "/circuit-prive-vietnam", label: "Circuit privé", group: "envies", published: false },
  { path: "/trek-vietnam", label: "Trek et randonnée", group: "envies", published: false },
  { path: "/vietnam-hors-sentiers", label: "Hors des sentiers battus", group: "envies", published: false },
  { path: "/vietnam-cuisine", label: "Cuisine et marchés", group: "envies", published: false },

  { path: "/quand-partir-au-vietnam", label: "Quand partir", group: "preparer", published: false },
  { path: "/budget-voyage-vietnam", label: "Budget du voyage", group: "preparer", published: false },
  { path: "/visa-vietnam", label: "Visa et formalités", group: "preparer", published: false },
  { path: "/itineraire-vietnam", label: "Idées d'itinéraires", group: "preparer", published: false },
  { path: "/carte-vietnam", label: "Carte du Vietnam", group: "preparer", published: false },
  { path: "/que-faire-au-vietnam", label: "Que faire au Vietnam", group: "preparer", published: false },

  { path: "/nord-ou-sud-vietnam", label: "Nord ou Sud ?", group: "comparer", published: false },
  { path: "/vietnam-ou-thailande", label: "Vietnam ou Thaïlande ?", group: "comparer", published: false },
  { path: "/agence-locale-ou-tour-operateur", label: "Agence locale ou TO ?", group: "comparer", published: false },
  { path: "/halong-ou-lan-ha", label: "Halong ou Lan Ha ?", group: "comparer", published: false },
  { path: "/avis", label: "Nos avis clients", group: "comparer", published: false },
  { path: "/carnets-de-voyage", label: "Carnets de voyage", group: "comparer", published: false },
  { path: "/agence-de-voyage-vietnam", label: "Qui sommes-nous", group: "agence", published: false },

  { path: "/mentions-legales", label: "Mentions légales", group: "legal", published: false },
  { path: "/conditions-generales-de-vente", label: "CGV", group: "legal", published: false },
  { path: "/politique-de-confidentialite", label: "Confidentialité", group: "legal", published: false },
  { path: "/plan-du-site", label: "Plan du site", group: "legal", published: false },
  { path: "/credits-photos", label: "Crédits photo", group: "legal", published: true },
];

export const routesIn = (group: RouteGroup) => ROUTES.filter((r) => r.group === group);
export const publishedRoutes = () => ROUTES.filter((r) => r.published);
