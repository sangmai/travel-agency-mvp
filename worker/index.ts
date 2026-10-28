/**
 * Point d'entrée Worker.
 *
 * Les fichiers de out/ sont servis directement depuis l'edge sans passer par
 * ce code : il ne s'exécute que pour ce qui n'est pas un fichier, c'est-à-dire
 * le formulaire de devis et les adresses inconnues.
 */
import site from "../content/site.json";

interface Env {
  /* Déclaré dans wrangler.jsonc. Sert out/, en appliquant les règles
     `html_handling` et `not_found_handling` qui y sont configurées. */
  ASSETS: { fetch(request: Request): Promise<Response> };
  DEVIS_LIMIT: { limit(options: { key: string }): Promise<{ success: boolean }> };
  /* Secret, posé dans le tableau de bord Cloudflare — jamais dans le dépôt. */
  RESEND_API_KEY: string;
  /* Expéditeur. Tant que le domaine n'est pas vérifié chez Resend, seule
     l'adresse de test onboarding@resend.dev est acceptée. */
  DEVIS_FROM: string;
  /* Boîte où tombent les demandes. Distincte de l'adresse publique affichée
     sur le site : une agence trie ses prospects ailleurs que son courrier
     courant, et tant que le domaine n'est pas vérifié chez Resend, celle-ci
     doit être l'adresse du compte Resend. */
  DEVIS_TO: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: FormDataEntryValue | null, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Page de repli, servie quand la demande n'a pas pu partir. Mieux vaut un
 * message franc avec un numéro de téléphone qu'un « merci » qui ment : la
 * personne a rempli le formulaire, elle doit pouvoir nous joindre autrement.
 *
 * Volontairement autonome — la feuille de style du site n'est pas chargée ici.
 */
function erreur(titre: string, message: string, status: number): Response {
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${titre} — ${site.name}</title>
<style>body{margin:0;display:grid;place-items:center;min-height:100vh;
background:#f6f1e7;color:#22303a;font:16px/1.6 system-ui,sans-serif;padding:24px}
main{max-width:34rem}h1{font-size:1.6rem;margin:0 0 .6em}a{color:#1f5f54}
p{margin:0 0 1em}</style></head><body><main>
<h1>${titre}</h1><p>${message}</p>
<p>Écrivez-nous à <a href="mailto:${site.email}">${site.email}</a>
ou appelez le <a href="tel:${site.phone}">${site.phoneDisplay}</a>.
Nous reprenons votre projet de là.</p>
<p><a href="/">Retour à l'accueil</a></p></main></body></html>`;

  return new Response(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/* Les `select` du formulaire renvoient des codes. On n'en traduit que ceux
   qui ne se lisent pas tels quels : si une option est ajoutée côté formulaire
   sans l'être ici, l'e-mail affiche le code brut — lisible, pas cassé. */
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
  // <input type="month"> renvoie « 2027-03 ».
  const m = /^(\d{4})-(\d{2})$/.exec(mois);
  if (!m) return mois || "non précisé";
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(+m[1], +m[2] - 1, 1)));
}

interface Demande {
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
 * Corps en texte brut, pas en HTML : le projet du voyageur est du texte libre,
 * donc rien à échapper et aucune chance d'injecter du balisage dans la boîte
 * de réception. Et cela se lit aussi bien sur un téléphone.
 */
function courriel(d: Demande, page: string, recu: string): string {
  return [
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

async function devis(request: Request, env: Env): Promise<Response> {
  const merci = new URL("/merci/", request.url);
  const form = await request.formData();

  // Honeypot : un champ invisible rempli signale un robot. On répond comme à
  // un humain pour ne pas lui indiquer qu'il a été détecté.
  if (clean(form.get("societe"))) return Response.redirect(merci, 303);

  const d: Demande = {
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

  // Le honeypot arrête les robots naïfs, pas quelqu'un qui vise la boîte de
  // réception ou le quota d'envoi. Cinq demandes par minute et par adresse IP.
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

  const voyageurs = d.voyageurs ? `${d.voyageurs} pers., ` : "";
  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.DEVIS_FROM,
      to: [env.DEVIS_TO],
      // L'agence répond en cliquant simplement sur « Répondre ».
      reply_to: `${d.prenom} ${d.nom} <${d.email}>`,
      subject: `Devis — ${d.prenom} ${d.nom}, ${voyageurs}${duree(d.duree)}`,
      text: courriel(d, request.headers.get("referer") ?? "page inconnue", recu),
    }),
  });

  if (!reponse.ok) {
    // La demande est perdue pour l'agence si elle n'est écrite nulle part :
    // on la journalise intégralement, elle reste repêchable dans les logs
    // Cloudflare (`npx wrangler tail`, ou l'onglet Observability).
    console.error("[devis] ENVOI ÉCHOUÉ — demande à repêcher", {
      status: reponse.status,
      resend: await reponse.text(),
      demande: d,
    });
    return erreur(
      "Votre demande n'est pas partie",
      "Un incident technique nous empêche de recevoir votre message. Il n'a pas été enregistré, merci de nous joindre directement.",
      500,
    );
  }

  return Response.redirect(merci, 303);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/devis") {
      if (request.method !== "POST") {
        return new Response("Méthode non autorisée.", {
          status: 405,
          headers: { Allow: "POST" },
        });
      }
      return devis(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
