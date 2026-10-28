import { getSite } from "@/lib/content";

/**
 * Signal E-E-A-T : une agence dont on peut nommer les interlocuteurs pèse plus
 * qu'une page « Notre équipe » anonyme. Les `Person` correspondants sont
 * déclarés en JSON-LD comme `employee` de la `TravelAgency`.
 *
 * Cette section portait auparavant une fondatrice inventée, sa biographie et
 * une citation qu'elle n'avait jamais prononcée — le tout également déclaré à
 * Google. Elle ne contient plus que ce que l'agence publie réellement : des
 * noms, des fonctions, une licence et une adresse. C'est moins chaleureux, et
 * c'est vrai ; la chaleur viendra des vraies photos et des vrais mots de
 * l'équipe, pas d'un personnage.
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
          {site.name} est une agence locale installée au Vietnam, titulaire de
          la licence de tour-opérateur international{" "}
          <b>{site.license}</b>. Vos échanges se font avec la même personne, du
          premier message jusqu&apos;au retour.
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
