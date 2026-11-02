import { DataTable } from "./DataTable";
import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getSeasons, getHome } from "@/lib/content";

/**
 * "Quand partir au Vietnam" is one of the highest-volume informational queries
 * in the French market, and the entry point of most purchase journeys.
 *
 * Conditions are rendered as a bar whose length states the quality, doubled by
 * the word itself: readable at a glance when scanning a column, and not
 * dependent on colour perception.
 */
const LEVELS: Record<string, { label: string; fill: number }> = {
  ideal: { label: "Idéal", fill: 1 },
  bon: { label: "Bon", fill: 0.7 },
  moyen: { label: "Moyen", fill: 0.42 },
  deconseille: { label: "À éviter", fill: 0.14 },
};

function Season({ level }: { level: string }) {
  const l = LEVELS[level];
  if (!l) throw new Error(`Niveau de saison inconnu : « ${level} » (content/seasons.json).`);
  return (
    <span className={`season${level === "ideal" ? " season--peak" : ""}`}>
      <span
        className="season__bar"
        style={{ "--fill": l.fill } as React.CSSProperties}
        aria-hidden="true"
      />
      {l.label}
    </span>
  );
}

/**
 * The table alone, with no section heading: the home page introduces it with an
 * h2, the guide page with its h1. Duplicating the render would have let the two
 * diverge at the first change of scale.
 */
export async function SeasonTable({ note }: { note?: React.ReactNode }) {
  const rows = await getSeasons();

  return (
    <DataTable
      caption="Conditions de voyage mois par mois et par région. Source : moyennes climatiques 1991–2020 et retours de nos équipes sur le terrain."
      columns={["Mois", "Nord", "Centre", "Sud", "À savoir"]}
      rows={rows.map((m) => [
        m.month,
        <Season level={m.nord} key="n" />,
        <Season level={m.centre} key="c" />,
        <Season level={m.sud} key="s" />,
        m.note,
      ])}
      note={note}
    />
  );
}

export async function WhenToGo() {
  const h = (await getHome()).saison;
  return (
    <section className="sec" id="quand-partir">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{h.title}</Accent>}
          lede={h.lede}
        />
        <SeasonTable
          note={
            <>
              Le Têt (nouvel an lunaire) tombe entre fin janvier et mi-février
              selon les années : fête magnifique, mais hausse des tarifs et sites
              bondés pendant une semaine. Nous vous indiquons la date exacte de
              votre année de départ dans le devis.{" "}
              <a className="lnk" href="/quand-partir-au-vietnam">Le guide complet</a>
            </>
          }
        />
      </div>
    </section>
  );
}
