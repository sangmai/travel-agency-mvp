import { Photo } from "@/components/Photo";
import { SectionHead } from "@/components/ui";
import type { Day } from "@/lib/content";

/**
 * Chaque journée porte ses données chiffrées : c'est ce qui engage l'agence et
 * permet au lecteur de dire non.
 *
 * Les libellés vivent ici, pas dans le contenu — ajouter « bateau » ou
 * « vol » ne demande qu'une entrée de plus.
 */
const LABELS: Record<string, string> = {
  trajet: "Trajet",
  marche: "Marche",
  velo: "Vélo",
  bateau: "Bateau",
  vol: "Vol",
  nuit: "Nuit",
  repas: "Repas",
};

export function Program({ days }: { days: Day[] }) {
  return (
    <section className="sec" id="jour-par-jour">
      <div className="wrap wrap--wide">
        <SectionHead
          kicker="Programme"
          title="Jour par jour"
          lede="Chaque journée indique ses temps de transfert, ses marches et son hébergement. C'est volontairement précis : un programme sans chiffres ne permet pas de dire non."
        />

        <ol className="jours">
          {days.map((d) => (
            <li className="jour" key={d.n}>
              <div className="jour__n">
                <span>Jour</span>
                <b>{d.n}</b>
              </div>

              <div className="jour__body">
                <h3 className="d3">{d.title}</h3>
                <p className="jour__txt">{d.body}</p>

                {d.facts.length > 0 && (
                  <dl className="jour__facts">
                    {d.facts.map((f) => (
                      <div key={f.key}>
                        <dt>{LABELS[f.key] ?? f.key}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {d.photo && (
                <figure className="fig jour__fig">
                  <Photo id={d.photo} role="day" />
                </figure>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
