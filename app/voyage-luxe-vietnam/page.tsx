import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Bande } from "@/components/Bande";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, getBudget, tripUrl, TRIP_BASE, lien} from "@/lib/content";

/**
 * The page a luxury agency would write as a mood board. This one prices the
 * gap instead.
 *
 * The honest question behind the query is not "what is luxury in Vietnam" but
 * "what do I get for twice the money". So the page answers line by line, using
 * the tiers already published on /budget-voyage-vietnam rather than inventing a
 * second scale — two pages quoting different prices for the same thing is the
 * fastest way to lose a reader who checks.
 *
 * It also names the three places where the extra budget changes almost nothing.
 * That costs us margin on every quote where the traveller takes the advice, and
 * it is the only reason to believe the rest of the page.
 *
 * No hotel names anywhere. We would have to verify each one, prices move, and a
 * named property that has since declined is worse than a category.
 */

const POSTES = [
  {
    poste: "Nuit en baie",
    charme: "Cabine double sur jonque partagée",
    signature: "Jonque entièrement privatisée",
    verdict: "Décisif",
    fort: true,
  },
  {
    poste: "Étape balnéaire",
    charme: "Bon 4★ en bord de mer",
    signature: "Resort 5★, plage souvent privée",
    verdict: "Décisif",
    fort: true,
  },
  {
    poste: "Guide",
    charme: "Privé et dédié, vous suit d'une ville à l'autre",
    signature: "Identique, avec davantage d'accès réservés",
    verdict: "Marginal",
    fort: false,
  },
  {
    poste: "Hôtel en ville",
    charme: "4★ et boutique-hôtels de caractère",
    signature: "5★ et adresses historiques",
    verdict: "Faible si vous sortez toute la journée",
    fort: false,
  },
  {
    poste: "Transferts",
    charme: "Voiture privée avec chauffeur",
    signature: "Identique, véhicule plus grand",
    verdict: "Nul",
    fort: false,
  },
  {
    poste: "Repas",
    charme: "Petits-déjeuners, quelques dîners",
    signature: "Tables réputées, cours de cuisine privés",
    verdict: "Réel, mais arbitrable sur place",
    fort: false,
  },
];

