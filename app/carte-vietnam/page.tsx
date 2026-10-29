import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TripMap } from "@/components/TripMap";
import { DataTable } from "@/components/DataTable";
import { Closing, Fil, JsonLd, PriceFrom, SectionHead } from "@/components/ui";
import { breadcrumb } from "@/components/JsonLd";
import { getGuide, getSite, getTrips, resolveStops, tripUrl, TRIP_BASE } from "@/lib/content";

/**
 * La carte est calculée au build depuis Natural Earth, puis rendue en SVG
 * inline : pas de tuiles, pas de bibliothèque, pas de requête au chargement.
 * C'est la seule page du site qu'un concurrent ne peut pas recopier sans
 * refaire le même travail — et une carte qui pèse quelques kilo-octets reste
 * lisible là où un fond de carte interactif demanderait du JavaScript.
 *
 * Même composant que les fiches voyage, sans le tracé : relier vingt-trois
 * lieux dessinerait un parcours qui n'existe pas.
 */

const DISTANCES = [
  { de: "Hanoï", a: "Baie de Lan Ha", km: "185 km", route: "3 h", autre: "—" },
  { de: "Hanoï", a: "Ninh Binh", km: "95 km", route: "2 h", autre: "—" },
  { de: "Hanoï", a: "Sapa", km: "315 km", route: "5 h 30", autre: "—" },
  { de: "Hanoï", a: "Ha Giang", km: "300 km", route: "6 h 30", autre: "—" },
  { de: "Hanoï", a: "Hué", km: "700 km", route: "14 h", autre: "1 h 15 en avion" },
  { de: "Hué", a: "Hoi An", km: "130 km", route: "3 h", autre: "2 h 30 en train" },
  { de: "Da Nang", a: "Phong Nha", km: "300 km", route: "5 h 30", autre: "—" },
  { de: "Hoi An", a: "Hô Chi Minh-Ville", km: "860 km", route: "17 h", autre: "1 h 20 en avion" },
  { de: "Hô Chi Minh-Ville", a: "Can Tho", km: "170 km", route: "3 h 30", autre: "—" },
  { de: "Hô Chi Minh-Ville", a: "Phu Quoc", km: "400 km", route: "—", autre: "1 h en avion" },
];

const REGIONS = [
  {
    nom: "Le Nord",
    etendue: "De Ha Giang à Ninh Binh, environ 400 km",
    lieux: "Hanoï, baie de Lan Ha, Ninh Binh, Pu Luong, Sapa, Ha Giang, Cao Bang, Ba Be",
    corps:
      "Tout tient dans un rayon de 300 kilomètres autour de Hanoï, ce qui en fait la région la plus facile à parcourir sans vol intérieur. Les routes de montagne sont lentes : Ha Giang est à 300 kilomètres mais à six heures et demie de route.",
  },
  {
    nom: "Le Centre",
    etendue: "De Phong Nha à Hoi An, environ 350 km",
    lieux: "Hué, Hoi An, Da Nang, Phong Nha",
    corps:
      "La bande la plus étroite du pays — moins de 50 kilomètres entre mer et frontière laotienne par endroits. Hué et Hoi An ne sont qu'à trois heures l'une de l'autre par le col des Nuages, ce qui en fait l'étape la plus compacte d'un circuit.",
  },
  {
    nom: "Le Sud",
    etendue: "De Hô Chi Minh-Ville à Ca Mau, environ 350 km",
    lieux: "Hô Chi Minh-Ville, Can Tho, Chau Doc, Phu Quoc, Con Dao",
    corps:
      "Un delta plat sillonné de canaux, où le bateau remplace souvent la voiture. Les distances sont courtes mais les bacs ralentissent : comptez toujours une marge sur les trajets du Mékong. Phu Quoc et Con Dao ne s'atteignent qu'en avion.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const g = await getGuide("carte-vietnam");
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: "/carte-vietnam" },
    openGraph: {
      type: "article",
      title: g.ogTitle,
      description: g.ogDescription,
      images: [{ url: `/photos/og/${g.photo}.jpg`, width: 1200, height: 630, alt: g.photoAlt }],
    },
  };
}

