import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SeasonTable } from "@/components/WhenToGo";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getSite, getTrips, tripUrl, TRIP_BASE, getGuide } from "@/lib/content";

/**
 * « Quand partir au Vietnam » est la requête informationnelle la plus
 * volumineuse du marché français sur cette destination, et le point d'entrée
 * de la plupart des parcours d'achat. La page d'accueil en porte un résumé ;
 * ici le sujet est traité en entier, car une section d'accueil ne dispute
 * jamais le classement à une page dédiée.
 *
 * Chaque titre est suivi d'une réponse directe avant la nuance : c'est la
 * forme qu'un moteur génératif reprend. Les mois sont écrits en toutes
 * lettres plutôt qu'en plages (« de novembre à avril » plutôt que « nov-avr »)
 * pour que la phrase reste citable hors de son tableau.
 */

const REGIONS = [
  {
    nom: "Le Nord",
    lieux: "Hanoï, baie d'Halong, Sapa, Ha Giang, Ninh Binh",
    reponse: "D'octobre à novembre, puis de mars à avril.",
    corps:
      "Le Nord est la seule région du pays à connaître un véritable hiver. De décembre à février, Hanoï tourne autour de 15 °C sous un crachin tenace, et Sapa peut descendre sous les 5 °C — il y neige exceptionnellement. L'été, de juin à août, est chaud et lourd, avec des averses brèves mais violentes qui rendent les pistes de Ha Giang difficiles. Restent deux fenêtres sèches et lumineuses, de part et d'autre : octobre-novembre, le plus sûr, et mars-avril, légèrement plus brumeux sur la baie.",
  },
  {
    nom: "Le Centre",
    lieux: "Hué, Hoi An, Da Nang, Phong Nha",
    reponse: "De février à août, sans hésitation.",
    corps:
      "Le Centre inverse le calendrier du reste du pays : il est sec quand le Nord et le Sud sont humides. Sa saison des pluies va de septembre à décembre et culmine en octobre-novembre, période où le vieux Hoi An est régulièrement inondé — les commerçants y circulent en barque, ce qui a son charme mais ferme les rues. C'est aussi la saison des typhons sur cette côte. Un circuit traversant le pays en octobre doit donc raccourcir le Centre, ou l'aborder par Phong Nha, à l'intérieur des terres.",
  },
  {
    nom: "Le Sud",
    lieux: "Hô Chi Minh-Ville, delta du Mékong, Phu Quoc",
    reponse: "De novembre à avril, et le reste de l'année sans drame.",
    corps:
      "Le Sud ne connaît que deux saisons et jamais le froid : il fait entre 26 et 34 °C toute l'année. La saison sèche, de novembre à avril, est la plus confortable. La saison des pluies, de mai à octobre, mérite d'être relativisée : il s'agit d'une averse en fin d'après-midi, une heure environ, après quoi la lumière revient. Le delta du Mékong est même plus beau à ce moment-là, les canaux étant hauts. Seul Phu Quoc est réellement pénalisé, la mer y devenant agitée de juillet à septembre.",
  },
];


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("quand-partir-au-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/quand-partir-au-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function QuandPartir() {
  const guide = await getGuide("quand-partir-au-vietnam");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/quand-partir-au-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Quand partir au Vietnam", path: "/quand-partir-au-vietnam" },
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
                { label: "Quand partir au Vietnam" },
              ]}
            />
            <h1 className="d1">Quand partir au Vietnam ?</h1>
            <p className="lede">
              <b>Mars et avril sont les deux meilleurs mois pour traverser le
              pays du nord au sud</b>, parce que ce sont les seuls où les trois
              régions sont sèches en même temps. Le Vietnam s&apos;étire sur
              1 650 kilomètres et couvre trois climats distincts : le Centre est
              sec quand le Nord et le Sud sont humides, et l&apos;inverse. Il
              n&apos;existe donc pas de mauvaise période — seulement un
              itinéraire à accorder au mois choisi.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Les douze mois, région par région</h2>
            <SeasonTable />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Les trois climats"
              title="Pourquoi une seule réponse ne suffit pas"
              lede="Un voyageur qui ne fait que le Nord et un voyageur qui traverse tout le pays n'ont pas le même calendrier. Voici la saison propre à chaque région, et ce qui s'y joue."
            />
            <div className="guide">
              {REGIONS.map((r) => (
                <article className="guide__bloc" key={r.nom}>
                  <h3 className="d3">{r.nom}</h3>
                  <p className="guide__lieux">{r.lieux}</p>
                  <p className="guide__rep"><b>{r.reponse}</b></p>
                  <p>{r.corps}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur les saisons"
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
              kicker="Passer à l'itinéraire"
              title="Nos circuits, et le mois qui leur va"
              lede="Chaque circuit porte sa propre fenêtre idéale, indiquée sur sa fiche. Dites-nous vos dates : nous adaptons le parcours à la saison plutôt que l'inverse."
            />
            <ul className="saison-liste">
              {trips.map((t) => (
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
              <a className="btn btn--amber" href={TRIP_BASE}>Voir tous les circuits</a>
            </p>
          </div>
        </section>

        <Closing
          title="Vos dates sont fixées ? Partons de là."
          body="Donnez-nous votre mois de départ : nous construisons l'itinéraire autour, en évitant les régions qui ne s'y prêtent pas. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
