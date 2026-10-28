import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { breadcrumb, orgId } from "@/components/JsonLd";
import { getComparison, getSite } from "@/lib/content";

/**
 * Page de confiance. C'est la seule du site qui parle de l'agence elle-même,
 * donc la seule où rien ne peut être inventé : un numéro de licence, une
 * adresse et des noms se vérifient en trente secondes, et une invention
 * découverte ici décrédibilise tout le reste.
 *
 * Elle ne contient par conséquent aucune histoire de fondation, aucune
 * biographie et aucun chiffre de notoriété — nous n'en avons pas de
 * vérifiable. Tout ce qui s'y trouve vient de content/site.json, qui reprend
 * ce que l'agence publie déjà.
 */

const LIMITES = [
  {
    titre: "Les vols internationaux ne sont pas inclus",
    texte:
      "Nos prix s'entendent à l'arrivée au Vietnam. Nous pouvons vous conseiller sur les itinéraires aériens, mais vous achetez vos billets vous-même — ce qui vous laisse libre d'utiliser des miles, de partir d'une autre ville ou de prolonger ailleurs.",
  },
  {
    titre: "Nous relevons du droit vietnamien",
    texte:
      "La garantie financière de l'APST, qui protège les clients des agences immatriculées Atout France, ne s'applique pas à une agence établie au Vietnam. C'est la contrepartie réelle du prix : nous la disons avant la vente, pas après. Notre licence de tour-opérateur international reste, elle, vérifiable auprès de l'administration vietnamienne.",
  },
  {
    titre: "Nous ne publions pas de note globale",
    texte:
      "Les avis figurent sur la fiche du voyage concerné, et la moyenne qui s'y affiche est calculée sur ces avis-là. Une note d'agence agrégée sur plusieurs centaines d'avis invérifiables ne nous paraît pas une information : c'est un argument.",
  },
  {
    titre: "Le décalage horaire joue contre vous le matin",
    texte:
      "Il y a cinq à six heures d'écart avec la France selon la saison. Nos bureaux ouvrent quand votre journée commence à peine, et ferment vers midi heure française. En pratique, un message envoyé le soir en France trouve une réponse le lendemain matin.",
  },
];

const QUESTIONS = [
  {
    q: "Comment vérifier qu'une agence de voyage au Vietnam est légale ?",
    a: "Par son numéro de licence de tour-opérateur international, délivré par l'administration nationale du tourisme vietnamienne. Il se présente sous la forme NN-NNN/AAAA/TCDL-GP LHQT et doit être affiché par l'agence. Le nôtre est le 48-049/2015/TCDL-GP LHQT. Une agence qui ne le communique pas, ou qui ne donne qu'une adresse e-mail et un compte Facebook, ne doit pas recevoir d'acompte.",
  },
  {
    q: "Quelle différence entre une agence locale et un tour-opérateur français ?",
    a: "Le nombre d'intermédiaires. Un tour-opérateur basé en France sous-traite l'exécution à une agence réceptive vietnamienne : vous payez sa marge d'intermédiation, de l'ordre de 20 à 35 % à prestation égale, et vos demandes transitent par deux structures. Une agence locale opère elle-même. En contrepartie, elle ne relève pas du droit français et ne vend pas de forfait avec vol inclus.",
  },
  {
    q: "Qui répond quand j'écris ?",
    a: "Un conseiller nommé, le même du premier message jusqu'à votre retour. L'équipe tient dans une page : vous n'êtes jamais renvoyé d'un service à l'autre, et la personne qui a construit votre itinéraire est celle qui le corrige.",
  },
  {
    q: "Que se passe-t-il si quelque chose tourne mal sur place ?",
    a: "Nous sommes dans le même fuseau horaire que vous pendant le voyage, et non à cinq heures de décalage. Un hôtel qui ne convient pas, un vol annulé, un guide qui déçoit : la décision se prend dans l'heure parce qu'elle se prend sur place, par les gens qui ont réservé.",
  },
  {
    q: "Comment se passe le paiement depuis la France ?",
    a: "Un acompte confirme la réservation, le solde se règle avant le départ. Le détail, le calendrier et le barème d'annulation figurent en clair dans les conditions communiquées avec le devis — nous préférons que vous les lisiez avant de verser quoi que ce soit.",
  },
];

export const metadata: Metadata = {
  title: "Agence de voyage locale au Vietnam — licence, équipe et adresse",
  description:
    "Agence francophone installée à Da Nang, licence de tour-opérateur international 48-049/2015/TCDL-GP LHQT. Qui répond, où nous sommes, et ce que nous ne faisons pas.",
  alternates: { canonical: "/agence-de-voyage-vietnam" },
  openGraph: {
    type: "article",
    title: "Qui sommes-nous — agence locale au Vietnam",
    description:
      "Licence, adresse, équipe et limites assumées. Les informations qu'on vérifie avant de verser un acompte.",
  },
};

