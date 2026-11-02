import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * The subject where marketing vocabulary is emptiest. Every agency in the
 * country sells "hors des sentiers battus", and most of them mean Sapa.
 *
 * So the page refuses the adjective and prices the thing instead: how many
 * hours of road, what the bed actually looks like, how many extra days. A
 * traveller can then decide, which is what they came for.
 *
 * Road times come from /carte-vietnam, the single source for distances on this
 * site. Legs that are not in that table are described without a figure rather
 * than with an invented one — a number nobody can check is worth less than an
 * honest "longer".
 *
 * The page ends by arguing against itself: for a first trip to Vietnam, this is
 * the wrong choice, and saying so is what makes the rest credible.
 */

const NIVEAUX = [
  {
    niveau: "1 · L'alternative évidente",
    lieux: "Baie de Lan Ha, Pu Luong",
    route: "Même accès que le site classique",
    nuit: "Écolodges, maisons d'hôtes, eau chaude",
    echange: "Presque rien — un nom moins connu au retour",
  },
  {
    niveau: "2 · Le détour assumé",
    lieux: "Lac de Ba Be, Cao Bang, chutes de Ban Gioc",
    route: "Une journée de route depuis Hanoï",
    nuit: "Auberges simples, chez l'habitant",
    echange: "Deux jours de programme et le confort hôtelier",
  },
  {
    niveau: "3 · Le vrai écart",
    lieux: "Plateau de Dong Van, boucle de Ha Giang",
    route: "6 h 30 jusqu'à Ha Giang, puis la montagne",
    nuit: "Chez l'habitant, salle de bains parfois commune",
    echange: "Trois jours, le confort, et une part d'imprévu",
  },
];

/* Uniquement des liaisons présentes dans /carte-vietnam. Les étapes de
   montagne qui suivent ne figurent pas dans cette table : elles sont décrites
   sans chiffre plutôt qu'avec un chiffre inventé. */
const ROUTES = [
  { de: "Hanoï", a: "Baie de Lan Ha", km: "185 km", route: "3 h", note: "Le classique moins fréquenté" },
  { de: "Hanoï", a: "Ninh Binh", km: "95 km", route: "2 h", note: "Très fréquenté à Tam Coc, calme ailleurs" },
  { de: "Hanoï", a: "Sapa", km: "315 km", route: "5 h 30", note: "Site de masse depuis vingt ans" },
  { de: "Hanoï", a: "Ha Giang", km: "300 km", route: "6 h 30", note: "Porte du plateau, la montagne commence après" },
  { de: "Da Nang", a: "Phong Nha", km: "300 km", route: "5 h 30", note: "Grottes majeures, fréquentation modérée" },
];

