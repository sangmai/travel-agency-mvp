/**
 * Le contrat de contenu : un CMS branché plus tard doit produire ces formes.
 *
 * Le contenu porte des valeurs, les composants décident de la présentation.
 * Une latitude est un nombre, pas « 21°N » ; un niveau de saison est une
 * valeur, pas un nom de classe CSS.
 */

export type PhotoId = string;
export type PlaceId = string;

export type Place = {
  id: PlaceId;
  /** Nom éditorial français. */
  fr: string;
  /** Toponyme porté par la carte — ce que le voyageur lira sur place. */
  map: string;
  lat: number;
  lon: number;
};

export type PhotoMeta = {
  file: string;
  alt: string;
  place: string;
  lat: number | null;
  credit: { title: string; author: string; licence: string; page: string };
};

/**
 * Une étape référence un lieu par identifiant, et peut porter son propre
 * libellé. « Croisière Halong privée » est ainsi un libellé posé sur la baie
 * de Lan Ha, et non un lieu inventé dans le répertoire.
 */
export type Stop = { place: PlaceId; label?: string };

export type FactKey = "trajet" | "marche" | "velo" | "bateau" | "vol" | "nuit" | "repas";
export type Fact = { key: FactKey; value: string };

export type Day = {
  n: string;
  title: string;
  body: string;
  facts: Fact[];
  photo?: PhotoId;
};

export type Review = {
  author: string;
  city: string;
  date: string;
  rating: number;
  body: string;
  title?: string;
  /** Slug du voyage concerné. */
  trip?: string;
  /** D'où vient l'avis, et où le vérifier. Un témoignage que le visiteur ne
   *  peut pas retrouver ailleurs ne vaut rien — et en publier d'invérifiables
   *  est une pratique commerciale trompeuse. */
  source?: string;
  sourceUrl?: string;
  /** Repris sur la page d'accueil. */
  featured?: boolean;
};

export type Trip = {
  slug: string;
  code: string;
  name: string;
  tagline: string;
  days: number;
  priceFrom: number;
  niveau: string;
  confort: string;
  type: string;
  region: string;
  saison: string;
  groupe: string;
  photo: PhotoId;
  intro: string;
  pitch: string;
  audience: string;
  tag?: string;
  plus: string[];
  stops: Stop[];
  program: Day[];
  nights: string[];
  included: string[];
  excluded: string[];
};

export type Region = {
  id: string;
  name: string;
  subtitle: string;
  feel: string;
  summary: string;
  highlights: string[];
  duration: string;
  route: string;
  photo: PhotoId;
};

export type Envie = { route: string; title: string; line: string; photo: PhotoId };
export type Step = { step: string; title: string; body: string };
export type Faq = { q: string; a: string };
export type BudgetRow = { gamme: string; hotel: string; perDay: string; twoWeeks: string; inclus: string };
export type SeasonRow = { month: string; nord: string; centre: string; sud: string; note: string };
export type Comparison = { columns: string[]; rows: { criterion: string; local: string; to: string }[] };
export type Story = {
  kicker: string;
  title: string;
  author: string;
  when: string;
  trip: string;
  pull: string;
  body: string[];
  photo: PhotoId;
};

export type Site = {
  name: string;
  legalName: string;
  url: string;
  locale: string;
  lang: string;
  tagline: string;
  founded: string;
  /** Licence de tour-opérateur international, délivrée par l'administration
   *  vietnamienne du tourisme. Pour un voyageur français qui achète à une
   *  agence étrangère, c'est la seule garantie vérifiable : elle doit être
   *  exacte, et elle est affichée en toutes lettres. */
  license: string;
  membership: string;
  phone: string;
  phoneDisplay: string;
  phoneAlt: string;
  whatsapp: string;
  email: string;
  address: {
    street: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    countryName: string;
  };
  geo: { lat: number; lng: number };
  hours: { opens: string; closes: string; days: string[] };
  social: { facebook: string; instagram: string };
  /** Profils publics vérifiés — réseaux, plateformes d'avis, annuaires.
   *  Sert à désambiguïser l'entité auprès des moteurs. */
  sameAs: string[];
  languages: string[];
  /** Note agrégée publiée par un tiers, affichée avec son lien. Elle n'est
   *  pas déclarée en aggregateRating : Google ne reconnaît pas la reprise
   *  d'une note tierce comme la sienne, et une note d'établissement
   *  auto-déclarée n'ouvre plus droit aux résultats enrichis. */
  reviewSource: { name: string; url: string; rating: number; count: number; note: string };
  responseTime: string;
  currency: string;
  /**
   * Outils de mesure. Chaque champ vide désactive l'outil correspondant :
   * rien n'est chargé, aucune balise n'est écrite.
   *
   * `searchConsole` ne coûte rien à la page — une balise meta, aucun script.
   * `ga4` en coûte beaucoup : environ 30 Ko de script, des cookies, et donc
   * en France une demande de consentement préalable. Ne le renseigner qu'en
   * ayant posé la bannière correspondante.
   * `cloudflare` est l'alternative sans cookie ni bannière.
   */
  mesure: { searchConsole: string; ga4: string; cloudflare: string };
  /* Pas de `rating` : une note agrégée ne se déclare pas, elle se calcule
     depuis des avis réels — `aggregate()` s'en charge. Le champ portait une
     moyenne inventée sur un nombre d'avis inventé, publiée en données
     structurées. C'est le genre de déclaration qui vaut une action manuelle
     de Google, et qui ment au visiteur avant de lui vendre quoi que ce soit. */

  /** Les personnes réellement nommées par l'agence. Sans biographie : nous
   *  n'en avons pas, et en écrire une reviendrait à l'inventer. */
  team: { name: string; role: string }[];
};

/**
 * Page guide : tout ce qu'un éditeur doit pouvoir corriger sans toucher au
 * code. Les règles de visa changent, les prix bougent, les saisons se
 * précisent — ce sont les réponses qui vieillissent, pas la mise en page.
 *
 * Les tableaux propres à chaque page (postes de budget, critères Nord/Sud,
 * expériences) restent dans le composant : leur forme est indissociable de
 * la colonne qui les affiche.
 */
export type Guide = {
  slug: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  photo: PhotoId;
  photoAlt: string;
  faq: Faq[];
};

/** En-tête de section : « *mot* » donne l'accent ambre, « {cle} » une valeur
 *  du site (voir lib/text.tsx). */
export type Head = { kicker: string; title: string; lede?: string };

export type Home = {
  hero: Head & {
    caption: string;
    captionNote: string;
    sub: string;
    ctaPrimary: string;
    ctaSecondary: string;
    proof: { value: string; label: string }[];
  };
  regions: Head;
  envies: Head;
  circuits: Head;
  process: Head;
  comparatif: Head;
  saison: Head;
  budget: Head;
  avis: Head;
  faq: Head;
  devis: Head & { promises: { title: string; detail: string }[]; submit: string };
  closing: { title: string; body: string };
};
