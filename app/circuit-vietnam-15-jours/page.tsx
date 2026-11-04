import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Photo } from "@/components/Photo";
import { QuoteForm } from "@/components/QuoteForm";
import { Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";
import { euro } from "@/lib/format";

/**
 * Page d'intention pour « circuit Vietnam 15 jours ».
 *
 * Elle ne double pas la fiche du circuit : celle-ci décrit le programme jour
 * par jour, celle-là répond aux questions qui se posent *avant* de l'ouvrir —
 * pourquoi quinze jours plutôt que dix ou vingt-et-un, ce que coûte la
 * traversée, quel mois la permet. Les deux pages se renvoient l'une à l'autre
 * plutôt que de se répéter.
 *
 * ## Tout vient du circuit, rien n'est ressaisi
 *
 * Le prix, la durée, le nom et les étapes sont lus dans
 * content/itineraries/vietnam-du-nord-au-sud.json. Si le circuit change de
 * prix dans le CMS, cette page change avec lui. Une seule chose est écrite ici
 * et nulle part ailleurs : le découpage en tranches de jours du tableau, parce
 * que le programme stocke des étapes et non des numéros de jour.
 *
 * ## Deux chiffres à ne pas réinventer
 *
 * Les fourchettes budgétaires (1 200–1 700 € en charme, 800–1 100 € en
 * confort, 600–950 € de vols) sont celles que publie /budget-voyage-vietnam.
 * Elles sont répétées ici parce qu'un lecteur qui cherche « circuit vietnam 15
 * jours prix » ne doit pas avoir à changer de page — mais si elles bougent
 * là-bas, elles doivent bouger ici. C'est la seule duplication assumée.
 */

const REFERENCE = "vietnam-du-nord-au-sud";

/* Le programme stocke des étapes, pas des jours. Ce découpage est la seule
   donnée propre à cette page ; il suit l'ordre et le contenu réels de
   `program`, et les nuits annoncées se relisent une à une dans `nights`. */
const TRANCHES = [
  { jours: "1–2", etape: "Hanoï", quoi: "Les 36 rues du vieux quartier à pied et en cyclo, le temple de la Littérature, le musée d'Ethnographie." },
  { jours: "3", etape: "Ninh Binh", quoi: "Deux heures de barque à rames à Trang An, menée par des rameuses du village — souvent avec les pieds." },
  { jours: "4–5", etape: "Lan Ha, puis train de nuit", quoi: "Embarquement à Got plutôt qu'à Tuan Chau, nuit en jonque, puis cabine climatisée vers Hué." },
  { jours: "6", etape: "Hué", quoi: "La citadelle et la Cité pourpre interdite, le tombeau de Tu Duc, retour par la rivière des Parfums." },
  { jours: "7–9", etape: "Hoi An", quoi: "Trois nuits dont deux journées libres : la vieille ville, la plage d'An Bang à vélo, ou rien du tout." },
  { jours: "10–11", etape: "Hô Chi Minh-Ville", quoi: "Les tunnels de Cu Chi, la poste centrale d'Eiffel, le palais de la Réunification laissé en l'état." },
  { jours: "12–13", etape: "Delta du Mékong", quoi: "Cai Rang à 5 h 30 : le marché de gros bat son plein entre 6 h et 7 h 30, et à 8 h tout est fini." },
  { jours: "14–15", etape: "Retour à Saïgon, départ", quoi: "Ben Thanh ou le quartier chinois de Cho Lon, bien plus calme. Dîner d'adieu avec votre guide." },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("circuit-vietnam-15-jours");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/circuit-vietnam-15-jours" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function CircuitQuinzeJours() {
  const guide = await getGuide("circuit-vietnam-15-jours");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  const trip = trips.find((t) => t.slug === REFERENCE);
  /* Si le circuit de référence disparaît du CMS, la page n'a plus de sujet :
     mieux vaut un 404 franc qu'une page qui parle d'un produit absent. */
  if (!trip) notFound();

  const dix = trips.find((t) => t.slug === "montagnes-et-baies-du-nord");
  const troisSemaines = trips.find((t) => t.slug === "vietnam-et-cambodge");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        /* FAQPage reste déclaré bien que Google ait retiré les résultats
           enrichis FAQ pour tous les sites le 7 mai 2026 : il n'y a plus
           d'étoiles à gagner, mais le balisage reste lisible par les moteurs
           de réponse. Les cinq questions sont visibles dans la page — jamais
           de balisage sans contenu affiché. */
        "@type": "FAQPage",
        "@id": `${site.url}/circuit-vietnam-15-jours/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Circuits", path: TRIP_BASE },
        { name: "15 jours", path: "/circuit-vietnam-15-jours" },
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
            <Fil
              items={[
                { label: "Accueil", href: "/" },
                { label: "Circuits", href: TRIP_BASE },
                { label: "15 jours" },
              ]}
            />
            <h1 className="d1">Circuit Vietnam 15 jours&nbsp;: traverser le pays du Nord au Sud</h1>
            <p className="lede">
              <b>Quinze jours, c&apos;est la durée à partir de laquelle le
              Vietnam se traverse sans le survoler.</b> Vous passez des karsts
              du Tonkin au patrimoine impérial du Centre, puis à l&apos;eau
              partout dans le delta du Mékong. Ce qui rend la traversée tenable
              tient en deux lignes du programme&nbsp;: une nuit de train entre
              Hanoï et Hué, un vol intérieur entre Da Nang et Saïgon. Sans eux,
              la même distance se paierait en journées de route.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">L&apos;itinéraire en un coup d&apos;œil</h2>
            <p>
              Le circuit de référence est <b>{trip.name}</b> ({trip.code})&nbsp;:
              {` ${trip.days} jours, ${trip.days - 1} nuits, niveau ${trip.niveau.toLowerCase()}, ${trip.confort.toLowerCase()}.`}{" "}
              Le programme jour par jour, avec les temps de transfert et les
              hébergements nommés, est sur la fiche du circuit.
            </p>
            <DataTable
              caption="Structure du circuit Nord–Sud de quinze jours. Les étapes et les nuits sont celles du programme ; le découpage en tranches de jours est indicatif et s'ajuste à vos horaires de vol."
              columns={["Jours", "Étape", "Le moment à retenir"]}
              rows={TRANCHES.map((t) => [
                <b key="j">{t.jours}</b>,
                t.etape,
                t.quoi,
              ])}
              note={
                <>
                  Nuits&nbsp;: {trip.nights.length} étapes d&apos;hébergement,
                  dont une en jonque en baie de Lan Ha et une en cabine de
                  train.{" "}
                  <a className="lnk" href={tripUrl(trip.slug)}>
                    Le programme jour par jour
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
                <Photo id="hoian" role="half" />
              </figure>
              <div className="parcours__txt">
                <h2 className="d2">Pourquoi quinze jours — et pas dix, ni vingt-et-un</h2>
                <p>
                  <b>En dix jours, mieux vaut une seule moitié du pays.</b>{" "}
                  {dix && (
                    <>
                      «&nbsp;{dix.name}&nbsp;» ({dix.days} jours, à partir de{" "}
                      {euro(dix.priceFrom)}) reste au Nord&nbsp;: Hanoï, Ninh
                      Binh, Lan Ha, Pu Luong, Mai Chau. C&apos;est le bon choix
                      si vous venez d&apos;abord pour les paysages.
                    </>
                  )}
                </p>
                <p>
                  <b>En quinze jours, le pays entier devient possible</b> — à
                  condition d&apos;accepter un rythme soutenu les premiers jours
                  et de garder les deux journées libres de Hoi An pour
                  respirer. C&apos;est le seuil, pas le confort&nbsp;: tout
                  jour retiré se prend sur le Centre.
                </p>
                <p>
                  <b>En trois semaines, le Vietnam se combine.</b>{" "}
                  {troisSemaines && (
                    <>
                      «&nbsp;{troisSemaines.name}&nbsp;» ({troisSemaines.days}{" "}
                      jours, à partir de {euro(troisSemaines.priceFrom)})
                      descend le Mékong jusqu&apos;à Angkor.
                    </>
                  )}
                </p>
                <p className="note">
                  <a className="lnk" href="/nord-ou-sud-vietnam">
                    Nord ou Sud, si vous devez choisir
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Le prix"
              title={`À partir de ${euro(trip.priceFrom)} par personne`}
              lede="Base deux voyageurs en chambre double, hors vols internationaux. Le devis définitif dépend de vos dates, de la gamme d'hébergement et du nombre de vols intérieurs retenus."
            />
            <p>
              Le prix comprend l&apos;hébergement en chambre double dans les
              établissements nommés, les petits-déjeuners et les repas indiqués
              jour par jour, un guide francophone diplômé à chaque étape, les
              transferts en véhicule privé climatisé, les droits
              d&apos;entrée, <b>le vol intérieur Da Nang–Hô Chi Minh-Ville</b>,
              la cabine du train de nuit Hanoï–Hué, la nuit en jonque en pension
              complète et les sorties en bateau dans le delta.
            </p>
            <p>
              À titre de repère, et pour un circuit de quinze jours hors vols
              internationaux&nbsp;: <b>1 200 à 1 700 €</b> par personne en
              gamme charme, <b>800 à 1 100 €</b> en gamme confort. Les vols
              Paris–Hanoï ajoutent 600 à 950 € selon la saison.
            </p>
            <p className="note">
              Le détail poste par poste — hébergement, guide, chauffeur, vols
              intérieurs, repas, visa — est sur la page consacrée au budget.{" "}
              <a className="lnk" href="/budget-voyage-vietnam">
                Ce que coûte vraiment un voyage au Vietnam
              </a>
            </p>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <h2 className="d2">Quand partir pour un circuit de quinze jours</h2>
            <p>
              La saison de ce circuit va de <b>{trip.saison.toLowerCase()}</b>.
              Un Nord–Sud demande les trois régions praticables en même temps,
              ce qui resserre beaucoup la fenêtre par rapport à un séjour sur
              une seule moitié du pays.
            </p>
            <p>
              <b>Mars est le meilleur mois</b>&nbsp;: c&apos;est le seul de
              l&apos;année où le Nord, le Centre et le Sud sont simultanément au
              mieux. Avril suit de près, le Sud y devenant seulement bon plutôt
              qu&apos;idéal. À l&apos;inverse, <b>octobre est à éviter au
              Centre</b>, où Hué et Hoi An peuvent être inondés — alors que
              c&apos;est un très beau mois au Nord, ce qui explique
              qu&apos;octobre convienne à un circuit du Nord et pas à une
              traversée.
            </p>
            <p className="note">
              Il n&apos;existe pas de mauvaise période pour le Vietnam, seulement
              un itinéraire à adapter au mois choisi.{" "}
              <a className="lnk" href="/quand-partir-au-vietnam">
                Le calendrier mois par mois, région par région
              </a>
            </p>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur les quinze jours"
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
              kicker="Les autres durées"
              title="Si quinze jours ne tombent pas juste"
              lede="Tous nos circuits sont privés et se réaménagent : la durée affichée est un point de départ, pas un format."
            />
            <ul className="saison-liste">
              {trips.map((t) => (
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

        <QuoteForm trip={trip} />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
