import { DataTable } from "./DataTable";
import { SectionHead } from "./ui";
import { getBudget } from "@/lib/content";

/**
 * Deuxième requête informationnelle du marché après la saisonnalité. Donner
 * des fourchettes précises plutôt qu'un « sur devis » est à la fois un facteur
 * de conversion et la condition pour être cité quand quelqu'un demande à une
 * IA combien coûte un voyage au Vietnam.
 */
export async function Budget() {
  const rows = await getBudget();

  return (
    <section className="sec sec--sand" id="budget">
      <div className="wrap">
        <SectionHead
          kicker="Budget"
          title="Combien coûte un voyage au Vietnam ?"
          lede="Comptez 55 à 75 € par jour et par personne en gamme confort, 85 à 120 € en gamme charme, et 180 à 300 € en gamme signature — guide francophone, chauffeur privé, hébergement et petits-déjeuners inclus. Les vols internationaux Paris–Hanoï s'ajoutent à ce budget, entre 600 et 950 € selon la saison."
        />
        <DataTable
          caption="Budget par personne, hors vols internationaux, base deux voyageurs en chambre double."
          columns={["Gamme", "Hébergement", "Par jour", "14 jours", "Compris"]}
          rows={rows.map((b) => [
            b.gamme,
            b.hotel,
            <span className="num" key="d">{b.perDay}</span>,
            <span className="num" key="w">{b.twoWeeks}</span>,
            b.inclus,
          ])}
          note={
            <>
              Ces fourchettes couvrent l&apos;essentiel des devis que nous
              émettons. Trois leviers les font bouger : la saison, la gamme
              d&apos;hébergement et le nombre de vols intérieurs retenus face aux
              trajets par la route.{" "}
              <a className="lnk" href="/budget-voyage-vietnam">Détail poste par poste</a>
            </>
          }
        />
      </div>
    </section>
  );
}
