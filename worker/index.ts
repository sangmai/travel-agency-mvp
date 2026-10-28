/**
 * Point d'entrée Worker.
 *
 * Les fichiers de out/ sont servis directement depuis l'edge sans passer par
 * ce code : il ne s'exécute que pour ce qui n'est pas un fichier, c'est-à-dire
 * le formulaire de devis et les adresses inconnues.
 *
 * ⚠️ INCOMPLET — le devis est validé, filtré et journalisé, mais n'est
 * transmis nulle part. Les demandes sont donc perdues : brancher le CRM ou
 * l'envoi d'e-mail, une limitation par IP et une conservation conforme au
 * RGPD avant d'ouvrir le site au public.
 */

interface Env {
  /* Déclaré dans wrangler.jsonc. Sert out/, en appliquant les règles
     `html_handling` et `not_found_handling` qui y sont configurées. */
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: FormDataEntryValue | null, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function devis(request: Request): Promise<Response> {
  const merci = new URL("/merci/", request.url);
  const form = await request.formData();

  // Honeypot : un champ invisible rempli signale un robot. On répond comme à
  // un humain pour ne pas lui indiquer qu'il a été détecté.
  if (clean(form.get("societe"))) return Response.redirect(merci, 303);

  const demande = {
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
  if (!demande.prenom) erreurs.push("prenom");
  if (!demande.nom) erreurs.push("nom");
  if (!EMAIL.test(demande.email)) erreurs.push("email");
  if (!demande.consentement) erreurs.push("consentement");

  if (erreurs.length > 0) {
    return Response.json(
      { ok: false, erreurs, message: "Formulaire incomplet." },
      { status: 400 },
    );
  }

  // TODO: transmettre au CRM / envoyer l'e-mail. Journalisation provisoire,
  // visible dans `npx wrangler tail`.
  console.info("[devis] nouvelle demande", {
    ...demande,
    projet: demande.projet.slice(0, 120),
  });

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
      return devis(request);
    }

    return env.ASSETS.fetch(request);
  },
};
