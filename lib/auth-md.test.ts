import { test } from "node:test";
import assert from "node:assert/strict";
import { AUTH_MD_TYPE, authMd } from "./auth-md.ts";

const ORIGIN = "https://voyagevietnam-surmesure.com";
const DOC = authMd(ORIGIN);

test("le document commence par un H1 qui nomme auth.md", () => {
  /* C'est la condition de détection du protocole : un lecteur doit reconnaître
     le document à sa première ligne, sans le parcourir. */
  const h1 = DOC.split("\n")[0];
  assert.ok(h1.startsWith("# "), `première ligne sans H1 : ${h1}`);
  assert.ok(h1.toLowerCase().includes("auth.md"), `H1 ne nomme pas auth.md : ${h1}`);
  assert.equal(AUTH_MD_TYPE, "text/markdown; charset=utf-8");
});

test("le document est autonome : audience, enregistrement, méthode, usage", () => {
  /* Les quatre points qu'exige la branche sans OAuth. Faute de serveur
     d'autorisation, c'est ce document qui doit répondre seul. */
  assert.match(DOC, /## À qui ce document s'adresse/);
  assert.match(DOC, /## Enregistrement/);
  assert.match(DOC, /Aucune procédure d'enregistrement n'existe/);
  assert.match(DOC, /POST \/api\/devis/);
});

test("les règles qui font échouer un appel sont écrites", () => {
  assert.match(DOC, /reference-interne/, "le pot de miel doit être signalé");
  assert.match(DOC, /5 requêtes par minute/, "la limite doit être chiffrée");
  assert.match(DOC, /429/);
  assert.match(DOC, /relevée par des personnes/, "un agent doit savoir que ce n'est pas un bac à sable");
});

test("aucune métadonnée OAuth n'est revendiquée", () => {
  /* Le cœur de la décision. Ce domaine n'émet pas de jeton : déclarer un
     issuer, une portée ou un register_uri enverrait un agent vers des adresses
     inexistantes. Ce test échoue si quelqu'un ajoute la revendication sans
     ajouter le serveur qui va avec. */
  for (const interdit of ["issuer", "register_uri", "scopes_supported", "bearer_methods_supported"]) {
    const revendique = new RegExp(`^(?!.*n'(est|a) pas).*\\b${interdit}\\b`, "mi");
    assert.ok(
      !revendique.test(DOC.replace(/\/\.well-known\/oauth-[a-z-]+/g, "")),
      `${interdit} revendiqué sans serveur d'autorisation`,
    );
  }
  /* La mise en garde doit rester : /auth est le relais du CMS, pas un point
     d'autorisation, et un agent qui le confondrait perdrait son temps. */
  assert.match(DOC, /n'est pas un serveur d'autorisation/);
});

test("les adresses pointent vers l'origine demandée", () => {
  for (const chemin of ["/llms.txt", "/.well-known/api-catalog", "/openapi.json", "/documentation-api/"]) {
    assert.ok(DOC.includes(`${ORIGIN}${chemin}`), `${chemin} absent ou relatif`);
  }
});
