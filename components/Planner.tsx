"use client";

/**
 * The tool. A budget of days that visibly runs out.
 *
 * Not dropdowns — that is what Evaneos and Marco Vasco already sell, and a
 * fourth copy of it differentiates nothing. Not a map either: a map answers
 * "where is it", and the question a French traveller actually has is whether
 * their trip fits in the leave they have booked.
 *
 * It starts from a hand-written itinerary rather than an empty canvas. A
 * combinatorial generator would emit sequences with no prose, losing the voice
 * that is the site's only real asset and walking straight into the thin-content
 * penalty. Here the traveller adjusts something already good, and watches what
 * each adjustment costs.
 */

import { useEffect, useRef, useState } from "react";
import {
  bilan, rythme, retraits, encoder, decoder, region, verdictSaison,
} from "@/lib/planner";
import type { Etape, Leg, Lieu, Plan, SaisonRow } from "@/lib/planner";
import { AFFILIE, aReserver, experiences } from "@/lib/booking";

export type PlanBase = { nom: string; jours: number; etapes: Etape[] };

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

/** The min/max attributes are native hints; a typed value ignores them. */
const borne = (n: number, bas: number, haut: number) =>
  Math.min(haut, Math.max(bas, n));

export function Planner({
  lieux, legs, saisons, bases,
}: {
  lieux: Lieu[];
  legs: Leg[];
  saisons: SaisonRow[];
  bases: PlanBase[];
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

  /* A place with no leg is a place the planner cannot cost, and the two
     Cambodian entries have none. Offering them produced a single "remove the
     Centre" button spanning two countries, because region() knows only
     latitude and Siem Reap sits 0.4° above the boundary. */
  const joignable = (id: string) =>
    legs.some((l) => l.from === id || l.to === id);
  const absents = lieux.filter(
    (l) => joignable(l.id) && !plan.etapes.some((e) => e.place === l.id),
  );

  const ajouter = (id: string) => {
    const lieu = lieux.find((l) => l.id === id);
    if (!lieu) return;
    setPlan({ ...plan, etapes: [...plan.etapes, { place: id, nuits: lieu.nuits.ideal }] });
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
        <label>
          Durée
          <input type="number" min={5} max={30} value={plan.jours}
            onChange={(ev) =>
              setPlan({ ...plan, jours: borne(Number(ev.target.value) || 5, 5, 30) })} />
          jours
        </label>
        <label>
          Départ
          <select value={plan.mois}
            onChange={(ev) => setPlan({ ...plan, mois: ev.target.value })}>
            {MOIS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>
          Voyageurs
          <input type="number" min={1} max={12} value={plan.voyageurs}
            onChange={(ev) =>
              setPlan({ ...plan, voyageurs: borne(Number(ev.target.value) || 1, 1, 12) })} />
        </label>
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

      <ol className="plan__etapes">
        {plan.etapes.map((e, i) => {
          const lieu = lieux.find((l) => l.id === e.place);
          const v = lieu ? verdictSaison(saisons, plan.mois, region(lieu.lat)) : "";
          return (
            <li key={`${e.place}-${i}`}>
              <b>{nom(e.place)}</b>
              <span className="plan__nuits">
                <button type="button" onClick={() => nuits(i, e.nuits - 1)} aria-label="Une nuit de moins">−</button>
                {e.nuits} {e.nuits > 1 ? "nuits" : "nuit"}
                <button type="button" onClick={() => nuits(i, e.nuits + 1)} aria-label="Une nuit de plus">+</button>
              </span>
              {v === "deconseille" && (
                <em className="plan__saison">En {plan.mois.toLowerCase()}, c&apos;est la saison des pluies ici.</em>
              )}
              <button type="button" className="plan__x" onClick={() => retirer(i)}>Retirer</button>
            </li>
          );
        })}
      </ol>

      {b.reste >= 0 && plan.etapes.length > 1 && (
        <div className="plan__suite">
          {(() => {
            const urgents = plan.etapes
              .map((e) => ({ e, pourquoi: aReserver(e.place) }))
              .filter((x): x is { e: Etape; pourquoi: string } => x.pourquoi !== null);
            const calmes = plan.etapes.filter((e) => aReserver(e.place) === null);

            return (
              <>
                {urgents.length > 0 && (
                  <section>
                    <h3>À réserver maintenant</h3>
                    <p className="plan__note">
                      {urgents.length === 1
                        ? "Une seule chose. Pas dix."
                        : `${urgents.length} choses. Pas dix.`}
                    </p>
                    {urgents.map(({ e, pourquoi }) => (
                      <div className="plan__urgent" key={e.place}>
                        <b>{nom(e.place)}</b>
                        <p>{pourquoi}</p>
                      </div>
                    ))}
                  </section>
                )}

                {calmes.length > 0 && (
                <section className="plan__calme">
                  <h3>Ce qui peut attendre</h3>
                  {/* The claim about thousands of rooms is gone. It was true of
                      Hanoï and Saïgon and false of Con Dao, Ban Gioc, Pu Luong
                      and Ba Be, every one of which can land in this sentence —
                      and a reason that is false half the time is worse than no
                      reason, on the one block whose job is to be believed.
                      What decides urgency is the list above; this one needs no
                      second justification of its own.

                      Four names, then a count. Slicing to three said nothing
                      about the rest, so an itinerary with six calm stops
                      quietly reassured the visitor about half of them. */}
                  <p>
                    Vos hôtels à{" "}
                    {calmes.slice(0, 4).map((e) => nom(e.place)).join(", ")}
                    {calmes.length > 4 &&
                      ` et ${calmes.length - 4} autre${
                        calmes.length - 4 > 1 ? "s étapes" : " étape"
                      }`}
                    &nbsp;: rien ne presse. Réservez-les quand vos vols seront
                    pris, pas avant.
                  </p>
                  <p className="plan__note">
                    Ce plan reste à cette adresse. Revenez à ce moment-là.
                  </p>
                </section>
                )}

                {/* Keyed on the free days, which is what the heading says, and
                    not on `reste` — that is the night budget, and a plan can
                    fit its nights exactly while still leaving a week of
                    mornings with nothing booked. Gating on `reste` hid this
                    section on an itinerary with seven free days. */}
                {r.joursLibres > 0 && (
                <section>
                  <h3>Vos journées libres</h3>
                  <p className="plan__note">
                    {r.joursLibres} {r.joursLibres > 1 ? "journées" : "journée"}{" "}
                    sans valise à faire. Voici ce qu&apos;on y fait — ou rien,
                    c&apos;est permis.
                  </p>
                  <ul className="plan__liens">
                    {plan.etapes.slice(0, 3).flatMap((e) =>
                      experiences(nom(e.place)).map((x) => (
                        <li key={`${e.place}-${x.libelle}`}>
                          <a href={x.url} target="_blank" rel="noopener nofollow sponsored">
                            {x.libelle}
                          </a>
                          {x.partenaire && <small> · {x.partenaire}</small>}
                        </li>
                      )),
                    )}
                  </ul>
                  {AFFILIE && (
                    <p className="plan__note">
                      Liens partenaires — nous percevons une commission, sans
                      surcoût pour vous.
                    </p>
                  )}
                </section>
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
              </>
            );
          })()}
        </div>
      )}

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
    </div>
  );
}
