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
  founded: string;
  license: string;
  phone: string;
  phoneDisplay: string;
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
  social: { facebook: string; instagram: string };
  rating: { value: number; count: number; best: number };
  responseTime: string;
  currency: string;
  advisor: {
    name: string;
    role: string;
    since: number;
    bio: string;
    languages: string[];
  };
};
