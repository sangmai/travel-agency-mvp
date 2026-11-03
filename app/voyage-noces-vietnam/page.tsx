import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Photo } from "@/components/Photo";
import { QuoteForm } from "@/components/QuoteForm";
import { Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * The angle no other page on this site uses: honeymooners do not choose their
 * dates. The wedding fixes them, often a year ahead, and everything else has to
 * bend around that. So the page does not ask "when do you want to go" — it asks
 * what a given month allows, and answers with the one decision that cannot be
 * undone afterwards: where the trip ends.
 *
 * Every figure comes from what the site already publishes — the monthly season
 * table in content/seasons.json, the tiers in content/budget.json, and the one
 * hard fact about Phu Quoc on /quand-partir-au-vietnam ("la mer y devenant
 * agitée de juillet à septembre"). Con Dao has no published season of its own
 * here, so it is described by what we do know: 230 km offshore, an hour's
 * flight, the most preserved coast in the country. Inventing a climate table
 * for it would have been the easy and dishonest move.
 *
 * The page also argues against its own margin, twice: three to five beach
 * nights rather than more, and no Signature tier in the cities. Those are the
 * two places a honeymoon budget is most often wasted, and saying so is the only
 * reason the rest is worth reading.
 */

const MOIS = [
  { quand: "Novembre à février", sud: "Idéal", ile: "Con Dao ou Phu Quoc", note: "La meilleure fenêtre. Mer calme, chaleur sèche, tout s'enchaîne.", bon: true },
  { quand: "Mars et avril", sud: "Idéal à bon", ile: "Con Dao ou Phu Quoc", note: "Les trois régions sont praticables en même temps — rare dans l'année.", bon: true },
  { quand: "Mai et juin", sud: "Moyen", ile: "Côte du Centre", note: "Début de mousson au Sud. Les plages du Centre prennent le relais.", bon: true },
  { quand: "Juillet à septembre", sud: "Moyen", ile: "Côte du Centre", note: "Mer agitée à Phu Quoc. C'est le seul moment où nous déconseillons l'île.", bon: false },
  { quand: "Octobre", sud: "Bon", ile: "Con Dao ou Phu Quoc", note: "Le Sud redevient excellent, mais le Centre est en saison des pluies.", bon: true },
];

const RYTHME = [
  {
    quoi: "Deux étapes par semaine, pas trois",
    pourquoi:
      "Un circuit classique enchaîne trois villes en sept jours. Ce n'est pas un défaut — c'est ce qu'il faut pour voir le pays. Mais un voyage de noces ne cherche pas à maximiser les sites : il cherche des heures qui ne servent à rien. Deux étapes laissent cette place, trois ne la laissent pas.",
  },
  {
    quoi: "La plage à la fin, jamais au milieu",
    pourquoi:
      "Trois à cinq nuits, après le circuit. Repartir visiter quand on s'est arrêté est beaucoup plus difficile que l'inverse, et les voyageurs qui ont coupé leur parcours par une étape balnéaire nous le disent tous au retour. Au-delà de cinq nuits, la plupart s'ennuient — nous préférons le dire avant.",
  },
  {
    quoi: "Le budget sur deux moments, pas sur quatorze jours",
    pourquoi:
      "La nuit en baie sur une jonque privatisée et l'étape balnéaire. Ce sont les deux endroits où l'argent devient une expérience plutôt qu'une chambre. Le reste du temps, un bon 4★ fait le travail — vous êtes dehors de neuf heures à dix-neuf heures.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("voyage-noces-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/voyage-noces-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function VoyageDeNoces() {
  const guide = await getGuide("voyage-noces-vietnam");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Les circuits qui se terminent réellement par une île, calculés depuis la
     dernière étape plutôt que depuis une étiquette commerciale. Un circuit dont
     le parcours change dans le CMS sort de lui-même de cette liste. */
  const ILES = ["con-dao", "phu-quoc"];
  const finissentPlage = trips.filter((t) => ILES.includes(t.stops[t.stops.length - 1]?.place));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/voyage-noces-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Voyage de noces", path: "/voyage-noces-vietnam" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Voyage de noces" }]} />
            <h1 className="d1">Voyage de noces au Vietnam&nbsp;: la date décide de tout</h1>
            <p className="lede">
              <b>Vous ne choisissez pas vos dates — le mariage les fixe.</b>{" "}
              C&apos;est la différence avec tous les autres voyages, et elle change
              l&apos;ordre des questions. Le mois détermine l&apos;île où finir le
              séjour, et c&apos;est la seule décision qui ne se rattrape pas sur
              place&nbsp;: de juillet à septembre, la mer est agitée à Phu Quoc.
              Tout le reste s&apos;ajuste autour.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Votre mois de mariage, et où finir le voyage</h2>
            <DataTable
              caption="Conditions du Sud et de ses îles, reprises de notre calendrier des trois régions. Les mois se recouvrent : une date en limite de période s'arbitre au cas par cas."
              columns={["Période", "Le Sud", "Où finir", "Ce qu'il faut savoir"]}
              rows={MOIS.map((m) => [
                <b key="q">{m.quand}</b>,
                m.sud,
                m.bon ? m.ile : <b key="i">{m.ile}</b>,
                m.note,
              ])}
              note={
                <>
                  Aucune de ces périodes n&apos;est à écarter — seule
                  l&apos;île change. Un mariage en août donne un très beau voyage
                  qui finit sur la côte du Centre plutôt qu&apos;au large.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    Le calendrier mois par mois
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <div className="parcours">
              <figure className="parcours__photo">
                <Photo id="phuquoc" role="half" />
              </figure>
              <div className="parcours__txt">
                <h2 className="d2">Con Dao ou Phu Quoc</h2>
                <p className="lede">
                  <b>Con Dao pour le calme</b>&nbsp;: 230 kilomètres au large, une
                  heure de vol depuis Hô Chi Minh-Ville, le littoral le plus
                  préservé du pays. Peu de resorts, peu de vols, peu de monde.
                </p>
                <p>
                  <b>Phu Quoc pour le choix</b>&nbsp;: davantage d&apos;adresses,
                  des liaisons plus fréquentes, et une fréquentation sans commune
                  mesure. De juillet à septembre, la mer y devient agitée — c&apos;est
                  le seul argument qui tranche vraiment entre les deux.
                </p>
                <p className="note">
                  Les deux ne s&apos;atteignent qu&apos;en avion, ce qui ajoute une
                  demi-journée au programme.{" "}
                  <a className="lnk" href="/carte-vietnam">
                    Les distances du pays
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Ce qui change vraiment"
              title="Trois règles, et aucune ne concerne le luxe"
              lede="Un voyage de noces ne se distingue pas d'un autre par la catégorie des hôtels. Il s'en distingue par le rythme et par l'endroit où l'argent est placé."
            />
            <div className="guide">
              {RYTHME.map((r) => (
                <article className="guide__bloc" key={r.quoi}>
                  <h3 className="d3">{r.quoi}</h3>
                  <p>{r.pourquoi}</p>
                </article>
              ))}
            </div>
            <p className="note">
              Le détail poste par poste de ce que l&apos;écart de gamme achète —
              et des trois endroits où il n&apos;achète presque rien — est sur la
              page consacrée au haut de gamme.{" "}
              <a className="lnk" href="/voyage-luxe-vietnam">
                Ce que l&apos;écart achète
              </a>
            </p>
          </div>
        </section>

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce que les futurs mariés nous demandent"
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

        <section className="sec sec--jade">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Nos circuits"
              title="Ceux qui se terminent par une île"
              lede="Calculés depuis la dernière étape réelle du programme. Tous les autres se réaménagent de la même façon : une île ajoutée à la fin, et le reste resserré pour lui faire de la place."
            />
            <ul className="saison-liste">
              {finissentPlage.map((t) => (
                <li key={t.slug}>
                  <a href={tripUrl(t.slug)}>
                    <b>{t.name}</b>
                    <span>{t.days} jours · {t.region}</span>
                  </a>
                  <PriceFrom amount={t.priceFrom} />
                </li>
              ))}
            </ul>
            <p className="cta-row">
              <a className="btn btn--amber" href={TRIP_BASE}>Comparer les six circuits</a>
            </p>
          </div>
        </section>

        <QuoteForm />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
