import type { NextConfig } from "next";

/**
 * Export statique : le site n'a aucune dépendance d'exécution — pas de base,
 * pas d'API, pas de secret. Cloudflare Pages sert des fichiers depuis l'edge.
 *
 * `next/image` n'est pas utilisé : Cloudflare n'a pas d'optimiseur d'images
 * Next, donc les variantes sont fabriquées au build (scripts/make-images.mjs)
 * et servies en <img srcset>. Rien à configurer ici.
 *
 * Le formulaire de devis vit dans functions/api/devis.ts, une Pages Function,
 * puisqu'un export statique ne peut pas héberger de route handler.
 */
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  /* Cloudflare Pages sert /a/ pour /a.html ; les barres finales évitent une
     redirection sur chaque page. */
  trailingSlash: true,
};

export default nextConfig;
