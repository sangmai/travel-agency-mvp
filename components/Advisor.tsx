import { Portrait } from "./Art";
import { getSite } from "@/lib/content";

/**
 * Signal E-E-A-T : le contenu attribuable à une personne identifiable pèse
 * plus qu'une page « Notre équipe » anonyme. Le `Person` correspondant est
 * déclaré en JSON-LD comme `employee` de la `TravelAgency`.
 */
export async function Advisor() {
  const site = await getSite();
  const a = site.advisor;

  return (
    <section className="sec sec--jade">
      <div className="wrap">
        <div className="who">
          <figure className="who__fig"><Portrait /></figure>
          <div>
            <p className="kicker">Votre interlocutrice</p>
            <blockquote className="who__q">
              « Un itinéraire ne se vend pas, il se discute. Dites-moi ce que
              vous voulez éviter autant que ce que vous voulez voir — c&apos;est
              presque toujours la phrase qui change le voyage. »
            </blockquote>
            <p className="who__id">
              <b>{a.name}</b>
              {a.role} · {site.name}, depuis {a.since}
            </p>
            <p className="lede">{a.bio}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
