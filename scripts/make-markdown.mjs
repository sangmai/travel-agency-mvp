/**
 * A Markdown copy of every page, for the readers that only want the words.
 *
 * ## Why
 *
 * The home page is 225 KB of HTML, most of it the React payload Next inlines so
 * the page can hydrate. A model fetching it wades through all of that to reach
 * four thousand words. The same page as Markdown is a few kilobytes of prose,
 * tables and headings — the part anybody quoting this site actually wants.
 *
 * Cloudflare's crawler report says this is not hypothetical: OpenAI made 394
 * requests in a week, more than Googlebot, and pulled 14 MB of images.
 *
 * Stated plainly, as with llms.txt: no engine has published evidence that
 * serving Markdown earns citations. The difference is that this is not a
 * manifest making claims about the site — it is the site's own content in a
 * cheaper wrapper, so the worst case is that nobody asks for it.
 *
 * ## Built from the HTML, not from the content files
 *
 * Half of each page's prose lives in its TSX — the three massifs on the
 * terraces page, the twelve months on the calendar — and only half in
 * content/. Generating from JSON would quietly drop whichever half the author
 * happened to write in a component. Converting the built HTML cannot disagree
 * with the page, because it *is* the page.
 *
 * ## No dependency
 *
 * The project runs on four production packages and an HTML parser would have
 * been a fifth. The markup here is ours and its vocabulary is closed — the tag
 * census across all 28 pages fits on a screen — so this tokenises what we
 * actually emit rather than what HTML permits in general.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..");
const OUT = path.join(ROOT, "out");
const site = JSON.parse(readFileSync(path.join(ROOT, "content/site.json"), "utf8"));

/* Pages with no `main`: the CMS shell and the 404. Neither has prose to offer
   and both would convert to an empty file. */
const EXCLUS = new Set(["admin", "404"]);

/** Closed in HTML, so the walker must never look for an end tag. */
const VIDES = new Set(["br", "img", "hr", "input", "meta", "link", "source", "col"]);

/** Dropped with their subtree: furniture, controls and vector drawings. The
 *  breadcrumb goes too — the canonical URL in the front matter says where the
 *  page sits, and says it once instead of on every line. */
const IGNORES = new Set([
  "svg", "script", "style", "form", "nav", "button",
  "select", "textarea", "label", "noscript",
]);

const ENTITES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0",
  laquo: "«", raquo: "»", hellip: "…", mdash: "—", ndash: "–",
  eacute: "é", egrave: "è", agrave: "à", ccedil: "ç", ocirc: "ô", icirc: "î",
};

const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITES[n.toLowerCase()] ?? m);

/**
 * Tag soup to a tree.
 *
 * Unbalanced end tags are tolerated by unwinding to the nearest matching open
 * element and ignoring the tag otherwise, which is what browsers do and what
 * keeps one malformed fragment from costing a whole page.
 */
function arbre(html) {
  const racine = { tag: "#racine", attrs: {}, enfants: [] };
  const pile = [racine];
  const jeton = /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let pos = 0;
  let m;
  while ((m = jeton.exec(html))) {
    const texte = html.slice(pos, m.index);
    if (texte) pile.at(-1).enfants.push(decode(texte));
    pos = jeton.lastIndex;
    if (m[0].startsWith("<!--")) continue;

    const nom = m[1].toLowerCase();
    if (m[0].startsWith("</")) {
      const i = pile.findLastIndex((n) => n.tag === nom);
      if (i > 0) pile.length = i;
      continue;
    }
    const attrs = {};
    for (const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g)) {
      if (a[1]) attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? "");
    }
    const noeud = { tag: nom, attrs, enfants: [] };
    pile.at(-1).enfants.push(noeud);
    if (!VIDES.has(nom) && !m[0].endsWith("/>")) pile.push(noeud);
  }
  const reste = html.slice(pos);
  if (reste) pile.at(-1).enfants.push(decode(reste));
  return racine;
}

