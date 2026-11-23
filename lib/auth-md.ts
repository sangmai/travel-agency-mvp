/**
 * Le document auth.md, dans sa forme autonome.
 *
 * ## Pourquoi la forme autonome, et pas OAuth
 *
 * Le protocole prévoit deux branches : un service protégé publie des métadonnées
 * OAuth, un service qui ne l'est pas publie un auth.md qui se suffit. Celui-ci
 * relève de la seconde, et ce n'est pas un repli faute de temps.
 *
 * Rien ici n'est protégé. Aucune route n'accepte de jeton, aucun compte
 * n'existe, aucune portée n'est définie. Publier des métadonnées de serveur
 * d'autorisation reviendrait à déclarer que ce domaine délivre des jetons : un
 * agent suivrait la déclaration, appellerait des adresses inexistantes, et
 * conclurait à une panne. Un document qui dit « il n'y a rien à demander »
 * répond à la même question, en moins de requêtes et sans mentir.
 *
 * Attention au nom : `/auth.md` est exactement la forme que worker/markdown.ts
 * donne au jumeau Markdown de `/auth/`, qui est le relais OAuth GitHub du CMS.
 * Les deux n'ont rien à voir, et c'est pourquoi ce document est servi par le
 * Worker avant que la négociation Markdown ne s'en mêle.
 */
import { CATALOG_PATH, DOC_PATH, OPENAPI_PATH } from "./api-catalog.ts";

export const AUTH_MD_PATH = "/auth.md";
export const AUTH_MD_TYPE = "text/markdown; charset=utf-8";

export function authMd(origin: string): string {
  const u = (p: string) => new URL(p, origin).href;

  return `# auth.md — Voyage Vietnam Sur Mesure

> Ce service ne demande aucune authentification, et n'en délivrera pas.
> Aucun compte, aucune clé, aucun jeton, aucune portée. Tout ce qui est
> lisible ici l'est sans se présenter.

## À qui ce document s'adresse

Aux agents qui lisent le contenu de ce site, et à ceux qui déposent une demande
de devis pour le compte d'une personne. Dans les deux cas il n'y a rien à
obtenir au préalable.

## Enregistrement

**Aucune procédure d'enregistrement n'existe.** Il n'y a ni point d'entrée
d'inscription, ni délivrance d'identifiants, ni serveur d'autorisation. Ce
n'est pas une omission : rien sur ce domaine n'est protégé, donc il n'y a aucun
accès à accorder.

| Ressource | Authentification | Limite |
| --- | --- | --- |
| Toutes les pages, en HTML ou en Markdown | Aucune | Aucune |
| \`/llms.txt\`, \`/sitemap.xml\` | Aucune | Aucune |
| \`POST /api/devis\` | Aucune | 5 requêtes par minute et par adresse IP |

## Lire le contenu

Toute page existe en Markdown : son adresse suffixée de \`.md\`
(\`/blog/quy-nhon.md\`), ou la même adresse avec un en-tête \`Accept\` nommant
explicitement \`text/markdown\`. Un \`Accept\` générique renvoie le HTML, et c'est
voulu.

- Inventaire des pages : ${u("/llms.txt")}
- Catalogue d'API (RFC 9727) : ${u(CATALOG_PATH)}
- Description OpenAPI : ${u(OPENAPI_PATH)}
- Documentation lisible : ${u(DOC_PATH)}

## Écrire : déposer une demande de devis

\`POST /api/devis\`, corps encodé en formulaire. Quatre champs obligatoires :
\`prenom\`, \`nom\`, \`email\`, et \`consentement\` qui doit valoir \`on\`. La réponse
normale est une redirection \`303\` ; un formulaire incomplet renvoie un \`400\`
en JSON nommant les champs fautifs.

Deux règles à respecter sans quoi la demande se perd ou se bloque :

1. Le champ \`reference-interne\` est un pot de miel. **Laissez-le vide.** Rempli,
   la requête est acceptée en apparence et n'est jamais transmise.
2. Au-delà de cinq requêtes par minute depuis la même adresse, la route répond
   \`429\`.

**Chaque demande arrive dans une boîte relevée par des personnes, et déclenche
un courriel vers le voyageur dont l'adresse est fournie.** Ce n'est pas un bac à
sable. N'appelez cette route que pour une demande réelle, avec le consentement
de la personne concernée.

## Comment vous présenter, faute d'identifiants

Puisqu'aucune clé n'est délivrée, la seule identification possible est
déclarative. Envoyez un \`User-Agent\` qui nomme votre agent et une adresse
joignable. En cas de volume anormal, c'est ce qui permet de vous écrire plutôt
que de vous bloquer.

## Ce que ce document n'affirme pas

Ce domaine **n'est pas un serveur d'autorisation**. Il ne publie ni
\`/.well-known/oauth-protected-resource\` ni
\`/.well-known/oauth-authorization-server\`, parce qu'il n'a ni ressource protégée
ni jeton à émettre.

La route \`/auth\` existe, mais c'est le relais OAuth GitHub du système
d'édition : elle sert à authentifier les personnes qui écrivent ce site auprès
de GitHub, et n'émet rien pour qui que ce soit d'autre. Ne la traitez pas comme
un point d'entrée d'autorisation.
`;
}
