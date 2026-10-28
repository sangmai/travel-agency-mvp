import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content";

/** Calculé une fois au build : le site est exporté en statique. */
export const dynamic = "force-static";

/**
 * Les crawlers des moteurs génératifs sont autorisés comme tout le monde.
 *
 * Bloquer les crawlers de recherche en direct (OAI-SearchBot, PerplexityBot,
 * ChatGPT-User) rendrait le site incitable sans rien changer au classement
 * Google — ce n'est pas le même robot que ceux qui entraînent les modèles.
 * Pour restreindre, ajouter ici une règle nommant le robot.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/merci"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
