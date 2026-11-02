import type { ReactNode } from "react";

/**
 * Two conventions so that CMS-editable text keeps the site's formatting and
 * figures, without anyone having to write HTML into a form field.
 */

/**
 * `*text*` becomes the heading's amber accent. The character never appears in
 * a French sentence, so there is nothing to escape.
 */
export function Accent({ children }: { children: string }): ReactNode {
  return children
    .split("*")
    .map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));
}

/**
 * `{ville}`, `{note}`, `{delai}`… pull values from the site content instead of
 * copying them. An address that changes in content/site.json therefore
 * propagates to every sentence quoting it, rather than leaving them to lie.
 *
 * An unknown key throws: a red build beats a literal "{vile}" served in the
 * middle of a heading.
 */
export function fill(texte: string, vars: Record<string, string | number>): string {
  return texte.replace(/\{(\w+)\}/g, (_, cle) => {
    if (!(cle in vars)) {
      throw new Error(
        `content: "{${cle}}" is unknown. Available: ${Object.keys(vars).join(", ")}.`,
      );
    }
    return String(vars[cle]);
  });
}
