import { Photo, photoCaption } from "./Photo";
import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getRegions, getHome, lien} from "@/lib/content";

/**
 * Offset grid, photo and text alternating sides: a row of identical cards reads
 * like a catalogue, not like an invitation.
 */
export async function Regions() {
  const h = (await getHome()).regions;
  const regions = await getRegions();
  const captions = await Promise.all(regions.map((r) => photoCaption(r.photo)));

  return (
    <section className="sec sec--sand" id="regions">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{h.title}</Accent>}
          lede={h.lede}
        />

        {regions.map((r, i) => (
          <article className="rgn" key={r.id}>
            <div>
              <p className="kicker">{r.subtitle}</p>
              <h3 className="d2">{r.name}</h3>
              <p className="rgn__feel">{r.feel}</p>
              <p className="rgn__txt">{r.summary}</p>

              <ul className="rgn__places">
                {r.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>

              <div className="rgn__foot">
                <span>Durée conseillée · {r.duration}</span>
                <a className="lnk" href={lien(r.route)}>
                  Nos circuits dans {r.name.toLowerCase()} →
                </a>
              </div>
            </div>

            <figure className="fig rgn__fig">
              <Photo id={r.photo} role="half" />
              <figcaption className="rgn__tag">{captions[i]}</figcaption>
            </figure>
          </article>
        ))}
      </div>
    </section>
  );
}
