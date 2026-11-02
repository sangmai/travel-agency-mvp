/**
 * GitHub OAuth relay for the CMS.
 *
 * Sveltia and Decap cannot exchange the authorization code for a token
 * themselves: that needs the client secret, which has no business living in a
 * web page. So they need a trusted third party. By default they call
 * api.netlify.com, which only answers for sites hosted at Netlify — hence a
 * dead "Sign In with GitHub" button here.
 *
 * Rather than a second Worker to deploy and watch, both routes live in the one
 * already serving the site. The secret stays server-side, and `base_url` in
 * public/admin/config.yml simply points at this domain.
 *
 * Text shown here is in English: these pages are seen by whoever maintains the
 * site, never by a visitor.
 */

export interface AuthEnv {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const COOKIE = "cms_oauth_state";

/* GitHub is asked only for what the CMS needs: read and write the repository,
   and read the identity to show who publishes. A broader scope would be granted
   for the lifetime of the token stored in the editor's browser. */
const SCOPE = "repo,user";

function page(body: string): Response {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
      `<title>Authentication</title></head><body>${body}</body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/**
 * Protocol inherited from Netlify CMS, which Sveltia honours: the popup
 * announces it is ready, waits for the opener to speak up, then returns the
 * token only to the origin the opener answered from.
 */
function remettre(provider: string, charge: string): Response {
  return page(
    `<p>Authentication complete. You can close this window.</p>` +
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

/** Start of the flow: the CMS opens this address in a popup window. */
export function demarrer(request: Request, env: AuthEnv): Response {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? "github";

  if (provider !== "github") return echec(provider, "Only GitHub is supported.");
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    console.error(
      "[cms] CONFIGURATION — GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is " +
        "missing. Create an OAuth App on GitHub, then set both as Worker secrets.",
    );
    return echec(provider, "The CMS is not configured server-side yet.");
  }

  /* An OAuth relay open to everyone is used to build phishing pages that
     borrow this domain. Only this site's admin page has any reason to call
     this route. */
  const referer = request.headers.get("referer");
  if (referer && new URL(referer).host !== url.host) {
    return echec(provider, "Origin not allowed.");
  }

  // Anti-replay token: GitHub hands it back unchanged, and the cookie tells us
  // whether this is the flow we actually opened.
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

/** Return from GitHub, carrying a code to exchange for a token. */
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

  if (!code) return echec(provider, "GitHub returned no code.");
  if (!state || state !== attendu) return echec(provider, "Session expired, start the sign-in again.");

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
    console.error("[cms] code exchange refused by GitHub", { status: reponse.status });
    return echec(provider, "GitHub refused the code exchange.");
  }

  const data = (await reponse.json()) as { access_token?: string; error_description?: string };
  if (!data.access_token) {
    console.error("[cms] no token in GitHub's response", { error: data.error_description });
    return echec(provider, data.error_description ?? "No token received.");
  }

  return remettre(provider, `success:${JSON.stringify({ provider, token: data.access_token })}`);
}
