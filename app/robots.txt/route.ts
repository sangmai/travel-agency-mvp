import { getSite } from "@/lib/content";

/** Computed once at build time: the site is exported statically. */
export const dynamic = "force-static";

/**
 * robots.txt, written by hand rather than through Next's metadata helper.
 *
 * The helper only emits User-agent, Allow, Disallow, Sitemap and Host. It has
 * no way to produce a `Content-Signal:` line, and that line is the reason this
 * file exists as a route.
 *
 * ## The signals, and why ai-input is yes
 *
 * Content Signals (contentsignals.org) let a site state what its content may be
 * used for, separately from who may fetch it. Three values, in Cloudflare's own
 * words:
 *
 *   search     building a search index and returning links and short excerpts.
 *              Explicitly does NOT cover AI-generated summaries.
 *   ai-input   putting the content into a model — retrieval-augmented
 *              generation, grounding, generative search answers.
 *   ai-train   training or fine-tuning a model.
 *
 * An audit tool suggested the common template, `ai-train=no, search=yes,
 * ai-input=no`. That would have been the exact opposite of what this site is
 * for. Every citation this project is chasing — AI Overviews, AI Mode, ChatGPT
 * Search, Perplexity — arrives through ai-input, not through search: Cloudflare
 * draws that line explicitly. Declaring ai-input=no asks the engines we are
 * courting to leave us out of the answers we are writing for.
 *
 * ai-train stays no. Training produces no link, no attribution and no
 * enquiry, and a site of this size contributes nothing measurable to a model's
 * weights either way; refusing it costs no citation, because citation runs
 * through retrieval. That one is a preference, not a technical judgement — it
 * is a single word to change below.
 *
 * ## What this is not
 *
 * A preference, not a fence. Cloudflare: "content signals express preferences;
 * they are not technical countermeasures against scraping." Nothing here blocks
 * anybody, and honouring it is voluntary. It costs three lines and states a
 * position; it should not be counted on.
 *
 * ## Why the AI crawlers are allowed to fetch at all
 *
 * Blocking the live-search crawlers (OAI-SearchBot, PerplexityBot,
 * Claude-SearchBot) would make the site uncitable without changing anything in
 * Google's ranking — they are not the same bots as the ones that train the
 * models. To restrict one, add a named group below.
 *
 * /admin stays crawlable on purpose: its `noindex` tag is a stronger signal
 * than a `Disallow`, but the bot still has to be able to read it. A `Disallow`
 * would stop it seeing the instruction, and the page could then be indexed from
 * an external link.
 *
 * /auth and /callback are the OAuth relay routes: they redirect to GitHub and
 * have no content to crawl.
 */
const SIGNAUX = "search=yes, ai-input=yes, ai-train=no";

const INTERDITS = ["/api/", "/merci", "/auth", "/callback"];

export async function GET() {
  const site = await getSite();

  /* English, unlike the site: the readers of these two lines are crawler
     operators, wherever they are. */
  const texte = [
    "# Content signals below state how this site's content may be used.",
    "# They are a declaration of preferences, not an access control.",
    "#",
    "#   search=yes     indexing and linking to these pages is welcome",
    "#   ai-input=yes   quoting them in AI-generated answers is welcome",
    "#   ai-train=no    training or fine-tuning a model on them is not",
    "",
    "User-Agent: *",
    `Content-Signal: ${SIGNAUX}`,
    "Allow: /",
    ...INTERDITS.map((p) => `Disallow: ${p}`),
    "",
    `Host: ${site.url}`,
    `Sitemap: ${site.url}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(texte, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
