import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * A guide, not a product listing.
 *
 * The obvious move for this URL is a facet page listing "family trips" — which
 * is what competitors do. With six itineraries in the catalogue, exactly one of
 * which is built for families, that page would list one product and be thin by
 * definition.
 *
 * So it answers the question instead. The parent typing this query wants to
 * know whether the trip is a good idea at their child's age, and what it will
 * actually cost them in hours on a road. That is knowledge an agency on the
 * ground has and a comparison site cannot invent — and it does not depend on
 * how many products are in the catalogue.
 *
 * Deliberately NOT a duplicate of /itineraire-vietnam. That page sets the
 * rhythm rules for everyone; this one tightens three of them and says why.
 * Restating the same four rules would make two pages compete for one query and
 * weaken both.
 *
 * Road times come from /carte-vietnam, which is the single source for distances
 * on this site. Two pages quoting different durations for the same leg is worse
 * than quoting none.
 */

const AGES = [
  {
    age: "3 à 5 ans",
    marche: "Un séjour sur deux ou trois lieux, Centre ou Sud, hôtel avec piscine",
    coince: "Le rapport transport / temps utile : trois heures de voiture pour une visite d'une heure",
    duree: "10 à 12 jours",
  },
  {
    age: "6 à 9 ans",
    marche: "Le circuit classique devient confortable : baie, rizières, vieille ville",
    coince: "Les marches de plus de deux heures et les journées à deux visites",
    duree: "12 à 15 jours",
  },
  {
    age: "10 à 13 ans",
    marche: "Presque tout, y compris une nuit chez l'habitant et une demi-journée de vélo",
    coince: "Les trajets de nuit, qui se paient le lendemain",
    duree: "14 à 18 jours",
  },
  {
    age: "14 ans et plus",
    marche: "Les mêmes programmes que les adultes, trek compris",
    coince: "Rien de spécifique — l'arbitrage redevient celui du budget",
    duree: "15 à 21 jours",
  },
];

/* Distances et durées reprises de /carte-vietnam : source unique du site. */
const TRAJETS = [
  { de: "Hanoï", a: "Ninh Binh", km: "95 km", route: "2 h", verdict: "Sans difficulté", ok: true },
  { de: "Hanoï", a: "Baie de Lan Ha", km: "185 km", route: "3 h", verdict: "Acceptable, la croisière suit", ok: true },
  { de: "Hué", a: "Hoi An", km: "130 km", route: "3 h", verdict: "À couper au col des Nuages", ok: true },
  { de: "Hanoï", a: "Sapa", km: "315 km", route: "5 h 30", verdict: "Limite avant 8 ans", ok: false },
  { de: "Hanoï", a: "Ha Giang", km: "300 km", route: "6 h 30", verdict: "À écarter en famille", ok: false },
  { de: "Hanoï", a: "Hué", km: "700 km", route: "14 h", verdict: "Avion — 1 h 15", ok: false },
  { de: "Hoi An", a: "Hô Chi Minh-Ville", km: "860 km", route: "17 h", verdict: "Avion — 1 h 20", ok: false },
];

