/**
 * The content contract: a CMS plugged in later must produce these shapes.
 *
 * Content carries values, components decide presentation. A latitude is a
 * number, not "21°N"; a season level is a value, not a CSS class name.
 */

export type PhotoId = string;
export type PlaceId = string;

export type Place = {
  id: PlaceId;
  /** French editorial name. */
  fr: string;
  /** Place name as shown on the map — what the traveller will read on site. */
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
 * A stop references a place by id, and may carry its own label. "Croisière
 * Halong privée" is therefore a label placed on Lan Ha bay, not an invented
 * entry in the place directory.
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
  /** Slug of the trip concerned. */
  trip?: string;
  /** Where the review comes from, and where to verify it. A testimonial the
   *  visitor cannot find elsewhere is worth nothing — and publishing
   *  unverifiable ones is a deceptive commercial practice. */
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

/**
 * Two entities, deliberately separated.
 *
 * The brand is this website: a French-language sales channel with its own name,
 * its own domain and its own contact address. The operator is Jasmin Travel:
 * the licensed agency that runs the trips and contracts with the traveller.
 *
 * They used to be one object, which meant the site declared Jasmin's licence,
 * founding year and legal name as its own — the same business asserted at two
 * domains. For a traveller googling the agency before wiring three thousand
 * euros, that reads as "which one is real?". For a search engine, two domains
 * claiming identical NAP is a duplicate entity, and the older one wins.
 *
 * Keeping them apart is also what makes the commission traceable: a lead that
 * arrives through this brand is attributable to it, where a lead that arrives
 * through a second site called "Jasmin Travel" is attributable to nobody.
 */
export type Site = {
  /** The brand carried by this site. Shown with `byline` underneath. */
  name: string;
  /** "by Jasmin Travel". The relationship is stated rather than hidden —
   *  that single line is what removes the "which one is real?" moment. */
  byline: string;
  /** The agency that holds the licence, runs the trips, and with whom the
   *  traveller contracts and pays. Everything in here belongs to them, and
   *  the copy must say so rather than claim it. */
  operator: {
    name: string;
    legalName: string;
    /** Their own site. Declared in JSON-LD so an engine can resolve the
     *  operator to a real, already-indexed entity instead of guessing. */
    url: string;
    founded: string;
    /** International tour operator licence, issued by the Vietnamese tourism
     *  administration. For a French traveller buying from a foreign agency it
     *  is the only verifiable guarantee: it must be exact, displayed in full,
     *  and attributed to its holder — not to this site. */
    license: string;
    membership: string;
  };
  url: string;
  locale: string;
  lang: string;
  tagline: string;
  /** The operator's office line. Answered by their staff, not ours. */
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
  /** Verified public profiles of the OPERATOR — social networks, review
   *  platforms, directories. `sameAs` asserts "this is the same entity", so
   *  these hang off the operator node in JSON-LD. Putting them on the brand
   *  would claim the brand *is* Jasmin Travel, which is the confusion this
   *  whole split exists to remove. */
  sameAs: string[];
  languages: string[];
  /** Aggregate rating published by a third party, shown with its link. It is
   *  NOT declared as aggregateRating: Google does not recognise a third-party
   *  score reused as your own, and a self-declared business rating no longer
   *  qualifies for rich results. */
  reviewSource: { name: string; url: string; rating: number; count: number; note: string };
  responseTime: string;
  currency: string;
  /**
   * Measurement tools. An empty field disables the matching tool: nothing is
   * loaded, no tag is written.
   *
   * `searchConsole` costs the page nothing — one meta tag, no script.
   * `ga4` costs a lot: roughly 30 KB of script, cookies, and therefore in
   * France a prior consent request. Only fill it in once the matching banner
   * is in place.
   * `cloudflare` is the alternative with neither cookie nor banner.
   */
  mesure: { searchConsole: string; ga4: string; cloudflare: string };
  /* No `rating`: an aggregate score is not declared, it is computed from real
     reviews — `aggregate()` handles that. The field used to carry an invented
     average over an invented review count, published as structured data. That
     is the kind of declaration that earns a manual action from Google, and
     that lies to the visitor before selling them anything. */

  /** The operator's staff — the people a traveller actually deals with. No
   *  biography: we do not have one, and writing one would mean inventing it.
   *  Declared in JSON-LD as `employee` of the operator, never of the brand. */
  team: { name: string; role: string }[];
};

/**
 * Guide page: everything an editor must be able to correct without touching
 * code. Visa rules change, prices move, seasons get sharper — it is the
 * answers that age, not the layout.
 *
 * Tables specific to each page (budget lines, North/South criteria,
 * experiences) stay in the component: their shape is inseparable from the
 * column that displays them.
 */
export type Guide = {
  slug: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  photo: PhotoId;
  photoAlt: string;
  /** Dates taken from the repository history, in YYYY-MM-DD form. An invented
   *  date is a lying freshness signal — exactly what the criterion is trying
   *  to measure. */
  datePublished: string;
  dateModified: string;
  /** Name of a team member, or empty. Empty means the agency publishes under
   *  its own name: that is what the JSON-LD then declares. Naming someone is a
   *  claim about who wrote the page and who answers for it. */
  author: string;
  faq: Faq[];
};

/** Section heading: "*word*" gives the amber accent, "{key}" a value from the
 *  site content (see lib/text.tsx). */
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
