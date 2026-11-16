import { SectionHead } from "./ui";
import { typo } from "./Article";
import { Accent } from "@/lib/text";
import { bilan } from "@/lib/planner";
import type { Etape } from "@/lib/planner";
import { getHome, getTrips, getPlaces, getLegs, lien } from "@/lib/content";

/**
 * The planner, argued for on the page everyone lands on.
 *
 * The tool shipped reachable only from the footer, and being linked to is the
 * first reason the spec gave for building it — nobody links to a sales page,
 * people do link to a free tool. A section nobody can find serves neither.
 *
 * It sits after the circuits on purpose: a visitor who has just read six
 * packaged itineraries and wants none of them has, at that exact moment,
 * revealed which of the two audiences they belong to.
 *
 * No client JavaScript. The home page has none today, its mobile LCP is 3.1 s
 * in the lab, and the audit's instruction was to leave the hero alone until
 * CrUX returns field data — so at the very least do not make it heavier. The
 * real tool is one click away and is better than any teaser could be.
 */

/** The itinerary the example starts from, found by its length. */
const BASE_JOURS = 15;

/**
 * What gets added to it. Chosen because it is the strongest example that is
 * also fully costed: adding Sapa leaves the trip two days short with no
 * unknown legs, so every number below can be defended. Ha Giang is only one
 * day short; Con Dao and Phu Quoc look worse but route through legs the data
 * holds nothing on, which would make the shortfall optimistic and the sentence
 * false. The spec's §4 has the table this was read off.
 */
const AJOUT = "sapa";

export async function Apercu() {
  const [home, trips, places, legsFile] = await Promise.all([
    getHome(),
    getTrips(),
    getPlaces(),
    getLegs(),
  ]);
  const t = home.planificateur;

  const base = trips.find((x) => x.days === BASE_JOURS);
  const ajout = places.find((p) => p.id === AJOUT);
  if (!base) throw new Error(`[apercu] no ${BASE_JOURS}-day itinerary to build the example from`);
  if (!ajout) throw new Error(`[apercu] place "${AJOUT}" is not in content/places.json`);

  /* Inserted at its latitude, exactly as the planner does it, because an
     example that appended Sapa after the Mekong delta would be showing a trip
     nobody takes. */
  const latitude = (id: string) => places.find((p) => p.id === id)?.lat ?? 0;
  const etapes: Etape[] = base.stops
    .filter((s) => s.nuits > 0)
    .map((s) => ({ place: s.place, nuits: s.nuits }));
  const rang = etapes.findIndex((e) => latitude(e.place) < ajout.lat);
  etapes.splice(rang === -1 ? etapes.length : rang, 0, {
    place: AJOUT,
    nuits: ajout.nuits.ideal,
  });

  /* `mois` and `voyageurs` are required by the Plan type and read by neither
     bilan() nor anything below; only `jours` and `etapes` affect the figures. */
  const b = bilan(
    { jours: base.days, mois: "Mars", voyageurs: 2, etapes },
    legsFile.legs,
  );

  /* The guard. This section's whole claim is that its numbers are real, so a
     data change that makes the example fit — or that routes it through a leg
     nobody has costed — must stop the build rather than quietly print
     "Il vous manque 0 jours" above a sentence promising the tool tells the
     truth. Whoever hits this picks a new AJOUT from the spec's table. */
  if (b.reste >= 0) {
    throw new Error(
      `[apercu] adding ${AJOUT} to the ${base.days}-day trip now leaves ${b.reste} night(s) spare, ` +
        `so the example no longer shows a shortfall. Pick another AJOUT.`,
    );
  }
  if (b.inconnus.length > 0) {
    throw new Error(
      `[apercu] the example routes through leg(s) with no data: ${b.inconnus.join(", ")}. ` +
        `The shortfall would be understated. Pick another AJOUT or add the leg.`,
    );
  }

  const manque = -b.reste;
  const barres = Math.max(b.nuitsDisponibles, b.nuitsPlacees);

  return (
    <section className="sec sec--sand" id="planificateur">
      <div className="wrap">
        {/* typo() rather than raw strings: these sentences end in "?" and the
            colon rule applies to them, and the one thing worse than no
            non-breaking space is a heading that drops its question mark onto
            a line of its own. The other home-page sections predate the helper. */}
        <SectionHead
          kicker={typo(t.kicker)}
          title={<Accent>{typo(t.title)}</Accent>}
          lede={typo(t.lede ?? "")}
        />

        <div className="apercu">
          {/* aria-hidden because the sentence under it says the same thing in
              words. Left readable, a screen reader would hear the itinerary
              twice — the same reason TripMap is hidden beside its étape list. */}
          <div className="apercu__demo" aria-hidden="true">
            <span className="apercu__compte">
              {b.nuitsPlacees} / {b.nuitsDisponibles} nuits
            </span>
            <div className="plan__g">
              {Array.from({ length: barres }, (_, i) => (
                <i
                  key={i}
                  className={
                    i < b.nuitsPlacees
                      ? i < b.nuitsDisponibles
                        ? "ok"
                        : "over"
                      : "nil"
                  }
                />
              ))}
            </div>
            <p className="apercu__verdict">
              Il vous manque {manque} {manque > 1 ? "jours" : "jour"}.
            </p>
          </div>

          <div>
            <p>{typo(t.argument)}</p>
            <p className="apercu__force">{typo(t.force)}</p>
            <a
              className="btn btn--amber"
              href={lien("/organiser-son-voyage-au-vietnam")}
            >
              {t.cta}
            </a>
            <p className="apercu__repli">{typo(t.repli)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
