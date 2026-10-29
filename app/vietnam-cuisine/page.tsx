import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Photo } from "@/components/Photo";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * La cuisine décide d'un voyage au Vietnam plus souvent que les paysages, et
 * c'est un sujet où les faits sont nombreux, courts et vérifiables — donc
 * très repris en réponse générative. L'angle qui nous distingue n'est pas la
 * liste des plats mais la géographie : pourquoi le même nom désigne deux
 * plats différents à 1 600 kilomètres d'écart.
 */

const REGIONS = [
  {
    nom: "Le Nord",
    ou: "Hanoï, Ninh Binh, Sapa",
    gout: "Sobre, salé, peu sucré",
    corps:
      "La cuisine la plus retenue des trois, et la plus ancienne. Peu de piment, presque pas de sucre, des bouillons mijotés longtemps et l'aneth comme herbe maîtresse — un héritage du climat, qui connaît un vrai hiver. C'est ici que sont nés le phở et le bún chả.",
    plats: ["Phở bò", "Bún chả", "Chả cá", "Bánh cuốn"],
  },
  {
    nom: "Le Centre",
    ou: "Hué, Hoi An, Da Nang",
    gout: "Épicé, nombreux petits plats",
    corps:
      "Héritage de la cour impériale de Hué, qui servait des dizaines de plats en petites portions pour l'empereur. Le piment est partout, les présentations sont les plus travaillées du pays, et plusieurs spécialités sont strictement locales : le cao lầu de Hoi An ne se prépare qu'avec l'eau d'un puits de la ville.",
    plats: ["Bún bò Huế", "Cao lầu", "Mì Quảng", "Bánh bèo"],
  },
  {
    nom: "Le Sud",
    ou: "Hô Chi Minh-Ville, delta du Mékong",
    gout: "Sucré, herbacé, métissé",
    corps:
      "La plus douce et la plus mélangée, marquée par les influences khmère, chinoise et française. Le sucre de palme et le lait de coco entrent dans les plats salés, et chaque bol arrive avec une assiette d'herbes fraîches que le Nord ne sert pas. C'est aussi ici que le bánh mì a pris sa forme actuelle.",
    plats: ["Bánh xèo", "Hủ tiếu", "Bánh mì", "Cá kho tộ"],
  },
];

const PRIX = [
  { quoi: "Bol de phở dans la rue", prix: "1,50 – 2,50 €", note: "Le matin uniquement : les bonnes adresses ferment quand le bouillon est épuisé." },
  { quoi: "Repas complet, restaurant de quartier", prix: "5 – 8 €", note: "Deux plats et une boisson, pour deux personnes." },
  { quoi: "Bánh mì", prix: "0,80 – 1,50 €", note: "Le meilleur rapport qualité-prix du pays, et un petit-déjeuner à lui seul." },
  { quoi: "Table réputée, grande ville", prix: "20 – 35 €", note: "Par personne, boissons comprises." },
  { quoi: "Cours de cuisine à Hoi An", prix: "25 – 40 €", note: "Demi-journée, marché et traversée en barque compris." },
  { quoi: "Café à l'œuf à Hanoï", prix: "1 – 2 €", note: "Inventé en 1946 pendant une pénurie de lait." },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("vietnam-cuisine");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/vietnam-cuisine" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function Cuisine() {
  const guide = await getGuide("vietnam-cuisine");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/vietnam-cuisine/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Cuisine du Vietnam", path: "/vietnam-cuisine" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Cuisine du Vietnam" }]} />
            <h1 className="d1">Que manger au Vietnam&nbsp;?</h1>
            <p className="lede">
              <b>Il n&apos;y a pas une cuisine vietnamienne mais trois</b>, et
              le même nom ne désigne pas le même plat d&apos;un bout à
              l&apos;autre du pays. Le Nord est sobre et salé, le Centre épicé
              et impérial, le Sud sucré et métissé. Un phở de Hanoï arrive nu ;
              le même à Saïgon s&apos;accompagne d&apos;une assiette
              d&apos;herbes et de pousses de soja. C&apos;est la conséquence
              directe de 1 650 kilomètres et de trois climats.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Trois cuisines"
              title="Ce qui change du nord au sud"
              lede="Les plats cités sont ceux que nos guides font goûter en priorité, et qu'on ne trouve vraiment que dans leur région d'origine."
            />
            <div className="guide">
              {REGIONS.map((r) => (
                <article className="guide__bloc" key={r.nom}>
                  <h3 className="d3">{r.nom}</h3>
                  <p className="guide__lieux">{r.ou}</p>
                  <p className="guide__rep"><b>{r.gout}</b></p>
                  <p>{r.corps}</p>
                  <ul className="profil">
                    {r.plats.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <h2 className="d2">Ce que coûte un repas</h2>
            <DataTable
              caption="Prix constatés en 2026, par personne sauf mention contraire."
              columns={["", "Prix", "Ce qu'il faut savoir"]}
              rows={PRIX.map((p) => [p.quoi, <span className="num" key="p">{p.prix}</span>, p.note])}
              note={
                <>
                  La restauration est le poste où l&apos;on dépense le moins au
                  Vietnam et dont on se souvient le plus. Comptez 10 à 25 € par
                  jour et par personne, tout compris.{" "}
                  <a className="lnk" href="/budget-voyage-vietnam">Le budget détaillé</a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <div className="parcours">
              <figure className="parcours__photo">
                <Photo id="marche" role="half" />
              </figure>
              <div className="parcours__txt">
                <h2 className="d2">Manger dans la rue, sans risque</h2>
                <p className="lede">
                  Le critère n&apos;est pas la propreté apparente mais la
                  rotation. Là où les habitants font la queue, tout a été
                  préparé dans la journée et rien ne stagne.
                </p>
                <ul className="profil">
                  <li>Choisissez une échoppe pleine, à l&apos;heure où elle est pleine.</li>
                  <li>Préférez ce qui sort du feu devant vous.</li>
                  <li>Méfiez-vous des buffets tièdes et des jus à la glace pilée.</li>
                  <li>Évitez les crudités dans un établissement vide.</li>
                </ul>
                <p className="parcours__note">
                  Nos guides emmènent les voyageurs manger dans la rue dès le
                  premier soir, précisément pour lever cette appréhension au
                  moment où elle est la plus forte.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur la table"
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
              title="Tous traversent les trois cuisines"
              lede="Marchés du matin, repas chez l'habitant, cours de cuisine à Hoi An : dites-nous si la table compte pour vous, nous ajustons le programme en conséquence."
            />
            <ul className="saison-liste">
              {trips.map((t) => (
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
          title="Un voyage se retient par la table."
          body="Dites-nous ce que vous aimez manger, ce que vous ne mangez pas, et vos contraintes alimentaires : elles figurent sur le carnet de route remis aux guides, pas seulement dans un e-mail."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
