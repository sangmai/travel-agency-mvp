/**
 * Checks that every hand-picked activity still exists.
 *
 * An organiser can withdraw a tour at any time, and the link then leads to a
 * 404 — worse than the search page it replaced, because a dead link costs the
 * commission and the reader's trust at once, where a search page only
 * converts less well.
 *
 * Deliberately NOT part of `prebuild`. It makes one network request per
 * activity, and a build that fails because GetYourGuide is slow, or because
 * the machine is offline, would be a build that fails for no reason of ours.
 * Run it by hand: `npm run experiences`, after adding one and every few weeks.
 */
import { readFileSync } from "node:fs";

const fichier = new URL("../content/experiences.json", import.meta.url);
const data = JSON.parse(readFileSync(fichier, "utf8"));

const activites = Object.entries(data)
  .filter(([lieu]) => lieu !== "_")
  .flatMap(([lieu, liste]) => liste.map((a) => ({ lieu, ...a })));

if (!activites.length) {
  console.log("[experiences] aucune activité choisie — tout retombe sur la recherche");
  process.exit(0);
}

const mortes = [];

for (const a of activites) {
  let etat;
  try {
    /* GetYourGuide answers 403 to anything that looks automated, so a 403 is
       not evidence of a dead page — only a 404 or a 410 is. Saying so here
       stops the next person from "fixing" a link that was never broken. */
    const r = await fetch(a.url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/131.0 Safari/537.36",
        "accept-language": "fr-FR,fr;q=0.9",
      },
    });
    etat = r.status;
  } catch (e) {
    etat = `réseau : ${e.code ?? e.name}`;
  }

  const verdict =
    etat === 404 || etat === 410 ? "MORTE" : etat === 403 ? "403 (bloqué, non concluant)" : `${etat}`;
  if (verdict === "MORTE") mortes.push(a);
  console.log(`  ${a.lieu.padEnd(12)} ${String(verdict).padEnd(28)} ${a.titre}`);
}

if (mortes.length) {
  console.error(
    `\n[experiences] ${mortes.length} lien(s) mort(s). Les retirer de ` +
      `content/experiences.json : le lieu retombera sur la recherche, ` +
      `qui marche toujours.`,
  );
  process.exit(1);
}

console.log(`\n[experiences] ${activites.length} activité(s), aucune morte`);
