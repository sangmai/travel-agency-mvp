import { tripUrl, type Site, type Trip } from "@/lib/content";

/**
 * A single `@graph` whose `@id`s cross-reference each other: that is what makes
 * a search engine understand the agency, its reviews and its trips are one and
 * the same entity.
 *
 * WARNING: everything declared here must be visible on the page. An
 * AggregateRating or a price marked up but absent from the render breaks
 * Google's rules and invites a manual action.
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

/* No `Review` or `AggregateRating` anywhere in this graph, deliberately.
 *
 * Google requires reviews marked up as structured data to be collected by the
 * site itself, not reused from a third party. Every review this project holds
 * comes from Tripadvisor — so declaring them here as the agency's own, or
 * computing an AggregateRating from them, is outside the rules. That is the
 * class of markup that earns a manual action for "misleading structured data",
 * and a manual action costs incomparably more than two review snippets gain.
 *
 * The reviews stay *visible* on the page, quoted with their author, their date
 * and a link to the Tripadvisor page. Quoting an attributed review is
 * legitimate; declaring it as first-party data is not. The distinction is the
 * markup, not the text.
 *
 * What would make them declarable: reviews gathered by the site, from
 * travellers who booked through it, stored with proof of collection.
 */

/** `TouristTrip` describes an itinerary better than a generic `Product`, and
 *  carries the route as a sequence of places — usable in a generative answer. */
export function touristTripNode(
  trip: Trip,
  opts: { site: Site; stops: string[] },
) {
  const url = opts.site.url + tripUrl(trip.slug);

  return {
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: trip.name,
    description: trip.intro,
    url,
    touristType: trip.audience,
    /* The operator, not the brand. `provider` names who actually delivers the
       trip — and the traveller contracts and pays Jasmin Travel, who runs it.
       This site sells; it does not operate. Naming the brand here would be the
       one place the markup contradicts the commercial reality. */
    provider: { "@id": operatorId(opts.site.url) },
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
      /* `seller` belongs on the Offer, not on the Trip — schema.org puts it
         there and nowhere else. The brand sells, the operator delivers; both
         are true and they are different facts, so both are declared, each on
         the type that actually defines the property. */
      seller: { "@id": orgId(opts.site.url) },
      priceSpecification: {
        "@type": "PriceSpecification",
        price: trip.priceFrom,
        priceCurrency: opts.site.currency,
        valueAddedTaxIncluded: true,
        description:
          "Prix à partir de, par personne, base deux voyageurs, hors vols internationaux.",
      },
    },
  };
}

export const operatorId = (url: string) => `${url}/#operateur`;

/**
 * Two nodes, not one.
 *
 * `#organisation` is the brand this site publishes under. It owns the domain,
 * the contact address and the editorial content — and nothing else.
 *
 * `#operateur` is Jasmin Travel: the licence, the office, the opening hours,
 * the staff, the Tripadvisor profile. Everything a traveller would check
 * before paying belongs here, because it is genuinely theirs.
 *
 * `parentOrganization` links the two. That is not decoration: the site says
 * "by Jasmin Travel" in its header, and the markup has to say the same thing.
 * Visible claim and declared claim agreeing is the whole point — a page that
 * states one relationship and declares another is exactly what structured-data
 * policy treats as misleading.
 *
 * Why this matters beyond tidiness: declaring Jasmin's licence and founding
 * year on a node named after this site asserted that this site IS Jasmin
 * Travel, at a second domain. Two domains asserting one business is a
 * duplicate entity, and the engine keeps the older one.
 */
export function organisationNode(site: Site) {
  const personId = `${site.url}/#equipe`;
  const op = site.operator;

  return [
    {
      /* The brand: an Organization, not a TravelAgency. It holds no licence
         and operates no trip, so claiming the more specific type would be a
         claim it cannot support. */
      "@type": "Organization",
      "@id": orgId(site.url),
      name: site.name,
      alternateName: `${site.name} ${site.byline}`,
      url: site.url,
      description: `Marque francophone de ${op.name}, ${site.tagline.toLowerCase()} basée à ${site.address.city}. Circuits privés sur mesure au Vietnam, au Laos et au Cambodge.`,
      email: site.email,
      inLanguage: "fr-FR",
      parentOrganization: { "@id": operatorId(site.url) },
      /* The brand's own profiles, kept apart from the operator's `sameAs`
         further down. Both lists mean "this is the same entity", so they
         cannot be pooled: the Facebook page opened under the brand name
         identifies the brand, and Jasmin Travel's page identifies Jasmin.
         Pooling them would assert the two are one — the exact confusion the
         brand/operator split was built to remove. */
      sameAs: site.brandSameAs,
      /* `image` and `logo` are recommended and are what Google draws on for a
         knowledge panel. Both point at the Open Graph image produced at build
         time by scripts/make-images.mjs — a real file, 1200 x 630, already
         served and already referenced by the page. */
      image: `${site.url}/photos/og/halong.jpg`,
      logo: {
        "@type": "ImageObject",
        url: `${site.url}/photos/og/halong.jpg`,
        width: 1200,
        height: 630,
      },
    },
    {
      /* The operator. `url` points at their own site, so an engine can resolve
         this node to an entity it has already indexed rather than inferring a
         new one. */
      "@type": ["TravelAgency", "LocalBusiness"],
      "@id": operatorId(site.url),
      name: op.name,
      legalName: op.legalName,
      url: op.url,
      description: `${site.tagline} basée à ${site.address.city}, spécialisée dans les circuits privés sur mesure au Vietnam, au Laos et au Cambodge.`,
      foundingDate: op.founded,
      /* The licence is the only verifiable guarantee a French traveller can
         hold against an agency established outside Europe — and it belongs to
         the operator, which is why it hangs here and not on the brand. */
      hasCredential: {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "Licence de tour-opérateur international",
        identifier: op.license,
        recognizedBy: { "@type": "Organization", name: op.membership },
      },
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
      /* Declared hours show up in the Google Business Profile: announcing a
         window during which nobody answers costs you the call. */
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: site.hours.days,
        opens: site.hours.opens,
        closes: site.hours.closes,
      },
      /* `sameAs` asserts "this is the same entity". These profiles are the
         operator's, so they belong on the operator node — putting them on the
         brand would claim the brand is Jasmin Travel, which is the confusion
         this split exists to remove. An unrelated "Jasmine Tours Ha Giang"
         also exists and ranks far better: these links tell an engine which is
         which. */
      sameAs: [...site.sameAs, op.url],
      employee: site.team.map((_, i) => ({ "@id": `${personId}-${i}` })),
    },
    ...site.team.map((m, i) => ({
      "@type": "Person",
      "@id": `${personId}-${i}`,
      name: m.name,
      jobTitle: m.role,
      knowsLanguage: site.languages,
      worksFor: { "@id": operatorId(site.url) },
    })),
  ];
}
