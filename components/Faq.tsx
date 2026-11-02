import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getFaq, getHome } from "@/lib/content";

/**
 * Native `<details>`: the answers sit in the served HTML even when collapsed,
 * so crawlers and generative engines can read them. A JavaScript accordion that
 * only injects the answer on click would make them invisible.
 *
 * The FAQPage markup (JsonLd.tsx) must mirror these questions word for word.
 */
export async function Faq() {
  const h = (await getHome()).faq;
  const faq = await getFaq();

  return (
    <section className="sec" id="faq">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{h.title}</Accent>}
          lede={h.lede}
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
