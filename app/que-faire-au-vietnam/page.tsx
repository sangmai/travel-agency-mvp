import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Photo } from "@/components/Photo";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getSite, getTrips, tripUrl, TRIP_BASE, type PlaceId } from "@/lib/content";

/**
 * Requête très large, donc très disputée. L'angle qui nous distingue n'est pas
 * la liste — tout le monde cite la baie d'Halong — mais la durée conseillée et
 * ce que chaque étape demande réellement : c'est ce qu'une agence sur place
 * sait et qu'un comparateur ne peut pas inventer.
 *
 * Chaque expérience renvoie vers le circuit qui passe réellement par ce lieu,
 * calculé depuis les étapes du contenu. Un circuit retiré du CMS ne laisse
 * donc pas de lien pendant derrière lui.
 */

type Experience = {
  lieu: PlaceId;
  titre: string;
  photo: string;
  duree: string;
  texte: string;
};

const EXPERIENCES: Experience[] = [
  {
    lieu: "lan-ha",
    titre: "Dormir en baie de Lan Ha",
    photo: "halong",
    duree: "1 nuit à bord",
    texte:
      "La baie voisine d'Halong, dans le même massif karstique mais sans la file des jonques. On y nage depuis le bateau au petit matin, avant que les autres embarcations n'arrivent. C'est la seule étape où nous conseillons de ne dormir qu'une nuit : elle se vit en vingt-quatre heures.",
  },
  {
    lieu: "ninh-binh",
    titre: "Ramer entre les pitons de Ninh Binh",
    photo: "ninhbinh",
    duree: "2 nuits",
    texte:
      "Les mêmes reliefs calcaires qu'en baie d'Halong, mais sortant des rizières au lieu de la mer. On y circule en barque menée à la rame — souvent aux pieds — entre les falaises et sous les grottes. À vélo entre deux villages, c'est l'une des plus belles journées du Nord.",
  },
  {
    lieu: "ha-giang",
    titre: "Parcourir la boucle de Ha Giang",
    photo: "hagiang",
    duree: "4 jours minimum",
    texte:
      "La route la plus spectaculaire du pays, le long de la frontière chinoise : cols à 1 500 mètres, marchés hmong et villages de pierre du plateau de Dong Van. Il faut quatre jours pleins et accepter des journées de route longues ; en échange, on croise peu de voyageurs.",
  },
  {
    lieu: "sapa",
    titre: "Marcher dans les rizières en terrasses",
    photo: "rizieres",
    duree: "2 à 3 jours",
    texte:
      "Elles n'existent qu'au Nord. En eau de mai à juin, elles réfléchissent le ciel ; dorées de mi-septembre à début octobre, juste avant la moisson. Pu Luong offre les mêmes paysages que Sapa avec une fraction des visiteurs, et des marches plus douces.",
  },
  {
    lieu: "hanoi",
    titre: "Se perdre dans le vieux Hanoï",
    photo: "hanoi",
    duree: "3 nuits",
    texte:
      "Trente-six rues de corporations, chacune autrefois dédiée à un métier, où l'on s'assoit sur un tabouret de plastique pour manger un bún chả au charbon de bois. Trois nuits ne sont pas de trop : la ville se livre le matin tôt, autour du lac, et le soir après la fermeture des échoppes.",
  },
  {
    lieu: "hue",
    titre: "Traverser la cité impériale de Hué",
    photo: "hue",
    duree: "2 nuits",
    texte:
      "L'ancienne capitale des Nguyen, sa citadelle et les tombeaux impériaux dispersés le long de la rivière des Parfums. Le site a beaucoup souffert de la guerre et la restauration se poursuit : c'est ce qui le rend émouvant plutôt que décevant, à condition qu'on vous l'explique.",
  },
  {
    lieu: "hoi-an",
    titre: "Voir Hoi An après le départ des cars",
    photo: "hoian",
    duree: "3 nuits",
    texte:
      "La vieille ville est magnifique et saturée entre dix heures et seize heures. Elle redevient elle-même tôt le matin et à la nuit tombée, quand les lanternes s'allument. Trois nuits permettent aussi la plage d'An Bang et les villages de maraîchers autour.",
  },
  {
    lieu: "phong-nha",
    titre: "Descendre dans les grottes de Phong Nha",
    photo: "phongnha",
    duree: "2 nuits",
    texte:
      "Le plus grand réseau karstique d'Asie du Sud-Est, classé à l'Unesco. Paradise Cave se parcourt sur passerelle sans difficulté ; Hang En demande deux jours de marche et une nuit sous tente. Étape rare dans les circuits classiques, et l'une des plus marquantes.",
  },
  {
    lieu: "can-tho",
    titre: "Arriver au marché flottant avant le jour",
    photo: "mekong",
    duree: "2 nuits",
    texte:
      "Cai Rang fonctionne vraiment entre cinq et sept heures, quand les grossistes échangent depuis leurs barques. Après neuf heures, il ne reste que les bateaux à touristes. C'est la raison pour laquelle le delta se dort et ne se visite pas en excursion d'une journée depuis Saïgon.",
  },
  {
    lieu: "hcmc",
    titre: "Manger dans la rue à Hô Chi Minh-Ville",
    photo: "cuisine",
    duree: "2 nuits",
    texte:
      "La cuisine du Sud est plus sucrée, plus herbacée et plus métissée que celle du Nord. Un bánh mì à Saïgon, un hủ tiếu au petit-déjeuner, un café à l'œuf hérité du Nord : deux soirées suffisent à comprendre que ce n'est pas le même pays culinaire.",
  },
  {
    lieu: "phu-quoc",
    titre: "Finir par la plage à Phu Quoc",
    photo: "phuquoc",
    duree: "3 à 5 nuits",
    texte:
      "Baignade toute l'année, sauf de juillet à septembre où la mer se creuse. L'île s'est beaucoup construite au nord ; le sud et l'est gardent des plages calmes. À envisager seulement si vous avez dix-huit jours ou plus — sinon elle se prend sur le reste.",
  },
];

