import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * Requête de comparaison, donc d'hésitation : celui qui la tape a déjà décidé
 * de partir et cherche à trancher. C'est le moment du parcours où une réponse
 * franche vaut mieux qu'un argumentaire.
 *
 * La page recommande donc explicitement le Nord dans la plupart des cas, au
 * lieu de renvoyer les deux dos à dos. Une comparaison qui ne tranche pas ne
 * sert ni le lecteur, ni le référencement : un moteur génératif reprend une
 * phrase qui conclut, pas une qui ménage.
 */

const CRITERES = [
  {
    critere: "Paysages",
    nord: "Pitons calcaires, rizières en terrasses, montagnes de Ha Giang",
    sud: "Delta plat, canaux, vergers, cocotiers",
    verdict: "nord" as const,
  },
  {
    critere: "Patrimoine",
    nord: "Hanoï, Ninh Binh, villages d'ethnies minoritaires",
    sud: "Saïgon coloniale, tunnels de Cu Chi, pagodes khmères",
    verdict: "nord" as const,
  },
  {
    critere: "Plages",
    nord: "Baignade possible de mai à septembre seulement",
    sud: "Phu Quoc et Con Dao, baignade toute l'année",
    verdict: "sud" as const,
  },
  {
    critere: "Climat en hiver",
    nord: "15 °C et crachin de décembre à février",
    sud: "28 à 32 °C et grand soleil, saison sèche",
    verdict: "sud" as const,
  },
  {
    critere: "Climat en été",
    nord: "Chaud et lourd, averses violentes",
    sud: "Averse quotidienne en fin d'après-midi, une heure",
    verdict: "égal" as const,
  },
  {
    critere: "Temps de trajet",
    nord: "Routes de montagne lentes, 3 à 5 h entre étapes",
    sud: "Distances courtes, bateau plutôt que voiture",
    verdict: "sud" as const,
  },
  {
    critere: "Dépaysement",
    nord: "Marchés ethniques, maisons sur pilotis, langue et cuisine distinctes",
    sud: "Vie fluviale, influence khmère et chinoise",
    verdict: "nord" as const,
  },
  {
    critere: "Affluence",
    nord: "Baie d'Halong très fréquentée, le reste beaucoup moins",
    sud: "Delta aux heures creuses, Phu Quoc saturé en hiver",
    verdict: "égal" as const,
  },
];

const PROFILS = [
  {
    titre: "Choisissez le Nord si…",
    coul: "nord",
    points: [
      "C'est votre premier voyage au Vietnam.",
      "Vous partez entre octobre et avril.",
      "Vous venez pour les paysages et la marche.",
      "Vous voulez voir des rizières en terrasses — elles n'existent qu'au Nord.",
      "Vous aimez les villes qui ont une vieille ville.",
    ],
  },
  {
    titre: "Choisissez le Sud si…",
    coul: "sud",
    points: [
      "Vous voyagez en décembre ou janvier et voulez du soleil garanti.",
      "Vous terminez par une semaine de plage.",
      "Vous avez des enfants en bas âge : les trajets sont plus courts.",
      "Vous supportez mal le froid humide.",
      "Vous êtes déjà allé au Nord.",
    ],
  },
];

const QUESTIONS = [
  {
    q: "Nord ou Sud Vietnam : que choisir si je n'ai que dix jours ?",
    a: "Le Nord, dans la plupart des cas. En dix jours, traverser le pays revient à passer trois journées dans les transports pour effleurer chaque région. Le Nord concentre dans un rayon de 300 kilomètres ce que les voyageurs viennent chercher : Hanoï, la baie d'Halong ou de Lan Ha, Ninh Binh, et les rizières en terrasses qui n'existent nulle part ailleurs au Vietnam. Le Sud devient le meilleur choix si vous partez en décembre ou janvier et tenez à la plage.",
  },
  {
    q: "Peut-on faire les deux en quinze jours ?",
    a: "Oui, à condition d'accepter deux vols intérieurs et de renoncer au Centre ou de n'en garder qu'une étape. Quinze jours suffisent pour Hanoï, la baie, Hoi An et le delta du Mékong, en comptant environ une journée et demie de déplacements. En dessous de treize jours, le parcours devient une succession d'aéroports.",
  },
  {
    q: "Quelle est la vraie différence entre le Nord et le Sud ?",
    a: "Le relief et le climat, qui commandent tout le reste. Le Nord est montagneux et connaît quatre saisons, dont un véritable hiver à 15 °C. Le Sud est plat, sillonné de canaux, et ne descend jamais sous 26 °C. De là découlent deux voyages différents : on marche au Nord, on navigue au Sud. La cuisine, l'architecture et jusqu'à l'accent en portent la trace.",
  },
  {
    q: "Et le Centre, faut-il le sacrifier ?",
    a: "Pas si vos dates le permettent. Hué et Hoi An sont les deux plus belles villes du pays et se visitent en quatre jours à elles deux. Le vrai motif de les écarter n'est pas le temps mais la saison : d'octobre à décembre, le Centre est en pleine saison des pluies et Hoi An est régulièrement inondé, alors que le Nord et le Sud sont au mieux de leur forme.",
  },
  {
    q: "Le Sud est-il moins intéressant que le Nord ?",
    a: "Non, mais il est moins spectaculaire au premier regard. Le delta du Mékong ne se livre pas en une journée d'excursion depuis Hô Chi Minh-Ville : il demande d'y dormir, de prendre les bacs, de longer les canaux au petit matin quand les marchés flottants fonctionnent vraiment. Les voyageurs qui en reviennent déçus sont presque toujours ceux qui l'ont fait en aller-retour dans la journée.",
  },
];

