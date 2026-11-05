/**
 * The lead ledger: who wrote in, and how long they waited.
 *
 * ## What it answers that the click ledger cannot
 *
 * contact_click counts knocks on the door. It cannot say whether anyone opened
 * it. That gap is the reason a partner can be measured for months and still
 * owe nothing: clicks are intentions, and no commission was ever paid on an
 * intention.
 *
 * Two timestamps close the gap. `recorded_at` is written when the form is
 * submitted; `answered_at` when a message addressed to that same traveller is
 * seen leaving, because the agency copied our follow-up address on it. The
 * distance between them is the only number in this project that describes an
 * outcome.
 *
 * ## Phase one measures, it does not chase
 *
 * No reminder is sent from here. Reminding enforces a service level that no
 * agreement defines yet, and automated nagging of a partner one meets daily
 * costs more than it collects. The record comes first: after a season it says
 * "fourteen requests, median four days, five never answered", and that sentence
 * is what makes the conversation about commission possible at all.
 */

import type { D1 } from "./clicks";

export interface LeadEnv {
  /* Same binding as the click ledger. Absent in local development, so every
     call here guards: a ledger that is unavailable must never stop a request
     from reaching the agency. */
  CLICS?: D1;
}

export type NouveauLead = {
  email: string;
  prenom: string;
  nom: string;
  circuit: string;
  duree: string;
  voyageurs: string;
  page: string;
};

/** Addresses are compared, never displayed back: lower-casing at write time
 *  means the CC handler can match without guessing at the sender's casing. */
const normaliser = (e: string) => e.trim().toLowerCase();

/**
 * Writes the lead. Swallows its own errors for the same reason the click
 * ledger does: a failed write loses a measurement, while a thrown exception
 * would lose the customer.
 */
export async function enregistrerLead(
  env: LeadEnv,
  l: NouveauLead,
): Promise<void> {
  if (!env.CLICS) return;
  try {
    await env.CLICS.prepare(
      "INSERT INTO lead (recorded_at, email, prenom, nom, circuit, duree, voyageurs, page) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        new Date().toISOString(),
        normaliser(l.email),
        l.prenom,
        l.nom,
        l.circuit || null,
        l.duree || null,
        l.voyageurs || null,
        l.page,
      )
      .run();
  } catch (e) {
    console.error("[lead] write failed", { error: String(e) });
  }
}

/**
 * Marks every pending lead held by this traveller as answered.
 *
 * Plural on purpose: someone who wrote twice about two itineraries has two open
 * rows, and one reply closes the conversation, not half of it. Rows already
 * answered are left alone — the first reply is the one being measured, and a
 * later message must not quietly improve the record.
 */
export async function marquerRepondu(
  env: LeadEnv,
  emailVoyageur: string,
  par: string,
): Promise<number> {
  if (!env.CLICS) return 0;
  try {
    const r = (await env.CLICS.prepare(
      "UPDATE lead SET answered_at = ?, answered_by = ? " +
        "WHERE email = ? AND answered_at IS NULL",
    )
      .bind(new Date().toISOString(), par.slice(0, 160), normaliser(emailVoyageur))
      .run()) as { meta?: { changes?: number } };
    return r?.meta?.changes ?? 0;
  } catch (e) {
    console.error("[lead] answer update failed", { error: String(e) });
    return 0;
  }
}

/**
 * Retention. Erases the person, keeps the measurement.
 *
 * A year after someone wrote in, their name and address stop serving any
 * purpose we can defend: the delay has been measured, the trip has happened or
 * has not. What remains is two timestamps and a page, which is exactly what the
 * click ledger has always held.
 *
 * Deleting the row outright would have been simpler and worse: it would erase
 * the evidence of how long that person waited, which is the one thing worth
 * keeping.
 */
export async function anonymiserAnciens(env: LeadEnv): Promise<number> {
  if (!env.CLICS) return 0;
  const limite = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString();
  try {
    const r = (await env.CLICS.prepare(
      "UPDATE lead SET email = '', prenom = '', nom = '', anonymised_at = ? " +
        "WHERE recorded_at < ? AND anonymised_at IS NULL",
    )
      .bind(new Date().toISOString(), limite)
      .run()) as { meta?: { changes?: number } };
    const n = r?.meta?.changes ?? 0;
    if (n > 0) console.log("[lead] anonymised", { rows: n });
    return n;
  } catch (e) {
    console.error("[lead] anonymisation failed", { error: String(e) });
    return 0;
  }
}

/**
 * One line for the daily digest.
 *
 * English, like every other line the bot sends: the digest is read by the
 * partner who asked for the source to stop speaking French to him. The site
 * stays French, the instrumentation does not.
 */
export async function resumeLeads(env: LeadEnv): Promise<string> {
  if (!env.CLICS) return "";
  try {
    const { results } = await env.CLICS.prepare(
      "SELECT " +
        "COUNT(*) AS total, " +
        "SUM(CASE WHEN answered_at IS NULL THEN 1 ELSE 0 END) AS attente, " +
        "SUM(CASE WHEN answered_at IS NULL AND recorded_at < ? THEN 1 ELSE 0 END) AS tardifs " +
        "FROM lead",
    )
      .bind(new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .all<{ total: number; attente: number; tardifs: number }>();
    const r = results[0];
    if (!r || !r.total) return "";
    return (
      `Requests: ${r.total} total, ${r.attente ?? 0} awaiting a reply` +
      (r.tardifs ? `, ${r.tardifs} of them for over 24 h` : "")
    );
  } catch (e) {
    console.error("[lead] summary failed", { error: String(e) });
    return "";
  }
}

/**
 * Pulls every address out of a raw header, for the inbound copy.
 *
 * Deliberately crude: it looks for anything shaped like an address anywhere in
 * the line, rather than parsing RFC 5322 properly. Display names carry commas
 * and quoted strings carry anything at all, and a parser that is almost right
 * is worse here than one that over-collects — the addresses are only used to
 * look up a pending lead, so an extra one matches nothing and costs nothing.
 */
export function adresses(entete: string | null): string[] {
  if (!entete) return [];
  const out = entete.match(/[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/g) ?? [];
  return [...new Set(out.map(normaliser))];
}
