import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite } from "@/lib/content";

/**
 * Nous ne vendons pas la Thaïlande. Une comparaison écrite par une partie
 * prenante ne vaut donc que si elle accorde franchement à l'autre ce qui lui
 * revient — ici les plages, les infrastructures et la facilité d'un premier
 * voyage. C'est aussi la seule version qu'un moteur génératif reprendra.
 */

const CRITERES = [
  { c: "Premier voyage en Asie", v: "Thaïlande", t: "Infrastructures denses, anglais répandu", n: "Demande plus d'organisation" },
  { c: "Plages et îles", v: "Thaïlande", t: "Krabi, Koh Lanta, fonds riches", n: "Phu Quoc, Con Dao — belles mais secondaires" },
  { c: "Montagnes et randonnée", v: "Vietnam", t: "Relief doux autour de Chiang Mai", n: "Sapa, Pu Luong, Ha Giang" },
  { c: "Rizières en terrasses", v: "Vietnam", t: "Peu étagées", n: "Les plus spectaculaires d'Asie du Sud-Est" },
  { c: "Patrimoine historique", v: "Égalité", t: "Ayutthaya, Sukhothaï, temples", n: "Hué, Hoi An, My Son" },
  { c: "Budget sur place", v: "Vietnam", t: "Référence", n: "10 à 20 % en dessous" },
  { c: "Cuisine", v: "Égalité", t: "Épicée, sucrée-salée, très codifiée", n: "Trois cuisines régionales distinctes" },
  { c: "Affluence touristique", v: "Vietnam", t: "35 à 40 millions de visiteurs par an", n: "Moitié moins" },
  { c: "Dépaysement", v: "Vietnam", t: "Tourisme ancien et très rodé", n: "Ouvert plus tard, encore moins formaté" },
];

const SAISONS = [
  { mois: "Novembre à février", th: "Idéal partout", vn: "Sud excellent, Nord frais et brumeux" },
  { mois: "Mars et avril", th: "Chaud, très sec", vn: "La seule fenêtre où les trois régions sont sèches" },
  { mois: "Mai à août", th: "Mousson sur la côte ouest", vn: "Centre au mieux, Nord chaud et lourd" },
  { mois: "Septembre et octobre", th: "Pic de mousson", vn: "Nord superbe, Centre à éviter" },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("vietnam-ou-thailande");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/vietnam-ou-thailande" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function VietnamOuThailande() {
  const guide = await getGuide("vietnam-ou-thailande");
  const site = await getSite();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/vietnam-ou-thailande/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Vietnam ou Thaïlande", path: "/vietnam-ou-thailande" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Vietnam ou Thaïlande" }]} />
            <h1 className="d1">Vietnam ou Thaïlande&nbsp;?</h1>
            <p className="lede">
              <b>La Thaïlande pour les plages et pour un premier voyage en Asie
              sans accompagnement. Le Vietnam pour les paysages de montagne, le
              dépaysement et un budget 10 à 20 % plus bas.</b> Nous ne vendons
              que le second, et nous le disons d&apos;emblée : ce qui suit
              accorde donc à la Thaïlande ce qui lui revient, parce qu&apos;une
              comparaison qui ne concède rien ne sert à personne.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Neuf critères</h2>
            <DataTable
              caption="Comparaison à durée et gamme équivalentes, hors vols internationaux."
              columns={["Critère", "Thaïlande", "Vietnam", "Avantage"]}
              rows={CRITERES.map((x) => [x.c, x.t, x.n, <b key="v">{x.v}</b>])}
              note={
                <>
                  Les deux pays se rejoignent sur l&apos;essentiel : vol
                  d&apos;environ treize heures depuis Paris, décalage de cinq à
                  six heures, et aucune obligation vaccinale.{" "}
                  <a className="lnk" href="/visa-vietnam">Les formalités pour le Vietnam</a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="Le critère qui tranche le plus souvent"
              title="Vos dates, avant vos envies"
              lede="Les deux pays n'ont pas le même calendrier, et c'est généralement ce qui décide. La Thaïlande a une saison sèche nette ; le Vietnam en a trois, décalées, parce qu'il s'étire sur 1 650 kilomètres."
            />
            <DataTable
              caption="Conditions comparées, période par période."
              columns={["Période", "Thaïlande", "Vietnam"]}
              rows={SAISONS.map((s) => [<b key="m">{s.mois}</b>, s.th, s.vn])}
              note={
                <>
                  Un départ en janvier favorise nettement la Thaïlande ; un
                  départ en mars ou avril, le Vietnam.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    Le détail mois par mois
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
              title="Ce qu'on nous demande avant de trancher"
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
          title="Hésiter est raisonnable."
          body="Dites-nous vos dates et ce que vous attendez du voyage : si la Thaïlande y répond mieux, nous vous le dirons — nous préférons perdre un devis que décevoir un voyageur."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
