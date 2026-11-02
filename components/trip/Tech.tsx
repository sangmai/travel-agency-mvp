import { DataTable } from "@/components/DataTable";
import { SectionHead } from "@/components/ui";
import type { Spec } from "./Specs";

/**
 * Spec sheet. Rows shared with the page header come from `tripSpecs`; only the
 * three specific to the table are written here.
 *
 * NOTE: Terdav offers a downloadable PDF spec sheet, and it is a real
 * conversion factor: the document circulates by email around the family while
 * they decide. The button is still to be wired up.
 */
export function Tech({ code, specs }: { code: string; specs: Spec[] }) {
  const rows: string[][] = [
    ["Code voyage", code],
    ...specs
      .filter((s) => s.table !== false)
      .map((s) => [s.tableLabel ?? s.label, s.detail ?? s.value]),
    [
      "Encadrement",
      "Guide francophone titulaire de la carte de guide national, et chauffeur privé. Assistance locale 7j/7.",
    ],
    [
      "Formalités",
      "Passeport valable 6 mois après la date d'entrée. Exemption de visa pour les ressortissants français jusqu'à 45 jours.",
    ],
    ["Dates de départ", "Aucune : ce voyage est privé et se compose à vos dates."],
  ];

  return (
    <section className="sec" id="fiche-technique">
      <div className="wrap wrap--wide">
        <SectionHead kicker="Fiche technique" title="Ce qu'il faut savoir avant de dire oui" />
        <DataTable
          caption={`Caractéristiques du voyage ${code}. Ces éléments figurent à l'identique sur le devis qui vous est adressé.`}
          columns={["Critère", "Détail"]}
          rows={rows}
          note="Une fiche technique PDF reprenant le programme, la liste d'équipement et les conditions de vente est jointe au devis."
        />
      </div>
    </section>
  );
}
