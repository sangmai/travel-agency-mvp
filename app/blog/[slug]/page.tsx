import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Bande } from "@/components/Bande";
import { Corps, ancre, enligne, typo } from "@/components/Article";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { GuideMeta } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getArticles, getSite, articleUrl, BLOG_BASE, lien } from "@/lib/content";

/**
 * One article.
 *
 * ## Why a blog at all, next to twenty-one guide pages
 *
 * Not for keywords — the guides already hold the queries that matter, and a
 * second page on a subject one of them owns would take traffic from it rather
 * than add any. What a blog adds is a date. Generative engines weight recency
 * heavily, and a guide page updated in place looks the same from outside
 * whether it was revised yesterday or never; a stream of dated articles is the
 * one signal that cannot be faked by editing a timestamp.
 *
 * So the rule for what belongs here: a subject no guide page already answers.
 * The first one, combining Vietnam with Cambodia, supports a circuit we sell
 * and had no page of its own.
 */

export async function generateStaticParams() {
  return (await getArticles()).map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = (await getArticles()).find((x) => x.slug === slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.description,
    alternates: { canonical: `${BLOG_BASE}/${a.slug}` },
    openGraph: {
      type: "article",
      title: a.ogTitle,
      description: a.ogDescription,
      publishedTime: a.datePublished,
      modifiedTime: a.dateModified,
      images: [{ url: `/photos/og/${a.photo}.jpg`, width: 1200, height: 630, alt: a.photoAlt }],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [site, articles] = await Promise.all([getSite(), getArticles()]);
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const url = `${site.url}${articleUrl(article.slug)}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.description,
        url,
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        inLanguage: "fr-FR",
        /* Named author or the agency itself — never a name invented to fill a
           field, same rule as the guide pages. */
        author: article.author
          ? { "@type": "Person", name: article.author }
          : { "@id": `${site.url}/#organisation` },
        publisher: { "@id": `${site.url}/#organisation` },
        image: `${site.url}/photos/og/${article.photo}.jpg`,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: article.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Blog", path: BLOG_BASE },
        { name: article.title, path: `${BLOG_BASE}/${article.slug}` },
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
                { label: "Blog", href: lien(BLOG_BASE) },
                { label: article.title },
              ]}
            />
            <h1 className="d1">{typo(article.title)}</h1>
            <p className="lede">{enligne(article.lede)}</p>
            <GuideMeta guide={article} />

            {/* A table of contents on an article of this length is navigation,
                not decoration: it is also what lets an answer engine address a
                section instead of the whole page. */}
            <nav className="art__sommaire" aria-label="Sommaire">
              <ol>
                {article.sections.map((s) => (
                  <li key={s.h2}>
                    <a href={`#${ancre(s.h2)}`}>{typo(s.h2)}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <Bande id={article.photo} />
          </div>
        </section>

        <Corps sections={article.sections} />

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur ce voyage"
              lede="Les réponses sont dans le HTML même repliées : un lecteur d'écran comme un moteur les trouve sans ouvrir quoi que ce soit."
            />
            <div className="faq">
              {article.faq.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <Closing
          title="Deux pays, une seule demande de devis."
          body="Dites-nous vos dates et le temps dont vous disposez : nous ajustons la répartition entre le Vietnam et le Cambodge, et nous vous disons franchement si la durée ne permet pas les deux. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
