import { getSite } from "@/lib/content";

/**
 * E-E-A-T signal: an agency whose contacts can be named carries more weight
 * than an anonymous "Our team" page. The matching `Person` nodes are declared
 * in JSON-LD as `employee` of the `TravelAgency`.
 *
 * This section used to carry an invented founder, her biography and a quote she
 * never said — all of it also declared to Google. It now contains only what the
 * agency actually publishes: names, roles, a licence and an address. That is
 * less warm, and it is true; the warmth will come from the team's real photos
 * and real words, not from a character.
 */
export async function Advisor() {
  const site = await getSite();

  return (
    <section className="sec sec--jade">
      <div className="wrap">
        <p className="kicker">Qui vous répond</p>
        <h2 className="d2">
          Une équipe à <em>{site.address.city}</em>, pas un formulaire
        </h2>
        <p className="lede">
          Vos voyages sont opérés par <b>{site.operator.name}</b>, agence
          locale installée à {site.address.city} et titulaire de la licence de
          tour-opérateur international{" "}
          <b>{site.operator.license}</b>. Vos échanges se font avec la même
          personne, du premier message jusqu&apos;au retour.
        </p>

        <ul className="equipe">
          {site.team.map((m) => (
            <li key={m.name}>
              <b>{m.name}</b>
              <span>{m.role}</span>
            </li>
          ))}
        </ul>

        <p className="cta-row">
          <a className="lnk" href="/agence-de-voyage-vietnam">
            Qui nous sommes, en détail
          </a>
        </p>
      </div>
    </section>
  );
}
