import { Photo } from "./Photo";
import { PriceFrom, SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getTrips, resolveStops, tripUrl, getHome } from "@/lib/content";

/**
 * Une liste, pas une grille : six itinéraires se comparent en lisant une
 * colonne. Dans une grille, l'œil doit relire la même information six fois.
 *
 * Le prix est en texte brut, jamais dans une image — c'est ce qui permet le
 * rich snippet via le JSON-LD Offer et la citation par un moteur génératif.
 */
export async function Circuits() {
  const h = (await getHome()).circuits;
  const trips = await getTrips();
  const routes = await Promise.all(trips.map((t) => resolveStops(t.stops)));

  return (
    <section className="sec" id="circuits">
      <div className="wrap">
        <SectionHead
          kicker={h.kicker}
          title={<Accent>{h.title}</Accent>}
          lede={h.lede}
        />

        <div className="trips">
          {trips.map((c, i) => (
            <article className="trip" key={c.slug}>
              <figure className="fig trip__fig">
                <Photo id={c.photo} role="thumb" />
                <figcaption className="trip__days">{c.days} jours</figcaption>
              </figure>

              <div>
                <div className="trip__head">
                  <h3 className="d3">{c.name}</h3>
                  {c.tag && <span className="badge">{c.tag}</span>}
                </div>
                <p className="trip__route">
                  {routes[i].map((s) => s.label).join(" · ")}
                </p>
                <p className="trip__txt">{c.pitch}</p>
                <p className="trip__who">
                  <b>Pour qui —</b> {c.audience}
                </p>
              </div>

              <p className="trip__price">
                <PriceFrom amount={c.priceFrom} />
                <br />
                <a className="lnk" href={tripUrl(c.slug)}>Voir le détail →</a>
              </p>
            </article>
          ))}
        </div>

        <p className="note">
          Prix par personne, base deux voyageurs, en gamme confort à charme, hors
          vols internationaux Paris–Hanoï (comptez 600 à 950 € selon la saison).
          Un devis ferme, nominatif et détaillé vous est adressé sous 48 heures.
        </p>
      </div>
    </section>
  );
}
