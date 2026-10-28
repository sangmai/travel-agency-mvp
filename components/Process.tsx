import { SectionHead } from "./ui";
import { getProcess } from "@/lib/content";

/** La numérotation est légitime ici, et seulement ici : ces étapes forment
 *  une séquence réelle où l'ordre porte une information utile. */
export async function Process() {
  const steps = await getProcess();

  return (
    <section className="sec sec--sand" id="methode">
      <div className="wrap">
        <SectionHead
          kicker="Notre méthode"
          title="Comment naît votre voyage"
          lede="Un seul interlocuteur du premier message jusqu'à votre retour. Aucune des trois premières étapes ne vous engage."
        />
        <ol className="flow">
          {steps.map((s) => (
            <li className="flow__step" key={s.step}>
              <span className="flow__n">Étape {s.step}</span>
              <h3 className="d3">{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
