/**
 * Worker entry point.
 *
 * Files in out/ are served straight from the edge without touching this code:
 * it only runs for what is not a file — the quote form and unknown addresses.
 */
import site from "../content/site.json";
import { demarrer, retour, type AuthEnv } from "./auth";
import { clic, record, digest, type ClicEnv } from "./clicks";
import { envoyerAccuse } from "./accuse";
import { markdown, page } from "./markdown";
import { enregistrerLead, anonymiserAnciens, type LeadEnv } from "./leads";

interface Env extends AuthEnv, ClicEnv, LeadEnv {
  /* Declared in wrangler.jsonc. Serves out/, applying the `html_handling`
     and `not_found_handling` rules configured there. */
  ASSETS: { fetch(request: Request): Promise<Response> };
  DEVIS_LIMIT: { limit(options: { key: string }): Promise<{ success: boolean }> };
  /* Secret, set in the Cloudflare dashboard — never in the repository. */
  RESEND_API_KEY: string;
  /* Sender shown to the traveller, on the confirmation they receive. This is
     the address printed across the site, so it has to be the one that exists
     and the one replies reach. */
  DEVIS_FROM: string;

  /**
   * Sender of the internal notification only. Optional: falls back to
   * DEVIS_FROM.
   *
   * The two mails have different readers. The traveller's confirmation must
   * come from the published address; the notification is read by one person who
   * already knows where it came from, so its From is free.
   *
   * It is info@, an address that is deliberately not a mailbox — and that is the
   * point. contact@ carries real correspondence, so a filter rule matching it
   * would catch travellers' replies too. A rule matching info@ catches the
   * machine and nothing else.
   *
   * It does not escape the host's impersonation flag: that was tested, and the
   * rule keys on the domain, not on the local part. See wrangler.jsonc.
   */
  NOTIF_FROM?: string;
  /* Where requests land — one address, or several separated by commas. Two are
     configured: the one that has to arrive and the one that can be handed over.
     See wrangler.jsonc for why neither is enough alone. */
  DEVIS_TO: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: FormDataEntryValue | null, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Fallback page, served when the request could not go out. A frank message
 * with a phone number beats a "thank you" that lies: the person filled in the
 * form, they must be able to reach us another way.
 *
 * Deliberately self-contained — the site stylesheet is not loaded here.
 *
 * The visible text stays in French: this page is read by visitors.
 *
 * `ref` is a short code shown at the foot of the page. It tells a visitor or an
 * attacker nothing useful, but it distinguishes at a glance a missing key from
 * a delivery failure — without it, the only way to know which is to open the
 * logs.
 */
function erreur(titre: string, message: string, status: number, ref?: string): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${titre} — ${site.name}</title>
<style>body{margin:0;display:grid;place-items:center;min-height:100vh;
background:#f6f1e7;color:#22303a;font:16px/1.6 system-ui,sans-serif;padding:24px}
main{max-width:34rem}h1{font-size:1.6rem;margin:0 0 .6em}a{color:#1f5f54}
p{margin:0 0 1em}small{color:#5a6870}</style></head><body><main>
<h1>${titre}</h1><p>${message}</p>
<p>Écrivez-nous à <a href="mailto:${site.email}">${site.email}</a>
ou appelez le <a href="tel:${site.phone}">${site.phoneDisplay}</a>.
Nous reprenons votre projet de là.</p>
<p><a href="/">Retour à l'accueil</a></p>
${ref ? `<small>réf. ${ref}</small>` : ""}</main></body></html>`;

  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/* The form's `select` elements return codes. Only those that do not read as-is
   are mapped: if an option is added on the form side and not here, the email
   shows the raw code — readable, not broken.

   The returned strings stay in French: they end up in the agency's email about
   a French traveller. */
function duree(code: string): string {
  if (!code) return "non précisée";
  if (code === "indecis") return "pas encore décidée";
  return `environ ${code} jours`;
}

function gamme(code: string): string {
  if (!code) return "non précisée";
  if (code === "indecis") return "à définir ensemble";
  return code[0].toUpperCase() + code.slice(1);
}

function depart(mois: string): string {
  // <input type="month"> returns "2027-03".
  const m = /^(\d{4})-(\d{2})$/.exec(mois);
  if (!m) return mois || "non précisé";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 1)));
}

interface Demande {
  /* The trip the request came from, when the form was embedded on a trip page.
     Empty from the home page. A field that exists in the form and not here
     would vanish silently — the Worker reads `name` attributes verbatim. */
  circuit: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  depart: string;
  duree: string;
  voyageurs: string;
  gamme: string;
  projet: string;
  consentement: boolean;
}

/**
 * Plain-text body, not HTML: the traveller's project is free text, so there is
 * nothing to escape and no chance of injecting markup into the inbox. It also
 * reads just as well on a phone.
 *
 * Kept in French — it describes a French traveller's request and is forwarded
 * as-is to the operator.
 */
function courriel(d: Demande, page: string, recu: string): string {
  return [
    ...(d.circuit ? [`CIRCUIT : ${d.circuit}`, ""] : []),
    `${d.prenom} ${d.nom}`,
    d.email,
    d.telephone || "téléphone non communiqué",
    "",
    `Départ      ${depart(d.depart)}`,
    `Durée       ${duree(d.duree)}`,
    `Voyageurs   ${d.voyageurs || "non précisé"}`,
    `Gamme       ${gamme(d.gamme)}`,
    "",
    "Son projet",
    "----------",
    d.projet || "(laissé vide)",
    "",
    "---",
    `Reçu le ${recu}`,
    `Depuis ${page}`,
    "Répondre à ce message écrit directement au voyageur.",
  ].join("\n");
}

async function devis(
  request: Request,
  env: Env,
  ctx: { waitUntil(p: Promise<unknown>): void },
): Promise<Response> {
  const merci = new URL("/merci/", request.url);
  const form = await request.formData();

  /* Honeypot: a filled-in invisible field means a bot. We answer exactly as we
     would a human so it is not told it was caught — which makes the catch
     silent, and therefore undetectable when it hits the wrong target. Hence the
     log line: a burst of catches means either a spam campaign or a trap that is
     catching customers. */
  if (clean(form.get("reference-interne"))) {
    console.warn("[quote] honeypot — request discarded without sending", {
      ip: request.headers.get("CF-Connecting-IP"),
      agent: request.headers.get("user-agent"),
    });
    return Response.redirect(merci, 303);
  }

  const d: Demande = {
    circuit: clean(form.get("circuit"), 120),
    prenom: clean(form.get("prenom"), 80),
    nom: clean(form.get("nom"), 80),
    email: clean(form.get("email"), 160),
    telephone: clean(form.get("telephone"), 40),
    depart: clean(form.get("depart"), 20),
    duree: clean(form.get("duree"), 20),
    voyageurs: clean(form.get("voyageurs"), 4),
    gamme: clean(form.get("gamme"), 20),
    projet: clean(form.get("projet")),
    consentement: form.get("consentement") === "on",
  };

  const erreurs: string[] = [];
  if (!d.prenom) erreurs.push("prenom");
  if (!d.nom) erreurs.push("nom");
  if (!EMAIL.test(d.email)) erreurs.push("email");
  if (!d.consentement) erreurs.push("consentement");

  if (erreurs.length > 0) {
    return Response.json(
      { ok: false, erreurs, message: "Formulaire incomplet." },
      { status: 400 },
    );
  }

  // The honeypot stops naive bots, not someone aiming at the inbox or the
  // sending quota. Five requests per minute per IP address.
  const ip = request.headers.get("CF-Connecting-IP") ?? "local";
  const { success } = await env.DEVIS_LIMIT.limit({ key: ip });
  if (!success) {
    return erreur(
      "Trop de demandes",
      "Plusieurs demandes viennent de partir depuis votre connexion. Patientez une minute avant de réessayer.",
      429,
    );
  }

  const recu = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date());

  // Without a key there is no point calling Resend only to be told 401. This is
  // not an exotic case: the secret is set by hand in the dashboard, so it is
  // missing on first deploy and after every key rotation.
  if (!env.RESEND_API_KEY) {
    console.error(
      "[quote] CONFIGURATION — the RESEND_API_KEY secret is not set on this " +
        "Worker, no request can go out. Cloudflare dashboard → Settings → " +
        "Variables and Secrets → type Secret.",
      { request: d },
    );
    return erreur(
      "Votre demande n'est pas partie",
      "Un incident technique nous empêche de recevoir votre message. Il n'a pas été enregistré, merci de nous joindre directement.",
      500,
      "CFG-01",
    );
  }

  const voyageurs = d.voyageurs ? `${d.voyageurs} pers., ` : "";
  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.NOTIF_FROM || env.DEVIS_FROM,
      /**
       * Several recipients, separated by commas.
       *
       * One address was a single point of failure, and routing it through the
       * agency mailbox proved it: sent from contact@ to contact@ through an
       * outside relay, the notification tripped the host's anti-spoofing rule
       * and landed in Junk. Sent only to the Gmail, it never reaches the
       * mailbox that can be handed over.
       *
       * So both. The Gmail is the one that must arrive and does; the agency
       * mailbox keeps the copy. If a filter swallows one of them, the lead
       * still exists in the other — and in the lead table either way.
       */
      to: env.DEVIS_TO.split(",").map((a) => a.trim()).filter(Boolean),
      // The agency replies by simply hitting "Reply".
      reply_to: `${d.prenom} ${d.nom} <${d.email}>`,
      /* The trip name leads the subject when there is one: the agency sorts
         its inbox by programme, not by surname. */
      subject: d.circuit
        ? `Devis ${d.circuit} — ${d.prenom} ${d.nom}, ${voyageurs}${duree(d.duree)}`
        : `Devis — ${d.prenom} ${d.nom}, ${voyageurs}${duree(d.duree)}`,
      text: courriel(d, request.headers.get("referer") ?? "page inconnue", recu),
    }),
  });

  if (!reponse.ok) {
    /* Two very different failures look alike from here: a revoked key or a
       refused recipient is fixed in two minutes, a Resend outage is merely
       endured. Telling them apart in the log avoids searching the wrong side.

       The request is lost to the agency if it is written nowhere: we log it in
       full, so it stays recoverable from the Cloudflare logs (the Worker's Logs
       tab, or `npx wrangler tail`). */
    const config = reponse.status === 401 || reponse.status === 403;
    console.error(
      config
        ? "[quote] CONFIGURATION — Resend rejects the key or the recipient. " +
            "Check the RESEND_API_KEY secret (revoked? never set?) and that " +
            "DEVIS_TO is an address Resend is allowed to deliver to. The " +
            "sandbox restriction this used to describe ended when the domain " +
            "was verified at Resend."
        : "[quote] SEND FAILED — Resend outage, request to recover from logs",
      { status: reponse.status, resend: await reponse.text(), request: d },
    );
    return erreur(
      "Votre demande n'est pas partie",
      "Un incident technique nous empêche de recevoir votre message. Il n'a pas été enregistré, merci de nous joindre directement.",
      500,
      config ? "CFG-02" : "SRV-03",
    );
  }

  /* Only now does it reach the ledger: a request counts only once it has
     actually gone out. Counting earlier would inflate the figure with
     honeypots, incomplete forms and delivery failures — and this ledger is
     worth something only if every line matches something the operator really
     received. */
  /* The page is the one the form was submitted from — not /api/devis, which
     would be the same value on every row and say nothing. */
  let depuis = "/";
  try {
    depuis = new URL(request.headers.get("referer") ?? "/", request.url).pathname;
  } catch {
    /* Missing or unreadable Referer: "/" is an honest fallback. */
  }
  record(env, ctx, "quote", depuis, request);

  /* The lead ledger, which the click ledger cannot be: this row carries a name
     and an address, and exists to hold `answered_at` later. Written on
     waitUntil like everything else here — the traveller is owed a redirect, not
     a database round-trip. */
  ctx.waitUntil(
    enregistrerLead(env, {
      email: d.email,
      prenom: d.prenom,
      nom: d.nom,
      circuit: d.circuit,
      duree: d.duree,
      voyageurs: d.voyageurs,
      page: depuis,
    }),
  );

  /* The traveller's own copy, sent after the agency's — never before, and never
     instead. It leaves on waitUntil so the redirect to /merci is not held while
     Resend answers: the person who just clicked should see the thank-you page
     immediately, not watch a spinner because a second mail is in flight.

     Its failures are swallowed inside envoyerAccuse for the same reason this
     call sits below `record`: by this point the request has reached the agency
     and the ledger. Nothing that happens next is allowed to undo that. */
  ctx.waitUntil(envoyerAccuse(d, env));

  return Response.redirect(merci, 303);
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: { waitUntil(p: Promise<unknown>): void },
  ): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/devis") {
      if (request.method !== "POST") {
        return new Response("Méthode non autorisée.", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }
      return devis(request, env, ctx);
    }

    /* Click beacon. Answers 204 to everything, invalid bodies included: the
       browser does not wait for the response, and a visible error would teach
       nobody anything while advertising the measurement to whoever probes it. */
    if (pathname === "/api/clic") {
      if (request.method !== "POST") {
        return new Response(null, { status: 405, headers: { Allow: "POST" } });
      }
      return clic(request, env, ctx);
    }

    // CMS OAuth relay. Both names are imposed by the CMS, which derives them
    // from `base_url` in public/admin/config.yml.
    if (pathname === "/auth") return demarrer(request, env);
    if (pathname === "/callback") return retour(request, env);

    /* One address, two representations. `markdown` answers only when the client
       explicitly named text/markdown; otherwise `page` serves the HTML and
       advertises the Markdown twin in a Link header. */
    const md = await markdown(request, env);
    if (md) return md;

    return page(request, env);
  },

  /* Daily digest. The schedule is set in wrangler.jsonc. Errors are absorbed
     by `digest` itself: a scheduled job that fails loudly has nobody there to
     hear it.

     Worth knowing when testing this: a changed cron schedule takes roughly
     three minutes to propagate at Cloudflare. Scheduling a test two minutes
     out and concluding the handler is dead is a mistake that has already been
     made here. */
  async scheduled(_event: unknown, env: Env): Promise<void> {
    await digest(env);
    /* Retention sweep. Erases the name and the address of anyone who wrote in
       more than a year ago, leaving the two timestamps that are the actual
       measurement. Runs after the digest so a failure here cannot cost the
       daily figures. */
    await anonymiserAnciens(env);
  },

  /* There is no `email()` handler any more.
   *
   * One lived here: Cloudflare Email Routing delivered a blind copy of the
   * agency's replies, and it marked the matching lead answered. It was switched
   * off on 11 November 2026 when the domain's MX moved to the agency's own mail
   * host — a domain has one set of MX records, and they cannot be shared.
   *
   * It is deleted rather than left in place. A handler that cannot fire is
   * worse than none: the next person to wonder why response times stopped being
   * recorded would read it, believe it runs, and go looking for the bug
   * somewhere else entirely.
   *
   * The measurement moved to the mailbox itself, which the two parties share:
   * every reply sits in a Sent folder both can open. See worker/leads.ts.
   */

};