export default async function CarteVietnam() {
  const guide = await getGuide("carte-vietnam");
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  /* Tous les lieux visités par au moins un circuit, du nord au sud. La carte
     décrit donc ce que nous programmons réellement, pas un atlas. */
  const ids = [...new Set(trips.flatMap((t) => t.stops.map((s) => s.place)))];
  const lieux = (await resolveStops(ids.map((place) => ({ place })))).sort(
    (a, b) => b.lat - a.lat,
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${site.url}/carte-vietnam/#faq`,
        mainEntity: guide.faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "ItemList",
        "@id": `${site.url}/carte-vietnam/#lieux`,
        name: "Étapes situées au Vietnam",
        numberOfItems: lieux.length,
        itemListElement: lieux.map((l, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Place",
            name: l.fr,
            geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lon },
          },
        })),
      },
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Carte du Vietnam", path: "/carte-vietnam" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Carte du Vietnam" }]} />
            <h1 className="d1">Carte du Vietnam</h1>
            <p className="lede">
              <b>Le Vietnam s&apos;étire sur 1 650 kilomètres du nord au sud,
              pour moins de 50 kilomètres de large par endroits.</b> C&apos;est
              cette géométrie qui commande tout le reste : trois climats
              décalés, des temps de trajet longs d&apos;une région à
              l&apos;autre, et la nécessité de deux vols intérieurs dès
              qu&apos;on veut traverser le pays en quinze jours. Voici les{" "}
              {lieux.length} étapes que nous programmons, situées.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <div className="parcours">
              <figure className="parcours__map">
                <TripMap stops={lieux} route={false} />
              </figure>
              <div className="parcours__txt">
                <h2 className="d3">Les {lieux.length} étapes, du nord au sud</h2>
                <ol className="etapes">
                  {lieux.map((l, i) => (
                    <li key={l.id}>
                      <span className="etapes__n">{i + 1}</span>
                      <span>{l.fr}</span>
                    </li>
                  ))}
                </ol>
                <p className="parcours__note">
                  Carte calculée au build à partir des contours Natural Earth,
                  rendue en SVG : elle ne charge aucune tuile et reste lisible
                  sans JavaScript. Les noms portés sont les toponymes
                  vietnamiens, ceux que vous lirez sur les panneaux.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <h2 className="d2">Distances et temps réels</h2>
            <DataTable
              caption="Temps de trajet constatés, embouteillages de sortie de ville compris. Ce ne sont pas des distances divisées par une vitesse moyenne."
              columns={["De", "À", "Distance", "Par la route", "Autrement"]}
              rows={DISTANCES.map((d) => [
                d.de,
                <b key="a">{d.a}</b>,
                <span className="num" key="k">{d.km}</span>,
                d.route,
                d.autre,
              ])}
              note={
                <>
                  Au-delà de cinq heures de route, nous proposons presque
                  toujours un vol intérieur : 40 à 110 € le trajet contre une
                  journée entière rendue au voyage.{" "}
                  <a className="lnk" href="/itineraire-vietnam">
                    Ce qui tient selon la durée
                  </a>
                </>
              }
            />
          </div>
        </section>

        <section className="sec">
          <div className="wrap wrap--wide">
            <SectionHead
              kicker="Trois régions"
              title="Ce que la géographie impose"
              lede="Chaque région a sa propre logique de déplacement : routes de montagne lentes au Nord, distances courtes au Centre, bacs et canaux au Sud."
            />
            <div className="guide">
              {REGIONS.map((r) => (
                <article className="guide__bloc" key={r.nom}>
                  <h3 className="d3">{r.nom}</h3>
                  <p className="guide__lieux">{r.etendue}</p>
                  <p className="guide__rep"><b>{r.lieux}</b></p>
                  <p>{r.corps}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec sec--sand" id="faq">
          <div className="wrap">
            <SectionHead
              kicker="Questions fréquentes"
              title="Ce qu'on nous demande sur les distances"
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
              title="Et le parcours de chacun"
              lede="Chaque fiche porte sa propre carte, avec les étapes reliées dans l'ordre du programme et les temps de trajet détaillés jour par jour."
            />
            <ul className="saison-liste">
              {trips.map((t) => (
                <li key={t.slug}>
                  <a href={tripUrl(t.slug)}>
                    <b>{t.name}</b>
                    <span>{t.days} jours · {t.stops.length} étapes</span>
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
          title="Votre parcours n'est pas encore sur cette carte."
          body="Dites-nous combien de jours vous avez et ce qui vous attire : nous plaçons les étapes, nous calculons les trajets réels, et nous vous disons franchement ce qui ne tient pas."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
