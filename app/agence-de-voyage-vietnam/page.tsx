import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb, orgId } from "@/components/JsonLd";
import { getComparison, getSite, getGuide } from "@/lib/content";

/**
 * Trust page. It is the only one on the site that talks about the agency
 * itself, and therefore the only one where nothing can be invented: a licence
 * number, an address and names are verified in thirty seconds, and one
 * invention discovered here discredits everything else.
 *
 * It consequently carries no founding story, no biography and no reputation
 * figures — we have none that are verifiable. Everything on it comes from
 * content/site.json, which mirrors what the agency already publishes.
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


export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("agence-de-voyage-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/agence-de-voyage-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function Agence() {
  const guide = await getGuide("agence-de-voyage-vietnam");
  const [site, comparison] = await Promise.all([getSite(), getComparison()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "AboutPage",
        "@id": `${site.url}/agence-de-voyage-vietnam/#page`,
        name: `Qui sommes-nous — ${site.name}`,
        mainEntity: { "@id": orgId(site.url) },
      },
      {
        "@type": "FAQPage",
        "@id": `${site.url}/agence-de-voyage-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
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
              <b>{site.name} est la marque francophone de {site.operator.name},
              agence de voyage installée à {site.address.city} et titulaire de la
              licence de tour-opérateur international {site.operator.license}</b>,
              délivrée par l&apos;{site.operator.membership.toLowerCase()}.{" "}
              {site.operator.name} conçoit et opère elle-même les circuits
              privés sur mesure au Vietnam, au Laos et au Cambodge&nbsp;: c&apos;est
              avec elle que vous contractez et à elle que vous réglez. Cette page
              réunit ce qui se vérifie avant de verser un acompte à une agence
              située à l&apos;autre bout du monde.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        {/* The NAP must be identical here, in the footer, in the JSON-LD and on
            the Google Business Profile: any variation dilutes the signal. */}
        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Nos coordonnées, en clair</h2>
            <DataTable
              caption="Informations légales et contact. Elles doivent correspondre exactement à celles de notre fiche Google et de nos documents contractuels."
              columns={["", "Détail"]}
              rows={[
                ["Marque du site", <b key="m">{site.name}</b>],
                ["Agence qui opère les voyages", <b key="n">{site.operator.legalName}</b>],
                ["Licence tour-opérateur international", <b key="l">{site.operator.license}</b>],
                ["Autorité", site.operator.membership],
                ["En activité depuis", site.operator.founded],
                [
                  "Site de l'agence",
                  <a key="u" className="lnk" href={site.operator.url} rel="noopener">
                    {site.operator.url.replace(/^https?:\/\//, "")}
                  </a>,
                ],
                [
                  "Adresse",
                  `${site.address.street}, ${site.address.city}, ${site.address.countryName}`,
                ],
                [
                  "Téléphone",
                  <a key="t" href={`tel:${site.phone}`}>{site.phoneDisplay}</a>,
                ],
                [
                  "WhatsApp",
                  <a
                    key="w"
                    href={`https://wa.me/${site.whatsapp.replace(/\D/g, "")}`}
                    rel="noopener"
                  >
                    {site.whatsapp}
                  </a>,
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
          title="Posez-nous la question qui vous retient."
          body="Un doute sur le paiement, l'assurance, la licence ou ce qui se passe si un vol est annulé : écrivez-nous avant de réserver quoi que ce soit. Nous répondons sous 48 heures ouvrées, et nous le disons quand la réponse ne vous arrange pas."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
