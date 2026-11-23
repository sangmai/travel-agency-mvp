import { test } from "node:test";
import assert from "node:assert/strict";
import { APIS, CATALOG_TYPE, DOC_PATH, OPENAPI_PATH, linkset, openapi } from "./api-catalog.ts";

const ORIGIN = "https://voyagevietnam-surmesure.com";

test("le catalogue a la forme d'un linkset RFC 9727", () => {
  const doc = linkset(ORIGIN);
  assert.ok(Array.isArray(doc.linkset));
  assert.equal(doc.linkset.length, APIS.length);
  assert.equal(CATALOG_TYPE, "application/linkset+json");

  for (const e of doc.linkset) {
    /* Un anchor relatif est la faute classique : la RFC veut une adresse qui
       identifie l'interface, pas un chemin à résoudre contre on ne sait quoi. */
    assert.ok(e.anchor.startsWith("https://"), `anchor relatif : ${e.anchor}`);
    for (const rel of ["service-desc", "service-doc"] as const) {
      const liens = e[rel];
      assert.ok(Array.isArray(liens) && liens.length > 0, `${rel} manquant sur ${e.anchor}`);
      for (const l of liens) {
        assert.ok(l.href.startsWith("https://"), `${rel} relatif : ${l.href}`);
        assert.ok(l.type.length > 0, `${rel} sans type`);
      }
    }
  }
});

test("chaque entrée désigne la spécification et sa propre ancre de documentation", () => {
  const doc = linkset(ORIGIN);
  doc.linkset.forEach((e, i) => {
    assert.equal(e["service-desc"][0].href, `${ORIGIN}${OPENAPI_PATH}`);
    assert.equal(e["service-doc"][0].href, `${ORIGIN}${DOC_PATH}#${APIS[i].id}`);
  });
});

test("tout chemin annoncé est décrit par la spécification", () => {
  const spec = openapi(ORIGIN);
  const decrits = Object.keys(spec.paths);
  for (const api of APIS) {
    /* L'API de contenu s'ancre à la racine : ce sont ses routes de lecture qui
       la décrivent, pas une entrée « / ». Les autres doivent figurer telles
       quelles, sans quoi le catalogue enverrait vers une spécification muette
       sur ce qu'il annonce. */
    if (api.anchor === "/") continue;
    assert.ok(decrits.includes(api.anchor), `${api.anchor} absent de l'OpenAPI`);
  }
  assert.ok(decrits.includes("/llms.txt"));
  assert.ok(decrits.includes("/{page}.md"));
});

test("le relevé de clics n'est jamais publié", () => {
  /* Le registre des intentions de contact sert à départager une commission :
     un compteur documenté est un compteur qu'on invite à remplir. Ce test
     existe pour que le rajouter demande de le décider, pas de l'oublier. */
  const tout = JSON.stringify([linkset(ORIGIN), openapi(ORIGIN)]);
  assert.ok(!tout.includes("/api/clic"), "/api/clic ne doit pas être catalogué");
  assert.ok(!tout.includes("/callback"), "le relais OAuth du CMS ne doit pas être catalogué");
});

test("la demande de devis exige les quatre champs que le Worker vérifie", () => {
  const corps = openapi(ORIGIN).paths["/api/devis"].post.requestBody;
  const schema = corps.content["application/x-www-form-urlencoded"].schema;
  assert.deepEqual([...schema.required].sort(), ["consentement", "email", "nom", "prenom"]);
  /* Le pot de miel est documenté comme devant rester vide : un agent honnête
     doit savoir ne pas le remplir. */
  assert.ok("reference-interne" in schema.properties);
});
