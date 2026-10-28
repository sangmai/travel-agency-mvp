/**
 * Cloudflare Pages Function : POST /api/devis.
 *
 * Le site étant exporté en statique, le formulaire ne peut pas être servi par
 * un route handler Next. Le code est le même, en API Web standard.
 *
 * ⚠️ INCOMPLET — valide, filtre les robots, journalise, mais ne transmet
 * rien. Les demandes sont donc perdues : ne pas mettre en ligne avant d'avoir
 * branché le CRM ou l'envoi d'e-mail, une limitation de débit par IP et une
 * conservation conforme au RGPD.
 */

function clean(value: FormDataEntryValue | null, max = 2000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function onRequestPost({ request }: { request: Request }) {
  const form = await request.formData();

  // Honeypot : un champ invisible rempli signale un robot. On répond 200
  // pour ne pas lui indiquer qu'il a été détecté.
  if (clean(form.get("societe"))) {
    return Response.redirect(new URL("/merci/", request.url), 303);
  }

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

  // TODO: transmettre au CRM / envoyer l'e-mail. Journalisation provisoire.
  console.info("[devis] nouvelle demande", {
    ...demande,
    projet: demande.projet.slice(0, 120),
  });

  return Response.redirect(new URL("/merci/", request.url), 303);
}
