import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Photo } from "@/components/Photo";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite } from "@/lib/content";

/**
 * The one page on this site where a wrong number does not cost a reader an
 * afternoon — it costs them a flight they cannot change.
 *
 * ## Where the dates come from
 *
 * Computed with Hồ Ngọc Đức's Vietnamese lunar calendar algorithm, on UTC+7.
 * The timezone is the whole point: the Vietnamese calendar resolves new moons
 * at UTC+7 and the Chinese one at UTC+8, so the two new years occasionally fall
 * on different days. 2030 is such a year — 2 February in Vietnam, 3 February in
 * China. Any page that simply copies Chinese New Year dates is wrong that year,
 * and almost every French-language page does exactly that.
 *
 * The algorithm was validated against three known years before being trusted:
 * 2024-02-10, 2025-01-29, 2026-02-17. All three match.
 *
 * ## Why the dates are a literal table and not computed at runtime
 *
 * The site is a static export. Computing "the next Tết" at build time would
 * bake whatever date was current when the build ran, and a site not rebuilt for
 * a year would then announce a Tết that has already happened. A table that
 * states five years outright is true whenever it is read.
 *
 * `scripts/check-tet.mjs` fails the build when fewer than two future dates
 * remain, so the table is extended before it runs out rather than after.
 */

/* Tết, premier jour du premier mois lunaire. Calendrier vietnamien (UTC+7).
   La colonne « Chine » n'est là que pour les années où les deux diffèrent —
   c'est la seule information de cette page qu'on ne trouve pas ailleurs. */
/* Pas exporté : Next.js n'autorise qu'une liste fixe d'exports dans un fichier
   page.tsx, et un nom inconnu fait échouer la compilation. scripts/check-tet.mjs
   lit ce fichier en texte, il n'a besoin d'aucun export. */
const TETS = [
  { annee: 2027, date: "2027-02-06", libelle: "samedi 6 février 2027", animal: "Chèvre · Đinh Mùi", chine: null },
  { annee: 2028, date: "2028-01-26", libelle: "mercredi 26 janvier 2028", animal: "Singe · Mậu Thân", chine: null },
  { annee: 2029, date: "2029-02-13", libelle: "mardi 13 février 2029", animal: "Coq · Kỷ Dậu", chine: null },
  { annee: 2030, date: "2030-02-02", libelle: "samedi 2 février 2030", animal: "Chien · Canh Tuất", chine: "3 février" },
  { annee: 2031, date: "2031-01-23", libelle: "jeudi 23 janvier 2031", animal: "Cochon · Tân Hợi", chine: null },
];

/**
 * Last day of the festival: mùng 3, so the start date plus two.
 *
 * Computed in UTC on purpose. Parsing "2027-02-06" without the explicit Z
 * makes a date in the build machine's local zone, and a build running west of
 * Greenwich would then round the result back to mùng 2. The dates themselves
 * are cut at UTC+7 upstream, where the Vietnamese calendar is defined.
 */
