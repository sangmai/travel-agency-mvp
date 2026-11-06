import { Photo } from "./Photo";
import type { PhotoId } from "@/lib/content";

/**
 * A photograph closing the section whose argument it illustrates.
 *
 * ## What the first attempt got wrong
 *
 * It was a full-width band between two sections: 1344 × 756 on a desktop,
 * against 518 × 389 for every other photograph on the site and a prose column
 * of about 660. Two and a half times wider than anything around it, floating in
 * the gap between two bands of colour, attached to no heading. It read as a
 * foreign object because it was one — the only image here obeying none of the
 * rules the rest of the page follows.
 *
 * The site already has a grammar for pictures and it is consistent: every
 * landscape image is 4/3, and every one of them is bounded by something — a
 * column beside text, a card, a scrolling rail. The hero is the single
 * exception, and that is the point of a hero. A second full-bleed image does
 * not add a second bold moment; it spends the first one.
 *
 * So this now sits inside the section it belongs to, at the width of the prose
 * above it, in the same 4/3 as everything else. Nothing new was invented: the
 * fix was to stop breaking the system that was already there.
 *
 * ## No caption
 *
 * The first version printed "Quy Nhon · 14°N" under each photograph. Latitude
 * earns its place in the gallery, where place and position are the whole
 * content. Here it was two facts joined by a middle dot under a picture that
 * needs neither — the kind of chrome that appears on a page regardless of what
 * the page is about. Belonging to a section does the work the caption was
 * pretending to do, and the alt text still carries the description.
 */
export function Bande({ id, second }: { id: PhotoId; second?: PhotoId }) {
  if (second) {
    return (
      <div className="bande-duo">
        <figure className="fig bande">
          <Photo id={id} role="bande" />
        </figure>
        <figure className="fig bande">
          <Photo id={second} role="bande" />
        </figure>
      </div>
    );
  }
  return (
    <figure className="fig bande">
      <Photo id={id} role="bande" />
    </figure>
  );
}
