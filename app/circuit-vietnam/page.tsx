import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuoteForm } from "@/components/QuoteForm";
import { TripCard } from "@/components/TripCard";
import { Fil, JsonLd, SectionHead } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { breadcrumb, siteId } from "@/components/JsonLd";
import { aggregate, getGuide, getReviews, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";
import { euro, score } from "@/lib/format";

/**
 * Terres d'Aventure's model: every card carries enough information to be ruled
 * out without being opened.
 *
 * NOTE: Terdav builds real indexable facets; nothing filters here yet. Those
 * pages remain to be produced — they are what brings the long tail.
 */
/* Métadonnées et FAQ lues dans content/guides/circuit-vietnam.json, comme sur
   toutes les autres pages. Elles étaient écrites en dur ici, seule exception du
   site : une page commerciale dont le titre ne se corrige pas depuis le CMS est
   celle qu'on oublie de corriger. */
export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("circuit-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: TRIP_BASE },
    openGraph: {
      type: "website",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function CircuitsIndex() {
  const [site, trips, guide] = await Promise.all([getSite(), getTrips(), getGuide("circuit-vietnam")]);

  /* Inclusions et exclusions communes aux six circuits, calculées par
     intersection plutôt que recopiées. Un circuit dont le contenu change dans
     le CMS sort de lui-même de ces listes — ce qui évite d'annoncer sur la page
     de catégorie une prestation qui n'est plus dans tous les programmes. */
  const communs = (champ: "included" | "excluded") =>
    trips
      .map((t) => t[champ])
      .reduce((a, b) => a.filter((x) => b.includes(x)));


  const ratings = await Promise.all(
    trips.map(async (t) => aggregate(await getReviews({ trip: t.slug }))),
  );

  // A single pass for the three bounds shown in the intro paragraph.
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
    "@graph": [
    {
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
    },
    {
      "@type": "FAQPage",
      "@id": `${site.url}${TRIP_BASE}#faq`,
      mainEntity: guide.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    ],
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
              <li><b>{score(site.reviewSource.rating)}/5</b> sur {site.reviewSource.name}</li>
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

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <h2 className="d2">Les six, ligne à ligne</h2>
            <DataTable
              caption="Prix par personne, base deux voyageurs en chambre double, hors vols internationaux. Toutes ces valeurs se réajustent : elles décrivent le point de départ, pas une contrainte."
              columns={["Circuit", "Durée", "Régions", "Niveau", "Pour qui", "Dès"]}
              rows={order.map(({ t }) => [
                <a className="lnk" key="n" href={tripUrl(t.slug)}><b>{t.name}</b></a>,
                <span className="num" key="d">{t.days} j</span>,
                t.region,
                t.niveau,
                t.audience,
                <span className="num" key="p">{euro(t.priceFrom)}</span>,
              ])}
              note={
                <>
                  Le tableau sert à écarter, pas à choisir&nbsp;: trois lignes
                  éliminées, il reste deux programmes à ouvrir.{" "}
                  <a className="lnk" href="/itineraire-vietnam">
                    Quelle durée pour quel itinéraire
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Ce que le prix comprend"
              title="Identique sur les six circuits"
              lede="Ces lignes sont calculées depuis les programmes eux-mêmes, pas recopiées : une prestation qui disparaîtrait d'un seul circuit disparaîtrait aussi de cette liste."
            />
            <div className="parcours">
              <div className="parcours__txt">
                <h3 className="d3">Compris</h3>
                <ul className="saison-liste">
                  {communs("included").map((x) => (
                    <li key={x}><span>{x}</span></li>
                  ))}
                </ul>
              </div>
              <div className="parcours__txt">
                <h3 className="d3">Non compris</h3>
                <ul className="saison-liste">
                  {communs("excluded").map((x) => (
                    <li key={x}><span>{x}</span></li>
                  ))}
                </ul>
              </div>
            </div>
            <p className="note">
              Chaque fiche détaille en plus ce qui lui est propre. Nous listons
              les exclusions aussi précisément que les inclusions&nbsp;: un devis
              qui ne dit pas ce qu&apos;il ne couvre pas n&apos;est pas un devis.{" "}
              <a className="lnk" href="/budget-voyage-vietnam">
                Le budget réel d&apos;un voyage
              </a>
            </p>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Comment choisir"
              title="Quatre questions avant de comparer les programmes"
              lede="Dans cet ordre. Chacune élimine plus de circuits que la suivante, et les trois premières se tranchent sans nous."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">Combien de jours sur place&nbsp;?</h3>
                <p>
                  C&apos;est la question qui élimine le plus. Dix jours imposent
                  une seule région, quinze permettent la traversée, trois
                  semaines ouvrent le Cambodge. Tout le reste en découle.{" "}
                  <a className="lnk" href="/itineraire-vietnam">
                    Ce qui tient selon la durée
                  </a>
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Nord, Sud, ou les deux&nbsp;?</h3>
                <p>
                  Les deux moitiés du pays ne se ressemblent pas, et elles
                  n&apos;ont pas la même saison. Trancher avant de regarder les
                  programmes évite de comparer des voyages qui ne se comparent
                  pas.{" "}
                  <a className="lnk" href="/nord-ou-sud-vietnam">
                    Nord ou Sud, le détail
                  </a>
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">À quelle période&nbsp;?</h3>
                <p>
                  Le Vietnam s&apos;étire sur 1 650 kilomètres et n&apos;a pas
                  une saison mais trois, décalées. Vos dates peuvent écarter une
                  région entière — mieux vaut le savoir avant.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    Le calendrier des trois régions
                  </a>
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Quel niveau d&apos;hébergement&nbsp;?</h3>
                <p>
                  Entre 55 et 300 € par jour et par personne selon la gamme. Ce
                  n&apos;est pas un détail de confort&nbsp;: c&apos;est le poste
                  qui fait varier le budget du simple au quintuple.{" "}
                  <a className="lnk" href="/voyage-luxe-vietnam">
                    Ce que l&apos;écart achète
                  </a>
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande avant de réserver"
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

        {/* Le bloc « Vous hésitez encore » vivait ici, au-dessus du
            formulaire : deux sections sec--jade l'une sur l'autre, donc un
            seul long aplat vert avec un bouton inutile au milieu, qui faisait
            défiler jusqu'au formulaire déjà visible. Son texte disait ce que
            dit le chapô du formulaire. */}
        <QuoteForm />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
