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
 *
 * /admin reste explorable à dessein : sa balise `noindex` est un signal plus
 * fort qu'un `Disallow`, mais encore faut-il que le robot puisse la lire. Un
 * `Disallow` l'empêcherait de voir la consigne et la page pourrait être
 * indexée depuis un lien externe.
 *
 * /auth et /callback sont les routes du relais OAuth : elles redirigent vers
 * GitHub et n'ont aucun contenu à explorer.
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
