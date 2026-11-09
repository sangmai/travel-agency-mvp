/**
 * Content negotiation: the same page as Markdown, for clients that ask.
 *
 * Every page is also built as a flat `.md` file — see scripts/make-markdown.mjs
 * for why. Two ways to reach it: fetch `/visa-vietnam.md` directly, or send
 * `Accept: text/markdown` to `/visa-vietnam/` and get it back here.
 *
 * ## A bare wildcard must not count
 *
 * Almost every HTTP client that is not a browser sends a wildcard Accept, curl
 * and most crawlers included. Treating that as consent would serve Markdown to
 * things expecting a web page — including, on a bad day, a search engine
 * indexing the Markdown as the page itself.
 *
 * So the rule is narrow: `text/markdown` has to be named, and it has to be
 * wanted at least as much as `text/html`. A wildcard alone decides nothing.
 *
 * ## Vary, on both answers
 *
 * Two different bodies now live at one URL, which is exactly the situation
 * `Vary: Accept` exists for. It goes on the HTML as well as the Markdown: a
 * cache that stored the Markdown without it would hand it to the next browser
 * that came along.
 */

export interface AssetsEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/** Quality of one media type in an Accept header, wildcards excluded. */
function qualite(accept: string, type: string): number {
  for (const partie of accept.split(",")) {
    const [brut, ...params] = partie.split(";");
    if (brut.trim().toLowerCase() !== type) continue;
    const q = params
      .map((p) => p.trim().match(/^q=([\d.]+)$/i))
      .find(Boolean);
    return q ? Number(q[1]) : 1;
  }
  return 0;
}

/** `/` → `/index.md`, `/visa-vietnam/` → `/visa-vietnam.md`. */
const versMd = (pathname: string) => {
  const nu = pathname.replace(/\/+$/, "");
  return `${nu || "/index"}.md`;
};

/* Only page addresses. A request for a file with an extension already names
   the representation it wants. */
const estUnePage = (pathname: string) => !/\.[a-z0-9]+$/i.test(pathname);

/** The inverse of `versMd`: `/visa-vietnam.md` → `/visa-vietnam/`, `/index.md` → `/`. */
const versPage = (pathname: string) => {
  const nu = pathname.replace(/\.md$/, "");
  return nu === "/index" ? "/" : `${nu}/`;
};

/**
 * Returns the Markdown representation when the client asked for it, `null`
 * otherwise — in which case the caller serves the page as usual.
 */
export async function markdown(
  request: Request,
  env: AssetsEnv,
): Promise<Response | null> {
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  try {
    return await negocier(request, env);
  } catch (e) {
    /* Same reasoning as `page`: returning null sends the caller to the HTML,
       which is the right answer when the alternative is a 500. */
    console.error("[markdown] négociation abandonnée", { error: String(e) });
    return null;
  }
}

async function negocier(
  request: Request,
  env: AssetsEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!estUnePage(url.pathname)) return null;

  const accept = request.headers.get("accept") ?? "";
  const veutMd = qualite(accept, "text/markdown");
  if (veutMd === 0 || veutMd < qualite(accept, "text/html")) return null;

  const cible = new URL(versMd(url.pathname), url.origin);
  const reponse = await env.ASSETS.fetch(new Request(cible, { method: "GET" }));
  /* No .md for this path: fall through rather than answer 404, because the page
     itself may well exist. */
  if (!reponse.ok) return null;

  const entetes = new Headers(reponse.headers);
  entetes.set("content-type", "text/markdown; charset=utf-8");
  entetes.set("vary", "Accept");
  entetes.set("link", `<${url.href}>; rel="canonical"`);

  return new Response(request.method === "HEAD" ? null : reponse.body, {
    status: 200,
    headers: entetes,
  });
}

/**
 * The page itself, told that a Markdown twin exists and that the answer at this
 * URL depends on Accept.
 *
 * The `Link` header is the only machine-readable way to advertise the
 * alternative to a client that has not guessed the `.md` convention.
 */
export async function page(request: Request, env: AssetsEnv): Promise<Response> {
  const reponse = await env.ASSETS.fetch(request);

  try {
    const url = new URL(request.url);
    if (!reponse.ok) return reponse;

    /**
     * A `.md` fetched at its own address is the same page in another format,
     * and nothing told Google so.
     *
     * The negotiated answer carried a canonical from the start; this one did
     * not, while every HTML page advertises it through a `rel="alternate"`
     * header — so the crawler was being walked to thirty files that looked like
     * thirty new pages saying exactly what the existing ones say. The next
     * Search Console report would have been "Duplicate without user-selected
     * canonical", thirty times.
     *
     * A canonical rather than a noindex: this is an alternate representation,
     * the case the HTTP header form of rel=canonical exists for, and it folds
     * the address into the page instead of discarding it. Blocking the files in
     * robots.txt would have been worse still — they exist for the crawlers that
     * would then be unable to read them.
     */
    if (url.pathname.endsWith(".md")) {
      const entetes = new Headers(reponse.headers);
      entetes.set("content-type", "text/markdown; charset=utf-8");
      entetes.set(
        "link",
        `<${new URL(versPage(url.pathname), url.origin).href}>; rel="canonical"`,
      );
      return new Response(reponse.body, {
        status: reponse.status,
        statusText: reponse.statusText,
        headers: entetes,
      });
    }

    if (!estUnePage(url.pathname)) return reponse;

    const entetes = new Headers(reponse.headers);
    entetes.append("vary", "Accept");
    entetes.set(
      "link",
      `<${new URL(versMd(url.pathname), url.origin).href}>; rel="alternate"; type="text/markdown"`,
    );
    return new Response(reponse.body, {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: entetes,
    });
  } catch (e) {
    /* Two headers are not worth a blank page. Since run_worker_first covers
       every page address, an exception thrown here would be the site going
       down — so the unmodified asset is returned instead. */
    console.error("[markdown] en-têtes non posés", { error: String(e) });
    return reponse;
  }
}
