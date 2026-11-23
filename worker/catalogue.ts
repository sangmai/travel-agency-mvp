/**
 * Les deux ressources de découverte : le catalogue RFC 9727 et le document
 * OpenAPI qu'il désigne.
 *
 * Servies par le Worker et non depuis out/, pour une raison tenant au type :
 * `api-catalog` n'a pas d'extension, et la couche d'assets statiques déduit le
 * `Content-Type` de l'extension. Un fichier posé là sortirait en
 * application/octet-stream, ce qui invalide le catalogue aussi sûrement qu'un
 * 404. Ici l'en-tête est écrit, pas deviné.
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

/** Une journée de cache : ces deux documents ne bougent qu'au déploiement. */
const CACHE = "public, max-age=86400";

function document(corps: unknown, type: string, entetes: Record<string, string>, method: string) {
  const json = JSON.stringify(corps, null, 2);
  const headers = { "content-type": type, "cache-control": CACHE, ...entetes };
  /* HEAD doit renvoyer les mêmes en-têtes sans corps — la RFC 9727 demande
     explicitement qu'un HEAD sur le catalogue réponde. */
  return new Response(method === "HEAD" ? null : json, { headers });
}

/**
 * Répond si l'adresse est l'une des deux, sinon rend `null` pour laisser la
 * requête suivre son cours.
 */
export function catalogue(request: Request): Response | null {
  const { pathname, origin } = new URL(request.url);
  if (pathname !== CATALOG_PATH && pathname !== OPENAPI_PATH) return null;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  if (pathname === OPENAPI_PATH) {
    return document(openapi(origin), OPENAPI_TYPE, {}, request.method);
  }

  return document(linkset(origin), CATALOG_TYPE, {
    /* Le profil, que la RFC suggère de porter en paramètre du Content-Type.
       Il est ici pour ne pas allonger un type que des validateurs comparent
       caractère par caractère. Le second lien est la relation définie en
       section 3 : le catalogue se désigne lui-même. */
    link: `<${CATALOG_PROFILE}>; rel="profile", <${CATALOG_PATH}>; rel="api-catalog"`,
  }, request.method);
}
