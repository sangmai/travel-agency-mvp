import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Photo } from "@/components/Photo";
import { Closing, Fil, JsonLd } from "@/components/ui";
import { dateFr } from "@/components/GuideMeta";
import { typo } from "@/components/Article";
import { breadcrumb } from "@/components/JsonLd";
import { getArticles, getSite, articleUrl, BLOG_BASE } from "@/lib/content";

/**
 * The index.
 *
 * It lists what exists and says what the blog is for, which on a site of
 * twenty-one guide pages is a question worth answering out loud: the guides
 * hold the recurring questions, the articles take the subjects that have no
 * page of their own. Writing the distinction down is what stops the next
 * article from being a second "quand partir".
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog — préparer un voyage au Vietnam, sujet par sujet",
    description:
      "Les sujets qui n'entrent pas dans nos guides : combiner deux pays, passer une frontière, choisir une saison contre une autre. Écrit depuis Da Nang.",
    alternates: { canonical: BLOG_BASE },
    openGraph: {
      type: "website",
      title: "Le blog de Voyage Vietnam Sur Mesure",
      description:
        "Des articles longs sur la préparation d'un voyage au Vietnam, écrits par l'équipe qui opère les circuits.",
    },
  };
}

export default async function Blog() {
  const [site, articles] = await Promise.all([getSite(), getArticles()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        "@id": `${site.url}${BLOG_BASE}/#blog`,
        name: `Blog — ${site.name}`,
        url: `${site.url}${BLOG_BASE}/`,
        inLanguage: "fr-FR",
        publisher: { "@id": `${site.url}/#organisation` },
        blogPost: articles.map((a) => ({
          "@type": "BlogPosting",
          "@id": `${site.url}${articleUrl(a.slug)}#article`,
          headline: a.title,
          url: `${site.url}${articleUrl(a.slug)}`,
          datePublished: a.datePublished,
          dateModified: a.dateModified,
        })),
      },
      breadcrumb(site.url, [{ name: "Accueil" }, { name: "Blog", path: BLOG_BASE }]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />

      <main id="contenu">
        <section className="sec sec--sand">
          <div className="wrap">
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Blog" }]} />
            <h1 className="d1">Le blog</h1>
            <p className="lede">
              <b>Les sujets qui n&apos;entrent dans aucun de nos guides.</b> Nos
              vingt-et-une pages répondent aux questions qui reviennent —
              quand partir, quel budget, quel itinéraire. Les articles prennent
              le reste : combiner deux pays, passer une frontière par le fleuve,
              décider ce qu&apos;on sacrifie quand il manque trois jours. Écrit
              depuis {site.address.city}, par ceux qui opèrent les voyages.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <ul className="art__index">
              {articles.map((a) => (
                <li key={a.slug}>
                  <a href={articleUrl(a.slug)}>
                    <figure className="fig">
                      <Photo id={a.photo} role="card" />
                    </figure>
                    <div>
                      <time dateTime={a.datePublished}>{dateFr(a.datePublished)}</time>
                      <h2 className="d3">{typo(a.title)}</h2>
                      <p>{typo(a.chapo)}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Closing
          title="Une question qu'aucun article ne traite ?"
          body="Posez-la : nous répondons nous-mêmes, depuis le Vietnam, et la réponse finit souvent par devenir un article. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
