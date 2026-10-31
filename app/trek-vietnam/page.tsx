import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Photo } from "@/components/Photo";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { GuideMeta, articleNode } from "@/components/GuideMeta";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * Sujet où le vocabulaire commercial ment le plus : « trek » désigne au
 * Vietnam aussi bien trois heures entre deux villages qu'une nuit sous tente
 * dans une grotte. La page donne donc des dénivelés et des durées, pas des
 * adjectifs — c'est ce qui permet à quelqu'un de savoir s'il en est capable.
 */

const MASSIFS = [
  {
    nom: "Pu Luong",
    acces: "4 h de Hanoï",
    niveau: "Facile",
    jours: "2 à 3 jours",
    denivele: "300 à 500 m/jour",
    corps:
      "Les mêmes rizières en terrasses qu'à Sapa, un relief plus doux et une fraction des visiteurs. Sentiers agricoles entre villages thaï blancs, nuits en maison sur pilotis. C'est l'étape que nous proposons en premier à qui veut marcher sans s'engager sur une semaine.",
  },
  {
    nom: "Sapa et Mu Cang Chai",
    acces: "5 h 30 de Hanoï",
    niveau: "Facile à modéré",
    jours: "2 à 4 jours",
    denivele: "400 à 700 m/jour",
    corps:
      "Les terrasses les plus spectaculaires du pays, à condition de quitter la ville et de dormir dans la vallée. Muong Hoa et Ta Van gardent leurs villages hmong et dao. Mu Cang Chai, plus au sud, offre les mêmes paysages avec encore moins de monde.",
  },
  {
    nom: "Ha Giang",
    acces: "6 h 30 de Hanoï",
    niveau: "Modéré",
    jours: "4 jours minimum",
    denivele: "500 à 800 m/jour",
    corps:
      "La région la plus spectaculaire du Vietnam, le long de la frontière chinoise : cols à 1 500 mètres, plateau karstique de Dong Van, marchés hmong. Les marches y sont courtes mais les journées de route longues. Quatre jours pleins sont un minimum.",
  },
  {
    nom: "Ba Be et Cao Bang",
    acces: "6 h de Hanoï",
    niveau: "Facile à modéré",
    jours: "3 jours",
    denivele: "300 à 600 m/jour",
    corps:
      "Le plus grand lac naturel du pays, des villages tay, et les chutes de Ban Gioc à la frontière. Marche en forêt et en barque plutôt qu'en terrasses — un autre Nord, beaucoup moins parcouru que Sapa.",
  },
  {
    nom: "Phong Nha",
    acces: "5 h 30 de Da Nang",
    niveau: "Modéré à soutenu",
    jours: "2 à 3 jours",
    denivele: "Variable, jusqu'à 900 m",
    corps:
      "Le seul massif du Centre, et le plus exigeant. Hang En demande deux jours de marche en forêt et une nuit sous tente à l'intérieur d'une grotte. Les parcours plus courts restent accessibles à tous, sur passerelle.",
  },
];

