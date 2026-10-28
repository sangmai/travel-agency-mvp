import { SectionHead } from "./ui";
import { getFaq } from "@/lib/content";

/**
 * `<details>` natif : les réponses sont dans le HTML servi même repliées,
 * donc lisibles par les crawlers et les moteurs génératifs. Un accordéon
 * JavaScript qui n'injecte la réponse qu'au clic les rendrait invisibles.
 *
 * Le balisage FAQPage (JsonLd.tsx) doit refléter ces questions mot pour mot.
 */
export async function Faq() {
  const faq = await getFaq();

  return (
    <section className="sec" id="faq">
      <div className="wrap">
        <SectionHead
          kicker="Questions fréquentes"
          title="Ce que les voyageurs nous demandent"
        />
        <div className="faq">
          {faq.map((item, i) => (
            <details key={item.q} open={i === 0}>
              <summary>{item.q}</summary>
              <div className="faq__a"><p>{item.a}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
