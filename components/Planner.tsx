"use client";

/**
 * The tool. A budget of days that visibly runs out.
 *
 * Not dropdowns — that is what Evaneos and Marco Vasco already sell, and a
 * fourth copy of it differentiates nothing. The gauges are the argument: the
 * question a French traveller actually has is whether their trip fits in the
 * leave they have booked.
 *
 * There is a map now, under the list, which the design once ruled out. The
 * reason it ruled it out was that a map answers "where is it" and nobody was
 * asking — true of thirteen famous places, false of twenty-one that include
 * Dong Van, Ban Gioc and Ba Be. A traveller cannot judge an order they cannot
 * see, and the button offering to sort the étapes north to south was asking
 * them to do exactly that.
 *
 * It starts from a hand-written itinerary rather than an empty canvas. A
 * combinatorial generator would emit sequences with no prose, losing the voice
 * that is the site's only real asset and walking straight into the thin-content
 * penalty. Here the traveller adjusts something already good, and watches what
 * each adjustment costs.
 */

import { useEffect, useRef, useState } from "react";
import {
  bilan, rythme, retraits, encoder, decoder, region, verdictSaison, saisie,
  trouverLeg, modeDefaut,
} from "@/lib/planner";
import type { Etape, Leg, Lieu, Plan, SaisonRow } from "@/lib/planner";
import { AFFILIE, PARTENAIRE_GYG, aReserver, experiences, tourIdGyg } from "@/lib/booking";
import { TripMap } from "./TripMap";
import type { Experience } from "@/lib/booking";

export type PlanBase = { nom: string; jours: number; etapes: Etape[] };

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/**
 * A number field the traveller can actually type in.
 *
 * Both fields are controlled, so whatever React holds is what the box shows.
 * Clamping that value on every keystroke made the box fight the typist: on the
 * way to 15, the lone "1" is below the minimum and was rewritten to 5 before
 * the 5 could be typed. Most of the legal range was unreachable except by the
 * spinner arrows.
 *
 * So a keystroke that does not yet make a usable number is kept as a draft and
 * committed to nothing. `saisie` decides; leaving the field drops the draft,
 * and the box falls back to the last value that was actually good.
 */
function Nombre({
  label, suffixe, valeur, bas, haut, onCommit,
}: {
  label: string;
  suffixe?: string;
  valeur: number;
  bas: number;
  haut: number;
  onCommit: (n: number) => void;
}) {
  const [brouillon, setBrouillon] = useState<string | null>(null);

  return (
    <label>
      {label}
      <input
        type="number"
        inputMode="numeric"
        min={bas}
        max={haut}
        value={brouillon ?? String(valeur)}
        onChange={(ev) => {
          const brut = ev.target.value;
          setBrouillon(brut);
          const n = saisie(brut, bas, haut);
          if (n !== null) onCommit(n);
        }}
        /* Dropping the draft here is what makes an abandoned half-entry
           harmless: the box goes back to showing the committed value rather
           than keeping "2" on screen while the plan was built from 14. */
        onBlur={() => setBrouillon(null)}
      />
      {suffixe}
    </label>
  );
}

/**
 * GetYourGuide's activity widget, and the reason it is behind a button.
 *
 * The widget is the only way to show real photographs and live prices — it is
 * what GetYourGuide offers and there is no feed to build our own cards from.
 * But it is a third-party script in an iframe, and measured on a bare page it
 * costs four requests to widget.getyourguide.com and a Set-Cookie, before the
 * visitor has done anything at all. Today that number is zero, and "this site
 * calls nobody" is an asset worth more than an image above the fold.
 *
 * So nothing loads until someone asks. A visitor who never presses the button
 * is in exactly the architecture documented in app/layout.tsx; one who presses
 * it has chosen to look at a shop. It is the same click-to-load pattern a
 * French site uses for an embedded map, and it sidesteps the consent question
 * for everyone who does not click.
 *
 * The script is fetched once per page. It installs its own observer, so a
 * widget inserted later — the second étape the traveller opens — is picked up
 * with no re-initialisation. That was measured, not assumed: without it the
 * second button would have looked broken.
 */
let scriptGygDemande = false;

