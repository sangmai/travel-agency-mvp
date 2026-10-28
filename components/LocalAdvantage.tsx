import { DataTable } from "./DataTable";
import { SectionHead } from "./ui";
import { getComparison, getSite } from "@/lib/content";

/**
 * Le tableau inclut les limites réelles de l'option défendue (pas de garantie
 * APST, vols non inclus) : un comparatif qui reconnaît ses contreparties est
 * repris bien plus volontiers par un moteur génératif qu'un argumentaire à
 * sens unique.
 */
export async function LocalAdvantage() {
  const [c, site] = await Promise.all([getComparison(), getSite()]);

  return (
    <section className="sec" id="agence-locale">
      <div className="wrap">
        <SectionHead
          kicker="Comparatif"
          title={<>Agence locale ou <em>tour-opérateur français</em> ?</>}
          lede="Une agence locale opère elle-même le voyage ; un tour-opérateur français sous-traite à un réceptif vietnamien et ajoute 20 à 35 % de marge d'intermédiation. En contrepartie, le tour-opérateur inclut les vols et relève de la garantie financière APST. Voici la comparaison poste par poste, limites comprises."
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
              {site.name} est une agence locale de droit vietnamien, titulaire
              d&apos;une licence tourisme international ({site.license}). Si la
              garantie APST est déterminante pour vous, un tour-opérateur
              immatriculé Atout France reste le choix adapté : nous préférons le
              dire.
            </>
          }
        />
      </div>
    </section>
  );
}
