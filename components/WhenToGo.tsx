import { DataTable } from "./DataTable";
import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getSeasons, getHome } from "@/lib/content";

/**
 * « Quand partir au Vietnam » est l'une des requêtes informationnelles les
 * plus volumineuses du marché français, et la porte d'entrée de la plupart
 * des parcours d'achat.
 *
 * Les conditions sont rendues par une barre dont la longueur dit la qualité,
 * doublée du mot : lisible d'un coup d'œil en balayant une colonne, et sans
 * dépendre de la perception des couleurs.
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
 * Le tableau seul, sans titre de section : la page d'accueil l'introduit par
 * un h2, la page guide par son h1. Dupliquer le rendu aurait laissé les deux
 * diverger au premier changement de barème.
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
