import type { NextConfig } from "next";

/**
 * Export statique : le site n'a aucune dépendance d'exécution — pas de base,
 * pas d'API, pas de secret. Cloudflare sert out/ depuis l'edge.
 *
 * `next/image` n'est pas utilisé : Cloudflare n'a pas d'optimiseur d'images
 * Next, donc les variantes sont fabriquées au build (scripts/make-images.mjs)
 * et servies en <img srcset>. Rien à configurer ici.
 *
 * Le formulaire de devis vit dans worker/index.ts, puisqu'un export statique ne
 * peut pas héberger de route handler.
 */
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  /* Chaque page devient <route>/index.html. `html_handling` dans
     wrangler.jsonc est réglé en conséquence : une seule URL par page. */
  trailingSlash: true,
};

export default nextConfig;
