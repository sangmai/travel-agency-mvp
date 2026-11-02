import type { ReactNode } from "react";

/**
 * Data table — four sections were repeating the same
 * `tbl-wrap / table / caption / thead` scaffolding.
 *
 * The home page's three tables (comparison, seasonality, budget) are real
 * marked-up `<table>` elements, not `<div>`s: that is the condition for a
 * generative engine to reuse them in an answer.
 */
export function DataTable({
  caption,
  columns,
  rows,
  note,
}: {
  caption: string;
  columns: string[];
  /** First cell = row header (`<th scope="row">`). */
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
