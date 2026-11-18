import type { Metadata } from "next";
import { Header, MobileBar } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Closing, Fil, JsonLd, SectionHead } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { breadcrumb } from "@/components/JsonLd";
import { Planner } from "@/components/Planner";
import { QuoteForm } from "@/components/QuoteForm";
import type { PlanBase } from "@/components/Planner";
import { getSite, getPlaces, getSeasons, getLegs, getTrips, getExperiences } from "@/lib/content";

/**
 * The planner, and the page that makes it findable.
 *
 * Someone buying a packaged circuit never searches how long Hanoï to Hué takes
 * — the agency handles that. Only a traveller organising it themselves does,
 * which is why this page and /circuit-vietnam-15-jours/ never compete: they are
 * reached by different questions, and the separation needs no interface trick
 * to hold.
 *
 * The plan the visitor builds lives in the URL hash, which crawlers do not
 * index, so there is no risk of thousands of thin generated pages. What gets
 * indexed is this prose and the table of legs underneath it.
 */

export const metadata: Metadata = {
  title: "Organiser son voyage au Vietnam soi-même",
  description:
    "Combien de jours coûte vraiment chaque trajet, ce qui se réserve à l'avance, et ce qui tient dans le temps dont vous disposez. Écrit depuis Da Nang.",
  alternates: { canonical: "/organiser-son-voyage-au-vietnam" },
};

export default async function OrganiserSonVoyage() {
  const [site, places, seasons, legsFile, trips, choisies] = await Promise.all([
    getSite(), getPlaces(), getSeasons(), getLegs(), getTrips(), getExperiences(),
  ]);

  /* The itineraries' own per-stop nights, not the generic ideal for each place.
     Substituting the ideal inflated every base past its own budget — the page
     opened by telling a visitor that the 14-day trip sold two clicks away needs
     seventeen, and the figure went into the Markdown that llms.txt points AI
     crawlers at. Stops with no night are waypoints, not étapes, and are dropped. */
  const bases: PlanBase[] = [...trips]
    .sort((a, b) => a.stops.length / a.days - b.stops.length / b.days)
    .slice(0, 3)
    .map((t) => ({
      nom: t.name,
      jours: t.days,
      etapes: t.stops
        .filter((s) => s.nuits > 0)
        .map((s) => ({ place: s.place, nuits: s.nuits })),
    }));

  const lieux = places.map((p) => ({
    id: p.id, fr: p.fr, map: p.map, lat: p.lat, lon: p.lon, nuits: p.nuits,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb(site.url, [
        { name: "Accueil" },
        { name: "Organiser son voyage", path: "/organiser-son-voyage-au-vietnam" },
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
            <Fil items={[{ label: "Accueil", href: "/" }, { label: "Organiser son voyage" }]} />
            <h1 className="d1">Organiser son voyage au Vietnam</h1>
            <p className="lede">
              <b>Le pays fait 1&nbsp;650 kilomètres et votre congé en fait quinze.</b>{" "}
              Tout le reste en découle. Cet outil ne vous vend rien&nbsp;: il vous
              dit ce qui tient dans le temps dont vous disposez, et ce qu&apos;il
              faut abandonner quand ça ne tient pas.
            </p>
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Trois choses à savoir avant"
              title="Les heures ne sont pas des journées"
              lede="C'est le calcul que personne ne vous donne, et celui qui décide de tout le reste."
            />
            <ol className="art__liste">
              <li>
                <b>Le train de nuit Hanoï–Hué ne coûte aucune journée.</b> Il part
                à 19&nbsp;h&nbsp;20, arrive à 7&nbsp;h&nbsp;55, et remplace une
                nuit d&apos;hôtel. Dix fois plus long que l&apos;avion, et moins
                cher en temps. Celui de Sapa, lui, ne fait pas ce
                cadeau&nbsp;: il faut encore monter de Lao Cai.
              </li>
              <li>
                <b>Une croisière «&nbsp;une nuit&nbsp;» en baie occupe deux
                journées.</b> La navette quitte l&apos;hôtel vers 8&nbsp;h,
                l&apos;embarquement est à midi, et l&apos;on débarque le lendemain
                à 11&nbsp;h&nbsp;30.
              </li>
              <li>
                <b>Un bus-couchettes met 30 à 60&nbsp;% de temps de plus
                qu&apos;une voiture</b> sur la même autoroute&nbsp;: ramassage en
                plusieurs points et pauses obligatoires. Personne ne vous le dit
                avant.
              </li>
            </ol>
          </div>
        </section>

        <section className="sec sec--sand">
          <div className="wrap">
            <SectionHead
              kicker="L'outil"
              title="Est-ce que votre voyage tient ?"
              lede="Ajoutez, retirez, changez le mois. La jauge vous dira la vérité avant l'agence."
            />
            <Planner lieux={lieux} legs={legsFile.legs} saisons={seasons} bases={bases}
              choisies={choisies} />
          </div>
        </section>

        <section className="sec">
          <div className="wrap">
            <SectionHead
              kicker="Les trajets"
              title="Ce que coûte chaque étape, et d'où vient le chiffre"
              lede="Chaque durée porte sa source. Si l'une d'elles est fausse, écrivez-nous : nous la corrigerons."
            />
            <DataTable
              caption="Durée de chaque trajet, et ce qu'il coûte en journées"
              columns={["Trajet", "Mode", "Durée", "Journées", "Source"]}
              rows={legsFile.legs.flatMap((l) =>
                l.modes.map((m) => [
                  `${places.find((p) => p.id === l.from)?.fr} → ${places.find((p) => p.id === l.to)?.fr}`,
                  m.mode.replace(/-/g, " "),
                  `${m.hours} h`,
                  m.days === 0 ? "aucune" : String(m.days),
                  m.source,
                ]),
              )}
              note={legsFile.regles.map((r) => r.texte).join(" ")}
            />

            <ul className="art__liste">
              <li>
                <b>Une durée vous paraît fausse&nbsp;?</b> Écrivez-nous. Nous
                affichons d&apos;où vient chaque chiffre précisément pour qu&apos;on
                puisse nous contredire.
              </li>
            </ul>
          </div>
        </section>

        {/* The form lives on this page now, so the closing button scrolls
            instead of leaving for the home page and dropping the hash —
            which would have discarded the plan the visitor just built. */}
        <Closing
          href="#devis"
          title="Il reste la part qui ne se réserve pas depuis la France."
          body="Les billets de train intérieurs demandent une carte vietnamienne, et un guide francophone en mars se trouve des mois à l'avance. Envoyez-nous votre plan : nous le chiffrons tel quel, et nous vous dirons franchement si la durée ne suffit pas. Devis gratuit, réponse sous 48 heures ouvrées."
        />

        <QuoteForm />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