const LIEUX = [
  {
    nom: "Le plateau de Dong Van",
    quoi:
      "Des pitons karstiques à perte de vue, à la frontière chinoise, sur une route en corniche qui suit la rivière Nho Que. C'est le paysage le plus spectaculaire du pays, et celui qui demande le plus de route : six heures et demie jusqu'à Ha Giang, puis deux jours de lacets. On y dort chez l'habitant, et le marché du dimanche à Meo Vac se tient pour ceux qui y vivent, pas pour ceux qui le photographient.",
  },
  {
    nom: "Le lac de Ba Be",
    quoi:
      "Trois lacs enchâssés dans la forêt, parcourus en barque, avec des villages tay sur les rives. La fréquentation y reste faible parce que rien n'y est spectaculaire au premier regard : c'est un endroit où l'on passe deux nuits à ne pas faire grand-chose, et c'est exactement ce qui le rend précieux après dix jours de circuit.",
  },
  {
    nom: "Les chutes de Ban Gioc",
    quoi:
      "La plus grande cascade frontalière d'Asie du Sud-Est, partagée avec la Chine. Elle est connue des Vietnamiens et presque pas des Européens — on y croise des familles de Hanoï en week-end, pas des groupes. La route depuis Cao Bang traverse des vallées de rizières que personne ne photographie, ce qui est précisément le signe qu'on est au bon endroit.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("vietnam-hors-sentiers");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/vietnam-hors-sentiers" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function HorsSentiers() {
  const guide = await getGuide("vietnam-hors-sentiers");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Les circuits qui passent réellement par un lieu peu fréquenté, calculés
     depuis les étapes plutôt que listés à la main : un circuit retiré du CMS ne
     laisse pas de lien derrière lui. */
  const ECARTES = ["ha-giang", "dong-van", "cao-bang", "ban-gioc", "ba-be", "pu-luong", "mai-chau", "phong-nha", "lan-ha"];
  const concernes = trips.filter((t) => t.stops.some((s) => ECARTES.includes(s.place)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/vietnam-hors-sentiers/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Hors des sentiers battus", path: "/vietnam-hors-sentiers" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Hors des sentiers battus" }]} />
            <h1 className="d1">Le Vietnam hors des sentiers battus</h1>
            <p className="lede">
              <b>Moins de monde se paie en heures de route et en confort
              d&apos;hébergement — jamais en effort physique.</b> C&apos;est la
              seule chose utile à savoir, et c&apos;est celle que l&apos;adjectif
              « authentique » dissimule. Trois niveaux d&apos;écart existent, du
              simple changement de baie au village sans eau chaude. Voici ce que
              chacun coûte réellement, pour que vous choisissiez le vôtre.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Trois niveaux, et ce qu&apos;on échange</h2>
            <DataTable
              caption="Constaté sur nos programmes. Le niveau 1 se glisse dans n'importe quel circuit ; le niveau 3 en redéfinit la durée."
              columns={["Niveau", "Où", "Accès", "La nuit", "Ce qu'on échange"]}
              rows={NIVEAUX.map((n) => [
                <b key="n">{n.niveau}</b>,
                n.lieux,
                n.route,
                n.nuit,
                n.echange,
              ])}
              note={
                <>
                  Le niveau 1 est presque toujours le bon arbitrage, et c&apos;est
                  rarement celui qu&apos;on vend : changer de baie ne coûte rien
                  et divise la fréquentation par dix.{" "}
                  <a className="lnk" href="/halong-ou-lan-ha">
                    Halong ou Lan Ha, le détail
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="La vraie monnaie d'échange"
              title="Les heures de route, en chiffres"
              lede="Ce qui tient ces endroits à l'écart n'est ni leur beauté ni leur secret : c'est la durée du trajet. Les distances ci-dessous sont celles de notre carte du pays."
            />
            <DataTable
              caption="Liaisons principales depuis Hanoï ou Da Nang. Les étapes de montagne qui suivent se font à quarante kilomètres-heure de moyenne."
              columns={["Trajet", "Distance", "Par la route", "Fréquentation"]}
              rows={ROUTES.map((r) => [
                <b key="t">{r.de} → {r.a}</b>,
                <span className="num" key="k">{r.km}</span>,
                <span className="num" key="r">{r.route}</span>,
                r.note,
              ])}
              note={
                <>
                  Comptez deux à trois jours de plus qu&apos;un circuit classique
                  de même ambition. Ce sont des jours de route, pas de visite —
                  un programme hors des sentiers en huit jours n&apos;existe pas.{" "}
                  <a className="lnk" href="/carte-vietnam">
                    Toutes les distances du pays
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Le détail"
              title="Trois endroits qui méritent le détour"
              lede="Ils ne sont pas secrets — ils sont loin. C'est la distance qui les protège, et c'est aussi ce qui doit entrer dans votre arbitrage."
            />
            <div className="guide">
              {LIEUX.map((l) => (
                <article className="guide__bloc" key={l.nom}>
                  <h3 className="d3">{l.nom}</h3>
                  <p>{l.quoi}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Quand nous déconseillons"
              title="Pour un premier voyage, ce n'est pas le bon choix"
              lede="C'est notre conseil le plus fréquent, et celui qui nous fait perdre le plus de devis. Nous le donnons quand même."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">Un premier voyage a besoin de repères</h3>
                <p>
                  Hanoï, une baie, Hué et Hoi An ne sont pas des passages obligés
                  par paresse&nbsp;: ils donnent la mesure du pays — sa densité,
                  sa cuisine, son rapport au temps. Sans cette mesure, le plateau
                  de Dong Van est un beau paysage sans contexte.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Le hors-piste se décide au deuxième voyage</h3>
                <p>
                  C&apos;est là qu&apos;il devient précis, parce qu&apos;on sait
                  enfin ce qu&apos;on veut éviter. Les voyageurs qui nous
                  demandent Ha Giang en connaissance de cause sont presque tous
                  déjà venus en Asie — et ce sont ceux qui en reviennent le plus
                  contents.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">La mousson coupe les routes</h3>
                <p>
                  De juin à août, les glissements de terrain ferment régulièrement
                  les routes de Dong Van et de Cao Bang. Sur un itinéraire sans
                  alternative, cela signifie un programme refait sur place.
                  Octobre et novembre sont les deux meilleurs mois.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    Le calendrier des trois régions
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
              title="Ce qu'on nous demande avant de s'écarter"
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
              title="Ceux qui passent par des lieux peu fréquentés"
              lede="Calculés depuis les étapes réelles de chaque programme, pas depuis une étiquette commerciale."
            />
            <ul className="saison-liste">
              {concernes.map((t) => (
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
          title="Dites-nous ce que vous voulez éviter."
          body="C'est une question plus utile que « où voulez-vous aller » : la foule, la route, le confort sommaire — on ne peut pas tout éviter en même temps, et savoir lequel des trois compte le plus pour vous suffit à dessiner l'itinéraire. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
