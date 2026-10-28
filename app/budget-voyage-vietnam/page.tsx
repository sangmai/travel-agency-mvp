import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BudgetTable } from "@/components/Budget";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * Deuxième requête informationnelle du marché après la saisonnalité.
 *
 * Le réflexe du métier est de répondre « sur devis ». C'est exactement ce qui
 * fait sortir une agence des réponses génératives : un modèle ne peut citer
 * que des chiffres. Donner des fourchettes engage, mais c'est la condition
 * pour exister sur la question que tout le monde pose en premier.
 */

const POSTES = [
  {
    poste: "Vols internationaux",
    fourchette: "600 – 950 €",
    detail:
      "Paris–Hanoï ou Paris–Hô Chi Minh-Ville aller-retour, avec une escale. Le prix suit le calendrier scolaire français plus que la météo vietnamienne : juillet-août et Noël sont les pointes. Réserver quatre à six mois à l'avance fait gagner 150 à 250 €.",
  },
  {
    poste: "Hébergement",
    fourchette: "25 – 180 € / nuit",
    detail:
      "Une maison d'hôtes correcte avec petit-déjeuner tourne autour de 25 à 40 € la chambre double. Un boutique-hôtel de charme à Hoi An ou Hanoï, 60 à 110 €. Les adresses de la gamme signature — anciennes demeures coloniales, lodges isolés — démarrent à 180 €.",
  },
  {
    poste: "Guide francophone",
    fourchette: "45 – 70 € / jour",
    detail:
      "Pour le groupe, pas par personne : à deux ou à six, c'est le même tarif. C'est le poste qui sépare le plus nettement un circuit privé d'un voyage organisé seul, et celui dont les voyageurs nous disent le plus souvent qu'ils ne l'auraient pas supprimé.",
  },
  {
    poste: "Voiture et chauffeur",
    fourchette: "55 – 90 € / jour",
    detail:
      "Également pour le groupe. Comprend le carburant, les péages et le logement du chauffeur. Sur les longues liaisons, un vol intérieur revient souvent moins cher qu'une journée de route — et rend une journée au voyage.",
  },
  {
    poste: "Vols intérieurs",
    fourchette: "40 – 110 € / trajet",
    detail:
      "Hanoï–Da Nang ou Da Nang–Hô Chi Minh-Ville. Trois vols intérieurs sur un circuit de quinze jours sont un arbitrage courant : environ 250 € par personne, contre deux jours et demi passés sur la route.",
  },
  {
    poste: "Repas",
    fourchette: "10 – 25 € / jour",
    detail:
      "Un phở de rue coûte 1,50 à 2,50 €, un repas complet dans un restaurant de quartier 5 à 8 €, une table réputée de Hanoï 20 à 35 €. C'est le poste où l'on dépense le moins et où l'on se souvient le plus.",
  },
  {
    poste: "Entrées et activités",
    fourchette: "8 – 20 € / jour",
    detail:
      "Cité impériale de Hué 5 €, sanctuaire de My Son 6 €, croisière d'une nuit en baie de Lan Ha 90 à 160 € selon le bateau. Les grottes de Phong Nha et les sorties en kayak sont les postes les plus variables.",
  },
  {
    poste: "Visa",
    fourchette: "25 – 50 €",
    detail:
      "E-visa de 90 jours demandé en ligne. Les ressortissants français en sont exemptés pour un séjour de 45 jours au plus — une exemption reconduite d'année en année, qu'il faut vérifier à la date du départ.",
  },
];

