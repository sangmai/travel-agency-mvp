import { Photo } from "./Photo";
import { PriceFrom, SectionHead } from "./ui";
import { Accent } from "@/lib/text";
import { getTrips, resolveStops, tripUrl, getHome, TRIP_BASE, lien} from "@/lib/content";

/**
 * A list, not a grid: six itineraries are compared by reading down one column.
 * In a grid, the eye has to re-read the same information six times.
 *
 * The price is plain text, never inside an image — that is what makes the rich
 * snippet possible through the JSON-LD Offer, and what lets a generative engine
 * quote it.
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

        {/* Eleven pages that list trips end with this button; the home page did
            not. The only route from here to /circuit-vietnam was the footer —
            and the hero's "voir les circuits et les prix" scrolls to this very
            section rather than opening the list, so a visitor who wanted to
            compare properly had nowhere obvious to go.

            The listing page carries the comparison table, the inclusions and
            the FAQ: it answers the questions this section raises and cannot
            answer in six cards. */}
        <p className="cta-row cta-row--center">
          <a className="btn btn--amber" href={lien(TRIP_BASE)}>
            Comparer les six circuits
          </a>
        </p>
      </div>
    </section>
  );
}