const INUTILE = [
  {
    ou: "Hanoï et Hô Chi Minh-Ville",
    pourquoi:
      "Vous partez à neuf heures et rentrez à dix-neuf. Entre un très bon 4★ du vieux quartier et un 5★ du quartier français, la différence tient dans une salle de bains plus grande et un petit-déjeuner plus fourni. Sur quatre nuits, l'écart finance la jonque privatisée — et c'est elle que vous raconterez.",
  },
  {
    ou: "Hoi An",
    pourquoi:
      "La vieille ville se traverse à pied et la plage est à quinze minutes de vélo. Les hôtels de charme y sont excellents dès la gamme Charme, souvent dans d'anciennes maisons de marchands. Monter en gamme ici achète une piscine plus grande, pas une expérience différente.",
  },
  {
    ou: "Les étapes de transition",
    pourquoi:
      "Une nuit avant un vol intérieur, une nuit après une longue route. Ce sont des lits, pas des destinations. Y mettre du budget est l'erreur la plus fréquente des programmes haut de gamme construits mécaniquement, gamme uniforme du premier au dernier jour.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("voyage-luxe-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/voyage-luxe-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function VoyageDeLuxe() {
  const guide = await getGuide("voyage-luxe-vietnam");
  const [site, trips, budget] = await Promise.all([getSite(), getTrips(), getBudget()]);

  /* Les circuits de la gamme haute, repérés par leur niveau de confort déclaré
     dans le contenu plutôt que par une liste écrite ici : un circuit dont la
     gamme change dans le CMS sort de cette liste tout seul. */
  const hautDeGamme = trips.filter((t) => /5★|signature/i.test(t.confort));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/voyage-luxe-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Voyage de luxe", path: "/voyage-luxe-vietnam" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Voyage de luxe" }]} />
            <h1 className="d1">Voyage de luxe au Vietnam&nbsp;: ce que l&apos;écart achète</h1>
            <p className="lede">
              <b>180 à 300 € par jour et par personne en gamme Signature, contre
              85 à 120 € en Charme.</b> L&apos;écart est d&apos;environ un facteur
              deux, et il ne se répartit pas également&nbsp;: il est décisif sur
              deux postes, marginal sur trois, et nul sur un. Voici lesquels —
              parce que la question utile n&apos;est pas ce qu&apos;est le luxe,
              mais ce qu&apos;il change.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Poste par poste</h2>
            <DataTable
              caption="Comparaison à itinéraire identique, base deux voyageurs en chambre double, hors vols internationaux."
              columns={["Poste", "Charme · 85–120 €/jour", "Signature · 180–300 €/jour", "L'écart"]}
              rows={POSTES.map((p) => [
                <b key="p">{p.poste}</b>,
                p.charme,
                p.signature,
                p.fort ? <b key="v">{p.verdict}</b> : p.verdict,
              ])}
              note={
                <>
                  Deux postes concentrent l&apos;essentiel de la différence. Le
                  reste se discute, et une partie ne se discute même pas.{" "}
                  <a className="lnk" href="/budget-voyage-vietnam/">
                    Le barème complet des trois gammes
                  </a>
                </>
              }
            />
            <Bande id="jonque-pont" />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Le barème"
              title="Les trois gammes, pour situer"
              lede="Ce sont les mêmes chiffres que notre page budget : un site qui annonce deux barèmes différents selon la page ne mérite d'être cru sur aucun des deux."
            />
            <DataTable
              caption="Par personne et par jour, base deux voyageurs en chambre double, hors vols internationaux."
              columns={["Gamme", "Hébergement", "Par jour", "Deux semaines"]}
              rows={budget.map((b) => [
                <b key="g">{b.gamme}</b>,
                b.hotel,
                <span className="num" key="d">{b.perDay}</span>,
                <span className="num" key="w">{b.twoWeeks}</span>,
              ])}
            />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Où l'écart compte vraiment"
              title="Deux postes, et pourquoi eux"
              lede="Ce sont les deux moments où l'hébergement cesse d'être un lit pour devenir le programme lui-même."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">La nuit en baie</h3>
                <p>
                  Une cabine sur une jonque partagée avec vingt autres passagers
                  et une jonque entièrement privatisée ne produisent pas le même
                  souvenir. Le dîner sur le pont, le kayak au lever du jour sans
                  attendre son tour, le mouillage choisi plutôt que subi&nbsp;:
                  c&apos;est le poste où l&apos;argent se transforme le plus
                  directement en expérience.{" "}
                  <a className="lnk" href="/halong-ou-lan-ha/">
                    Quelle baie choisir
                  </a>
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">L&apos;étape balnéaire</h3>
                <p>
                  À Con Dao ou à Phu Quoc, vous ne sortez pas visiter&nbsp;: vous
                  restez. L&apos;hôtel est le programme, la plage lui appartient
                  souvent, et le rapport entre ce que vous payez et ce que vous
                  vivez y est le plus direct de tout le voyage. C&apos;est
                  l&apos;inverse exact des étapes urbaines.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Où il ne change presque rien"
              title="Trois endroits où nous vous conseillons d'économiser"
              lede="Dire cela nous coûte de la marge sur chaque devis où le conseil est suivi. C'est aussi la seule raison de croire le reste de cette page."
            />
            <div className="guide">
              {INUTILE.map((i) => (
                <article className="guide__bloc" key={i.ou}>
                  <h3 className="d3">{i.ou}</h3>
                  <p>{i.pourquoi}</p>
                </article>
              ))}
            </div>
            <p className="note">
              La conclusion pratique&nbsp;: ne prenez pas une gamme uniforme.
              Mettez le budget sur la jonque et sur la plage, restez en bon 4★
              dans les villes. C&apos;est exactement ce que le sur-mesure permet
              et qu&apos;un forfait ne permet pas.{" "}
              <a className="lnk" href="/agence-locale-ou-tour-operateur/">
                Agence locale ou tour-opérateur
              </a>
            </p>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur le haut de gamme"
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

        {hautDeGamme.length > 0 && (
          <section className="sec sec--jade">
            <div className="wrap wrap--wide">
              <SectionHead
                kicker="Nos circuits"
                title="Ceux construits en gamme Signature"
                lede="Repérés par leur niveau de confort réel, pas par une étiquette. Tous se réaménagent gamme par gamme, étape par étape."
              />
              <ul className="saison-liste">
                {hautDeGamme.map((t) => (
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
                <a className="btn btn--amber" href={lien(TRIP_BASE)}>Voir tous les circuits</a>
              </p>
            </div>
          </section>
        )}

        <Closing
          title="Dites-nous où vous voulez que l'argent aille."
          body="C'est une question plus utile qu'un budget global : à enveloppe égale, un voyage où tout est en gamme haute vaut moins qu'un voyage où deux moments le sont vraiment. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
