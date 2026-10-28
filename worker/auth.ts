/**
 * Relais OAuth GitHub pour le CMS.
 *
 * Sveltia et Decap ne peuvent pas échanger eux-mêmes le code d'autorisation
 * contre un jeton : cela demande le secret client, qui n'a rien à faire dans
 * une page web. Il leur faut donc un tiers de confiance. Par défaut ils
 * s'adressent à api.netlify.com, qui ne répond que pour les sites hébergés
 * chez Netlify — d'où un bouton « Sign In with GitHub » inopérant ici.
 *
 * Plutôt qu'un second Worker à déployer et à surveiller, les deux routes
 * vivent dans celui qui sert déjà le site. Le secret reste côté serveur, et
 * `base_url` dans public/admin/config.yml pointe simplement vers ce domaine.
 */

export interface AuthEnv {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const COOKIE = "cms_oauth_state";

/* GitHub n'accepte que ce dont le CMS a besoin : lire et écrire le dépôt,
   et lire l'identité pour afficher qui publie. Une portée plus large serait
   accordée à vie au jeton stocké dans le navigateur de l'éditeur. */
const SCOPE = "repo,user";

function page(body: string): Response {
  return new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8">` +
      `<title>Authentification</title></head><body>${body}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/**
 * Protocole hérité de Netlify CMS, que Sveltia respecte : la fenêtre surgie
 * signale qu'elle est prête, attend que l'ouvreur se manifeste, puis ne lui
 * renvoie le jeton qu'à l'origine d'où il a répondu.
 */
function remettre(provider: string, charge: string): Response {
  return page(
    `<p>Authentification terminée, vous pouvez fermer cette fenêtre.</p>` +
      `<script>(function(){` +
      `function r(e){` +
      `window.opener.postMessage(${JSON.stringify(`authorization:${provider}:`)}+${JSON.stringify(charge)},e.origin);` +
      `window.removeEventListener("message",r,false);}` +
      `window.addEventListener("message",r,false);` +
      `window.opener.postMessage("authorizing:${provider}","*");` +
      `})()</script>`,
  );
}

function echec(provider: string, raison: string): Response {
  return remettre(provider, `error:${JSON.stringify({ message: raison })}`);
}

/** Début du parcours : le CMS ouvre cette adresse dans une fenêtre surgie. */
export function demarrer(request: Request, env: AuthEnv): Response {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "github";

  if (provider !== "github") return echec(provider, "Seul GitHub est pris en charge.");
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    console.error(
      "[cms] CONFIGURATION — GITHUB_CLIENT_ID ou GITHUB_CLIENT_SECRET manque. " +
        "Créer une OAuth App sur GitHub, puis poser les deux en secrets du Worker.",
    );
    return echec(provider, "Le CMS n'est pas encore configuré côté serveur.");
  }

  /* Un relais OAuth ouvert à tous sert à monter des pages d'hameçonnage qui
     empruntent ce domaine. Seule la page d'administration de ce site a une
     raison d'appeler cette route. */
  const referer = request.headers.get("referer");
  if (referer && new URL(referer).host !== url.host) {
    return echec(provider, "Origine non autorisée.");
  }

  // Jeton anti-rejeu : GitHub nous le rendra tel quel, le cookie dira s'il
  // s'agit bien du parcours que nous avons ouvert.
  const state = crypto.randomUUID().replaceAll("-", "");

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  authorize.searchParams.set("scope", SCOPE);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("redirect_uri", `${url.origin}/callback`);

  return new Response(null, {
    status: 302,
    headers: {
      location: authorize.toString(),
      "set-cookie": `${COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

/** Retour de GitHub, avec un code à échanger contre un jeton. */
export async function retour(request: Request, env: AuthEnv): Promise<Response> {
  const url = new URL(request.url);
  const provider = "github";
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const attendu = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);

  if (!code) return echec(provider, "GitHub n'a pas renvoyé de code.");
  if (!state || state !== attendu) return echec(provider, "Session expirée, reprenez la connexion.");

  const reponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      code,
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
    }),
  });

  if (!reponse.ok) {
    console.error("[cms] échange du code refusé par GitHub", { status: reponse.status });
    return echec(provider, "GitHub a refusé l'échange du code.");
  }

  const data = (await reponse.json()) as { access_token?: string; error_description?: string };
  if (!data.access_token) {
    console.error("[cms] aucun jeton dans la réponse de GitHub", { erreur: data.error_description });
    return echec(provider, data.error_description ?? "Aucun jeton reçu.");
  }

  return remettre(provider, `success:${JSON.stringify({ provider, token: data.access_token })}`);
}
