import { Photo, photoCaption } from "./Photo";
import { getCarnet, getPhotoMeta } from "@/lib/content";

/**
 * The only section that argues nothing. A travel page needs a moment where it
 * stops explaining and simply lets you look.
 *
 * Native horizontal scroll with snap, not a carousel: a carousel demands
 * JavaScript, hides images from crawlers and imposes its own pace.
 */
export async function Gallery() {
  const ids = await getCarnet();
  const meta = await getPhotoMeta();
  const captions = await Promise.all(ids.map(photoCaption));

  return (
    <section className="carnet sec--jade" aria-label="Photographies du Vietnam">
      <div className="carnet__head">
        <p className="kicker">Le carnet</p>
        <h2 className="d2">Ce que vous verrez</h2>
      </div>

      <div className="carnet__rail">
        {ids.map((id, i) => (
          <figure className="shot" key={id}>
            <Photo id={id} role="shot" />
            <figcaption>
              {meta[id].place}
              {meta[id].lat !== null && <span>{meta[id].lat}°N</span>}
              <span className="sr-only">{captions[i]}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
