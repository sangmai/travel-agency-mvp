import { DataTable } from "./DataTable";
import { SectionHead } from "./ui";
import { getSeasons } from "@/lib/content";

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

export async function WhenToGo() {
  const rows = await getSeasons();

  return (
    <section className="sec" id="quand-partir">
      <div className="wrap">
        <SectionHead
          kicker="Saisonnalité"
          title="Quand partir au Vietnam ?"
          lede="Mars et avril sont les deux meilleurs mois pour traverser le pays du nord au sud : les trois régions y sont simultanément sèches et douces. Octobre est à éviter au Centre, où Hué et Hoi An peuvent être inondés, mais c'est l'un des plus beaux mois au Nord. Autrement dit, il n'existe pas de mauvaise période pour le Vietnam — seulement un itinéraire à adapter au mois choisi."
        />
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
