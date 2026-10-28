import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getSite } from "@/lib/content";

/**
 * La seule page du site où une erreur coûte un avion raté.
 *
 * Deux conséquences sur la façon de l'écrire. D'abord la date de vérification
 * est écrite en dur et non calculée : un horodatage qui avance tout seul à
 * chaque build affirmerait une vérification qui n'a pas eu lieu. Ensuite la
 * source officielle est citée en toutes lettres plutôt que résumée, pour que
 * le lecteur puisse constater lui-même si la règle a bougé depuis.
 *
 * Les règles d'entrée au Vietnam ont changé trois fois depuis 2022. Cette
 * page doit être relue à chaque saison, pas écrite une fois pour toutes.
 */
const VERIFIE_LE = "28 octobre 2026";
const SOURCE =
  "https://www.diplomatie.gouv.fr/fr/information-par-pays/vietnam/conseils-aux-voyageurs-entree-sejour";

const CAS = [
  {
    duree: "45 jours ou moins",
    besoin: "Aucun visa",
    detail:
      "Dispense pour les ressortissants français depuis le 15 août 2023, quel que soit le motif du voyage. Les jours d'entrée et de sortie comptent tous les deux dans les 45.",
  },
  {
    duree: "Plus de 45 jours",
    besoin: "E-visa",
    detail:
      "Jusqu'à 90 jours, à entrées multiples. Demande en ligne sur le portail national de l'immigration, avant le départ.",
  },
  {
    duree: "Séjour fractionné",
    besoin: "À vérifier",
    detail:
      "Un circuit qui sort du pays puis y revient — Cambodge, Laos — relève de règles qui ont changé plusieurs fois. Nous confirmons le cas de chaque voyageur au moment du devis plutôt que de l'énoncer ici.",
  },
];

const QUESTIONS = [
  {
    q: "Faut-il un visa pour le Vietnam quand on est français ?",
    a: "Non, pas pour un séjour de 45 jours ou moins. Les ressortissants français en sont dispensés depuis le 15 août 2023, quel que soit le motif du voyage. Au-delà de 45 jours, un e-visa est nécessaire. Le passeport doit dans tous les cas être valable au moins six mois à la date d'entrée sur le territoire vietnamien.",
  },
  {
    q: "Les 45 jours comptent-ils le jour d'arrivée et le jour de départ ?",
    a: "Oui, les deux. Un vol qui atterrit le 1er du mois et un vol qui repart le 15 font quinze jours décomptés, pas treize. C'est l'erreur la plus fréquente sur les séjours longs, et le dépassement est sanctionné par une amende à la sortie du territoire, parfois assortie d'une interdiction de retour.",
  },
  {
    q: "Où demander l'e-visa, et combien coûte-t-il ?",
    a: "Uniquement sur le portail national de l'immigration du Vietnam. Le tarif officiel se règle en dollars américains et se situe autour de 25 $ pour une entrée simple et 50 $ pour des entrées multiples. Des dizaines de sites commerciaux se présentent comme officiels et facturent trois à cinq fois ce montant pour remplir le même formulaire : vérifiez que l'adresse se termine bien par .gov.vn.",
  },
  {
    q: "Quel délai prévoir pour obtenir l'e-visa ?",
    a: "Trois jours ouvrés selon le texte officiel, mais prévoyez une à deux semaines. Les délais s'allongent autour du Têt et pendant la haute saison, et une photo non conforme suffit à faire repartir le dossier de zéro. Ne prenez pas vos billets non remboursables avant d'avoir le document en main.",
  },
  {
    q: "Mon passeport doit-il être valable combien de temps ?",
    a: "Au moins six mois à compter de la date d'entrée au Vietnam, et non de la date de retour. Un passeport qui expire cinq mois après l'arrivée fait refuser l'embarquement dès Paris — la compagnie aérienne contrôle avant la police vietnamienne, parce que c'est elle qui devrait assurer le retour.",
  },
  {
    q: "Les enfants ont-ils besoin de leur propre document ?",
    a: "Oui. Chaque enfant, quel que soit son âge, doit avoir son passeport individuel valable six mois, et bénéficie de la même dispense de 45 jours. L'inscription d'un enfant sur le passeport d'un parent n'existe plus en France. Pour un mineur voyageant avec un seul parent, prévoyez en plus une autorisation de sortie du territoire et le livret de famille.",
  },
];