export default async function Agence() {
  const [site, comparison] = await Promise.all([getSite(), getComparison()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${site.url}/agence-de-voyage-vietnam/#page`,
        name: `Qui sommes-nous — ${site.name}`,
        mainEntity: { "@id": orgId(site.url) },
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/agence-de-voyage-vietnam/#faq`,
        mainEntity: QUESTIONS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Qui sommes-nous", path: "/agence-de-voyage-vietnam" },
      ]),
    ],
  };

  const jours = "du lundi au vendredi";

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />

      <main id="contenu">
        <section className="sec sec--sand">
          <div className="wrap">
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Qui sommes-nous" }]} />
            <h1 className="d1">Une agence locale, au Vietnam</h1>
            <p className="lede">
              <b>{site.legalName} est une agence de voyage francophone installée
              à {site.address.city}, titulaire de la licence de tour-opérateur
              international {site.license}</b>, délivrée par l&apos;
              {site.membership.toLowerCase()}. Nous concevons et opérons
              nous-mêmes des circuits privés sur mesure au Vietnam, au Laos et
              au Cambodge. Cette page réunit ce qui se vérifie avant de verser
              un acompte à une agence située à l&apos;autre bout du monde.
            </p>
          </div>
        </section>

        {/* Le NAP doit être identique ici, dans le pied de page, dans le
            JSON-LD et sur la fiche Google : toute variation dilue le signal. */}
        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Nos coordonnées, en clair</h2>
            <DataTable
              caption="Informations légales et contact. Elles doivent correspondre exactement à celles de notre fiche Google et de nos documents contractuels."
              columns={["", "Détail"]}
              rows={[
                ["Raison sociale", <b key="n">{site.legalName}</b>],
                ["Licence tour-opérateur international", <b key="l">{site.license}</b>],
                ["Autorité", site.membership],
                ["En activité depuis", site.founded],
                [
                  "Adresse",
                  `${site.address.street}, ${site.address.city}, ${site.address.countryName}`,
                ],
                [
                  "Téléphone et WhatsApp",
                  <a key="t" href={`tel:${site.phone}`}>{site.phoneDisplay}</a>,
                ],
                ["Second numéro", site.phoneAlt],
                ["E-mail", <a key="e" href={`mailto:${site.email}`}>{site.email}</a>],
                [
                  "Horaires",
                  `${site.hours.opens}–${site.hours.closes}, ${jours}, heure du Vietnam (UTC+7)`,
                ],
                ["Langues de travail", site.languages.join(", ")],
              ]}
              note={
                <>
                  Le numéro de licence se vérifie auprès de
                  l&apos;administration vietnamienne du tourisme. Une agence qui
                  ne communique pas le sien ne devrait recevoir aucun acompte —
                  la nôtre comprise.
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--jade">
          <div className="wrap">
            <SectionHead
              kicker="Qui vous répond"
              title="L'équipe tient dans une page"
              lede="Le même interlocuteur du premier message jusqu'à votre retour. La personne qui construit votre itinéraire est celle qui le corrige, et celle que vous appelez si quelque chose coince sur place."
            />
            <ul className="equipe">
              {site.team.map((m) => (
                <li key={m.name}>
                  <b>{m.name}</b>
                  <span>{m.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Agence locale ou tour-opérateur&nbsp;?</h2>
            <p className="lede">
              La différence n&apos;est pas une question de qualité mais de
              chaîne : combien de structures se tiennent entre vous et la
              personne qui réserve l&apos;hôtel.
            </p>
            <DataTable
              caption="Comparaison à prestations équivalentes : circuit privé, guide francophone, chauffeur, hébergement de même gamme."
              columns={["", ...comparison.columns]}
              rows={comparison.rows.map((r) => [
                <b key="c">{r.criterion}</b>,
                r.local,
                r.to,
              ])}
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Ce que nous ne faisons pas"
              title="Les limites, dites avant la vente"
              lede="Elles sont réelles et elles comptent. Une agence qui ne les énonce pas vous les fera découvrir au mauvais moment."
            />
            <div className="guide">
              {LIMITES.map((l) => (
                <article className="guide__bloc" key={l.titre}>
                  <h3 className="d3">{l.titre}</h3>
                  <p>{l.texte}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande avant de nous faire confiance"
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
          title="Posez-nous la question qui vous retient."
          body="Un doute sur le paiement, l'assurance, la licence ou ce qui se passe si un vol est annulé : écrivez-nous avant de réserver quoi que ce soit. Nous répondons sous 48 heures ouvrées, et nous le disons quand la réponse ne vous arrange pas."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
