import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Check } from "@/components/Art";
import { Photo } from "@/components/Photo";
import { TripMap } from "@/components/TripMap";
import { Program } from "@/components/trip/Program";
import { SpecList, tripSpecs } from "@/components/trip/Specs";
import { Tech } from "@/components/trip/Tech";
import { Closing, Fil, JsonLd, PriceFrom, ReviewCard, SectionHead } from "@/components/ui";
import { breadcrumb, touristTripNode } from "@/components/JsonLd";
import {
  aggregate,
  getReviews,
  getSite,
  getTrip,
  getTrips,
  resolveStops,
  tripUrl,
  TRIP_BASE,
} from "@/lib/content";
import { euro, score } from "@/lib/format";

/**
 * Modèle Terres d'Aventure : critères de décision → ancres → « les plus » →
 * programme chiffré → budget → hébergement → fiche technique → avis.
 *
 * Différence assumée : pas de calendrier de départs, ces voyages se composent
 * à vos dates — la section budget se termine donc sur une demande de devis.
 */
const ANCRES = [
  { id: "les-plus", label: "Les plus" },
  { id: "jour-par-jour", label: "Jour par jour" },
  { id: "budget", label: "Budget" },
  { id: "hebergement", label: "Hébergement" },
  { id: "fiche-technique", label: "Fiche technique" },
  { id: "avis", label: "Avis" },
];

export async function generateStaticParams() {
  return (await getTrips()).map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [trip, site] = await Promise.all([getTrip(slug), getSite()]);
  if (!trip) return {};

  return {
    /* `absolute` retire le suffixe de marque : il coûte seize caractères, et
       les titres dépassaient tous la soixantaine au-delà de laquelle Google
       tronque. Sur une fiche produit, le nom du voyage et son prix valent
       mieux que la marque, que `og:site_name` porte déjà. */
    title: {
      absolute: `${trip.name} — ${trip.days} jours dès ${trip.priceFrom} €`,
    },
    description: `${trip.tagline}. Programme jour par jour, ${trip.days} jours à partir de ${trip.priceFrom} €/pers. hors vols. Devis gratuit sous ${site.responseTime}.`,
    alternates: { canonical: tripUrl(trip.slug) },
    openGraph: {
      type: "article",
      title: `${trip.name} — ${trip.days} jours au Vietnam`,
      description: trip.tagline,
      url: site.url + tripUrl(trip.slug),
      images: [
        {
          url: `/photos/og/${trip.photo}.jpg`,
          width: 1200,
          height: 630,
          alt: `${trip.name}, circuit privé au Vietnam`,
        },
      ],
    },
  };
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getTrip(slug);
  if (!trip) notFound();

  const [site, stops, reviews] = await Promise.all([
    getSite(),
    resolveStops(trip.stops),
    getReviews({ trip: slug }),
  ]);

  const rating = aggregate(reviews);
  const specs = tripSpecs(trip, rating);
  const url = site.url + tripUrl(trip.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      touristTripNode(trip, { site, stops: stops.map((s) => s.fr), reviews }),
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Circuits au Vietnam", path: TRIP_BASE },
        { name: trip.name, path: tripUrl(trip.slug) },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />

      <main id="contenu">
        <section className="trip-hero">
          <div className="trip-hero__img">
            <Photo id={trip.photo} role="hero" />
          </div>
          <div className="trip-hero__veil" />

          <div className="wrap wrap--wide trip-hero__in">
            <Fil
              light
              items={[
                { label: "Accueil", href: "/" },
                { label: "Circuits au Vietnam", href: TRIP_BASE },
                { label: trip.name },
              ]}
            />

            <p className="trip-hero__type">{trip.type}</p>
            <h1 className="d1">{trip.name}</h1>
            <p className="trip-hero__tag">{trip.tagline}</p>

            <SpecList specs={specs} />

            <div className="trip-hero__buy">
              <PriceFrom amount={trip.priceFrom} className="price--lg" note="hors vols internationaux" />
              <a className="btn btn--amber" href="/#devis">Demander un devis gratuit</a>
              <span className="trip-hero__code">Code voyage {trip.code}</span>
            </div>
          </div>
        </section>

        <nav className="ancres" aria-label="Sections de la fiche">
          <div className="wrap wrap--wide ancres__in">
            {ANCRES.map((a) => (
              <a key={a.id} href={`#${a.id}`}>{a.label}</a>
            ))}
          </div>
        </nav>

        <section className="sec sec--sand" id="les-plus">
          <div className="wrap wrap--wide">
            <div className="plus-grid">
              <div>
                <p className="kicker">Ce voyage en deux mots</p>
                <p className="trip-intro">{trip.intro}</p>
              </div>
              <ul className="plus">
                {trip.plus.map((p) => (
                  <li key={p}>
                    <Check />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Carte et liste côte à côte : la carte est un SVG calculé au
                build, la liste porte la même information en texte — donc
                lisible par un lecteur d'écran et par un crawler. */}
            <div className="parcours">
              <figure className="parcours__map">
                <TripMap stops={stops} />
              </figure>

              <div className="parcours__txt">
                <h2 className="d3">Les étapes du parcours</h2>
                <ol className="etapes">
                  {stops.map((s, i) => (
                    <li key={s.id + i}>
                      <span className="etapes__n">{i + 1}</span>
                      <span>{s.label}</span>
                    </li>
                  ))}
                </ol>
                <p className="parcours__note">
                  Le tracé relie les étapes dans l&apos;ordre du programme. Il ne
                  figure pas la route réellement empruntée : les trajets et leurs
                  durées sont détaillés jour par jour ci-dessous.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Program days={trip.program} />

        <section className="sec sec--jade" id="budget">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Budget"
              title={<>À partir de <em>{euro(trip.priceFrom)}</em> par personne</>}
              lede="Base deux voyageurs en chambre double, hors vols internationaux. Le prix définitif dépend de vos dates, de la gamme d'hébergement et du nombre de vols intérieurs retenus face aux trajets par la route."
            />

            <div className="budget">
              <div>
                <h3 className="budget__h">Le prix comprend</h3>
                <ul className="budget__list budget__list--in">
                  {trip.included.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="budget__h">Le prix ne comprend pas</h3>
                <ul className="budget__list budget__list--out">
                  {trip.excluded.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            </div>

            <p className="cta-row">
              <a className="btn btn--amber" href="/#devis">
                Recevoir le devis détaillé sous {site.responseTime}
              </a>
            </p>
          </div>
        </section>

        <section className="sec sec--sand" id="hebergement">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Hébergement"
              title="Où vous dormez, nuit par nuit"
              lede="Les établissements sont nommés dans le devis. Ils sont remplaçables : si une adresse ne vous convient pas, nous en proposons une autre dans la même gamme, sans frais."
            />
            <ul className="nuits">
              {trip.nights.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        </section>

        <Tech code={trip.code} specs={specs} />

        <section className="sec sec--sand" id="avis">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Avis vérifiés"
              title={`${score(rating.value)}/5 sur ce voyage`}
              lede="Avis de voyageurs ayant effectué ce circuit, publiés tels qu'ils nous parviennent, réserves comprises."
            />
            <div className="revs">
              {reviews.map((r) => (
                <ReviewCard key={r.author + r.date} review={r} departure />
              ))}
            </div>
          </div>
        </section>

        <Closing
          title="Ce voyage, à votre main"
          body="Une étape en plus, un hôtel différent, deux jours de moins : dites ce que vous voulez changer, nous refaisons le devis sans frais."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
