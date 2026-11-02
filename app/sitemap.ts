import type { MetadataRoute } from "next";
import { getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";
import { publishedRoutes } from "@/lib/routes";

/** Computed once at build time: the site is exported statically. */
export const dynamic = "force-static";

/**
 * Declare only what is genuinely published: missing URLs would produce 404s in
 * Search Console and waste crawl budget. Trips come from the content and the
 * other routes from lib/routes.ts, so the list stays correct without
 * intervention.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);
  const now = new Date();

  /* `trailingSlash: true` means every page exists only with a trailing slash,
     and that is the form the canonical tags carry. Here the URLs are assembled
     by hand, outside that normalisation: without this reminder the sitemap would
     announce addresses that redirect, contradicting the canonicals of the very
     pages it declares. */
  const url = (path: string) => `${site.url}${path.replace(/\/?$/, "/")}`;

  return [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...publishedRoutes()
      .filter((r) => r.path !== "/credits-photos")
      .map((r) => ({
        url: url(r.path),
        lastModified: now,
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
