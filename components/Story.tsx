import { Photo, photoCaption } from "./Photo";
import { getStory } from "@/lib/content";

/**
 * Un carnet raconté par une personne nommée, pas une note sur cinq. Les deux
 * rassurent, mais seul le récit fait imaginer.
 *
 * ⚠️ Contenu de démonstration : à remplacer par un vrai carnet, avec l'accord
 * écrit du voyageur.
 */
export async function Story() {
  const r = await getStory();
  const caption = await photoCaption(r.photo);

  return (
    <section className="sec sec--jade recit" aria-labelledby="recit-titre">
      <div className="wrap wrap--wide">
        <div className="recit__grid">
          <figure className="fig fig--dark recit__fig">
            <Photo id={r.photo} role="story" />
            <figcaption>{caption}</figcaption>
          </figure>

          <div className="recit__txt">
            <p className="kicker">{r.kicker}</p>
            <h2 className="d2" id="recit-titre">{r.title}</h2>
            <p className="recit__meta">{r.author} · {r.trip} · {r.when}</p>
            <blockquote className="recit__pull">{r.pull}</blockquote>
            {r.body.map((para) => (
              <p className="recit__para" key={para.slice(0, 24)}>{para}</p>
            ))}
            <a className="lnk" href="/carnets-de-voyage">Lire d&apos;autres carnets →</a>
          </div>
        </div>
      </div>
    </section>
  );
}