const PAR_REGION = [
  {
    region: "Le Nord",
    incontournable: "Baie de Lan Ha, Ninh Binh, vieux Hanoï",
    sivousavez: "Ha Giang ou Pu Luong",
    duree: "6 à 9 jours",
  },
  {
    region: "Le Centre",
    incontournable: "Hué, Hoi An",
    sivousavez: "Phong Nha, col des Nuages",
    duree: "4 à 6 jours",
  },
  {
    region: "Le Sud",
    incontournable: "Delta du Mékong, Hô Chi Minh-Ville",
    sivousavez: "Phu Quoc, Con Dao",
    duree: "3 à 7 jours",
  },
];

const QUESTIONS = [
  {
    q: "Que faire au Vietnam en priorité si c'est la première fois ?",
    a: "Hanoï, une nuit en baie de Lan Ha, Ninh Binh, Hué, Hoi An et le delta du Mékong. Ces six étapes couvrent les trois régions, les trois climats et les trois cuisines du pays, et tiennent en quinze jours avec deux vols intérieurs. Tout le reste — Ha Giang, Phong Nha, les îles — mérite un second voyage plutôt qu'un raccourcissement du premier.",
  },
  {
    q: "La baie d'Halong vaut-elle encore le détour ?",
    a: "Oui, mais passez par la baie de Lan Ha. C'est le même massif karstique, immédiatement au sud, avec une fraction des bateaux. La baie d'Halong proprement dite concentre plusieurs centaines de jonques sur quelques itinéraires balisés ; Lan Ha offre les mêmes paysages, la baignade en plus et l'embouteillage en moins.",
  },
  {
    q: "Peut-on voir des rizières en terrasses toute l'année ?",
    a: "Elles sont là toute l'année, mais ne se ressemblent pas. En eau de mai à juin, elles font miroir. Dorées de la mi-septembre au début octobre, juste avant la moisson — c'est la période la plus photographiée. Entre les deux, le vert est uniforme et l'étagement des parcelles se lit beaucoup moins bien.",
  },
  {
    q: "Quelles expériences ne figurent pas dans les circuits classiques ?",
    a: "Phong Nha et ses grottes, la boucle de Ha Giang, Pu Luong, Ba Be et Cao Bang. Toutes demandent du temps de route, ce qui explique leur absence des programmes de douze jours. Elles valent d'être ajoutées dès que le séjour dépasse quinze jours, ou de remplacer une étape classique si vous êtes déjà venu.",
  },
  {
    q: "Que faire au Vietnam avec des enfants ?",
    a: "Les barques de Ninh Binh, le vélo dans les rizières, la nuit sur un bateau en baie de Lan Ha, un atelier de cuisine ou de lanternes à Hoi An, et le delta du Mékong qui se parcourt en bateau plutôt qu'en voiture. L'écueil n'est pas l'intérêt des étapes mais les temps de route : avec de jeunes enfants, nous ne dépassons pas trois heures par jour.",
  },
];

