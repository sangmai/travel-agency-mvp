import { score } from "@/lib/format";
import type { Trip } from "@/lib/content";

/**
 * Les critères de décision, décrits une fois.
 *
 * L'en-tête de la fiche et le tableau technique les affichaient chacun à la
 * main — cinq des neuf lignes du tableau répétaient mot pour mot les six
 * `<dt>/<dd>` du bandeau. Ils lisent désormais la même liste, chacun à sa
 * densité : `detail` quand le tableau veut une phrase plutôt qu'un mot,
 * `table: false` pour ce qui n'a pas sa place dans une fiche technique.
 */
export type Spec = {
  label: string;
  value: string;
  detail?: string;
  tableLabel?: string;
  table?: false;
};

export function tripSpecs(trip: Trip, rating: { value: number; count: number }): Spec[] {
  return [
    {
      label: "Durée",
      value: `${trip.days} jours`,
      detail: `${trip.days} jours, soit ${trip.days - 1} nuits sur place`,
    },
    {
      label: "Niveau",
      value: trip.niveau,
      detail: `${trip.niveau}. Les durées de marche et les dénivelés sont indiqués jour par jour dans le programme.`,
    },
    { label: "Hébergement", value: trip.confort },
    { label: "Saison", value: trip.saison, tableLabel: "Meilleure saison" },
    { label: "Groupe", value: trip.groupe, tableLabel: "Taille du groupe" },
    /* Pas de ligne « Avis » tant qu'il n'y en a aucun : « 0,0/5 (0) » se lit
       comme une très mauvaise note, pas comme une absence de note. */
    ...(rating.count > 0
      ? [
          {
            label: "Avis",
            value: `${score(rating.value)}/5 (${rating.count})`,
            table: false as const,
          },
        ]
      : []),
  ];
}

export function SpecList({ specs }: { specs: Spec[] }) {
  return (
    <dl className="specs">
      {specs.map((s) => (
        <div key={s.label}>
          <dt>{s.label}</dt>
          <dd>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
