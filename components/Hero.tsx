import { Photo } from "./Photo";
import { aggregate, getReviews, getSite } from "@/lib/content";
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

  const proof = [
    /* Calculé sur les avis réellement publiés, et non déclaré : la valeur
       qui figurait ici était inventée. */
    { v: `${score(note.value)}/5`, l: `sur ${note.count} avis publiés` },
    { v: site.responseTime, l: "pour recevoir votre itinéraire" },
    { v: `Depuis ${site.founded}`, l: `une agence locale, à ${site.address.city}` },
    { v: "Sans intermédiaire", l: "vous parlez à ceux qui opèrent" },
  ];

  return (
    <section className="hero over">
      <div className="hero__img">
        <Photo id="hagiang" role="hero" />
      </div>
      <div className="hero__veil" />

      <p className="caption">
        Plateau de Dong Van, Ha Giang
        <b>23°N</b>
      </p>

      <div className="wrap wrap--wide hero__in">
        <p className="kicker">Agence locale francophone · {site.address.city}</p>

        <h1 className="d1">
          Il y a mille façons de voyager au Vietnam. <em>Trouvons la vôtre.</em>
        </h1>

        <p className="hero__sub">
          De la brume sur les karsts de Ha Giang aux barques du marché flottant
          de Cai Rang, nous composons votre itinéraire étape par étape — depuis
          {" "}{site.address.city}, avec ceux qui connaissent la route.
        </p>

        <div className="hero__cta">
          <a className="btn btn--amber" href="#devis">Composer mon voyage</a>
          <a className="btn btn--glass" href="#circuits">Voir les circuits et les prix</a>
        </div>
      </div>

      <div className="proof">
        <div className="wrap wrap--wide">
          <div className="proof__grid">
            {proof.map((p) => (
              <div className="proof__cell" key={p.l}>
                <b>{p.v}</b>
                <span>{p.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