export const metadata: Metadata = {
  title: "Que faire au Vietnam ? 11 expériences",
  description:
    "Lan Ha plutôt qu'Halong, rizières de Pu Luong, marché flottant de Cai Rang à l'aube : onze expériences et le temps que chacune demande.",
  alternates: { canonical: "/que-faire-au-vietnam" },
  openGraph: {
    type: "article",
    images: [{ url: "/photos/og/hoian.jpg", width: 1200, height: 630, alt: "Vieille ville de Hoi An" }],
    title: "Que faire au Vietnam ?",
    description:
      "Onze expériences, la durée que chacune demande, et le circuit qui y passe.",
  },
};

export default async function QueFaire() {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Le lien de chaque expérience vient des étapes réelles des circuits : si
     plus aucun ne passe par ce lieu, la carte renvoie vers la liste plutôt
     que vers une page qui ne le propose pas.

     Parmi ceux qui conviennent, le plus court l'emporte. Prendre le premier
     venu renvoyait sept cartes sur onze vers la même traversée de quinze
     jours : un circuit de dix jours centré sur le Nord répond mieux à « que
     faire à Ninh Binh », et le maillage interne cesse de se concentrer sur
     une seule fiche. */
  const parDuree = [...trips].sort((a, b) => a.days - b.days);
  const circuitPour = (lieu: PlaceId) =>
    parDuree.find((t) => t.stops.some((s) => s.place === lieu));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/que-faire-au-vietnam/#faq`,
        mainEntity: QUESTIONS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${site.url}/que-faire-au-vietnam/#experiences`,
        name: "Que faire au Vietnam",
        numberOfItems: EXPERIENCES.length,
        itemListElement: EXPERIENCES.map((e, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: e.titre,
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Que faire au Vietnam", path: "/que-faire-au-vietnam" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Que faire au Vietnam" }]} />
            <h1 className="d1">Que faire au Vietnam&nbsp;?</h1>
            <p className="lede">
              <b>Dormir en baie de Lan Ha, ramer entre les pitons de Ninh Binh,
              marcher dans les rizières en terrasses, traverser la cité
              impériale de Hué et arriver au marché flottant de Cai Rang avant
              le jour.</b> Ces cinq étapes tiennent en quinze jours et couvrent
              les trois régions. Ci-dessous, onze expériences avec la durée que
              chacune demande réellement — c&apos;est ce qui manque le plus
              souvent aux listes, et c&apos;est ce qui décide d&apos;un
              itinéraire.
            </p>
          </div>
        </section>

        <section className="sec" id="experiences">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Onze expériences"
              title="Et le temps que chacune demande"
              lede="Les durées sont celles que nous prévoyons dans nos programmes, nuits sur place comprises. Chaque carte renvoie vers un circuit qui passe réellement par cette étape."
            />
            <ul className="tiles">
              {EXPERIENCES.map((e) => {
                const circuit = circuitPour(e.lieu);
                return (
                  <li className="tile" key={e.lieu + e.titre}>
                    <a href={circuit ? tripUrl(circuit.slug) : TRIP_BASE}>
                      <span className="tile__fig">
                        <Photo id={e.photo} role="card" />
                      </span>
                      <span className="tile__body">
                        <span className="d3">{e.titre}</span>
                        <span className="tile__facts">{e.duree}</span>
                        <span className="tile__line">{e.texte}</span>
                        <span className="tile__go">
                          {circuit ? `Au programme de « ${circuit.name} » →` : "Voir les circuits →"}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <h2 className="d2">Combien de jours par région</h2>
            <DataTable
              caption="Durées conseillées hors trajets internationaux, pour un circuit privé."
              columns={["Région", "À ne pas manquer", "Si vous avez plus de temps", "Durée conseillée"]}
              rows={PAR_REGION.map((r) => [
                <b key="r">{r.region}</b>,
                r.incontournable,
                r.sivousavez,
                r.duree,
              ])}
              note={
                <>
                  Additionnées, ces durées dépassent trois semaines : c&apos;est
                  voulu. Personne ne fait tout en un voyage, et vouloir le faire
                  est la façon la plus sûre de n&apos;en garder que la fatigue.{" "}
                  <a className="lnk" href="/itineraire-vietnam">
                    Les itinéraires par durée
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande avant de choisir les étapes"
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

        <Closing
          title="Dites-nous ce qui vous attire."
          body="Nous construisons le parcours autour de ce qui vous a arrêté dans cette page, en respectant les durées qui rendent chaque étape utile. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
