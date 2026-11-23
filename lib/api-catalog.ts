/**
 * Catalogue d'API au sens de la RFC 9727, et le document OpenAPI qu'il désigne.
 *
 * ## Une table, trois lecteurs
 *
 * Le catalogue servi sur /.well-known/api-catalog, le document OpenAPI servi
 * sur /openapi.json et la page lisible sur /documentation-api/ sortent tous
 * d'ici. C'est la seule façon d'empêcher qu'un `href` du catalogue désigne un
 * chemin que la spécification ne décrit pas : les trois ne peuvent plus diverger
 * sans que ce fichier change.
 *
 * ## Ce qui est publié, et ce qui ne l'est pas
 *
 * Le site n'expose que deux routes applicatives, et une seule est catalogable.
 *
 * `POST /api/devis` est annoncé. Il est déjà public — le formulaire figure en
 * clair dans le HTML de chaque page — donc le décrire n'ouvre rien qui ne le
 * soit : cela remplace une lecture du DOM par une lecture de contrat. Le
 * limiteur à cinq requêtes par minute et le pot de miel restent la défense, et
 * ils ne dépendent pas de la discrétion.
 *
 * `POST /api/clic` n'est PAS annoncé, et ce n'est pas un oubli. C'est le
 * registre des intentions de contact, celui qui sert à départager une
 * commission. wrangler.jsonc le dit : un nombre fabriqué ruine l'objet même du
 * registre. Un compteur qu'on documente est un compteur qu'on invite à
 * remplir, et aucun agent tiers n'a de raison légitime de l'appeler.
 *
 * `/auth` et `/callback` sont le relais OAuth du CMS. Ce sont des rouages
 * internes imposés par `base_url`, pas une interface offerte à qui que ce soit.
 */

export const CATALOG_PATH = "/.well-known/api-catalog";
export const OPENAPI_PATH = "/openapi.json";
export const DOC_PATH = "/documentation-api/";

/**
 * Type exigé par la RFC 9727 pour le catalogue.
 *
 * Sans paramètre : la RFC suggère d'ajouter `profile=`, mais un validateur qui
 * compare la chaîne entière au lieu d'analyser le type échouerait dessus. Le
 * profil part donc en en-tête `Link`, où il dit la même chose sans rien risquer.
 */
export const CATALOG_TYPE = "application/linkset+json";
export const CATALOG_PROFILE = "https://www.rfc-editor.org/info/rfc9727";
export const OPENAPI_TYPE = "application/vnd.oai.openapi+json;version=3.1";

export type Api = {
  /** Identifiant local, qui sert aussi d'ancre sur la page de documentation. */
  id: string;
  nom: string;
  /** Une phrase : ce que l'interface fait, pas comment elle le fait. */
  resume: string;
  /** Chemin qui identifie l'interface. Devient l'`anchor` du catalogue. */
  anchor: string;
};

export const APIS: Api[] = [
  {
    id: "contenu",
    nom: "API de contenu",
    resume:
      "Chaque page du site existe aussi en Markdown, et l'inventaire complet est publié. De quoi lire le site sans analyser du HTML.",
    anchor: "/",
  },
  {
    id: "devis",
    nom: "API de demande de devis",
    resume:
      "L'unique route en écriture : elle dépose une demande de voyage sur mesure, qui part par courriel à l'agence et au voyageur.",
    anchor: "/api/devis",
  },
];

/** Champs réellement lus par `devis()` dans worker/index.ts. */
const CHAMPS_DEVIS: { nom: string; max?: number; requis?: boolean; desc: string }[] = [
  { nom: "prenom", max: 80, requis: true, desc: "Prénom du voyageur." },
  { nom: "nom", max: 80, requis: true, desc: "Nom du voyageur." },
  { nom: "email", max: 160, requis: true, desc: "Adresse électronique, sur laquelle part l'accusé de réception." },
  { nom: "consentement", requis: true, desc: "Doit valoir « on ». Consentement au traitement de la demande." },
  { nom: "telephone", max: 40, desc: "Téléphone, avec l'indicatif international." },
  { nom: "circuit", max: 120, desc: "Intitulé du circuit concerné, s'il y en a un." },
  { nom: "depart", max: 20, desc: "Date de départ envisagée." },
  { nom: "duree", max: 20, desc: "Durée envisagée, en jours." },
  { nom: "voyageurs", max: 4, desc: "Nombre de voyageurs." },
  { nom: "gamme", max: 20, desc: "Gamme de confort souhaitée." },
  { nom: "projet", desc: "Texte libre : le projet de voyage." },
  {
    nom: "reference-interne",
    desc: "Pot de miel. Doit rester vide ; toute valeur fait répondre 303 sans rien envoyer.",
  },
];