function CadreGyg({ ville, tours }: { ville: string; tours: string[] }) {
  useEffect(() => {
    if (scriptGygDemande) return;
    scriptGygDemande = true;
    const s = document.createElement("script");
    s.src = "https://widget.getyourguide.com/dist/pa.umd.production.min.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  return (
    <div className="plan__gyg">
      {/* Every attribute here was read out of the widget's own source and seen
          to render, rather than guessed from the dashboard.

          `tour-ids` is what makes the chosen activity appear with its own
          photograph. It matters more than it looks: asked for a city name
          their search returns ferries and airport transfers — "Saigon" is no
          better than "Hô Chi Minh-Ville" — so a stop we have chosen something
          for shows that choice, and only a stop we have not falls back to the
          search. */}
      <div
        data-gyg-widget="activities"
        data-gyg-href="https://widget.getyourguide.com/default/activities.frame"
        data-gyg-locale-code="fr-FR"
        data-gyg-number-of-items="3"
        data-gyg-partner-id={PARTENAIRE_GYG}
        data-gyg-cmp="planificateur"
        {...(tours.length ? { "data-gyg-tour-ids": tours.join(",") } : { "data-gyg-q": ville })}
      />
      <p className="plan__note">
        Proposé par GetYourGuide. Nous percevons une commission, sans surcoût
        pour vous.
      </p>
    </div>
  );
}

/** The button, until it is pressed. */
function Activites({ ville, tours }: { ville: string; tours: string[] }) {
  const [ouvert, setOuvert] = useState(false);
  if (ouvert) return <CadreGyg ville={ville} tours={tours} />;
  return (
    <button type="button" className="plan__voir" onClick={() => setOuvert(true)}>
      {tours.length ? "Voir en images" : `Voir les activités à ${ville}`}
    </button>
  );
}

/**
 * What there is to book at one étape, directly under it.
 *
 * Three things can be true of a stop, and the block says whichever ones are:
 * it sells out, somebody has chosen activities for it, or neither.
 *
 * The important property is what drives it. The cards appear because an
 * activity was entered in the CMS for that place — not because the étape
 * exists. So the commercial block grows when the catalogue grows, and stays
 * flat when a traveller adds four more stops. Adding an étape never adds a
 * reason to sell, which is what keeps "il vous dira non" true while the links
 * sit two centimetres away.
 *
 * A place with nothing entered says so plainly instead of reaching for a
 * search link: on a one-night stop there is no free morning to fill anyway,
 * and a page that offers something everywhere is a shop.
 */
function SousEtape({
  place, nuits, ville, carte, choisies,
}: {
  place: string;
  nuits: number;
  /** French editorial name, for the sentences. */
  ville: string;
  /** Real-world spelling, for the partner's search box. */
  carte: string;
  choisies: Record<string, Experience[]>;
}) {
  const pourquoi = aReserver(place);
  const propres = choisies[place] ?? [];
  const libre = nuits > 1;
  /* Klook activities have no number and stay text; the widget is GetYourGuide's. */
  const tours = propres.map((x) => tourIdGyg(x.url)).filter((x): x is string => x !== null);

  if (!pourquoi && propres.length === 0 && !libre) {
    /* A one-night stop with nothing scarce and nothing chosen. There is no
       free morning to fill, so the honest line is the whole of it. */
    return (
      <p className="plan__rien">
        Rien d&apos;urgent ici&nbsp;: réservez quand vos vols seront pris.
      </p>
    );
  }

  return (
    <div className="plan__ici">
      {pourquoi && (
        <p className="plan__alerte">
          <b>À réserver maintenant.</b> {pourquoi}
        </p>
      )}
      {propres.length > 0 && (
        <ul className="plan__cartes">
          {propres.map((x) => {
            const l = experiences(place, ville, { [place]: [x] })[0];
            return (
              <li key={x.url}>
                <a href={l.url} target="_blank" rel="noopener nofollow sponsored">
                  {l.libelle}
                </a>
                {l.partenaire && <small>{l.partenaire}</small>}
              </li>
            );
          })}
        </ul>
      )}
      {!pourquoi && propres.length === 0 && (
        <p className="plan__rien">
          Rien d&apos;urgent ici&nbsp;: réservez quand vos vols seront pris.
        </p>
      )}
      {/* Offered wherever the traveller has a morning to spend. The button
          costs nothing until it is pressed, so it can sit under a stop we have
          chosen nothing for — which is most of them — without the page turning
          into a catalogue. */}
      {libre && <Activites ville={carte} tours={tours} />}
    </div>
  );
}

export function Planner({
  lieux, legs, saisons, bases, choisies,
}: {
  lieux: Lieu[];
  legs: Leg[];
  saisons: SaisonRow[];
  bases: PlanBase[];
  /** Hand-picked activities by place id. Absent places fall back to a search. */
  choisies: Record<string, Experience[]>;
}) {
  const [plan, setPlan] = useState<Plan>({
    jours: bases[0].jours,
    mois: "Mars",
    voyageurs: 2,
    etapes: bases[0].etapes,
  });

  /* Read the hash once on mount. Doing it in an effect rather than in the
     initial state keeps the server and the first client render identical,
     which is what React hydration requires. */
  useEffect(() => {
    const venu = decoder(decodeURIComponent(location.hash.slice(1)));
    if (venu) setPlan(venu);
  }, []);

  /* Write it back on every change, with replaceState so the back button still
     leaves the page instead of walking through every edit.
     
     The first commit is skipped deliberately. Both effects run in declaration
     order within it, and this one's closure still holds the default plan — the
     setPlan above is queued, not applied — so writing here would stamp the
     default over a shared link's hash before it had been applied. The visitor
     would see their own itinerary arrive a frame after the address bar said
     otherwise, on a feature whose entire premise is that the plan lives in the
     URL and nowhere else. */
  const monte = useRef(false);
  useEffect(() => {
    if (!monte.current) {
      monte.current = true;
      return;
    }
    history.replaceState(null, "", "#" + encoder(plan));
  }, [plan]);

  const b = bilan(plan, legs);
  const r = rythme(plan, legs);
  const aRetirer = b.reste < 0 ? retraits(plan, lieux, -b.reste) : [];
  const nom = (id: string) => lieux.find((l) => l.id === id)?.fr ?? id;

  /* Which hops the map should grey out, by position rather than by name.
     `bilan` reports them as "from → to", and the same pair can occur twice in
     one itinerary — a loop that returns through Hanoï does exactly that — so
     matching on the label would grey both crossings when only one is unknown.
     Recomputed here from the same rule bilan uses. */
  /* Clicking a marker brings the traveller back to the row that controls it.
     Plain DOM rather than state: the flash is a visual acknowledgement with no
     bearing on the plan, and routing it through React would mean holding, and
     then clearing, a piece of state that means nothing. The form below does the
     same thing for the same reason.

     `scrollIntoView` is given `center` so the row does not land under the
     sticky header, and the class removes itself — a highlight that stayed on
     would read as "this étape is the problem" long after it was fixed. */
  const versEtape = (i: number) => {
    const li = document.getElementById(`etape-${i}`);
    if (!li) return;
    li.scrollIntoView({ block: "center", behavior: "smooth" });
    li.classList.remove("plan__vise");
    void li.offsetWidth;
    li.classList.add("plan__vise");
    window.setTimeout(() => li.classList.remove("plan__vise"), 1400);
  };

  const segmentsInconnus = new Set<number>();
  for (let i = 0; i < plan.etapes.length - 1; i++) {
    const leg = trouverLeg(legs, plan.etapes[i].place, plan.etapes[i + 1].place);
    if (!leg || !modeDefaut(leg)) segmentsInconnus.add(i);
  }

  /* A place with no leg is a place the planner cannot cost, and the two
     Cambodian entries have none. Offering them produced a single "remove the
     Centre" button spanning two countries, because region() knows only
     latitude and Siem Reap sits 0.4° above the boundary. */
  const joignable = (id: string) =>
    legs.some((l) => l.from === id || l.to === id);
  const absents = lieux.filter(
    (l) => joignable(l.id) && !plan.etapes.some((e) => e.place === l.id),
  );

  /* Vietnam is a line, so a place's latitude is its position in an itinerary.
     Appending put Baie d'Halong after Con Dao — a flight from an island off the
     southern tip back to the far north, which nobody does, and which the
     planner then reported as an unknown leg precisely because no such leg
     exists, because nobody does it.

     The direction is read from the plan rather than assumed. Most French
     itineraries land in Hanoï and leave from Saïgon, but the reverse is a real
     trip and the tool has no business quietly turning it round.

     This works because the country is a line, and it stops working the moment
     Cambodia is in scope: Siem Reap sits north of the Mekong delta and comes
     after it. One more reason v1 offers only places that have legs. */
  const latitude = (id: string) => lieux.find((l) => l.id === id)?.lat ?? 0;

  const versLeSud = (etapes: Etape[]) =>
    etapes.length < 2 ||
    latitude(etapes[0].place) >= latitude(etapes[etapes.length - 1].place);

  const ranger = (etapes: Etape[]) => {
    const sud = versLeSud(etapes);
    return [...etapes].sort((a, b) =>
      sud ? latitude(b.place) - latitude(a.place)
          : latitude(a.place) - latitude(b.place),
    );
  };

  /* True when every étape already follows the one before it. The button that
     offers to reorder stays hidden until it has something to fix — a plan
     arriving from a shared link, or one edited by hand. */
  const enOrdre = plan.etapes.every((e, i, t) => {
    if (i === 0) return true;
    const sud = versLeSud(t);
    return sud
      ? latitude(t[i - 1].place) >= latitude(e.place)
      : latitude(t[i - 1].place) <= latitude(e.place);
  });

  const ajouter = (id: string) => {
    const lieu = lieux.find((l) => l.id === id);
    if (!lieu) return;
    const sud = versLeSud(plan.etapes);
    const i = plan.etapes.findIndex((e) =>
      sud ? latitude(e.place) < lieu.lat : latitude(e.place) > lieu.lat,
    );
    const etapes = [...plan.etapes];
    etapes.splice(i === -1 ? etapes.length : i, 0, { place: id, nuits: lieu.nuits.ideal });
    setPlan({ ...plan, etapes });
  };
  /* Never below one étape: the min and max on the inputs are native hints a
     typed value walks straight past, and an itinerary of nothing is not an
     itinerary the gauges can say anything true about. */
  const retirer = (i: number) =>
    plan.etapes.length > 1 &&
    setPlan({ ...plan, etapes: plan.etapes.filter((_, k) => k !== i) });
  const nuits = (i: number, n: number) =>
    setPlan({
      ...plan,
      etapes: plan.etapes.map((e, k) => (k === i ? { ...e, nuits: Math.max(1, n) } : e)),
    });

  return (
    <div className="plan">
      <div className="plan__barre">
        <Nombre
          label="Durée"
          suffixe="jours"
          valeur={plan.jours}
          bas={5}
          haut={30}
          onCommit={(jours) => setPlan((p) => ({ ...p, jours }))}
        />
        <label>
          Départ
          <select value={plan.mois}
            onChange={(ev) => setPlan({ ...plan, mois: ev.target.value })}>
            {MOIS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <Nombre
          label="Voyageurs"
          valeur={plan.voyageurs}
          bas={1}
          haut={12}
          onCommit={(voyageurs) => setPlan((p) => ({ ...p, voyageurs }))}
        />
      </div>

      <div className="plan__jauges">
        <div>
          <span className="plan__label">Jours · {plan.jours}</span>
          <div className="plan__g">
            {Array.from({ length: Math.max(b.nuitsDisponibles, b.nuitsPlacees) }, (_, i) => (
              <i key={i} className={i < b.nuitsPlacees
                ? (i < b.nuitsDisponibles ? "ok" : "over") : "nil"} />
            ))}
          </div>
          <p className={b.reste < 0 ? "plan__mal" : "plan__bien"}>
            {b.reste < 0
              ? `Il vous manque ${-b.reste} ${-b.reste > 1 ? "jours" : "jour"}.`
              : b.reste === 0
                ? "Ça rentre exactement."
                : `Il vous reste ${b.reste} ${b.reste > 1 ? "jours" : "jour"}.`}
          </p>
        </div>

        {/* A single stop has no rhythm to judge, and saying so is better than
            judging it anyway. `tendu` fires on `joursLibres < 2`, so a plan
            emptied to one short étape would otherwise print
            "Soutenu : 0 changement d'hôtel et 0 h de transport." — a sentence
            contradicted by its own two numbers, on the page whose whole claim
            is that its numbers are true. */}
        {plan.etapes.length >= 2 && (
        <div>
          <span className="plan__label">Rythme</span>
          <div className="plan__g">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} className={i < r.changements * 2 ? (r.tendu ? "over" : "ok") : "nil"} />
            ))}
          </div>
          {/* Both sentences agree in number, and both carry the non-breaking
              space French puts before a colon. These are the two most-rendered
              sentences in the component; "1 changements" on a page that claims
              to be written from Da Nang would undo more than it costs to
              prevent. The space is written   rather than &nbsp; because
              these are template literals, not JSX text. */}
          <p className={r.tendu ? "plan__mal" : "plan__bien"}>
            {r.tendu
              ? `Soutenu : ${r.changements} ${r.changements > 1 ? "changements" : "changement"} d'hôtel et ${r.heuresTransport} h de transport.`
              : `Tranquille : ${r.joursLibres} ${r.joursLibres > 1 ? "journées" : "journée"} sans bouger.`}
          </p>
        </div>
        )}
      </div>

      {/* Directly under the gauges, not at the foot of the list. Adding a stop
          is the move this tool exists for, and the two numbers it changes sit
          three centimetres above — press a chip and watch the day budget turn.
          At the bottom the gauge was off-screen, so the consequence of the
          click arrived only if the visitor scrolled back up to look for it. */}
      <div className="plan__ajout">
        <span className="plan__label">Ajouter une étape</span>
        <div>
          {absents.map((l) => (
            <button type="button" key={l.id} onClick={() => ajouter(l.id)}>
              + {l.fr} <small>{l.nuits.ideal} n</small>
            </button>
          ))}
        </div>
      </div>

      {/* The legs we hold nothing on. They are excluded from every number above,
          which makes those numbers optimistic, and saying so is the whole point
          of collecting them — an engine that knows about seven hundred
          unaccounted kilometres and lets the page stay quiet is worse than one
          that never noticed. */}
      {b.inconnus.length > 0 && (
        <div className="plan__inconnu">
          <p>
            <b>
              Nous ne connaissons pas encore{" "}
              {b.inconnus.length === 1 ? "ce trajet" : "ces trajets"}&nbsp;:
            </b>
          </p>
          <ul>
            {b.inconnus.map((x) => {
              const [a, z] = x.split(" → ");
              return <li key={x}>{nom(a)} → {nom(z)}</li>;
            })}
          </ul>
          <p className="plan__note">
            Ils ne sont comptés ni en heures ni en journées. Les chiffres
            ci-dessus sont donc optimistes.
          </p>
        </div>
      )}

      {aRetirer.length > 0 && (
        <div className="plan__coupe">
          {/* Not "une étape": retraits() groups by region, so one button can
              remove two or three stops at once, and promising a single cut
              understates what pressing it does. */}
          <p><b>Pour que ce voyage tienne, il faut alléger l&apos;itinéraire.</b></p>
          <ul>
            {aRetirer.map((x) => (
              <li key={x.libelle}>
                <button type="button" onClick={() => setPlan({
                  ...plan,
                  etapes: plan.etapes.filter((e) => !x.places.includes(e.place)),
                })}>
                  {x.libelle} — {x.nuits} {x.nuits > 1 ? "nuits" : "nuit"}
                </button>
              </li>
            ))}
          </ul>
          <p className="plan__note">
            Rien ne se décide tout seul&nbsp;: c&apos;est vous qui tranchez.
          </p>
        </div>
      )}

      {/* Only when there is something to put right. A plan built through the
          chips is already in order, so this says nothing on the common path. */}
      {!enOrdre && (
        <button
          type="button"
          className="plan__ranger"
          onClick={() => setPlan({ ...plan, etapes: ranger(plan.etapes) })}
        >
          Remettre les étapes {versLeSud(plan.etapes) ? "du nord au sud" : "du sud au nord"}
        </button>
      )}

      <ol className="plan__etapes">
        {plan.etapes.map((e, i) => {
          const lieu = lieux.find((l) => l.id === e.place);
          const v = lieu ? verdictSaison(saisons, plan.mois, region(lieu.lat)) : "";
          return (
            <li key={`${e.place}-${i}`} id={`etape-${i}`}>
              <b>{nom(e.place)}</b>
              <span className="plan__nuits">
                <button type="button" onClick={() => nuits(i, e.nuits - 1)} aria-label="Une nuit de moins">−</button>
                {/* A span, not a bare text node: the padding that separates the
                    count from the two buttons has to attach to something, and
                    CSS cannot select text. */}
                <span>{e.nuits} {e.nuits > 1 ? "nuits" : "nuit"}</span>
                <button type="button" onClick={() => nuits(i, e.nuits + 1)} aria-label="Une nuit de plus">+</button>
              </span>
              {v === "deconseille" && (
                <em className="plan__saison">En {plan.mois.toLowerCase()}, c&apos;est la saison des pluies ici.</em>
              )}
              <button type="button" className="plan__x" onClick={() => retirer(i)}>Retirer</button>
              {b.reste >= 0 && <SousEtape place={e.place} nuits={e.nuits}
                ville={nom(e.place)} carte={lieu?.map ?? nom(e.place)}
                choisies={choisies} />}
            </li>
          );
        })}
      </ol>

      {/* Below the list, not beside it. Building the itinerary and checking it
          are two steps, not one: the traveller composes, scrolls down to see
          where they have just sent themselves, and scrolls back up if the
          shape is wrong. Putting the map alongside would have served a
          question nobody asks while still typing — and it would have needed
          one layout for the phone and another for the desktop, where this
          needs neither.

          TripMap is a pure function of its props, with no hook and no effect,
          so it redraws in the same render as the gauges: the frame, the label
          placement and the route are all recomputed from the étapes alone. */}
      {plan.etapes.length >= 2 && (
        <figure className="plan__carte">
          <TripMap
            stops={plan.etapes.map((e) => {
              const l = lieux.find((x) => x.id === e.place);
              return {
                id: e.place,
                map: l?.map ?? nom(e.place),
                lat: l?.lat ?? 0,
                lon: l?.lon ?? 0,
                label: nom(e.place),
              };
            }) as never}
            inconnus={segmentsInconnus}
            nuits={plan.etapes.map((e) => e.nuits)}
            onPick={versEtape}
          />
          <figcaption className="plan__note">
            {b.inconnus.length > 0
              ? "Les segments gris sont les trajets dont nous n'avons pas la durée."
              : "Le trait joint les étapes ; il ne dessine pas la route."}
          </figcaption>
        </figure>
      )}

      {b.reste >= 0 && plan.etapes.length > 1 && (
        <div className="plan__suite">
          {/* The scarce items and the chosen activities now sit under their
              own étape, where the traveller is looking when they wonder what
              to do there. What is left here is the one line that must be said
              once rather than per stop. */}
          {AFFILIE && (
            <p className="plan__note">
              Liens partenaires — nous percevons une commission, sans surcoût
              pour vous.
            </p>
          )}

        {/* The quote button sits here, at the friction point, and not in
            the page footer: this is the paragraph where a traveller
            reads that the night train cannot be booked from France and
            thinks "let the agency handle it". It carries the plan into
            the form, so the agency receives an itinerary rather than a
            blank request.

            The write is plain DOM because the form is deliberately
            JavaScript-free — it is a server component several hundred
            pixels below, and reaching it through the document is the
            only seam that does not make it depend on React. If the
            script never runs, the anchor still scrolls to a working
            form and the traveller describes the trip themselves, which
            is exactly what happens today. */}
        <section className="plan__dur">
          <h3>Ce qui ne se réserve pas depuis la France</h3>
          <ul className="art__liste">
            <li>Les billets de train intérieurs — paiement par carte vietnamienne.</li>
            <li>Un chauffeur pour les étapes sans transport public.</li>
            <li>Un guide francophone, qui se trouve des mois à l&apos;avance.</li>
          </ul>
          <a
            className="plan__devis"
            href="#devis"
            onClick={() => {
              const projet = document.getElementById("projet");
              const vg = document.getElementById("voyageurs");
              if (projet instanceof HTMLTextAreaElement) {
                projet.value =
                  `Mon plan : ${plan.jours} jours, départ en ${plan.mois.toLowerCase()}, ` +
                  `${plan.voyageurs} ${plan.voyageurs > 1 ? "voyageurs" : "voyageur"}.\n\n` +
                  plan.etapes
                    .map((e) => `— ${nom(e.place)}, ${e.nuits} ${e.nuits > 1 ? "nuits" : "nuit"}`)
                    .join("\n") +
                  (b.inconnus.length
                    ? "\n\nTrajets que je n'ai pas encore réglés :\n" +
                      b.inconnus
                        .map((x) => {
                          const [d, a] = x.split(" → ");
                          return `— ${nom(d)} → ${nom(a)}`;
                        })
                        .join("\n")
                    : "") +
                  "\n\nCe que je n'arrive pas à organiser moi-même :\n";
              }
              if (vg instanceof HTMLInputElement) vg.value = String(plan.voyageurs);
            }}
          >
            Faire chiffrer ce plan par notre agence, à Da Nang
          </a>
          <p className="plan__note">
            Gratuit, réponse sous 48 heures ouvrées. Votre plan part avec
            la demande&nbsp;: rien à retaper.
          </p>
        </section>
        </div>
      )}
    </div>
  );
}