const LABEL = { nord: "Nord", sud: "Sud", "égal": "Égalité" };

export const metadata: Metadata = {
  title: "Nord ou Sud Vietnam : lequel choisir ?",
  description:
    "Le Nord si c'est votre premier voyage ou si vous partez entre octobre et avril. Le Sud en décembre-janvier et pour la plage. Comparatif critère par critère.",
  alternates: { canonical: "/nord-ou-sud-vietnam" },
  openGraph: {
    type: "article",
    images: [{ url: "/photos/og/ninhbinh.jpg", width: 1200, height: 630, alt: "Pitons calcaires de Ninh Binh" }],
    title: "Nord ou Sud Vietnam : lequel choisir ?",
    description:
      "Paysages, climat, trajets, plages : le comparatif qui tranche, selon la saison et le temps dont vous disposez.",
  },
};

export default async function NordOuSud() {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/nord-ou-sud-vietnam/#faq`,
        mainEntity: QUESTIONS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Nord ou Sud Vietnam", path: "/nord-ou-sud-vietnam" },
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
              items={[{ label: "Accueil", href: "/" }, { label: "Nord ou Sud Vietnam" }]}
            />
            <h1 className="d1">Nord ou Sud Vietnam&nbsp;?</h1>
            <p className="lede">
              <b>Le Nord, si c&apos;est votre premier voyage au Vietnam ou si
              vous partez entre octobre et avril.</b> Il concentre dans un rayon
              de 300 kilomètres la baie d&apos;Halong, Ninh Binh, Hanoï et les
              rizières en terrasses — qui n&apos;existent nulle part ailleurs
              dans le pays. <b>Le Sud l&apos;emporte en décembre et janvier</b>,
              quand le Nord est à 15 °C sous le crachin et que le delta du
              Mékong est au plus beau. Voici le détail, critère par critère.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Huit critères, et qui l&apos;emporte</h2>
            <DataTable
              caption="Comparatif Nord / Sud du Vietnam. La colonne de droite indique la région que nous recommandons sur ce critère précis."
              columns={["Critère", "Le Nord", "Le Sud", "Avantage"]}
              rows={CRITERES.map((c) => [
                c.critere,
                c.nord,
                c.sud,
                <b key="v">{LABEL[c.verdict]}</b>,
              ])}
              note={
                <>
                  Le Centre — Hué, Hoi An, Da Nang — n&apos;entre pas dans ce
                  comparatif parce qu&apos;il ne se choisit pas contre les deux
                  autres : il se traverse entre les deux.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    Le calendrier des trois régions
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Trancher"
              title="À qui s'adresse chacune des deux"
              lede="Si plusieurs lignes d'une colonne vous décrivent, vous avez votre réponse. Si les deux vous parlent autant, c'est que votre voyage dure assez longtemps pour les faire toutes les deux."
            />
            <div className="guide">
              {PROFILS.map((p) => (
                <article className="guide__bloc" key={p.titre}>
                  <h3 className="d3">{p.titre}</h3>
                  <ul className="profil">
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande avant de choisir"
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
            {/* Pas de filtre « circuits du Nord » : un seul de nos circuits
                reste au Nord, les autres traversent. Afficher la région
                couverte par chacun répond mieux à la question posée que de
                ranger de force des parcours entiers dans une colonne. */}
            <SectionHead
              kicker="Nos circuits"
              title="Et les régions que chacun couvre"
              lede="Chaque fiche détaille le programme jour par jour, les temps de trajet réels et ce que le prix comprend."
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
              <a className="btn btn--amber" href={TRIP_BASE}>Voir tous les circuits</a>
            </p>
          </div>
        </section>

        <Closing
          title="Toujours indécis ? C'est bon signe."
          body="Dites-nous vos dates et ce qui vous attire, nous vous dirons franchement laquelle des deux régions sert le mieux votre voyage — quitte à vous conseiller de revenir pour l'autre."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