/** Le document linkset de la RFC 9727. */
export function linkset(origin: string) {
  const url = (p: string) => new URL(p, origin).href;
  return {
    linkset: APIS.map((api) => ({
      anchor: url(api.anchor),
      "service-desc": [{ href: url(OPENAPI_PATH), type: OPENAPI_TYPE }],
      "service-doc": [{ href: `${url(DOC_PATH)}#${api.id}`, type: "text/html" }],
    })),
  };
}

/** Le document OpenAPI 3.1 que désignent les deux entrées du catalogue. */
export function openapi(origin: string) {
  const proprietes: Record<string, { type: string; maxLength?: number; description: string }> = {};
  for (const c of CHAMPS_DEVIS) {
    proprietes[c.nom] = { type: "string", ...(c.max ? { maxLength: c.max } : {}), description: c.desc };
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Voyage Vietnam Sur Mesure",
      version: "1.0.0",
      summary: "Le contenu du site en Markdown, et le dépôt d'une demande de devis.",
      description:
        "Deux interfaces. La première est en lecture seule et sert le site lui-même : toute page est disponible en Markdown, soit en appelant son adresse suffixée de .md, soit en envoyant Accept: text/markdown à l'adresse HTML. La seconde dépose une demande de voyage sur mesure.",
      license: { name: "Contenu éditorial sous droit d'auteur, tous droits réservés" },
    },
    servers: [{ url: origin }],
    paths: {
      "/{page}.md": {
        get: {
          operationId: "lirePageMarkdown",
          summary: "Une page du site en Markdown",
          description:
            "`page` est le chemin de la page sans sa barre oblique finale : `visa-vietnam`, `blog/quy-nhon`. La racine s'appelle `index`. La même ressource s'obtient sur l'adresse HTML avec un en-tête Accept nommant explicitement text/markdown — un Accept générique renvoie le HTML, ce qui est voulu.",
          parameters: [
            {
              name: "page",
              in: "path",
              required: true,
              description: "Chemin de la page, barres obliques comprises.",
              schema: { type: "string" },
              example: "blog/quy-nhon",
            },
          ],
          responses: {
            "200": {
              description: "La page en Markdown.",
              content: { "text/markdown": { schema: { type: "string" } } },
            },
            "404": { description: "Aucune page à ce chemin." },
          },
        },
      },
      "/llms.txt": {
        get: {
          operationId: "lireLlmsTxt",
          summary: "Inventaire du site pour un agent",
          description: "Les pages publiées, leur intitulé et leur date, en un seul fichier.",
          responses: {
            "200": {
              description: "L'inventaire.",
              content: { "text/plain": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/sitemap.xml": {
        get: {
          operationId: "lireSitemap",
          summary: "Plan du site",
          responses: {
            "200": {
              description: "Le plan du site.",
              content: { "application/xml": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/api/devis": {
        post: {
          operationId: "deposerDemandeDevis",
          summary: "Déposer une demande de devis",
          description:
            "Destiné au formulaire du site : le corps est encodé en formulaire, et la réponse normale est une redirection vers la page de remerciement. Limité à cinq requêtes par minute et par adresse IP.",
          requestBody: {
            required: true,
            content: {
              "application/x-www-form-urlencoded": {
                schema: {
                  type: "object",
                  required: CHAMPS_DEVIS.filter((c) => c.requis).map((c) => c.nom),
                  properties: proprietes,
                },
              },
            },
          },
          responses: {
            "303": {
              description: "Demande acceptée. Redirige vers /merci/.",
              headers: { Location: { schema: { type: "string" } } },
            },
            "400": {
              description: "Champs obligatoires manquants ou adresse invalide.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      ok: { type: "boolean" },
                      erreurs: { type: "array", items: { type: "string" } },
                      message: { type: "string" },
                    },
                  },
                },
              },
            },
            "405": { description: "Méthode autre que POST." },
            "429": { description: "Plus de cinq demandes en une minute depuis la même adresse." },
          },
        },
      },
    },
  };
}
