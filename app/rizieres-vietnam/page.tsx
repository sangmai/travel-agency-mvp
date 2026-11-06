import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Bande } from "@/components/Bande";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getSite, getTrips, tripUrl, getGuide } from "@/lib/content";

/**
 * The seasons of the northern terraces.
 *
 * ## Why this page and not a festival page
 *
 * The obvious neighbours — the Da Nang fireworks, the Hue festival, the Dalat
 * flower season — share a shape that does not pay here. They draw traffic for
 * six weeks a year, they need an `Event` node whose `endDate` expires and then
 * reports errors in Search Console every year it is not rewritten, and the
 * person typing the query is usually already in the country, adding an evening
 * to a trip that is booked. A season answers a different question: *which
 * month do I travel in*, which is one step from the quote form.
 *
 * It also had to point somewhere real. Of the famous terraces, Sapa and Mu Cang
 * Chai appear in no itinerary we publish; Pu Luong carries "Montagnes et baies
 * du Nord" and the Dong Van plateau carries "Vietnam authentique, hors
 * sentiers". So the page is built on those two, and says plainly where the
 * famous names stand rather than pretending they are on offer. Writing the
 * crowded ones up would have sent the reader to a dead end — the exact failure
 * a travel page can least afford.
 *
 * ## The admission in the last question
 *
 * A valley is never uniformly gold: families cut their own plot when it is
 * ready, so the real thing is a patchwork and the photographs are the best day
 * of the best slope. Saying so costs a little romance and buys the only thing
 * this site has to sell, which is being believed.
 */

const MASSIFS = [
  {
    nom: "Pu Luong",
    lieux: "Province de Thanh Hoa · environ 1 000 m · 4 h de Hanoï",
    reponse: "Deux moissons par an, début juin et fin septembre.",
    corps:
      "C'est le seul massif que nous programmons à donner deux récoltes, parce qu'il est bas : à mille mètres, deux cycles de riz tiennent dans une année là où Sapa n'en laisse passer qu'un. Les terrasses s'étagent autour de villages thaï blancs montés sur pilotis, et les norias de bambou qui remontent l'eau tournent encore. La réserve n'a pas de ville, pas de téléphérique et pas de marché à touristes : on y dort chez l'habitant ou dans de petites maisons d'hôtes au-dessus des rizières.",
  },
  {
    nom: "Hoang Su Phi",
    lieux: "Ouest de la province de Ha Giang · 1 000 à 1 500 m",
    reponse: "Mise en eau en mai, moisson de mi-septembre à début octobre.",
    corps:
      "Les plus hautes terrasses encore cultivées à la main du nord du Vietnam, classées patrimoine national, et pourtant presque vides en comparaison de Sapa — la route y est longue et c'est précisément ce qui les protège. Les versants sont plus raides qu'ailleurs, l'étagement plus serré, et la brume de fin de matinée monte des vallées et passe entre les niveaux. Hoang Su Phi est à l'ouest de Ha Giang, à l'opposé de la boucle de Dong Van : c'est un détour, pas une étape sur le chemin.",
  },
  {
    nom: "Sapa et Mu Cang Chai",
    lieux: "Provinces de Lao Cai et Yen Bai · 900 à 1 600 m",
    reponse: "Dorées début septembre à Sapa, mi-septembre à Mu Cang Chai.",
    corps:
      "Ce sont les deux noms que tout le monde connaît, et ils méritent leur réputation : la vallée de Muong Hoa et le versant de La Pan Tan sont parmi les plus beaux paysages agricoles d'Asie. Mais Sapa est devenue une ville de béton bâtie trop vite en altitude, et la dernière quinzaine de septembre y amène une fréquentation que peu de voyageurs imaginent. Nous ne les inscrivons dans aucun de nos circuits. Si vous y tenez, dites-le : c'est une étape à construire, pas à décocher sur un programme existant.",
  },
];

const SAISONS = [
  ["Pu Luong", "≈ 1 000 m", "Fin avril à mai", "Début juin, puis fin septembre", "Faible"],
  ["Hoang Su Phi", "1 000 – 1 500 m", "Mai à début juin", "Mi-septembre à début octobre", "Faible"],
  ["Mu Cang Chai", "900 – 1 500 m", "Mi-mai à mi-juin", "Mi-septembre à début octobre", "Forte"],
  ["Sapa", "1 000 – 1 600 m", "Mai à juin", "Début à mi-septembre", "Très forte"],
];