const absolu = (href) =>
  !href || /^(https?:|mailto:|tel:|#)/.test(href) ? href : site.url + href;

/** Markdown's table cells cannot hold a newline, and `|` would open a column. */
const cellule = (s) => s.replace(/[^\S\u00a0]*\n[^\S\u00a0]*/g, " ").replace(/\|/g, "\\|").trim();

/**
 * French puts a space before `: ; ! ? »`, and these pages write it as `&nbsp;`
 * precisely so it cannot be broken or swallowed. JavaScript's `\s` matches
 * U+00A0, so collapsing whitespace with `\s+` flattened it to an ordinary
 * space, which the rule below then removed: every `l'année : c'est` across
 * thirty files came out as `l'année: c'est`. Here the non-breaking space is
 * content, not formatting, and the classes below exclude it on purpose.
 */
const ESPACES = /[^\S\u00a0]+/g;

/* Only the comma and the full stop. French sets a space before `: ; ! ? »` and
   the pages use an ordinary one as often as an insécable; the first version
   stripped both and glued a thousand colons to the word in front of them. */
const propre = (s) => s.replace(ESPACES, " ").replace(/ ([,.])/g, "$1").trim();

/** Inline rendering: everything that belongs on one line. */
function enligne(n) {
  if (typeof n === "string") return n.replace(ESPACES, " ");
  if (IGNORES.has(n.tag)) return "";
  const dedans = () => n.enfants.map(enligne).join("");
  switch (n.tag) {
    case "br":
      return "\n";
    case "b":
    case "strong": {
      const t = propre(dedans());
      return t ? `**${t}**` : "";
    }
    case "em":
    case "i": {
      const t = propre(dedans());
      return t ? `*${t}*` : "";
    }
    case "a": {
      const t = propre(dedans());
      const h = absolu(n.attrs.href);
      return t && h ? `[${t}](${h})` : t;
    }
    case "img":
      return n.attrs.alt ? `![${n.attrs.alt}](${absolu(n.attrs.src)})` : "";
    default:
      return dedans();
  }
}

/** Block rendering: returns a list of blocks, joined later by blank lines. */
function blocs(n, ctx = {}) {
  if (typeof n === "string") {
    const t = propre(n);
    return t ? [t] : [];
  }
  if (IGNORES.has(n.tag)) return [];
  const enfantsBlocs = () => n.enfants.flatMap((e) => blocs(e, ctx));
  const texte = () => propre(enligne(n));

  switch (n.tag) {
    case "h1":
      return [`# ${texte()}`];
    case "h2":
      return [`## ${texte()}`];
    case "h3":
      return [`### ${texte()}`];
    case "h4":
      return [`#### ${texte()}`];

    case "p":
    case "figcaption":
    case "caption": {
      /* The kicker is the small label above a heading — "Où regarder", "Après
         la moisson", "Questions fréquentes". On the page it is typography; in
         a flat file it becomes an orphan line of two words sitting above the
         heading that says the same thing better, and a model quoting the page
         could lift it as if it were a sentence. */
      if (n.attrs.class?.split(/\s+/).includes("kicker")) return [];
      const t = texte();
      return t ? [n.tag === "caption" ? `**${t}**` : t] : [];
    }

    case "blockquote": {
      const t = texte();
      return t ? [t.split("\n").map((l) => `> ${l}`).join("\n")] : [];
    }

    case "ul":
    case "ol": {
      const items = n.enfants
        .filter((e) => typeof e !== "string" && e.tag === "li")
        .map((li, i) => {
          const t = propre(enligne(li));
          return t ? `${n.tag === "ol" ? `${i + 1}.` : "-"} ${t.replace(/\n/g, " ")}` : "";
        })
        .filter(Boolean);
      return items.length ? [items.join("\n")] : [];
    }

    /* Definition lists carry the itinerary's facts — duration, comfort, season.
       Rendered as a term in bold and its value on the same line, because that is
       how they read on the page and how they would be quoted. */
    case "dl": {
      const lignes = [];
      let terme = null;
      for (const e of n.enfants) {
        if (typeof e === "string") continue;
        if (e.tag === "dt") terme = propre(enligne(e));
        else if (e.tag === "dd") {
          const v = propre(enligne(e)).replace(/\n/g, " ");
          if (v) lignes.push(terme ? `- **${terme}** : ${v}` : `- ${v}`);
          terme = null;
        }
      }
      return lignes.length ? [lignes.join("\n")] : [];
    }

    case "table": {
      const legende = n.enfants.find((e) => typeof e !== "string" && e.tag === "caption");
      const rangs = [];
      const collecte = (x) => {
        if (typeof x === "string") return;
        if (x.tag === "tr") {
          rangs.push(
            x.enfants
              .filter((c) => typeof c !== "string" && (c.tag === "td" || c.tag === "th"))
              .map((c) => cellule(enligne(c))),
          );
          return;
        }
        x.enfants.forEach(collecte);
      };
      n.enfants.forEach(collecte);
      if (!rangs.length) return [];
      const largeur = Math.max(...rangs.map((r) => r.length));
      const egalise = (r) => [...r, ...Array(largeur - r.length).fill("")];
      const [entete, ...corps] = rangs;
      const out = [
        `| ${egalise(entete).join(" | ")} |`,
        `|${" --- |".repeat(largeur)}`,
        ...corps.map((r) => `| ${egalise(r).join(" | ")} |`),
      ].join("\n");
      const l = legende ? propre(enligne(legende)) : "";
      return l ? [`**${l}**`, out] : [out];
    }

    /* A collapsed FAQ is still a question and its answer; the `details` wrapper
       is a presentation choice this format does not have. */
    case "details": {
      const res = [];
      for (const e of n.enfants) {
        if (typeof e === "string") continue;
        if (e.tag === "summary") {
          const q = propre(enligne(e));
          if (q) res.push(`### ${q}`);
        } else res.push(...blocs(e, ctx));
      }
      return res;
    }

    case "img": {
      const t = enligne(n);
      return t ? [t] : [];
    }

    default:
      return enfantsBlocs();
  }
}

const entre = (html, balise) => {
  const m = html.match(new RegExp(`<${balise}[^>]*>([\\s\\S]*?)</${balise}>`, "i"));
  return m ? m[1] : null;
};

const metaDe = (html, nom) => {
  const m = html.match(new RegExp(`<meta name="${nom}" content="([^"]*)"`, "i"));
  return m ? decode(m[1]) : "";
};

/** Pages, as `out/<chemin>/index.html` -> url path. */
function pages(dir = OUT, prefixe = "") {
  const res = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name.startsWith("_") || EXCLUS.has(e.name)) continue;
    const sous = path.join(dir, e.name);
    const chemin = `${prefixe}/${e.name}`;
    if (existsSync(path.join(sous, "index.html"))) res.push(chemin);
    res.push(...pages(sous, chemin));
  }
  return res;
}

const chemins = ["", ...pages()];
let ecrits = 0;
let vides = [];

for (const chemin of chemins) {
  const source = path.join(OUT, chemin, "index.html");
  if (!existsSync(source)) continue;
  const html = readFileSync(source, "utf8");

  const main = entre(html, "main");
  if (!main) continue;

  const titre = decode(entre(html, "title") ?? "").trim();
  const corps = blocs(arbre(main))
    .map((b) => b.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n");

  if (corps.length < 200) vides.push(chemin || "/");

  const url = `${site.url}${chemin}/`;
  const texte =
    `---\n` +
    `title: ${JSON.stringify(titre)}\n` +
    `canonical: ${url}\n` +
    `description: ${JSON.stringify(metaDe(html, "description"))}\n` +
    `---\n\n${corps}\n`;

  /* Served beside the page, not inside it: /visa-vietnam.md is addressable and
     guessable, /visa-vietnam/index.md is neither. */
  const dest = path.join(OUT, `${chemin || "/index"}.md`);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, texte);
  ecrits++;
}

if (vides.length) {
  console.error(`markdown : conversion quasi vide pour ${vides.join(", ")}`);
  process.exit(1);
}
console.log(`markdown : ${ecrits} pages converties`);
