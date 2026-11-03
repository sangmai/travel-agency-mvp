import { Photo } from "./Photo";
import { Check } from "./Art";
import { getSite, getHome, type Trip } from "@/lib/content";
import { Accent } from "@/lib/text";

/**
 * JavaScript-free form: an HTML `<form>` posting to worker/index.ts, which
 * emails the request to the agency. It works when JS fails to load and costs
 * nothing at LCP.
 *
 * Field `name` attributes are read verbatim by the Worker: renaming one here
 * without renaming it there makes that information vanish from the email,
 * without anything failing at build time.
 */

/**
 * `trip` turns the generic form into a trip-specific one.
 *
 * Until now the form existed on the home page only: all twenty-four other
 * pages — including the six trip pages, which are the selling pages — sent the
 * visitor back to /#devis. Someone who had just read the price and the
 * day-by-day programme, at the highest point of intent, had to leave the page
 * to act. That is the gap this prop closes.
 *
 * When a trip is passed, three things change and all three reduce typing: the
 * duration select lands on the nearest matching option, the project field is
 * pre-filled with the trip name, and a hidden field carries the slug so the
 * email says which programme the request came from. The contact ledger already
 * records the referring page, so attribution works either way — but the agency
 * reading the email should not have to guess.
 */
export async function QuoteForm({ trip }: { trip?: Trip }) {
  const site = await getSite();
  const h = (await getHome()).devis;

  /* La durée du circuit ramenée à l'option la plus proche du menu. Un circuit
     de 13 jours tombe sur « environ 12 », pas sur « je ne sais pas » : le menu
     propose des ordres de grandeur, pas des engagements. */
  const DUREES = [10, 12, 15, 18];
  const duree = trip
    ? String(DUREES.reduce((a, b) => (Math.abs(b - trip.days) < Math.abs(a - trip.days) ? b : a)))
    : "15";

  return (
    <section className="sec sec--jade devis" id="devis">
      <div className="devis__img">
        <Photo id="halong" role="backdrop" decorative />
      </div>
      <div className="devis__veil" />

      <div className="wrap devis__in">
        <div className="quote">
          <div>
            <p className="kicker">{trip ? "Ce circuit, à vos dates" : h.kicker}</p>
            <h2 className="d2">
              {trip ? (
                <>Partir sur <em>{trip.name}</em></>
              ) : (
                <Accent>{h.title}</Accent>
              )}
            </h2>
            <p className="lede">
              {trip
                ? `Ce programme de ${trip.days} jours est un point de départ : dites-nous vos dates et ce que vous voudriez changer, nous le réécrivons. Devis chiffré sous ${site.responseTime} ouvrées, gratuit et sans engagement.`
                : h.lede}
            </p>

            <div className="promises">
              {h.promises.map((p) => (
                <div className="promise" key={p.title}>
                  <Check />
                  <p>
                    <b>{p.title}</b>
                    <span>{p.detail}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <form className="form" method="post" action="/api/devis">
            {/* Le circuit d'où part la demande. Champ caché plutôt que texte
                libre : le voyageur n'a rien à recopier, et l'agence lit le nom
                exact du programme en haut de l'e-mail. */}
            {trip && <input type="hidden" name="circuit" value={trip.name} />}
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
                <select id="duree" name="duree" defaultValue={duree}>
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
                  defaultValue={trip ? `Je m'intéresse au circuit « ${trip.name} ».\n\n` : undefined}
                  placeholder="Ce qui vous attire, ce que vous voulez éviter, les contraintes (enfants, mobilité, régime alimentaire)…"
                />
              </div>

              {/* Honeypot: invisible, must stay empty. The field name must not
                  evoke any category the browser knows how to autofill —
                  "societe" was one, and Chrome wrote the visitor's employer
                  into it. */}
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

              {/* WARNING — BEFORE GOING LIVE: this notice stands in as minimal
                  information; the GDPR requires an accessible privacy policy
                  naming the data controller, the retention period and how to
                  exercise your rights. The link to
                  /politique-de-confidentialite was removed while that page does
                  not exist: pointing a consent request at a 404 is worse than
                  not linking it at all. */}
              <label className="f f--consent" htmlFor="consentement">
                <input id="consentement" name="consentement" type="checkbox" required />
                <span>
                  J&apos;accepte que {site.name} utilise ces informations pour me
                  répondre. Elles sont transmises par e-mail à notre conseillère
                  et ne servent à aucun autre usage.
                </span>
              </label>

              <div className="form__send">
                <button className="btn btn--amber" type="submit">{h.submit}</button>
                <small>Gratuit · réponse sous {site.responseTime}</small>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