const FLEURS = [
  ["Sarrasin", "Plateau de Dong Van, Meo Vac", "Fin octobre à début décembre", "Blanc puis rose, puis violet sur la pierre grise"],
  ["Moutarde jaune", "Vallées de Ha Giang", "Novembre et décembre", "Des champs entiers d'un jaune franc, en fond de vallée"],
  ["Pruniers et pêchers", "Ha Giang, Moc Chau", "Janvier et février", "La floraison blanche et rose qui annonce le Tết"],
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("rizieres-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/rizieres-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function Rizieres() {
  const guide = await getGuide("rizieres-vietnam");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* The two itineraries that actually reach the terraces and the buckwheat
     plateau. Filtered rather than hard-coded: if a slug is renamed the section
     empties instead of linking to a 404. */
  const concernes = trips.filter((t) =>
    ["montagnes-et-baies-du-nord", "vietnam-authentique-hors-sentiers"].includes(t.slug),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/rizieres-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Rizières en terrasses", path: "/rizieres-vietnam" },
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
                { label: "Rizières en terrasses" },
              ]}
            />
            <h1 className="d1">Les rizières en terrasses du Nord</h1>
            <p className="lede">
              <b>Les terrasses sont dorées de la mi-septembre au début octobre,
              et en eau de mai à la mi-juin</b> — deux paysages sans rapport
              l&apos;un avec l&apos;autre, sur les mêmes versants. Le reste de
              l&apos;année, le vert est uniforme et l&apos;étagement des
              parcelles ne se lit presque plus. C&apos;est donc l&apos;une des
              rares raisons valables de fixer ses dates avant son itinéraire,
              plutôt que l&apos;inverse.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Massif par massif, les deux fenêtres</h2>
            <DataTable
              caption="Mise en eau et moisson des terrasses du nord du Vietnam"
              columns={["Massif", "Altitude", "Terrasses en eau", "Moisson dorée", "Fréquentation"]}
              rows={SAISONS}
              note={
                <>
                  Ces dates se déplacent d&apos;une à deux semaines selon
                  l&apos;année : c&apos;est la météo du printemps qui fixe la
                  date du repiquage, et la moisson suit. Nous confirmons la
                  fenêtre de votre année de départ dans le devis, avec nos
                  équipes sur place.
                </>
              }
            />
            <Bande id="rizieres" />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Où regarder"
              title="Trois massifs, trois calendriers"
              lede="Les plus connus ne sont pas les plus beaux, et surtout pas les plus calmes. Voici ce que chacun donne, et à quelle date."
            />
            <div className="guide">
              {MASSIFS.map((m) => (
                <article className="guide__bloc" key={m.nom}>
                  <h3 className="d3">{m.nom}</h3>
                  <p className="guide__lieux">{m.lieux}</p>
                  <p className="guide__rep"><b>{m.reponse}</b></p>
                  <p>{m.corps}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Après la moisson"
              title="Le sarrasin prend le relais"
              lede="La saison des fleurs du Nord commence là où celle du riz s'arrête. Un départ de fin septembre ou d'octobre attrape les deux."
            />
            <p>
              Le plateau karstique de Dong Van, tout au nord de Ha Giang, ne
              porte presque pas de terrasses : c&apos;est un pays de pierre où
              le maïs pousse dans les creux de roche. Ce que l&apos;on y vient
              voir en automne, ce sont les champs de sarrasin, semés après la
              récolte. Ils s&apos;ouvrent blancs, virent au rose en une
              quinzaine, puis au violet avant de sécher.
            </p>
            <DataTable
              caption="Les floraisons du Nord, de l'automne au Tết"
              columns={["Floraison", "Où", "Quand", "Ce que cela donne"]}
              rows={FLEURS}
            />
            {/* Buckwheat in flower, which is what this section is about, and
                what the alt text says — no province. Pexels states no location
                for it and its own tags name three that contradict each other,
                so the picture is evidence of the plant and the season, not of
                the place. It stays below the table rather than beside the
                paragraph for that reason: next to the sentence about the Dong
                Van karst, a ridge of green hills would have read as a claim
                about Dong Van. */}
            <Bande id="sarrasin" />
          </div>
        </section>

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur les rizières"
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
              kicker="Les circuits concernés"
              title="Deux programmes calés sur ces saisons"
              lede="L'un passe par les terrasses de Pu Luong, l'autre par le plateau à sarrasin de Dong Van. Tous deux ouvrent de mars à mai et de septembre à novembre, ce qui n'est pas un hasard."
            />
            <ul className="saison-liste">
              {concernes.map((t) => (
                <li key={t.slug}>
                  <a href={tripUrl(t.slug)}>
                    <b>{t.name}</b>
                    <span>{t.days} jours · {t.saison}</span>
                  </a>
                  <PriceFrom amount={t.priceFrom} />
                </li>
              ))}
            </ul>
            <p className="cta-row">
              <a className="btn btn--amber" href="/quand-partir-au-vietnam">
                Le calendrier des douze mois
              </a>
            </p>
          </div>
        </section>

        <Closing
          title="Vous visez la moisson ? Partons de la date."
          body="Dites-nous votre fenêtre de départ : nous plaçons l'étape dans les terrasses au plus près de la récolte, et nous construisons le reste autour. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
