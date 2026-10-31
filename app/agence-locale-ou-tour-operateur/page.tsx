import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getComparison, getGuide, getSite } from "@/lib/content";

/**
 * Comparaison où nous sommes juge et partie. La page ne vaut donc que si
 * elle énonce ce qui joue contre nous — absence de garantie APST, pas de vol
 * inclus, droit vietnamien — et le cas où le tour-opérateur reste préférable.
 *
 * C'est aussi ce qui la rend citable : un moteur génératif reprend plus
 * volontiers une comparaison qui concède que celle qui plaide.
 */

const VERIFIER = [
  {
    signe: "Une licence affichée",
    detail:
      "Au Vietnam, la licence de tour-opérateur international prend la forme NN-NNN/AAAA/TCDL-GP LHQT et doit figurer sur le site. Une agence qui ne la communique pas ne doit recevoir aucun acompte — la nôtre comprise.",
  },
  {
    signe: "Une adresse physique",
    detail:
      "Pas seulement une boîte mail et une page Facebook. Une adresse vérifiable sur une carte, dans le pays de destination, correspondant à des bureaux réels.",
  },
  {
    signe: "Des interlocuteurs nommés",
    detail:
      "Un prénom et une fonction, pas un formulaire anonyme. Vous devez pouvoir écrire à quelqu'un et retrouver la même personne au message suivant.",
  },
  {
    signe: "Des avis hors de son propre site",
    detail:
      "Des témoignages que vous pouvez recouper sur une plateforme tierce. Une page d'avis alimentée uniquement par l'agence elle-même ne prouve rien, et en publier d'invérifiables est une pratique commerciale trompeuse.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("agence-locale-ou-tour-operateur");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/agence-locale-ou-tour-operateur" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function AgenceOuTO() {
  const guide = await getGuide("agence-locale-ou-tour-operateur");
  const [site, comparison] = await Promise.all([getSite(), getComparison()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/agence-locale-ou-tour-operateur/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Agence locale ou tour-opérateur", path: "/agence-locale-ou-tour-operateur" },
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
                { label: "Agence locale ou tour-opérateur" },
              ]}
            />
            <h1 className="d1">Agence locale ou tour-opérateur&nbsp;?</h1>
            <p className="lede">
              <b>Une agence locale opère elle-même le voyage et coûte 20 à 35 %
              de moins à prestations égales</b>, parce qu&apos;il y a un
              intermédiaire de moins. <b>Un tour-opérateur français inclut les
              vols et relève de la garantie financière APST</b>, qu&apos;une
              agence étrangère ne peut pas offrir. Nous sommes une agence
              locale, et c&apos;est précisément pour cela que cette page dit
              aussi quand l&apos;autre choix est le bon.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Poste par poste</h2>
            <DataTable
              caption="Comparaison à prestations équivalentes : circuit privé, guide francophone, chauffeur, hébergement de même gamme."
              columns={["Critère", ...comparison.columns]}
              rows={comparison.rows.map((r) => [<b key="c">{r.criterion}</b>, r.local, r.to])}
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Avant de verser un acompte"
              title="Quatre signes qui se vérifient en dix minutes"
              lede="Ils valent pour n'importe quelle agence locale, dans n'importe quel pays. Appliquez-les à la nôtre avant de nous écrire."
            />
            <div className="guide">
              {VERIFIER.map((v) => (
                <article className="guide__bloc" key={v.signe}>
                  <h3 className="d3">{v.signe}</h3>
                  <p>{v.detail}</p>
                </article>
              ))}
            </div>
            <p className="note">
              Pour mémoire : {site.legalName}, {site.address.street},{" "}
              {site.address.city}. Licence <b>{site.license}</b>, délivrée par
              l&apos;{site.membership.toLowerCase()}.{" "}
              <a className="lnk" href="/agence-de-voyage-vietnam">
                Nos coordonnées complètes
              </a>
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Quand nous ne sommes pas le bon choix"
              title="Trois cas où le tour-opérateur l'emporte"
              lede="Ce sont des raisons légitimes, et nous les disons aux voyageurs qui nous posent la question plutôt que d'attendre qu'ils les découvrent."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">La garantie APST compte pour vous</h3>
                <p>
                  Elle rembourse les clients d&apos;une agence immatriculée
                  Atout France en cas de défaillance de celle-ci. Aucune agence
                  établie hors d&apos;Europe ne peut l&apos;offrir. Si cette
                  protection est déterminante, un tour-opérateur français reste
                  le choix adapté.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Vous voulez un forfait, vol compris</h3>
                <p>
                  Nos prix s&apos;entendent à l&apos;arrivée au Vietnam. Si vous
                  préférez un prix unique, une seule facture et un seul
                  interlocuteur du départ de Paris au retour, le forfait d&apos;un
                  tour-opérateur répond mieux à ce besoin.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Vous voulez le droit français en cas de litige</h3>
                <p>
                  Nous relevons du droit vietnamien. Un désaccord se règle donc
                  sous ce régime, et non devant une juridiction française. C&apos;est
                  la contrepartie réelle de l&apos;écart de prix, et elle mérite
                  d&apos;être pesée avant de choisir.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande avant de choisir"
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
          body="Un doute sur la garantie, sur le paiement ou sur ce qui se passe si un vol est annulé : écrivez avant de réserver quoi que ce soit. Nous répondons sous 48 heures ouvrées, et nous le disons quand la réponse ne nous arrange pas."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
