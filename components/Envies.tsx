import { Photo } from "./Photo";
import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getEnvies, getHome } from "@/lib/content";

/**
 * Entrée par l'envie, juste après le hero — c'est la question que le visiteur
 * se pose en arrivant (« est-ce que ce voyage est pour moi ? »), pas celle du
 * nombre de jours. Voyageurs du Monde, Original Travel et Jacada ouvrent tous
 * ainsi.
 */
export async function Envies() {
  const h = (await getHome()).envies;
  const envies = await getEnvies();

  return (
    <section className="sec" id="envies">
      <div className="wrap wrap--wide">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{h.title}</Accent>}
          lede={h.lede}
        />

        <ul className="tiles">
          {envies.map((e) => (
            <li className="tile" key={e.route}>
              <a href={e.route}>
                <span className="tile__fig">
                  <Photo id={e.photo} role="card" />
                </span>
                <span className="tile__body">
                  <span className="d3">{e.title}</span>
                  <span className="tile__line">{e.line}</span>
                  <span className="tile__go">Voir les voyages →</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
