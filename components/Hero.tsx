import { Photo } from "./Photo";
import { aggregate, getReviews, getSite, getHome, lien } from "@/lib/content";
import { Accent, fill } from "@/lib/text";
import { score } from "@/lib/format";

/**
 * Full-bleed image: on a travel site the first thing to feel is the desire for
 * the place, not the commercial proposition.
 *
 * The H1 carries the target query ("voyager au Vietnam") and the qualifier that
 * follows — "agence locale francophone" — is the entity generative engines pick
 * up: it must be identical in the title, the H1, the JSON-LD, llms.txt and the
 * Google Business Profile.
 */
export async function Hero() {
  const [site, reviews] = await Promise.all([getSite(), getReviews()]);
  const note = aggregate(reviews);

  const h = (await getHome()).hero;

  /* The rating comes from Tripadvisor, shown as-is and verifiable through the
     link in the reviews section. We no longer compute the average ourselves:
     two published testimonials do not make an agency rating. */
  const vars = {
    note: score(site.reviewSource.rating),
    avis: site.reviewSource.count,
    delai: site.responseTime,
    annee: site.operator.founded,
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

        {/* Le second bouton mène au planificateur, pas à la liste des
            circuits : celle-ci est à un coup de molette, et personne ne clique
            un bouton pour faire défiler. Le planificateur, lui, est la seule
            chose du site qu'un concurrent n'a pas — il mérite la place.

            « Tester » et non « Organiser » : le bouton d'à côté dit « Composer
            mon voyage » et mène au devis. Deux libellés quasi synonymes pour
            deux destinations différentes, c'est un visiteur qui se trompe de
            porte. « Tester » annonce un outil, pas un formulaire de plus.

            Pas de « Vietnam » dans le libellé non plus : nous avons déjà une
            page sur l'itinéraire, et lui voler son ancre reviendrait à faire
            concourir deux pages pour la même requête. */}
        <div className="hero__cta">
          <a className="btn btn--amber" href="#devis">{h.ctaPrimary}</a>
          <a className="btn btn--glass" href={lien("/organiser-son-voyage-au-vietnam")}>
            {h.ctaSecondary}
          </a>
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
