import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getSite, getTrips, tripUrl, TRIP_BASE, getGuide } from "@/lib/content";

/**
 * « Itinéraire Vietnam » se cherche presque toujours avec une durée accolée :
 * 10 jours, 2 semaines, 3 semaines. La page est donc organisée par durée et
 * non par région, et chaque durée dit aussi ce à quoi elle oblige à renoncer.
 *
 * Les circuits viennent du contenu, jamais d'une liste écrite ici : ajouter
 * une fiche dans le CMS la fait apparaître au bon palier sans toucher au code.
 */

const DUREES = [
  {
    duree: "7 à 9 jours",
    verdict: "Une seule région",
    faisable: "Hanoï, la baie de Lan Ha, Ninh Binh. Ou le Sud seul : Hô Chi Minh-Ville et deux nuits dans le delta.",
    renoncer: "La traversée du pays. À ce format, un Nord-Sud revient à passer un tiers du séjour dans les transports.",
  },
  {
    duree: "10 à 12 jours",
    verdict: "Une région, en profondeur",
    faisable: "Le Nord en entier, Ha Giang ou Pu Luong compris. Ou le Centre et le Sud, en commençant par Hué.",
    renoncer: "Les trois régions. C'est la durée où l'on gagne le plus à choisir plutôt qu'à survoler.",
  },
  {
    duree: "13 à 15 jours",
    verdict: "Le format le plus juste",
    faisable: "Nord, Centre et Sud avec deux vols intérieurs : Hanoï, la baie, Hué, Hoi An, le delta du Mékong.",
    renoncer: "Les montagnes du Grand Nord, qui demandent quatre jours à elles seules.",
  },
  {
    duree: "16 à 21 jours",
    verdict: "Tout, sans courir",
    faisable: "La traversée complète en ajoutant Ha Giang ou Phong Nha, ou une semaine au Cambodge avec Angkor.",
    renoncer: "Rien d'essentiel. Au-delà de 21 jours, mieux vaut ralentir que rallonger.",
  },
];

const RYTHME = [
  {
    regle: "Trois étapes par semaine, pas davantage",
    detail:
      "Chaque changement d'étape coûte une demi-journée : préparer les bagages, rouler, retrouver ses marques. Quatre étapes en sept jours produisent un voyage dont on ne garde que la fatigue.",
  },
  {
    regle: "Deux nuits minimum partout",
    detail:
      "Une nuit quelque part signifie arriver en fin d'après-midi et repartir après le petit-déjeuner : on a dormi dans une ville, on ne l'a pas vue. La seule exception justifiée est une nuit à bord en baie de Lan Ha.",
  },
  {
    regle: "Un vol intérieur vaut souvent une journée gagnée",
    detail:
      "Hanoï–Da Nang prend 1 h 20 en avion contre 15 h de route. À 40–110 € le trajet, l'arbitrage est presque toujours favorable sur les longues liaisons, et défavorable sur les courtes.",
  },
  {
    regle: "Une journée creuse par semaine",
    detail:
      "Sans rien de prévu. C'est elle que les voyageurs citent le plus souvent au retour — le marché du matin, la plage, la sieste. Un programme plein à ras bord est un programme qu'on subit.",
  },
];


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("itineraire-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/itineraire-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function Itineraire() {
  const guide = await getGuide("itineraire-vietnam");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);
  const parDuree = [...trips].sort((a, b) => a.days - b.days);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/itineraire-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${site.url}/itineraire-vietnam/#circuits`,
        name: "Itinéraires au Vietnam par durée",
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        numberOfItems: parDuree.length,
        itemListElement: parDuree.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${t.name} — ${t.days} jours`,
          url: site.url + tripUrl(t.slug),
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Idées d'itinéraires", path: "/itineraire-vietnam" },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />

      <main id="contenu">
        <section className="sec sec--sand">
          <div className="wrap">
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Idées d'itinéraires" }]} />
            <h1 className="d1">Quel itinéraire au Vietnam&nbsp;?</h1>
            <p className="lede">
              <b>Quinze jours est le format le plus juste pour traverser le pays
              du nord au sud.</b> En dessous de douze, mieux vaut choisir une
              seule région et la voir vraiment que tenter les trois et passer un
              tiers du séjour en transport. Au-delà de dix-huit jours, le
              Cambodge devient une addition cohérente. Voici ce que chaque durée
              permet — et ce à quoi elle oblige à renoncer.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Ce qui tient, selon la durée</h2>
            <DataTable
              caption="Durées hors vols internationaux. Le jour d'arrivée est rarement exploitable : le vol depuis la France dure treize heures avec escale."
              columns={["Durée sur place", "En résumé", "Ce qui est faisable", "Ce à quoi renoncer"]}
              rows={DUREES.map((d) => [d.duree, <b key="v">{d.verdict}</b>, d.faisable, d.renoncer])}
              note={
                <>
                  Ces paliers valent pour un circuit privé, où l&apos;on ne perd
                  pas de temps à attendre le reste du groupe.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    La saison modifie aussi le parcours
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Le rythme"
              title="Quatre règles qui valent plus que la liste des sites"
              lede="Ce qui distingue un bon itinéraire d'un mauvais n'est presque jamais le choix des étapes — c'est leur nombre et leur durée. Voici ce que nous appliquons à tous nos programmes."
            />
            <div className="guide">
              {RYTHME.map((r) => (
                <article className="guide__bloc" key={r.regle}>
                  <h3 className="d3">{r.regle}</h3>
                  <p>{r.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="circuits">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Nos itinéraires"
              title="Du plus court au plus long"
              lede="Chaque fiche détaille le programme jour par jour, les temps de trajet réels, l'hébergement nuit par nuit et ce que le prix comprend. Tous sont modifiables : ce sont des points de départ, pas des catalogues."
            />
            <ul className="saison-liste">
              {parDuree.map((t) => (
                <li key={t.slug}>
                  <a href={tripUrl(t.slug)}>
                    <b>{t.name}</b>
                    <span>{t.days} jours · {t.stops.length} étapes · {t.region}</span>
                  </a>
                  <PriceFrom amount={t.priceFrom} />
                </li>
              ))}
            </ul>
            <p className="cta-row">
              <a className="btn btn--amber" href={TRIP_BASE}>Voir tous les circuits</a>
            </p>
          </div>
        </section>

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur le parcours"
              lede="Les réponses sont dans le HTML même repliées : un lecteur d'écran comme un moteur les trouve sans ouvrir quoi que ce soit."
            />
            <div className="faq">
              {guide.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <Closing
          title="Votre itinéraire n'existe pas encore."
          body="Dites-nous combien de jours vous avez et ce qui vous attire : nous écrivons le parcours autour, étape par étape, avec les temps de trajet réels. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