const RETIRES = [
  {
    quoi: "La boucle de Ha Giang",
    pourquoi:
      "Six heures et demie de route pour y arriver, puis trois jours de lacets de montagne. C'est le plus beau paysage du pays et le plus mal adapté à un enfant de moins de douze ans : le mal des transports y est la règle, pas l'exception. Les rizières en terrasses se voient aussi à Pu Luong, nettement plus près de Hanoï.",
  },
  {
    quoi: "Le trek à Sapa avant huit ans",
    pourquoi:
      "Trois à cinq heures de marche sur des sentiers agricoles, souvent glissants. Un enfant de six ans tiendra la première heure. Nous proposons à la place une marche d'une heure et demie entre deux villages, avec retour en voiture — même paysage, même rencontre, sans la deuxième moitié de journée qui gâche la première.",
  },
  {
    quoi: "La journée entière en barque dans le Mékong",
    pourquoi:
      "Le marché flottant se tient entre six et huit heures du matin et demande un lever à cinq heures. L'intérêt est réel ; la journée qui suit, passée à bord sous la chaleur, l'est beaucoup moins pour un enfant. Une demi-journée suffit, et le reste se passe mieux à vélo entre les vergers.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("voyage-vietnam-famille");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/voyage-vietnam-famille" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function VoyageEnFamille() {
  const guide = await getGuide("voyage-vietnam-famille");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Les circuits de treize jours ou moins. Le critère n'est pas l'étiquette
     « famille » mais le nombre de changements d'étape : un programme court en
     compte mécaniquement moins, et c'est le transport qui use les enfants, pas
     la destination. Calculé depuis le contenu, donc un circuit retiré du CMS ne
     laisse pas de lien derrière lui. */
  const courts = trips.filter((t) => t.days <= 13);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/voyage-vietnam-famille/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Voyage en famille", path: "/voyage-vietnam-famille" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Voyage en famille" }]} />
            <h1 className="d1">Le Vietnam en famille&nbsp;: à partir de quel âge&nbsp;?</h1>
            <p className="lede">
              <b>Six ans, pour que le voyage soit confortable pour tout le
              monde.</b> Avant, rien ne l&apos;interdit, mais le rapport entre
              temps de transport et temps réellement profitable se dégrade vite.
              La contrainte n&apos;est pas la distance ni le dépaysement&nbsp;:
              c&apos;est le nombre d&apos;heures de voiture. Deux étapes par
              semaine au lieu de trois, trois heures de route par jour au
              maximum, et le pays devient facile.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Ce qui fonctionne, selon l&apos;âge</h2>
            <DataTable
              caption="Constaté sur nos programmes familiaux. Les âges sont indicatifs : un enfant de cinq ans habitué à voyager supporte mieux qu'un enfant de huit ans qui ne l'est pas."
              columns={["Âge", "Ce qui fonctionne", "Ce qui coince", "Durée conseillée"]}
              rows={AGES.map((a) => [
                <b key="a">{a.age}</b>,
                a.marche,
                a.coince,
                <span className="num" key="d">{a.duree}</span>,
              ])}
              note={
                <>
                  Le seuil de six ans n&apos;a rien de réglementaire : c&apos;est
                  l&apos;âge à partir duquel un enfant raconte son voyage au
                  retour. En dessous, il le vit, mais ne le garde pas.{" "}
                  <a className="lnk" href="/itineraire-vietnam">
                    Les durées d&apos;itinéraire en général
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="La vraie contrainte"
              title="Les temps de route, en chiffres"
              lede="C'est ce qui décide d'un programme familial, et c'est la donnée que les brochures omettent le plus souvent. Les distances ci-dessous sont celles de notre carte du pays, pas des estimations."
            />
            <DataTable
              caption="Durées de route constatées hors heures de pointe. Les deux dernières lignes se font en avion dans tous nos programmes."
              columns={["Trajet", "Distance", "Par la route", "En famille"]}
              rows={TRAJETS.map((t) => [
                <b key="t">{t.de} → {t.a}</b>,
                <span className="num" key="k">{t.km}</span>,
                <span className="num" key="r">{t.route}</span>,
                t.ok ? t.verdict : <b key="v">{t.verdict}</b>,
              ])}
              note={
                <>
                  Trois heures est le seuil au-delà duquel une journée bascule :
                  en deçà, le trajet est une transition ; au-delà, il devient la
                  journée elle-même.{" "}
                  <a className="lnk" href="/carte-vietnam">
                    Toutes les distances du pays
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Trois règles qui changent"
              title="Ce qu'on resserre par rapport à un programme classique"
              lede="Les règles de rythme du site valent pour tout le monde. En famille, trois d'entre elles se durcissent — et c'est la seule différence qui compte vraiment."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">Deux étapes par semaine, pas trois</h3>
                <p>
                  Chaque changement d&apos;étape coûte une demi-journée à un
                  adulte. Avec des enfants, il en coûte une entière&nbsp;: défaire
                  et refaire les bagages, le trajet, le temps de reprendre ses
                  repères dans une nouvelle chambre. Trois étapes en sept jours
                  produisent un voyage dont on ne garde que la fatigue.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Trois nuits plutôt que deux</h3>
                <p>
                  La règle générale du site est de deux nuits minimum partout. En
                  famille, la troisième nuit est celle qui transforme le séjour :
                  elle libère une journée sans transport, où l&apos;on retourne au
                  marché du matin ou à la piscine, et c&apos;est très souvent
                  celle que les enfants racontent au retour.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Trois heures de route par jour, maximum</h3>
                <p>
                  Au-delà, le trajet cesse d&apos;être une transition pour devenir
                  la journée. C&apos;est ce seuil qui écarte Ha Giang d&apos;un
                  programme familial, et qui rend le vol intérieur Hanoï–Da Nang
                  non pas un confort mais une condition.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Ce qu'on retire"
              title="Trois étapes que nous ne programmons pas en famille"
              lede="Elles figurent dans nos autres circuits et nous les recommandons volontiers — à des voyageurs sans enfants. Dire pourquoi vaut mieux que les faire disparaître sans explication."
            />
            <div className="guide">
              {RETIRES.map((r) => (
                <article className="guide__bloc" key={r.quoi}>
                  <h3 className="d3">{r.quoi}</h3>
                  <p>{r.pourquoi}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce que les parents nous demandent"
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
              title="Ceux qui comptent le moins de changements d'étape"
              lede="Treize jours ou moins, donc moins de trajets. Tous se réaménagent au rythme que vous nous indiquez — c'est précisément ce que le sur-mesure permet."
            />
            <ul className="saison-liste">
              {courts.map((t) => (
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
              <a className="btn btn--amber" href={TRIP_BASE}>Voir tous les circuits</a>
            </p>
          </div>
        </section>

        <Closing
          title="Dites-nous l'âge des enfants."
          body="C'est la première chose que nous demandons, et celle qui change le plus le programme : entre six et douze ans, ce n'est pas le même voyage. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
