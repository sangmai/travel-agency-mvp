import { score } from "@/lib/format";
import type { Trip } from "@/lib/content";

/**
 * The decision criteria, described once.
 *
 * The page header and the spec table each used to render them by hand — five of
 * the table's nine rows repeated the banner's six `<dt>/<dd>` pairs word for
 * word. They now read the same list, each at its own density: `detail` when the
 * table wants a sentence rather than a word, `table: false` for what has no
 * place in a spec sheet.
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
    /* No "Avis" row while there are none: "0,0/5 (0)" reads as a terrible
       rating, not as the absence of one. */
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