function finDuTet(debut: string): string {
  const d = new Date(`${debut}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 2);
  return d.toISOString().slice(0, 10);
}

const JOURS = [
  {
    quand: "J-10 à J-1",
    quoi: "Marchés aux fleurs, pêchers et kumquats sur les toits des scooters, préparation du bánh chưng",
    etat: "Tout est ouvert",
    verdict: "La meilleure période de l'année",
    bon: true,
  },
  {
    quand: "Veille (giao thừa)",
    quoi: "Les familles se rassemblent, les pagodes se remplissent peu avant minuit",
    etat: "Commerces fermés en fin de journée",
    verdict: "Saisissant, à condition d'être logé",
    bon: true,
  },
  {
    quand: "Jours 1 à 3",
    quoi: "Visites familiales, rues vides, beaucoup de rideaux baissés",
    etat: "Majorité des commerces et restaurants fermés",
    verdict: "À éviter pour un premier voyage",
    bon: false,
  },
  {
    quand: "Jours 4 à 7",
    quoi: "Réouverture progressive, d'abord les zones touristiques",
    etat: "Partiellement ouvert, horaires réduits",
    verdict: "Praticable, encore irrégulier",
    bon: false,
  },
  {
    quand: "Semaine suivante",
    quoi: "Retour à la normale en ville, transports encore saturés",
    etat: "Ouvert",
    verdict: "Normal, sauf les vols intérieurs",
    bon: true,
  },
];

const OUVERT = [
  {
    quoi: "Les hôtels et leurs restaurants",
    detail:
      "Ils ne ferment pas, et c'est ce qui rend la période praticable : vous êtes logé et nourri quoi qu'il arrive. Les équipes tournent en effectif réduit, avec une majoration versée à ceux qui travaillent ces jours-là.",
  },
  {
    quoi: "Les pagodes",
    detail:
      "Ouvertes et bondées — c'est précisément le moment où les Vietnamiens s'y rendent, encens à la main, pour la première prière de l'année. C'est le plus beau spectacle de la semaine, et il n'existe à aucune autre date.",
  },
  {
    quoi: "Les transferts privés",
    detail:
      "Organisables, à tarif majoré. Les chauffeurs aussi veulent être chez eux, et nous ne demandons à personne de travailler le premier jour sans une compensation qui le justifie. Nous le disons à l'avance plutôt que de le découvrir dans le devis.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("tet-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/tet-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function TetVietnam() {
  const guide = await getGuide("tet-vietnam");
  const site = await getSite();
  const prochain = TETS[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      /* The next Tết declared as an Event. A date a generative engine can read
         without parsing prose — and the fact most often asked for on this
         subject. `eventAttendanceMode` and a location are required for the type
         to validate; the location is the country, which is literally true.

         ## What Search Console asks for, and what it gets

         Google reports five recommended fields as missing here. Three were
         added because they can be stated truthfully: `image` (the page's own
         Tết photograph), `endDate`, and a country-level `address`.
         `endDate` covers the three days this page already calls "les trois
         jours creux" — mùng 1, 2 and 3 — which is the festival itself, not the
         public holiday whose length the Vietnamese government sets year by
         year, and which we therefore cannot know for 2027 and beyond.

         `organizer` and `performer` are deliberately left out and must stay
         out. Nobody organises the lunar new year of a country, and nobody
         performs it. Naming this agency in either field to silence a warning
         would put a false claim in machine-readable form on the one page whose
         value is that its dates are correct. Two permanent non-critical
         warnings are the right price for that. */
      {
        "@type": "Event",
        "@id": `${site.url}/tet-vietnam/#tet-${prochain.annee}`,
        name: `Tết ${prochain.annee} — Nouvel An vietnamien`,
        startDate: prochain.date,
        endDate: finDuTet(prochain.date),
        image: `${site.url}/photos/og/${guide.photo}.jpg`,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Country",
          name: "Vietnam",
          address: { "@type": "PostalAddress", addressCountry: "VN" },
        },
        description: `Premier jour de l'année lunaire vietnamienne, année du ${prochain.animal.split(" · ")[0]}.`,
        url: `${site.url}/tet-vietnam/`,
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/tet-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Tết au Vietnam", path: "/tet-vietnam" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Tết au Vietnam" }]} />
            <h1 className="d1">Tết {prochain.annee}&nbsp;: voyager pendant le Nouvel An vietnamien</h1>
            <p className="lede">
              <b>Le Tết {prochain.annee} tombe le {prochain.libelle}.</b> Pendant
              trois à quatre jours, le pays s&apos;arrête&nbsp;: commerces
              fermés, rues vides, familles rentrées chez elles. Les vols
              intérieurs sont complets des mois à l&apos;avance et leur prix
              double. <b>Mais la semaine qui précède est la plus belle de
              l&apos;année</b> — marchés aux fleurs, rues décorées, et tout
              encore ouvert. C&apos;est là que se joue l&apos;arbitrage.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Les dates jusqu&apos;en {TETS[TETS.length - 1].annee}</h2>
            <DataTable
              caption="Premier jour du premier mois lunaire, calendrier vietnamien (UTC+7). Le Tết dure officiellement plusieurs jours : la date ci-dessous est celle du premier."
              columns={["Année", "Date", "Année lunaire", "Nouvel An chinois"]}
              rows={TETS.map((t) => [
                <b key="a">{t.annee}</b>,
                t.libelle,
                t.animal,
                t.chine ? <b key="c">{t.chine} — différent</b> : "même jour",
              ])}
              note={
                <>
                  Le calendrier vietnamien calcule les nouvelles lunes sur le
                  fuseau UTC+7, le chinois sur UTC+8. Les deux Nouvel An tombent
                  donc parfois à un jour d&apos;écart — c&apos;est le cas en
                  2030. Une page qui recopie les dates chinoises se trompe cette
                  année-là.
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Jour par jour"
              title="Ce qui ferme, et quand ça rouvre"
              lede="Constaté sur nos programmes. Les fermetures varient d'une ville à l'autre et d'une année à l'autre : ce tableau décrit la règle, pas une garantie."
            />
            <DataTable
              caption="Repères autour du premier jour du Tết. Les zones très touristiques rouvrent plus tôt que les quartiers résidentiels."
              columns={["Quand", "Ce qui se passe", "Commerces", "Notre avis"]}
              rows={JOURS.map((j) => [
                <b key="q">{j.quand}</b>,
                j.quoi,
                j.etat,
                j.bon ? j.verdict : <b key="v">{j.verdict}</b>,
              ])}
              note={
                <>
                  La fenêtre à viser est donc J-10 à J-1&nbsp;: l&apos;atmosphère
                  sans les fermetures. Pour {prochain.annee}, cela veut dire
                  rentrer avant le {prochain.libelle.replace(/^\w+ /, "")}.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam/">
                    Le calendrier des trois régions
                  </a>
                </>
              }
            />
          </div>
        </section>

        {/* Les deux photos sont en `half`, donc chargées en différé : elles sont
            sous la ligne de flottaison et ne disputent rien au LCP. Elles
            illustrent les deux moments que la page recommande vraiment — la
            semaine d'avant — plutôt que le Tết lui-même, qui est précisément
            celui qu'on conseille d'éviter. */}
        <section className="sec">
          <div className="wrap wrap--wide">
            <div className="parcours">
              <figure className="parcours__photo">
                <Photo id="tet-fleurs" role="half" />
              </figure>
              <div className="parcours__txt">
                <h2 className="d2">Les marchés aux fleurs</h2>
                <p className="lede">
                  Ils s&apos;installent une semaine avant et disparaissent le
                  matin du premier jour. Pêchers roses au Nord, abricotiers
                  jaunes au Sud, kumquats chargés de fruits&nbsp;: chaque famille
                  en rapporte un, debout à l&apos;arrière du scooter.
                </p>
                <p>
                  C&apos;est l&apos;image que les voyageurs rapportent du Tết, et
                  elle se joue entièrement <b>avant</b> la fête. Une raison de
                  plus de viser la semaine qui précède plutôt que la semaine
                  même.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Ce qui reste ouvert"
              title="Trois choses sur lesquelles compter"
              lede="La semaine du Tết n'est pas impraticable. Elle est différente, et il faut savoir sur quoi s'appuyer."
            />
            <div className="guide">
              {OUVERT.map((o) => (
                <article className="guide__bloc" key={o.quoi}>
                  <h3 className="d3">{o.quoi}</h3>
                  <p>{o.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="La contrainte qui décide de tout"
              title="Réserver trois à quatre mois avant"
              lede="Ce délai n'est pas une formule commerciale. C'est la seule date de l'année où nous refusons parfois des demandes faute de disponibilités."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">Des millions de personnes rentrent chez elles</h3>
                <p>
                  Le Tết est la seule période où le pays entier se déplace en
                  même temps. Les vols intérieurs et les trains se remplissent
                  dès l&apos;ouverture des ventes, et un Hanoï–Da Nang peut
                  doubler de prix. Ce n&apos;est pas une majoration touristique,
                  c&apos;est une demande réelle.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Les hôtels ne montent pas partout pareil</h3>
                <p>
                  Les stations balnéaires fréquentées par les Vietnamiens
                  eux-mêmes montent fortement&nbsp;; les villes du Nord beaucoup
                  moins. L&apos;écart peut dépasser celui des vols, et il se
                  prévoit mal sans connaître la destination.{" "}
                  <a className="lnk" href="/budget-voyage-vietnam/">
                    Le barème des trois gammes
                  </a>
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Ce que nous facturons en plus</h3>
                <p>
                  Une majoration versée aux chauffeurs et aux guides qui
                  travaillent ces jours-là. Elle leur revient entièrement. Nous
                  l&apos;annonçons dans le devis plutôt que de la dissoudre dans
                  un prix global&nbsp;: demander à quelqu&apos;un de quitter sa
                  famille le premier jour de l&apos;année se paie.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <div className="parcours">
              <figure className="parcours__photo">
                <Photo id="tet-banh" role="half" />
              </figure>
              <div className="parcours__txt">
                <h2 className="d2">Ce qui se passe à l&apos;intérieur</h2>
                <p className="lede">
                  Pendant que les rues se vident, les familles cuisent les bánh
                  chưng au Nord, les bánh tét au Sud&nbsp;: du riz gluant, du
                  porc et des haricots mungo, enveloppés dans des feuilles de
                  bananier et cuits une nuit entière.
                </p>
                <p>
                  C&apos;est la raison pour laquelle tout ferme. Ce n&apos;est
                  pas une fête publique qu&apos;on regarde&nbsp;: c&apos;est une
                  fête de famille à laquelle on n&apos;est pas invité — sauf si
                  quelqu&apos;un vous y invite, ce qui arrive plus souvent
                  qu&apos;on ne croit.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur le Tết"
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
          title="Dites-nous vos dates, nous dirons si elles tombent mal."
          body="Si votre voyage chevauche les trois jours creux, nous le dirons et proposerons de décaler — même d'une semaine, cela change tout. Et si vous venez précisément pour le Tết, nous saurons où vous placer. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
