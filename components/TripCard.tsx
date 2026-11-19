import { Photo } from "./Photo";
import { PriceFrom } from "./ui";
import { score } from "@/lib/format";
import { tripUrl, type Trip } from "@/lib/content";

/**
 * A trip card in the list, modelled on Terres d'Aventure: image, title, two
 * lines, then the criteria row that lets you rule a trip out without opening it
 * — duration, difficulty, rating. Without it the visitor has to open six tabs
 * to sort through them.
 */
export function TripCard({
  trip,
  rating,
}: {
  trip: Trip;
  rating: { value: number; count: number };
}) {
  return (
    <article className="tile">
      <a href={tripUrl(trip.slug)}>
        <span className="tile__fig">
          <Photo id={trip.photo} role="card" />
          {trip.tag && <span className="badge badge--float">{trip.tag}</span>}
        </span>

        <span className="tile__body">
          <span className="tile__over">{trip.region}</span>
          <span className="d3">{trip.name}</span>
          <span className="tile__line">{trip.tagline}</span>

          <span className="tile__facts">
            <span><b>{trip.days} jours</b></span>
            <span>Niveau <b>{trip.niveau.toLowerCase()}</b></span>
            {/* Rien tant qu'il n'y a pas d'avis. « 0,0/5 (0 avis) » ne se lit
                pas comme une absence de note : ça se lit comme une note
                catastrophique, ou comme un voyage que personne ne réserve.
                La fiche voyage applique déjà cette règle — voir tripSpecs
                dans components/trip/Specs.tsx — la vignette ne le faisait pas,
                et c'est elle qu'on voit en premier.

                La ligne revient d'elle-même au premier avis rattaché au
                circuit : rien à réactiver. */}
            {rating.count > 0 && (
              <span><b>{score(rating.value)}/5</b> ({rating.count} avis)</span>
            )}
          </span>

          <span className="tile__foot">
            <PriceFrom amount={trip.priceFrom} />
            <span className="tile__go">Voir le voyage →</span>
          </span>
        </span>
      </a>
    </article>
  );
}
