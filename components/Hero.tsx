import { Photo } from "./Photo";
import { aggregate, getReviews, getSite, getHome } from "@/lib/content";
import { Accent, fill } from "@/lib/text";
import { score } from "@/lib/format";

/**
 * Pleine image : sur un site de voyage, la première chose à ressentir est
 * l'envie du lieu, pas la proposition commerciale.
 *
 * Le H1 porte la requête cible (« voyager au Vietnam ») et le qualificatif qui
 * suit — « agence locale francophone » — est l'entité reprise par les moteurs
 * génératifs : il doit être identique dans le title, le H1, le JSON-LD,
 * llms.txt et la fiche Google.
 */
export async function Hero() {
  const [site, reviews] = await Promise.all([getSite(), getReviews()]);
  const note = aggregate(reviews);

  const h = (await getHome()).hero;

  /* La note vient de Tripadvisor, affichée telle quelle et vérifiable par le
     lien de la section avis. Nous n'en calculons plus la moyenne nous-mêmes :
     deux témoignages publiés ne font pas une note d'agence. */
  const vars = {
    note: score(site.reviewSource.rating),
    avis: site.reviewSource.count,
    delai: site.responseTime,
    annee: site.founded,
    ville: site.address.city,
  };
  const t = (x: string) => fill(x, vars);

  return (
    <section className="hero over">
      <div className="hero__img">
        <Photo id="hagiang" role="hero" />
      </div>
      <div className="hero__veil" />

      <p className="caption">
        {h.caption}
        <b>{h.captionNote}</b>
      </p>

      <div className="wrap wrap--wide hero__in">
        <p className="kicker">{t(h.kicker)}</p>

        <h1 className="d1">
          <Accent>{t(h.title)}</Accent>
        </h1>

        <p className="hero__sub">{t(h.sub)}</p>

        <div className="hero__cta">
          <a className="btn btn--amber" href="#devis">{h.ctaPrimary}</a>
          <a className="btn btn--glass" href="#circuits">{h.ctaSecondary}</a>
        </div>
      </div>

      <div className="proof">
        <div className="wrap wrap--wide">
          <div className="proof__grid">
            {h.proof.map((p) => (
              <div className="proof__cell" key={p.label}>
                <b>{t(p.value)}</b>
                <span>{t(p.label)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
