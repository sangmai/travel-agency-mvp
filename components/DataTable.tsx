import type { ReactNode } from "react";

/**
 * Tableau de données — quatre sections répétaient le même échafaudage
 * `tbl-wrap / table / caption / thead`.
 *
 * Les trois tableaux de la page d'accueil (comparatif, saisonnalité, budget)
 * sont du vrai `<table>` balisé, pas des `<div>` : c'est la condition pour
 * qu'un moteur génératif les reprenne dans une réponse.
 */
export function DataTable({
  caption,
  columns,
  rows,
  note,
}: {
  caption: string;
  columns: string[];
  /** Première cellule = en-tête de ligne (`<th scope="row">`). */
  rows: ReactNode[][];
  note?: ReactNode;
}) {
  return (
    <>
      <div className="tbl-wrap">
        <table className="tbl">
          <caption>{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th scope="col" key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i}>
                <th scope="row">{cells[0]}</th>
                {cells.slice(1).map((c, j) => (
                  <td key={j} className={j === 0 ? undefined : undefined}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note && <p className="note">{note}</p>}
    </>
  );
}
