import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * Requête étroite, mais à très forte intention : celui qui la tape a déjà
 * choisi le Nord et compare deux produits presque identiques. Presque
 * personne n'écrit de page dédiée au sujet, alors que la réponse courte est
 * nette — c'est exactement le format qu'un moteur génératif reprend.
 *
 * La page prend parti, et dit aussi quand elle a tort : la baie d'Halong
 * reste préférable dans deux cas précis, énoncés plus bas.
 */

const CRITERES = [
  {
    critere: "Paysage",
    halong: "Pitons calcaires, 1 600 îlots",
    lanha: "Mêmes pitons, prolongement sud du massif",
    verdict: "Égalité",
  },
  {
    critere: "Bateaux en circulation",
    halong: "Plusieurs centaines, itinéraires balisés",
    lanha: "Quelques dizaines, routes dispersées",
    verdict: "Lan Ha",
  },
  {
    critere: "Baignade",
    halong: "Très restreinte",
    lanha: "Une centaine de plages accessibles",
    verdict: "Lan Ha",
  },
  {
    critere: "Kayak",
    halong: "Encadré, zones limitées",
    lanha: "Libre entre les îlots et les grottes",
    verdict: "Lan Ha",
  },
  {
    critere: "Villages flottants",
    critereNote: true,
    halong: "Visites très fréquentées",
    lanha: "Communautés encore en activité",
    verdict: "Lan Ha",
  },
  {
    critere: "Accès depuis Hanoï",
    halong: "2 h 30 d'autoroute",
    lanha: "3 h, puis embarquement à Cat Ba",
    verdict: "Halong",
  },
  {
    critere: "Choix de bateaux",
    halong: "Des dizaines, toutes gammes",
    lanha: "Offre plus restreinte, à réserver tôt",
    verdict: "Halong",
  },
  {
    critere: "Notoriété auprès des proches",
    halong: "Nom connu, classé Unesco",
    lanha: "Demande une explication au retour",
    verdict: "Halong",
  },
];

const SAISONS = [
  { periode: "Mars à mai", etat: "Idéal", detail: "Eau à 24-26 °C, brume légère au petit matin, foule encore modérée." },
  { periode: "Juin à août", etat: "Bon", detail: "Baignade à 28 °C, mais haute saison vietnamienne et risque de typhon en août." },
  { periode: "Septembre à novembre", etat: "Idéal", detail: "La meilleure fenêtre : ciel dégagé, mer calme, fréquentation en baisse." },
  { periode: "Décembre à février", etat: "Particulier", detail: "15 à 18 °C et brume dense. Pas de baignade, mais une atmosphère que beaucoup préfèrent." },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("halong-ou-lan-ha");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/halong-ou-lan-ha" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function HalongOuLanHa() {
  const guide = await getGuide("halong-ou-lan-ha");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Les circuits qui passent réellement par l'une des deux baies, calculés
     depuis les étapes plutôt que listés à la main. */
  const concernes = trips.filter((t) =>
    t.stops.some((s) => s.place === "lan-ha" || s.place === "ha-long"),
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/halong-ou-lan-ha/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Halong ou Lan Ha", path: "/halong-ou-lan-ha" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Halong ou Lan Ha" }]} />
            <h1 className="d1">Baie d&apos;Halong ou baie de Lan Ha&nbsp;?</h1>
            <p className="lede">
              <b>Lan Ha, dans neuf cas sur dix.</b> C&apos;est le même massif
              calcaire — Lan Ha en est le prolongement sud, au large de Cat Ba
              — mais avec quelques dizaines de bateaux au lieu de plusieurs
              centaines, une centaine de plages où l&apos;on peut nager, et du
              kayak libre entre les îlots. <b>Halong garde l&apos;avantage sur
              deux points</b> : l&apos;accès est plus court depuis Hanoï, et le
              choix de bateaux bien plus large. Voici le détail.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Huit critères, et qui l&apos;emporte</h2>
            <DataTable
              caption="Comparaison à prestation équivalente : une nuit à bord, pension complète, kayak compris."
              columns={["Critère", "Baie d'Halong", "Baie de Lan Ha", "Avantage"]}
              rows={CRITERES.map((c) => [c.critere, c.halong, c.lanha, <b key="v">{c.verdict}</b>])}
              note={
                <>
                  Les deux baies partagent le classement Unesco depuis
                  l&apos;extension de 2000 : choisir Lan Ha ne revient pas à
                  renoncer au site classé.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    Le calendrier des trois régions
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <h2 className="d2">Quand y aller</h2>
            <DataTable
              caption="Conditions en baie, période par période."
              columns={["Période", "Conditions", "Ce qu'il faut savoir"]}
              rows={SAISONS.map((s) => [s.periode, <b key="e">{s.etat}</b>, s.detail])}
            />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Quand nous avons tort"
              title="Les deux cas où Halong reste le bon choix"
              lede="Une comparaison qui ne concède rien n'est pas une comparaison. Voici les situations où nous programmons Halong sans hésiter."
            />
            <div className="guide">
              <article className="guide__bloc">
                <h3 className="d3">Vous avez moins de trois jours au Nord</h3>
                <p>
                  L&apos;embarquement pour Lan Ha se fait à Cat Ba, ce qui
                  ajoute une liaison et environ quarante minutes à
                  l&apos;aller comme au retour. Sur un séjour très court, cette
                  heure vaut mieux ailleurs.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Vous cherchez un bateau précis</h3>
                <p>
                  La flotte de Lan Ha est plus restreinte : une poignée de
                  bateaux de charme, souvent complets deux à trois mois à
                  l&apos;avance en haute saison. Halong offre un choix bien plus
                  large, du confortable au franchement luxueux.
                </p>
              </article>
              <article className="guide__bloc">
                <h3 className="d3">Ce qui ne change rien</h3>
                <p>
                  Le prix. À bateau de gamme équivalente, l&apos;écart est
                  négligeable entre les deux baies — la différence se joue sur
                  le bateau choisi, pas sur la destination.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur les deux baies"
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
              title="Ceux qui passent par la baie"
              lede="La nuit à bord y est programmée en baie de Lan Ha. Si vous préférez Halong, dites-le : le bateau se change sans frais."
            />
            <ul className="saison-liste">
              {concernes.map((t) => (
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
          title="Une nuit sur l'eau, et laquelle ?"
          body="Dites-nous vos dates : la fréquentation et la météo ne se valent pas d'un mois à l'autre, et le bon choix en octobre n'est pas celui de janvier. Devis gratuit, réponse sous 48 heures ouvrées."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
