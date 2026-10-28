import type { ReactNode } from "react";

/**
 * Deux conventions pour que des textes éditables depuis un CMS gardent la
 * mise en forme et les chiffres du site, sans que personne ait à écrire du
 * HTML dans un formulaire.
 */

/**
 * `*texte*` devient l'accent ambre du titre. Le caractère n'apparaît jamais
 * dans une phrase française, il n'y a donc rien à échapper.
 */
export function Accent({ children }: { children: string }): ReactNode {
  return children
    .split("*")
    .map((part, i) => (i % 2 ? <em key={i}>{part}</em> : part));
}

/**
 * `{ville}`, `{note}`, `{delai}`… reprennent les valeurs du site plutôt que
 * de les recopier. Une adresse qui change dans content/site.json se propage
 * ainsi aux phrases qui la citent, au lieu de les laisser mentir.
 *
 * Une clé inconnue lève : mieux vaut un build rouge qu'un « {vile} » servi
 * tel quel au milieu d'un titre.
 */
export function fill(texte: string, vars: Record<string, string | number>): string {
  return texte.replace(/\{(\w+)\}/g, (_, cle) => {
    if (!(cle in vars)) {
      throw new Error(
        `content : « {${cle}} » est inconnu. Disponibles : ${Object.keys(vars).join(", ")}.`,
      );
    }
    return String(vars[cle]);
  });
}
