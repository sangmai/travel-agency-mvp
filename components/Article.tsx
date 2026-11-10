import type { ReactNode } from "react";
import { Photo } from "./Photo";
import { DataTable } from "./DataTable";
import type { Bloc, Section } from "@/lib/content";

/**
 * Renders an article body from content, so that writing the twentieth post
 * never means writing a twentieth React file.
 *
 * Two inline conventions, no HTML in the CMS:
 *
 *   **gras**            the direct answer that opens a section
 *   [texte](/adresse/)  a link, and the whole point of publishing articles
 *
 * The parser is deliberately small. It handles what the convention describes
 * and nothing else: a `[` that is not a link stays a `[`, which is the right
 * failure for text an editor types by hand.
 */

/**
 * French sets a space before `: ; ! ? »` and after `«`, and that space must not
 * break.
 *
 * The rest of the site writes `&nbsp;` by hand in its TSX. Content coming from
 * JSON cannot, so the rule is applied here instead — and it is a rule, not a
 * choice an editor should have to remember. Without it the title of the first
 * article broke as "Vietnam et Cambodge" / ": combiner les deux", with the
 * colon alone at the head of a line.
 */
export function typo(texte: string): string {
  return texte.replace(/ ([:;!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
}

/** Splits on `**gras**` and `[texte](url)` in one pass, in order. */
export function enligne(brut: string): ReactNode[] {
  const texte = typo(brut);
  const out: ReactNode[] = [];
  const motif = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let pos = 0;
  let m: RegExpExecArray | null;
  while ((m = motif.exec(texte))) {
    if (m.index > pos) out.push(texte.slice(pos, m.index));
    if (m[1] !== undefined) {
      out.push(<b key={m.index}>{m[1]}</b>);
    } else {
      /* Internal addresses carry their trailing slash in the content, and
         scripts/check-links.mjs fails the build if one does not: a link written
         here is a link a reader follows, not an identifier. */
      out.push(
        <a key={m.index} className="lnk" href={m[3]}>
          {m[2]}
        </a>,
      );
    }
    pos = motif.lastIndex;
  }
  if (pos < texte.length) out.push(texte.slice(pos));
  return out;
}

function Bloc({ bloc }: { bloc: Bloc }) {
  if ("p" in bloc) return <p>{enligne(bloc.p)}</p>;

  if ("ul" in bloc) {
    return (
      <ul className="art__liste">
        {bloc.ul.map((x) => (
          <li key={x.slice(0, 32)}>{enligne(x)}</li>
        ))}
      </ul>
    );
  }

  if ("ol" in bloc) {
    return (
      <ol className="art__liste">
        {bloc.ol.map((x) => (
          <li key={x.slice(0, 32)}>{enligne(x)}</li>
        ))}
      </ol>
    );
  }

  if ("citation" in bloc) {
    return (
      <figure className="art__cite">
        <blockquote>{enligne(bloc.citation)}</blockquote>
        {bloc.source && <figcaption>{typo(bloc.source)}</figcaption>}
      </figure>
    );
  }

  if ("tableau" in bloc) {
    const t = bloc.tableau;
    return (
      <DataTable
        caption={t.legende ? typo(t.legende) : ""}
        columns={t.colonnes}
        rows={t.lignes.map((l) => l.map((c) => enligne(c)))}
        note={t.note ? enligne(t.note) : undefined}
      />
    );
  }

  return (
    <figure className="fig bande">
      <Photo id={bloc.photo} role="bande" />
    </figure>
  );
}

export function Corps({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((s) => (
        <section className="sec" key={s.h2}>
          <div className="wrap">
            {/* The id lets the table of contents and any external citation
                address a section rather than the whole page. */}
            <h2 className="d2" id={ancre(s.h2)}>
              {typo(s.h2)}
            </h2>
            {s.blocs.map((b, i) => (
              <Bloc bloc={b} key={i} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

/** "La fenêtre où les deux pays sont au sec" → "la-fenetre-ou-les-deux-pays…" */
export function ancre(titre: string): string {
  return titre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
