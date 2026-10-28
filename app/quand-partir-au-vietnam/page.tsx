import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SeasonTable } from "@/components/WhenToGo";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

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

const QUESTIONS = [
  {
    q: "Quel est le meilleur mois pour un circuit du Nord au Sud ?",
    a: "Mars et avril. Ce sont les deux seuls mois où les trois régions sont simultanément sèches et tempérées : le crachin du Nord est terminé, le Centre n'est pas encore dans sa saison des pluies, et le Sud reste dans sa saison sèche. Octobre et novembre sont excellents au Nord mais correspondent au pic des pluies au Centre, ce qui oblige à y écourter le séjour.",
  },
  {
    q: "Quand voir les rizières en terrasses de Sapa et Mu Cang Chai ?",
    a: "Deux fenêtres, très différentes. En mai et juin, les terrasses sont en eau et réfléchissent le ciel comme des miroirs. De la mi-septembre au début octobre, elles virent à l'or avant la moisson — c'est la période la plus photographiée, et la plus fréquentée. Entre les deux, de juillet à août, le vert est uniforme et l'étagement des parcelles se lit beaucoup moins.",
  },
  {
    q: "Faut-il éviter le Vietnam pendant le Têt ?",
    a: "Non, mais il faut le savoir. Le nouvel an lunaire tombe entre la fin janvier et la mi-février selon les années, et occupe une semaine pendant laquelle les familles se déplacent en masse : trains et vols intérieurs se remplissent des mois à l'avance, les tarifs montent, et beaucoup de commerces ferment deux à trois jours. En échange, le pays est décoré, les marchés aux fleurs sont magnifiques et l'ambiance n'a aucun équivalent le reste de l'année. Nous indiquons la date exacte de votre année de départ dans le devis.",
  },
  {
    q: "Peut-on visiter la baie d'Halong en hiver ?",
    a: "Oui, et l'on y gagne le calme. De décembre à février, la baie est souvent prise dans une brume qui estompe les pitons et que beaucoup de voyageurs trouvent plus belle que le plein soleil. En revanche la baignade est exclue, il fait 15 à 18 °C, et une croisière peut être annulée par la capitainerie en cas de coup de vent — une éventualité à prévoir dans le programme plutôt qu'à découvrir sur place.",
  },
  {
    q: "La saison des pluies rend-elle le voyage impossible ?",
    a: "Presque jamais, sauf au Centre en octobre-novembre. Ailleurs, la pluie tropicale tombe en averses courtes et prévisibles, le plus souvent en fin de journée, et non en bruine continue. Le vrai motif de prudence n'est pas la pluie elle-même mais les typhons, qui touchent la côte centrale de septembre à novembre et peuvent fermer un aéroport pendant vingt-quatre heures.",
  },
  {
    q: "Quand les prix sont-ils les plus bas ?",
    a: "De mai à septembre, hors Têt et hors vacances scolaires françaises. C'est la basse saison touristique au Nord et au Sud : les hébergements sont moins chers et les sites nettement moins fréquentés. Les vols Paris-Hanoï suivent plutôt le calendrier scolaire français, avec des pointes en juillet-août et à Noël quelle que soit la météo sur place.",
  },
];

export const metadata: Metadata = {
  title: "Quand partir au Vietnam ?",
  description:
    "Mars et avril pour traverser tout le pays. Le Centre est sec quand le Nord et le Sud sont humides : le tableau des douze mois, région par région.",
  alternates: { canonical: "/quand-partir-au-vietnam" },
  openGraph: {
    type: "article",
    images: [{ url: "/photos/og/rizieres.jpg", width: 1200, height: 630, alt: "Rizières en terrasses du nord du Vietnam" }],
    title: "Quand partir au Vietnam ? Le guide mois par mois",
    description:
      "Les trois régions du Vietnam n'ont pas la même saison. Tableau complet des douze mois, et ce qu'il faut en déduire pour son itinéraire.",
  },
};

export default async function QuandPartir() {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/quand-partir-au-vietnam/#faq`,
        mainEntity: QUESTIONS.map((f) => ({
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
              {QUESTIONS.map((f) => (
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