const QUESTIONS = [
  {
    q: "Quel budget pour deux semaines au Vietnam ?",
    a: "Entre 1 200 et 1 700 € par personne en gamme charme, hors vols internationaux, sur une base de deux voyageurs en chambre double. En gamme confort, comptez 800 à 1 100 €. Les vols Paris–Hanoï ajoutent 600 à 950 € selon la saison. Ces montants comprennent l'hébergement, le guide francophone, le chauffeur privé, les transferts, les petits-déjeuners et les entrées des sites prévus au programme.",
  },
  {
    q: "Pourquoi le prix par personne baisse-t-il quand on est plus nombreux ?",
    a: "Parce que le guide et le véhicule sont facturés au groupe, pas à la personne. Ce sont les deux plus gros postes après l'hébergement : à quatre, ils se divisent par deux par rapport à un couple. Un même circuit peut ainsi passer de 1 450 € à 1 050 € par personne sans rien changer au programme ni à la gamme d'hôtels.",
  },
  {
    q: "Le Vietnam est-il plus cher que la Thaïlande ?",
    a: "À prestation équivalente, non — le Vietnam reste 10 à 20 % en dessous sur l'hébergement et la restauration. L'écart se resserre sur les circuits privés avec guide, car les guides francophones y sont moins nombreux qu'en Thaïlande et donc mieux rémunérés. Sur le vol international, les deux destinations se valent.",
  },
  {
    q: "Combien faut-il prévoir d'argent de poche ?",
    a: "De 15 à 30 € par jour et par personne suffisent largement pour les déjeuners, les dîners, les boissons et quelques achats. Les cartes bancaires passent dans les hôtels et les restaurants des villes, beaucoup moins dans les campagnes et les marchés : prévoyez des espèces pour les étapes rurales.",
  },
  {
    q: "Faut-il prévoir des pourboires ?",
    a: "Ils ne sont pas obligatoires et ne figurent dans aucun de nos devis, mais l'usage existe pour le guide et le chauffeur en fin de circuit. L'ordre de grandeur pratiqué est de 3 à 5 € par jour et par voyageur pour le guide, la moitié pour le chauffeur. Nous le disons sans détour pour que personne ne se trouve embarrassé le dernier jour.",
  },
  {
    q: "Qu'est-ce qui n'est jamais compris dans le prix annoncé ?",
    a: "Les vols internationaux, l'assurance voyage, les déjeuners et dîners libres, les boissons, les pourboires et les dépenses personnelles. Chaque fiche circuit porte la liste exacte de ce qui est compris et de ce qui ne l'est pas — nous préférons une liste longue à une mauvaise surprise au moment du solde.",
  },
];

export const metadata: Metadata = {
  title: "Budget d'un voyage au Vietnam : prix réels poste par poste",
  description:
    "1 200 à 1 700 € par personne pour quinze jours en gamme charme, hors vols. Fourchettes détaillées : hébergement, guide, chauffeur, vols intérieurs, repas, visa.",
  alternates: { canonical: "/budget-voyage-vietnam" },
  openGraph: {
    type: "article",
    title: "Combien coûte un voyage au Vietnam ?",
    description:
      "Le détail poste par poste d'un circuit privé au Vietnam, avec des fourchettes plutôt qu'un « sur devis ».",
  },
};

export default async function BudgetPage() {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/budget-voyage-vietnam/#faq`,
        mainEntity: QUESTIONS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Budget d'un voyage au Vietnam", path: "/budget-voyage-vietnam" },
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
                { label: "Budget d'un voyage au Vietnam" },
              ]}
            />
            <h1 className="d1">Quel budget pour un voyage au Vietnam ?</h1>
            <p className="lede">
              <b>Comptez 1 200 à 1 700 € par personne pour quinze jours en
              gamme charme</b>, hors vols internationaux, sur une base de deux
              voyageurs. En gamme confort, le budget descend à 800 – 1 100 €.
              Les vols Paris–Hanoï s&apos;ajoutent, entre 600 et 950 € selon la
              saison. Ci-dessous, le détail de chaque poste : nous préférons
              donner des fourchettes vérifiables plutôt qu&apos;un « sur devis »
              qui n&apos;aide personne à décider.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Les trois gammes</h2>
            <BudgetTable
              note={
                <>
                  Trois leviers font bouger ces fourchettes : la saison, la
                  gamme d&apos;hébergement, et le nombre de vols intérieurs
                  retenus face aux trajets par la route.
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Poste par poste"
              title="Où part l'argent, exactement"
              lede="Les prix ci-dessous sont ceux que nous payons sur place, pas des moyennes trouvées en ligne. Deux postes — le guide et le véhicule — sont facturés au groupe : c'est ce qui fait baisser le prix par personne quand on voyage à quatre."
            />
            <DataTable
              caption="Fourchettes constatées en 2026 sur nos circuits privés. Par personne sauf mention contraire."
              columns={["Poste", "Fourchette", "Ce qu'il faut savoir"]}
              rows={POSTES.map((p) => [
                p.poste,
                <span className="num" key="f">{p.fourchette}</span>,
                p.detail,
              ])}
            />
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur le prix"
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
              kicker="Nos circuits"
              title="Les prix de départ, sans astérisque"
              lede="Chaque prix s'entend par personne, base deux voyageurs en chambre double, hors vols internationaux. La fiche de chaque circuit détaille ce qui est compris et ce qui ne l'est pas."
            />
            <ul className="saison-liste">
              {trips.map((t) => (
                <li key={t.slug}>
                  <a href={tripUrl(t.slug)}>
                    <b>{t.name}</b>
                    <span>{t.days} jours · {t.confort}</span>
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
          title="Un budget en tête ? Dites-le-nous."
          body="Donnez-nous votre enveloppe et vos dates : nous construisons le meilleur itinéraire possible dedans, ou nous vous disons franchement que ce n'est pas tenable. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