export const metadata: Metadata = {
  title: "Visa Vietnam : dispense 45 jours",
  description:
    "Dispense de visa pour les ressortissants français depuis le 15 août 2023, séjours de 45 jours maximum. E-visa 90 jours au-delà, passeport valable six mois.",
  alternates: { canonical: "/visa-vietnam" },
  openGraph: {
    type: "article",
    images: [{ url: "/photos/og/hanoi.jpg", width: 1200, height: 630, alt: "Vieille ville de Hanoï" }],
    title: "Faut-il un visa pour le Vietnam ?",
    description:
      "Dispense jusqu'à 45 jours pour les Français, e-visa au-delà. Ce qu'il faut vérifier avant de réserver.",
  },
};

export default async function Visa() {
  const site = await getSite();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/visa-vietnam/#faq`,
        mainEntity: QUESTIONS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Visa et formalités", path: "/visa-vietnam" },
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
              items={[{ label: "Accueil", href: "/" }, { label: "Visa et formalités" }]}
            />
            <h1 className="d1">Faut-il un visa pour le Vietnam ?</h1>
            <p className="lede">
              <b>Non, pas pour un séjour de 45 jours ou moins.</b> Les
              ressortissants français en sont dispensés depuis le 15 août 2023,
              quel que soit le motif du voyage. Au-delà, un e-visa de 90 jours à
              entrées multiples se demande en ligne. Dans tous les cas, le
              passeport doit être valable <b>au moins six mois à la date
              d&apos;entrée</b> — pas à la date du retour.
            </p>
            <p className="maj">
              Vérifié le {VERIFIE_LE} auprès du{" "}
              <a className="lnk" href={SOURCE} rel="noopener">
                ministère de l&apos;Europe et des Affaires étrangères
              </a>
              . Les règles d&apos;entrée au Vietnam ont changé trois fois depuis
              2022 : confirmez-les à la date de votre départ.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Ce qu&apos;il vous faut, selon la durée</h2>
            <DataTable
              caption="Formalités d'entrée au Vietnam pour un ressortissant français."
              columns={["Durée du séjour", "Document", "Détail"]}
              rows={CAS.map((c) => [c.duree, <b key="b">{c.besoin}</b>, c.detail])}
              note={
                <>
                  La dispense vaut pour les ressortissants français. Un
                  voyageur d&apos;une autre nationalité dans le même groupe peut
                  relever d&apos;un régime différent : signalez-le-nous au moment
                  du devis, nous vérifions pour chaque passeport.
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Le piège à connaître"
              title="Les faux sites officiels"
              lede="C'est, de loin, le motif de réclamation le plus fréquent sur les formalités vietnamiennes."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">Comment ils fonctionnent</h3>
                <p>
                  Des dizaines de sites commerciaux achètent les premières
                  places publicitaires sur « e-visa Vietnam », reprennent les
                  couleurs d&apos;un site d&apos;État et facturent 80 à 150 € un
                  formulaire officiel qui en coûte 25 à 50 $. Certains se
                  contentent de recopier votre demande sur le vrai portail ;
                  d&apos;autres encaissent sans rien déposer.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Comment les reconnaître</h3>
                <p>
                  Un seul critère tient : l&apos;adresse du site se termine par{" "}
                  <b>.gov.vn</b>. Tout le reste — mentions « officiel »,
                  drapeaux, numéros de service — s&apos;imite sans peine. Le
                  paiement officiel se fait en dollars américains et la réponse
                  arrive par courriel sous forme de PDF à imprimer.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Ce que nous faisons</h3>
                <p>
                  Nous ne demandons pas le visa à votre place et ne facturons
                  aucun frais de dossier : la démarche se fait en vingt minutes
                  et vous n&apos;avez pas à nous confier votre passeport. Nous
                  vous envoyons le lien du portail officiel avec le devis, et
                  nous relisons votre dossier avant envoi si vous le souhaitez.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur les formalités"
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
          title="Un doute sur votre situation ?"
          body="Nationalité particulière, passeport bientôt périmé, circuit qui passe par le Cambodge : écrivez-nous avant de réserver vos vols. Nous vérifions, et nous le disons si quelque chose ne passe pas."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
