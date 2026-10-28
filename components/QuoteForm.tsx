import { Photo } from "./Photo";
import { Check } from "./Art";
import { getSite } from "@/lib/content";

/**
 * Formulaire sans JavaScript : un `<form>` HTML qui poste vers worker/index.ts,
 * lequel envoie la demande par e-mail à l'agence. Il fonctionne si le JS ne
 * charge pas et ne coûte rien au LCP.
 *
 * Les `name` des champs sont lus tels quels par le Worker : en renommer un ici
 * sans l'y renommer fait disparaître l'information de l'e-mail, sans que rien
 * n'échoue au build.
 */
const PROMISES = [
  { t: "Réponse sous 48 heures ouvrées", d: "Un itinéraire complet jour par jour, hôtels nommés, prix ferme. Pas une brochure." },
  { t: "Gratuit et sans engagement", d: "Vous ne payez rien tant que vous n'avez pas validé le programme et versé l'acompte." },
  { t: "Retouches illimitées", d: "Une étape en plus, un hôtel différent, deux jours de moins : on refait le devis sans frais." },
  { t: "Un seul interlocuteur francophone", d: "La même personne du premier message jusqu'à votre retour, joignable 7j/7 sur place." },
];

export async function QuoteForm() {
  const site = await getSite();

  return (
    <section className="sec sec--jade devis" id="devis">
      <div className="devis__img">
        <Photo id="halong" role="backdrop" decorative />
      </div>
      <div className="devis__veil" />

      <div className="wrap devis__in">
        <div className="quote">
          <div>
            <p className="kicker">Devis sur mesure</p>
            <h2 className="d2">
              Racontez-nous <em>le Vietnam que vous avez en tête</em>
            </h2>
            <p className="lede">
              Quelques lignes suffisent pour commencer. Si vous hésitez encore
              sur les dates ou la durée, dites-le : c&apos;est précisément ce
              dont nous discutons ensuite.
            </p>

            <div className="promises">
              {PROMISES.map((p) => (
                <div className="promise" key={p.t}>
                  <Check />
                  <p>
                    <b>{p.t}</b>
                    <span>{p.d}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form className="form" method="post" action="/api/devis">
            <div className="form__grid">
              <div className="f">
                <label htmlFor="prenom">Prénom</label>
                <input id="prenom" name="prenom" type="text" autoComplete="given-name" required />
              </div>
              <div className="f">
                <label htmlFor="nom">Nom</label>
                <input id="nom" name="nom" type="text" autoComplete="family-name" required />
              </div>
              <div className="f">
                <label htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="f">
                <label htmlFor="telephone">Téléphone (facultatif)</label>
                <input id="telephone" name="telephone" type="tel" autoComplete="tel" />
              </div>
              <div className="f">
                <label htmlFor="depart">Départ envisagé</label>
                <input id="depart" name="depart" type="month" />
              </div>
              <div className="f">
                <label htmlFor="duree">Durée du séjour</label>
                <select id="duree" name="duree" defaultValue="15">
                  <option value="10">Environ 10 jours</option>
                  <option value="12">Environ 12 jours</option>
                  <option value="15">Environ 15 jours</option>
                  <option value="18">18 jours ou plus</option>
                  <option value="indecis">Je ne sais pas encore</option>
                </select>
              </div>
              <div className="f">
                <label htmlFor="voyageurs">Nombre de voyageurs</label>
                <input id="voyageurs" name="voyageurs" type="number" min={1} max={30} defaultValue={2} />
              </div>
              <div className="f">
                <label htmlFor="gamme">Gamme d&apos;hébergement</label>
                <select id="gamme" name="gamme" defaultValue="charme">
                  <option value="confort">Confort — 3★ et maisons d&apos;hôtes</option>
                  <option value="charme">Charme — 4★ et boutique-hôtels</option>
                  <option value="signature">Signature — 5★ et adresses rares</option>
                  <option value="indecis">À définir ensemble</option>
                </select>
              </div>
              <div className="f f--wide">
                <label htmlFor="projet">Votre projet</label>
                <textarea
                  id="projet"
                  name="projet"
                  placeholder="Ce qui vous attire, ce que vous voulez éviter, les contraintes (enfants, mobilité, régime alimentaire)…"
                />
              </div>

              {/* Honeypot : invisible, doit rester vide. Le nom du champ ne
                  doit évoquer aucune des catégories que le navigateur sait
                  remplir seul — « societe » en était une, et Chrome y écrivait
                  le nom de l'employeur du visiteur. */}
              <div aria-hidden="true" className="trap">
                <label htmlFor="reference-interne">Ne pas remplir</label>
                <input
                  id="reference-interne"
                  name="reference-interne"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* ⚠️ AVANT MISE EN LIGNE — cette mention tient lieu d'information
                  minimale ; le RGPD demande une politique de confidentialité
                  accessible, nommant le responsable du traitement, la durée de
                  conservation et la façon d'exercer ses droits. Le lien vers
                  /politique-de-confidentialite a été retiré tant que la page
                  n'existe pas : renvoyer une demande de consentement vers un
                  404 est pire que ne pas la lier. */}
              <label className="f f--consent" htmlFor="consentement">
                <input id="consentement" name="consentement" type="checkbox" required />
                <span>
                  J&apos;accepte que {site.name} utilise ces informations pour me
                  répondre. Elles sont transmises par e-mail à notre conseillère
                  et ne servent à aucun autre usage.
                </span>
              </label>

              <div className="form__send">
                <button className="btn btn--amber" type="submit">Recevoir mon itinéraire</button>
                <small>Gratuit · réponse sous {site.responseTime}</small>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
