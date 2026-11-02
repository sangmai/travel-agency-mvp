import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getProcess, getHome } from "@/lib/content";

/** Numbering is legitimate here, and only here: these steps form a real
 *  sequence where the order carries useful information. */
export async function Process() {
  const h = (await getHome()).process;
  const steps = await getProcess();

  return (
    <section className="sec sec--sand" id="methode">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{h.title}</Accent>}
          lede={h.lede}
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
