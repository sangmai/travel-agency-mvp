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
            <span><b>{score(rating.value)}/5</b> ({rating.count} avis)</span>
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
