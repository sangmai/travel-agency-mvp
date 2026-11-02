import { DataTable } from "./DataTable";
import { SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getComparison, getSite, getHome } from "@/lib/content";

/**
 * The table includes the real limits of the option being argued for (no APST
 * guarantee, flights not included): a comparison that concedes its trade-offs
 * is picked up far more readily by a generative engine than a one-sided pitch.
 */
export async function LocalAdvantage() {
  const h = (await getHome()).comparatif;
  const [c, site] = await Promise.all([getComparison(), getSite()]);

  return (
    <section className="sec" id="agence-locale">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{h.title}</Accent>}
          lede={h.lede}
        />
        <DataTable
          caption="Comparaison agence locale vietnamienne / tour-opérateur français, à prestations équivalentes."
          columns={["Critère", ...c.columns]}
          rows={c.rows.map((r) => [
            r.criterion,
            <span className="col-us" key="l">{r.local}</span>,
            r.to,
          ])}
          note={
            <>
              {site.operator.name}, qui opère vos voyages, est une agence
              locale de droit vietnamien titulaire d&apos;une licence tourisme
              international ({site.operator.license}). Si la garantie APST est
              déterminante pour vous, un tour-opérateur immatriculé Atout
              France reste le choix adapté : nous préférons le dire.
            </>
          }
        />
      </div>
    </section>
  );
}
