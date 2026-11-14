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

import { useEffect, useState } from "react";
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
     leaves the page instead of walking through every edit. */
  useEffect(() => {
    history.replaceState(null, "", "#" + encoder(plan));
  }, [plan]);

  const b = bilan(plan, legs);
  const r = rythme(plan, legs);
  const aRetirer = b.reste < 0 ? retraits(plan, lieux, -b.reste) : [];
  const nom = (id: string) => lieux.find((l) => l.id === id)?.fr ?? id;

  const absents = lieux.filter((l) => !plan.etapes.some((e) => e.place === l.id));

  const ajouter = (id: string) => {
    const lieu = lieux.find((l) => l.id === id);
    if (!lieu) return;
    setPlan({ ...plan, etapes: [...plan.etapes, { place: id, nuits: lieu.nuits.ideal }] });
  };
  const retirer = (i: number) =>
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
            onChange={(ev) => setPlan({ ...plan, jours: Number(ev.target.value) || 5 })} />
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
            onChange={(ev) => setPlan({ ...plan, voyageurs: Number(ev.target.value) || 1 })} />
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

        <div>
          <span className="plan__label">Rythme</span>
          <div className="plan__g">
            {Array.from({ length: 14 }, (_, i) => (
              <i key={i} className={i < r.changements * 2 ? (r.tendu ? "over" : "ok") : "nil"} />
            ))}
          </div>
          <p className={r.tendu ? "plan__mal" : "plan__bien"}>
            {r.tendu
              ? `Soutenu : ${r.changements} ${r.changements > 1 ? "changements" : "changement"} d'hôtel et ${r.heuresTransport} h de transport.`
              : /* joursLibres cannot be 1 here today — "tranquille" needs at least
                   two — but that is a coincidence of where the threshold in
                   rythme() currently sits, not a property of this sentence, so it
                   is pluralised like every other count in the component. */
                `Tranquille : ${r.joursLibres} ${r.joursLibres > 1 ? "journées" : "journée"} sans bouger.`}
          </p>
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
          <p><b>Pour que ce voyage tienne, il faut retirer une étape.</b></p>
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
          <p className="plan__note">Rien ne se décide tout seul : c&apos;est vous qui tranchez.</p>
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
                  <p>
                    Vos hôtels à{" "}
                    {calmes.slice(0, 3).map((e) => nom(e.place)).join(", ")}
                    &nbsp;: rien ne presse. Ces villes ont des milliers de
                    chambres. Réservez-les quand vos vols seront pris, pas avant.
                  </p>
                  <p className="plan__note">
                    Ce plan reste à cette adresse. Revenez à ce moment-là.
                  </p>
                </section>
                )}

                <section>
                  <h3>Vos journées libres</h3>
                  <p className="plan__note">
                    Vous avez laissé de la place. Voici ce qu&apos;on y fait — ou
                    rien, c&apos;est permis.
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
