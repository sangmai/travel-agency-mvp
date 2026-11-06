import { Photo, photoCaption } from "./Photo";
import type { PhotoId } from "@/lib/content";

/**
 * A photograph standing on its own between two sections.
 *
 * ## Why this exists rather than another `parcours`
 *
 * Thirteen pages carried no image at all. The obvious fix was the `parcours`
 * block used elsewhere — image left, prose right — but that block holds a whole
 * section: a heading, a lede, a list. Fitting one to a page that is already
 * written means either restructuring an argument that works, or inventing text
 * to sit beside a picture. The second is how pages fill up with sentences
 * nobody needed.
 *
 * This takes neither. The photograph sits between two existing sections and
 * says what it is, nothing more.
 *
 * ## The caption is the whole point
 *
 * Without one this would be decoration, and decoration on a page that argues
 * from figures is noise. `photoCaption` prints the place and its latitude —
 * "Baie d'Halong · 20°N" — the same line the gallery uses, and one that tells
 * someone planning a route something a pretty image alone does not.
 *
 * ## Two of them, on a page that compares
 *
 * /nord-ou-sud-vietnam weighs one half of the country against the other. A
 * single photograph there would argue for whichever half it showed, which is
 * the quiet way an image contradicts the text beside it. `second` puts the two
 * side by side, each captioned with its own latitude — 23°N against 10°N,
 * which is the comparison the page is about.
 */
export async function Bande({
  id,
  second,
}: {
  id: PhotoId;
  second?: PhotoId;
}) {
  const ids = second ? ([id, second] as const) : ([id] as const);
  const legendes = await Promise.all(ids.map(photoCaption));

  return (
    <div className="wrap wrap--wide">
      <div className={second ? "bande-duo" : undefined}>
        {ids.map((pid, i) => (
          <figure className="fig bande" key={pid}>
            <Photo id={pid} role="bande" />
            <figcaption>{legendes[i]}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
