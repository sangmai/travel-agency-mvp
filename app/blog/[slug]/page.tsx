import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Photo } from "@/components/Photo";
import { Corps, ancre, enligne, typo } from "@/components/Article";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { GuideMeta } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getArticles, getSite, getTrips, articleUrl, tripUrl, BLOG_BASE, lien } from "@/lib/content";

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
  const [site, articles, trips] = await Promise.all([getSite(), getArticles(), getTrips()]);
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
        {/* Le bandeau d'article, repris des fiches voyage : mêmes classes, même
            voile, même traitement du fil d'Ariane.

            Il remplace une mise en côte à côte qui ne tenait pas. Le chapeau
            et le sommaire font une hauteur qui dépend de l'article — six
            entrées de sommaire sur « Hué », deux sur un autre — tandis que la
            photo garde son 4/3. Sur les articles longs, la colonne de droite
            finissait en image trop courte surmontant un grand vide. Un bandeau
            n'a pas ce problème : la photo occupe le fond, le texte passe par
            dessus, et rien ne dépend de la longueur de l'autre colonne. */}
        <section className="trip-hero art-hero">
          <div className="trip-hero__img">
            <Photo id={article.photo} role="hero" />
          </div>
          <div className="trip-hero__veil" />

          <div className="wrap trip-hero__in">
            <Fil
              light
              items={[
                { label: "Accueil", href: "/" },
                { label: "Blog", href: lien(BLOG_BASE) },
                { label: article.title },
              ]}
            />
            <h1 className="d1">{typo(article.title)}</h1>
            <p className="trip-hero__tag">{enligne(article.lede)}</p>
            <GuideMeta guide={article} />
          </div>
        </section>

        {/* Le corps et son rail.

            Sans rail, la colonne de droite n'était occupée que par les photos
            — une par section au mieux — et restait vide partout ailleurs. Lui
            donner un habitant permanent est ce qui fait tenir la mise en page
            sur toute la longueur de l'article, et non par à-coups.

            Ce qu'on y met n'est pas du remplissage : le sommaire, qui est la
            navigation d'un texte de six sections, et les circuits, qui sont
            ce que l'article doit finir par proposer. Une colonne décorative
            aurait été pire que le vide. */}
        <section className="sec">
          <div className="wrap art__grille">
            <div className="art__flux">
              <Corps sections={article.sections} />
            </div>

            <aside className="art__rail">
              {/* Collant : sur un article de neuf mille pixels, un sommaire
                  qui défile hors de l'écran au premier tiers ne sert plus. */}
              <nav className="art__rail-bloc" aria-label="Sommaire">
                <p className="art__rail-titre">Dans cet article</p>
                <ol className="art__rail-som">
                  {article.sections.map((s) => (
                    <li key={s.h2}>
                      <a href={`#${ancre(s.h2)}`}>{typo(s.h2)}</a>
                    </li>
                  ))}
                </ol>
              </nav>

              {/* Le planificateur, et c'est le seul bloc sombre du rail.
                  Trois cartes blanches identiques auraient noyé celle qui
                  compte : c'est la seule chose du site qu'un concurrent n'a
                  pas, et un lecteur arrivé ici par « combien de jours pour le
                  Vietnam » est exactement celui à qui elle sert.

                  Le libellé du bouton est celui de la page d'accueil, mot pour
                  mot. Une action garde son nom d'un bout à l'autre du
                  parcours, sinon le visiteur croit arriver ailleurs. */}
              <div className="art__rail-bloc art__rail-bloc--outil">
                <p className="art__rail-titre">Votre itinéraire tient-il&nbsp;?</p>
                <p className="art__rail-texte">
                  Posez vos étapes&nbsp;: l&apos;outil compte les nuits et les
                  trajets, puis vous dit ce qui dépasse et ce qu&apos;il faut
                  retirer.
                </p>
                <a
                  className="btn btn--amber art__rail-btn"
                  href={lien("/organiser-son-voyage-au-vietnam")}
                >
                  Tester mon itinéraire
                </a>
                <p className="art__rail-fine">Gratuit, sans inscription.</p>
              </div>

              <div className="art__rail-bloc">
                <p className="art__rail-titre">Nos circuits</p>
                <ul className="art__rail-liste">
                  {trips.slice(0, 3).map((t) => (
                    <li key={t.slug}>
                      <a href={tripUrl(t.slug)}>
                        <span className="art__rail-vig">
                          <Photo id={t.photo} role="card" />
                        </span>
                        <span>
                          <b>{typo(t.name)}</b>
                          <small>
                            {t.days} jours &middot; dès {t.priceFrom}&nbsp;€
                          </small>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

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
