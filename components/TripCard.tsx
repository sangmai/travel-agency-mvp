import { Photo } from "./Photo";
import { PriceFrom } from "./ui";
import { score } from "@/lib/format";
import { tripUrl, type Trip } from "@/lib/content";

/**
 * Carte d'un voyage dans la liste, sur le modèle de Terres d'Aventure : image,
 * titre, deux lignes, puis la ligne de critères qui permet d'écarter un voyage
 * sans l'ouvrir — durée, niveau, note. Sans elle, le visiteur doit ouvrir six
 * onglets pour faire son tri.
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
