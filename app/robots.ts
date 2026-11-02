import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content";

/** Computed once at build time: the site is exported statically. */
export const dynamic = "force-static";

/**
 * Generative-engine crawlers are allowed like everyone else.
 *
 * Blocking the live-search crawlers (OAI-SearchBot, PerplexityBot,
 * ChatGPT-User) would make the site uncitable without changing anything in
 * Google's ranking — they are not the same bots as the ones that train the
 * models. To restrict, add a rule here naming the specific bot.
 *
 * /admin stays crawlable on purpose: its `noindex` tag is a stronger signal
 * than a `Disallow`, but the bot still has to be able to read it. A `Disallow`
 * would stop it seeing the instruction, and the page could then be indexed from
 * an external link.
 *
 * /auth and /callback are the OAuth relay routes: they redirect to GitHub and
 * have no content to crawl.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/merci", "/auth", "/callback"] },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
