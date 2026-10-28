import type { MetadataRoute } from "next";
import { getSite, getTrips, tripUrl, TRIP_BASE } from "@/lib/content";
import { publishedRoutes } from "@/lib/routes";

/** Calculé une fois au build : le site est exporté en statique. */
export const dynamic = "force-static";

/**
 * Ne déclarer que ce qui est réellement publié : des URL absentes
 * produiraient des 404 en Search Console et gaspilleraient le budget de
 * crawl. Les fiches viennent du contenu et les autres routes de
 * lib/routes.ts, donc la liste reste juste sans intervention.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);
  const now = new Date();

  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...publishedRoutes()
      .filter((r) => r.path !== "/credits-photos")
      .map((r) => ({
        url: site.url + r.path,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: r.path === TRIP_BASE ? 0.9 : 0.6,
      })),
    ...trips.map((t) => ({
      url: site.url + tripUrl(t.slug),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
