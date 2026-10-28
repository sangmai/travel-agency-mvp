import { aggregate, tripUrl, type Review, type Site, type Trip } from "@/lib/content";

/**
 * Un seul `@graph` dont les `@id` se référencent : c'est ce qui fait
 * comprendre à un moteur que l'agence, ses avis et ses circuits sont une même
 * entité.
 *
 * ⚠️ Tout ce qui est déclaré ici doit être visible sur la page. Un
 * AggregateRating ou un prix balisé mais absent du rendu viole les règles
 * Google et expose à une action manuelle.
 */
export const orgId = (url: string) => `${url}/#organisation`;
export const siteId = (url: string) => `${url}/#site`;

export function breadcrumb(url: string, trail: { name: string; path?: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: url + (t.path ?? ""),
    })),
  };
}

function reviewNodes(reviews: Review[]) {
  return reviews.map((r) => ({
    "@type": "Review",
    author: { "@type": "Person", name: r.author },
    datePublished: r.date,
    ...(r.title ? { name: r.title } : {}),
    reviewBody: r.body,
    reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
  }));
}

function ratingNode(value: number, count: number) {
  return {
    "@type": "AggregateRating",
    ratingValue: value,
    reviewCount: count,
    bestRating: 5,
    worstRating: 1,
  };
}

/** `TouristTrip` décrit un itinéraire mieux qu'un `Product` générique, et
 *  porte le parcours comme suite de lieux — exploitable en réponse générative. */
export function touristTripNode(
  trip: Trip,
  opts: { site: Site; stops: string[]; reviews: Review[] },
) {
  const url = opts.site.url + tripUrl(trip.slug);
  const agg = aggregate(opts.reviews);

  return {
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: trip.name,
    description: trip.intro,
    url,
    touristType: trip.audience,
    provider: { "@id": orgId(opts.site.url) },
    itinerary: {
      "@type": "ItemList",
      numberOfItems: opts.stops.length,
      itemListElement: opts.stops.map((name, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: { "@type": "City", name },
      })),
    },
    offers: {
      "@type": "Offer",
      price: trip.priceFrom,
      priceCurrency: opts.site.currency,
      availability: "https://schema.org/InStock",
      url,
      priceSpecification: {
        "@type": "PriceSpecification",
        price: trip.priceFrom,
        priceCurrency: opts.site.currency,
        valueAddedTaxIncluded: true,
        description:
          "Prix à partir de, par personne, base deux voyageurs, hors vols internationaux.",
      },
    },
    ...(agg.count > 0
      ? { aggregateRating: ratingNode(agg.value, agg.count), review: reviewNodes(opts.reviews) }
      : {}),
  };
}

export function organisationNode(site: Site, reviews: Review[]) {
  const personId = `${site.url}/#${site.advisor.name.toLowerCase().replace(/\s+/g, "-")}`;

  return [
    {
      "@type": ["TravelAgency", "LocalBusiness"],
      "@id": orgId(site.url),
      name: site.name,
      legalName: site.legalName,
      url: site.url,
      description:
        "Agence de voyage locale francophone basée à Hanoï, spécialisée dans les circuits privés sur mesure au Vietnam pour les voyageurs francophones.",
      foundingDate: site.founded,
      email: site.email,
      telephone: site.phone,
      priceRange: "€€–€€€",
      currenciesAccepted: site.currency,
      knowsLanguage: ["fr", "vi", "en"],
      areaServed: ["Vietnam", "Cambodge", "Laos"].map((name) => ({ "@type": "Country", name })),
      audience: {
        "@type": "Audience",
        geographicArea: ["France", "Belgique", "Suisse", "Canada"].map((name) => ({
          "@type": "Country",
          name,
        })),
      },
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.region,
        postalCode: site.address.postalCode,
        addressCountry: site.address.country,
      },
      geo: { "@type": "GeoCoordinates", latitude: site.geo.lat, longitude: site.geo.lng },
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "08:00",
        closes: "20:00",
      },
      sameAs: [site.social.facebook, site.social.instagram],
      employee: { "@id": personId },
      aggregateRating: ratingNode(site.rating.value, site.rating.count),
      review: reviewNodes(reviews),
    },
    {
      "@type": "Person",
      "@id": personId,
      name: site.advisor.name,
      jobTitle: site.advisor.role,
      description: site.advisor.bio,
      knowsLanguage: site.advisor.languages,
      worksFor: { "@id": orgId(site.url) },
    },
  ];
}
