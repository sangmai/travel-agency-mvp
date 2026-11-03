import type { MetadataRoute } from "next";
import { getGuides, getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";
import { publishedRoutes } from "@/lib/routes";

/** Computed once at build time: the site is exported statically. */
export const dynamic = "force-static";

/**
 * Declare only what is genuinely published: missing URLs would produce 404s in
 * Search Console and waste crawl budget. Trips come from the content and the
 * other routes from lib/routes.ts, so the list stays correct without
 * intervention.
 *
 * ## lastmod must mean something
 *
 * Every URL used to carry the build timestamp, so the sitemap announced that
 * all twenty-five pages had changed every time anything was deployed. Google
 * states it uses lastmod only when a site is consistently accurate with it — a
 * value that moves on every URL at every build is the exact pattern that gets
 * the field ignored, which costs the signal precisely when one page genuinely
 * has changed.
 *
 * Guide pages carry a real `dateModified`, taken from the repository history.
 * Those are used where they exist. The build date remains the fallback for
 * pages whose content is assembled rather than written — the home page, the
 * trip pages — because for those there is no better answer, and claiming a
 * precise date we cannot source would be the same lie in the other direction.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, trips, guides] = await Promise.all([getSite(), getTrips(), getGuides()]);
  const now = new Date();

  /* slug -> real modification date, for the pages that have one. */
  const modifie = new Map(guides.map((g): [string, Date] => [`/${g.slug}`, new Date(g.dateModified)]));

  /* `trailingSlash: true` means every page exists only with a trailing slash,
     and that is the form the canonical tags carry. Here the URLs are assembled
     by hand, outside that normalisation: without this reminder the sitemap would
     announce addresses that redirect, contradicting the canonicals of the very
     pages it declares. */
  const url = (path: string) => `${site.url}${path.replace(/\/?$/, "/")}`;

  return [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...publishedRoutes()
      /* /credits-photos is published and linked from all twenty-five pages, but
         it carries `noindex` — so it stays out. A sitemap asks an engine to
         index a URL; listing a page that also says "do not index" sends two
         opposite instructions about the same address.

         The page exists because CC BY and CC BY-SA require attribution to be
         reachable. That obligation is towards readers, not towards search
         engines, and 327 words of credits answer no query. Crawlable it must
         stay, which is why robots.txt does not block it: a disallowed page is
         one whose `noindex` is never read.

         Written down because this exclusion has twice been reported as an
         oversight by people reading the site from outside. It is a decision. */
      .filter((r) => r.path !== "/credits-photos")
      .map((r) => ({
        url: url(r.path),
        lastModified: modifie.get(r.path) ?? now,
        changeFrequency: "weekly" as const,
        priority: r.path === TRIP_BASE ? 0.9 : 0.6,
      })),
    ...trips.map((t) => ({
      url: url(tripUrl(t.slug)),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
