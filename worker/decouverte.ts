/**
 * Les documents de découverte : le catalogue RFC 9727, le document OpenAPI
 * qu'il désigne, et auth.md.
 *
 * Servis par le Worker et non depuis out/, pour deux raisons tenant toutes
 * deux aux en-têtes.
 *
 * `api-catalog` n'a pas d'extension, et la couche d'assets statiques déduit le
 * `Content-Type` de l'extension : un fichier posé là sortirait en
 * application/octet-stream, ce qui invalide le catalogue aussi sûrement qu'un
 * 404. Ici l'en-tête est écrit, pas deviné.
 *
 * `/auth.md` est exactement la forme que worker/markdown.ts donne au jumeau
 * Markdown de `/auth/` — le relais OAuth GitHub du CMS. Répondre ici, en amont
 * de la négociation, évite qu'il soit servi avec un lien canonique désignant la
 * page de connexion du système d'édition.
 */
import {
  CATALOG_PATH,
  CATALOG_PROFILE,
  CATALOG_TYPE,
  OPENAPI_PATH,
  OPENAPI_TYPE,
  linkset,
  openapi,
} from "../lib/api-catalog";
import { AUTH_MD_PATH, AUTH_MD_TYPE, authMd } from "../lib/auth-md";

/** Une journée de cache : ces documents ne bougent qu'au déploiement. */
const CACHE = "public, max-age=86400";

const CHEMINS = [CATALOG_PATH, OPENAPI_PATH, AUTH_MD_PATH];

function document(
  corps: string,
  type: string,
  entetes: Record<string, string>,
  method: string,
) {
  const headers = { "content-type": type, "cache-control": CACHE, ...entetes };
  /* HEAD renvoie les mêmes en-têtes sans corps — la RFC 9727 demande
     explicitement qu'un HEAD sur le catalogue réponde. */
  return new Response(method === "HEAD" ? null : corps, { headers });
}

/**
 * Répond si l'adresse est l'une des trois, sinon rend `null` pour laisser la
 * requête suivre son cours.
 */
export function decouverte(request: Request): Response | null {
  const { pathname, origin } = new URL(request.url);
  if (!CHEMINS.includes(pathname)) return null;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  if (pathname === AUTH_MD_PATH) {
    return document(authMd(origin), AUTH_MD_TYPE, {}, request.method);
  }

  if (pathname === OPENAPI_PATH) {
    const json = JSON.stringify(openapi(origin), null, 2);
    return document(json, OPENAPI_TYPE, {}, request.method);
  }

  return document(
    JSON.stringify(linkset(origin), null, 2),
    CATALOG_TYPE,
    {
      /* Le profil, que la RFC suggère de porter en paramètre du Content-Type.
         Il est ici pour ne pas allonger un type que des validateurs comparent
         caractère par caractère. Le second lien est la relation définie en
         section 3 : le catalogue se désigne lui-même. */
      link: `<${CATALOG_PROFILE}>; rel="profile", <${CATALOG_PATH}>; rel="api-catalog"`,
    },
    request.method,
  );
}
