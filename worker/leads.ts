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
 * `recorded_at` is written when the form is submitted, and that is now the whole
 * of it. The `answered_at` column was to be filled by an inbound-copy handler
 * running on Cloudflare Email Routing; that was switched off on 11 November 2026
 * so the domain's MX could point at the agency's own mail host, and nothing can
 * write the column any more. It is left in place: the rows that have it keep it,
 * and dropping a column to tidy a schema loses evidence to gain nothing.
 *
 * The measurement moved rather than disappeared. The agency mailbox is shared
 * between the two parties, so every reply to a traveller sits in a Sent folder
 * both can see — a plainer record than a timestamp inferred from a blind copy,
 * and one that needs no code at all.
 *
 * ## Phase one measures, it does not chase
 *
 * No reminder is sent from here. Reminding enforces a service level that no
 * agreement defines yet, and automated nagging of a partner one meets daily
 * costs more than it collects.
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

/** Stored lower-cased, so someone who writes in twice is one address, not two. */
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
 * It used to report how many requests were awaiting a reply. That number was
 * fed by the inbound-copy handler, which ran on Cloudflare Email Routing — and
 * Email Routing was switched off on 11 November 2026 so the domain's MX could
 * point at the agency's own mail host. Nothing can set answered_at any more, so
 * the figure would have read "all of them, still waiting" every night, for ever,
 * and been wrong every night.
 *
 * A metric that is structurally always 100 % is worse than no metric: it is read
 * once, disbelieved, and then the whole digest stops being read. So the line now
 * says only what the table still knows — how many requests exist, and how many
 * arrived today.
 *
 * The response time has not stopped being measurable; it has moved. The agency
 * mailbox is shared, so every reply to a traveller sits in its Sent folder,
 * visible to both parties. That is a better record than this column ever was,
 * and it needs no instrumentation.
 *
 * English, like every other line the bot sends: the digest is read by the
 * partner who asked for the source to stop speaking French to him. The site
 * stays French, the instrumentation does not.
 */
export async function resumeLeads(env: LeadEnv): Promise<string> {
  if (!env.CLICS) return "";
  try {
    const { results } = await env.CLICS.prepare(
      "SELECT COUNT(*) AS total, " +
        "SUM(CASE WHEN recorded_at >= ? THEN 1 ELSE 0 END) AS recents " +
        "FROM lead",
    )
      .bind(new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .all<{ total: number; recents: number }>();
    const r = results[0];
    if (!r || !r.total) return "";
    return (
      `Requests: ${r.total} total` +
      (r.recents ? `, ${r.recents} in the last 24 h` : ", none in the last 24 h")
    );
  } catch (e) {
    console.error("[lead] summary failed", { error: String(e) });
    return "";
  }
}