const SAISONS = [
  { periode: "Septembre à novembre", etat: "Idéal", detail: "La meilleure fenêtre. Ciel dégagé, sentiers secs, terrasses dorées de mi-septembre à début octobre." },
  { periode: "Mars à mai", etat: "Très bon", detail: "Températures douces, un peu plus de brume. Les terrasses sont en eau à partir de mai." },
  { periode: "Juin à août", etat: "À éviter", detail: "Pistes glissantes, sangsues actives, averses violentes. Les marches restent possibles mais perdent beaucoup." },
  { periode: "Décembre à février", etat: "Particulier", detail: "Marchable mais sous 10 °C, et une brume qui ferme les panoramas. Sapa peut descendre sous 5 °C." },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("trek-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/trek-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function Trek() {
  const guide = await getGuide("trek-vietnam");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Les circuits qui passent par un massif de marche, calculés depuis les
     étapes : un circuit retiré du CMS ne laisse pas de lien derrière lui. */
  const MARCHE = ["pu-luong", "sapa", "ha-giang", "ba-be", "cao-bang", "phong-nha", "mai-chau", "dong-van"];
  const concernes = trips.filter((t) => t.stops.some((s) => MARCHE.includes(s.place)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      articleNode(guide, site),
      {
        "@type": "FAQPage",
        "@id": `${site.url}/trek-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Trek au Vietnam", path: "/trek-vietnam" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Trek au Vietnam" }]} />
            <h1 className="d1">Où marcher au Vietnam&nbsp;?</h1>
            <p className="lede">
              <b>Pu Luong pour une première marche, Ha Giang pour le
              spectaculaire, Sapa pour les terrasses.</b> Presque tout se passe
              au Nord, sur des sentiers agricoles entre villages : trois à cinq
              heures par jour, 300 à 700 mètres de dénivelé, à la portée de qui
              marche occasionnellement. Le mot « trek » recouvre ici des réalités
              très différentes — voici les chiffres plutôt que les adjectifs.
            </p>
            <GuideMeta guide={guide} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Cinq massifs, et ce qu&apos;ils demandent</h2>
            <DataTable
              caption="Dénivelés et durées constatés sur nos programmes. Les niveaux sont ceux d'une randonnée de moyenne montagne en France, à l'humidité près."
              columns={["Massif", "Accès", "Niveau", "Durée", "Dénivelé"]}
              rows={MASSIFS.map((m) => [
                <b key="n">{m.nom}</b>,
                m.acces,
                m.niveau,
                m.jours,
                <span className="num" key="d">{m.denivele}</span>,
              ])}
              note={
                <>
                  Ce qui surprend n&apos;est pas la pente mais
                  l&apos;humidité : à 80 % d&apos;hygrométrie, un effort modéré
                  se ressent nettement plus qu&apos;en Europe.{" "}
                  <a className="lnk" href="/quand-partir-au-vietnam">
                    Le calendrier des trois régions
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Le détail"
              title="Chaque massif, et à qui il s'adresse"
              lede="Ils ne se valent pas et ne s'adressent pas aux mêmes voyageurs. L'ordre ci-dessous va du plus accessible au plus exigeant."
            />
            <div className="guide">
              {MASSIFS.map((m) => (
                <article className="guide__bloc" key={m.nom}>
                  <h3 className="d3">{m.nom}</h3>
                  <p className="guide__lieux">{m.acces} · {m.jours}</p>
                  <p className="guide__rep"><b>{m.niveau} — {m.denivele}</b></p>
                  <p>{m.corps}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <h2 className="d2">Quand marcher</h2>
            <DataTable
              caption="Conditions de marche dans le Nord, période par période."
              columns={["Période", "Conditions", "Ce qu'il faut savoir"]}
              rows={SAISONS.map((s) => [s.periode, <b key="e">{s.etat}</b>, s.detail])}
            />
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap wrap--wide">
            <div className="parcours">
              <figure className="parcours__photo">
                <Photo id="trek" role="half" />
              </figure>
              <div className="parcours__txt">
                <h2 className="d2">Dormir chez l&apos;habitant</h2>
                <p className="lede">
                  C&apos;est ce que les voyageurs citent le plus au retour, et
                  ce sur quoi ils sont le moins renseignés avant de partir.
                </p>
                <ul className="profil">
                  <li>Maisons sur pilotis, matelas au sol sous moustiquaire.</li>
                  <li>Pièce commune ou chambre séparée selon les familles.</li>
                  <li>Repas préparé devant vous, au feu de bois.</li>
                  <li>Sanitaires simples, eau chaude le plus souvent.</li>
                  <li>Électricité parfois intermittente.</li>
                </ul>
                <p className="parcours__note">
                  Nous le disons avant le départ plutôt que sur place : une nuit
                  en homestay n&apos;est pas une nuit d&apos;hôtel, et c&apos;est
                  précisément pour cela qu&apos;on s&apos;en souvient.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande avant de marcher"
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
              title="Ceux qui comportent de la marche"
              lede="Les durées de marche et les dénivelés figurent jour par jour dans chaque programme, pas seulement un niveau global."
            />
            <ul className="saison-liste">
              {concernes.map((t) => (
                <li key={t.slug}>
                  <a href={tripUrl(t.slug)}>
                    <b>{t.name}</b>
                    <span>{t.days} jours · {t.niveau}</span>
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
          title="Dites-nous ce que vous marchez chez vous."
          body="Une sortie par mois ou trois par semaine, ce n'est pas le même voyage. Nous calibrons les étapes là-dessus plutôt que sur un niveau affiché, et nous le disons quand un itinéraire est trop ambitieux."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
