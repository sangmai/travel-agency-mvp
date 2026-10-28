import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripCard } from "@/components/TripCard";
import { Fil, JsonLd, SectionHead } from "@/components/ui";
import { breadcrumb, siteId } from "@/components/JsonLd";
import { aggregate, getReviews, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";
import { euro, score } from "@/lib/format";

/**
 * Modèle Terres d'Aventure : chaque carte porte assez d'information pour être
 * écartée sans être ouverte.
 *
 * ⚠️ Terdav construit de vraies facettes indexables ; ici rien ne filtre
 * encore. Ces pages restent à produire — c'est elles qui apportent la longue
 * traîne.
 */
export const metadata: Metadata = {
  title: "Circuits au Vietnam — 6 itinéraires",
  description:
    "Six circuits privés au Vietnam, de 10 à 18 jours, dès 870 €/pers. Programme jour par jour, hébergement et budget détaillé pour chacun.",
  alternates: { canonical: TRIP_BASE },
  openGraph: {
    type: "website",
    images: [{ url: "/photos/og/trek.jpg", width: 1200, height: 630, alt: "Randonnée dans les rizières du nord du Vietnam" }],
  },
};

export default async function CircuitsIndex() {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Moyenne de tous les avis publiés, et non une valeur déclarée : celle qui
     figurait ici venait de content/site.json et avait été inventée. */
  const global = aggregate(await getReviews());

  const ratings = await Promise.all(
    trips.map(async (t) => aggregate(await getReviews({ trip: t.slug }))),
  );

  // Un seul passage pour les trois bornes affichées dans le chapô.
  const span = trips.reduce(
    (a, t) => ({
      min: Math.min(a.min, t.priceFrom),
      short: Math.min(a.short, t.days),
      long: Math.max(a.long, t.days),
    }),
    { min: Infinity, short: Infinity, long: 0 },
  );

  const order = trips
    .map((t, i) => ({ t, r: ratings[i] }))
    .sort((a, b) => a.t.priceFrom - b.t.priceFrom);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Circuits au Vietnam",
    url: site.url + TRIP_BASE,
    isPartOf: { "@id": siteId(site.url) },
    breadcrumb: breadcrumb(site.url, [
      { name: "Accueil" },
      { name: "Circuits au Vietnam", path: TRIP_BASE },
    ]),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: trips.length,
      itemListElement: trips.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: site.url + tripUrl(t.slug),
        name: t.name,
      })),
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />

      <main id="contenu">
        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Circuits au Vietnam" }]} />

            <h1 className="d1 list__h1">Nos circuits au Vietnam</h1>
            <p className="lede">
              Six itinéraires privés, de {span.short} à {span.long} jours, à
              partir de {euro(span.min)} par personne hors vols internationaux.
              Chacun est un point de départ : la durée, les étapes et la gamme
              d&apos;hébergement se réajustent sans frais jusqu&apos;au départ.
            </p>

            <ul className="list__proof">
              <li><b>{score(global.value)}/5</b> sur {global.count} avis publiés</li>
              <li><b>Devis sous {site.responseTime}</b>, gratuit et sans engagement</li>
              <li><b>Guide francophone</b> et chauffeur privé à chaque étape</li>
            </ul>
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <p className="list__count">{trips.length} voyages, du moins cher au plus cher</p>

            <ul className="tiles">
              {order.map(({ t, r }) => (
                <li key={t.slug}><TripCard trip={t} rating={r} /></li>
              ))}
            </ul>

            <p className="note">
              Prix par personne, base deux voyageurs en chambre double, hors vols
              internationaux Paris–Hanoï (600 à 950 € selon la saison). Aucun de
              ces circuits n&apos;a de date de départ fixe : ils se composent à
              vos dates.
            </p>
          </div>
        </section>

        <section className="sec sec--jade">
          <div className="wrap">
            <SectionHead
              kicker="Vous hésitez encore"
              title={<>Décrivez-nous votre projet, <em>nous ferons le tri</em></>}
              lede={`Dates approximatives, durée, nombre de voyageurs, ce qui vous attire et ce que vous voulez éviter. Vous recevez sous ${site.responseTime} un itinéraire chiffré, modifiable autant de fois qu'il le faudra.`}
            />
            <a className="btn btn--amber" href="/#devis">Demander mon devis gratuit</a>
          </div>
        </section>
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
