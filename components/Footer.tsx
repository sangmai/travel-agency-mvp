import { Glyph } from "./Art";
import { getSite } from "@/lib/content";
import { routesIn, type RouteGroup } from "@/lib/routes";

/**
 * Maillage interne. `routesIn` ne rend que les routes publiées, donc une
 * colonne vide disparaît d'elle-même au lieu d'afficher un titre sans liens.
 */
const COLUMNS: { title: string; group: RouteGroup }[] = [
  { title: "Circuits", group: "circuits" },
  { title: "Selon vos envies", group: "envies" },
  { title: "Préparer", group: "preparer" },
  { title: "Comparer", group: "comparer" },
];

export async function Footer() {
  const site = await getSite();

  return (
    <footer className="ftr">
      <div className="wrap wrap--wide">
        <div className="ftr__top">
          <div className="ftr__brand">
            <div className="mark">
              <Glyph className="mark__glyph" />
              <span>
                <span className="mark__name">{site.name}</span>
                <span className="mark__sub">Agence locale · {site.address.city}</span>
              </span>
            </div>

            <p className="ftr__about">
              {site.name} est une agence de voyage locale francophone basée à
              {" "}{site.address.city}, titulaire de la licence de tour-opérateur
              international {site.license}, spécialisée depuis {site.founded} dans
              les circuits privés sur mesure au Vietnam, au Laos et au Cambodge.
            </p>

            {/* NAP : doit être identique à Google Business Profile et au
                JSON-LD — toute variation dilue le signal local. */}
            <address className="ftr__nap">
              <b>{site.legalName}</b>
              {site.address.street}
              <br />
              {site.address.city} {site.address.postalCode}, {site.address.countryName}
              <br />
              <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phoneDisplay}</a>
              <br />
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <br />
              Licence {site.license}
            </address>
          </div>

          {COLUMNS.map((col) => routesIn(col.group)).map((routes, i) =>
            routes.length === 0 ? null : (
              <nav key={COLUMNS[i].title} aria-label={COLUMNS[i].title}>
                <h3>{COLUMNS[i].title}</h3>
                <ul>
                  {routes.map((r) => (
                    <li key={r.path}><a href={r.path}>{r.label}</a></li>
                  ))}
                </ul>
              </nav>
            ),
          )}
        </div>

        <div className="ftr__bot">
          <p>© {site.founded}–2026 {site.legalName}</p>
          <nav className="ftr__legal" aria-label="Informations légales">
            {routesIn("legal").map((r) => (
              <a key={r.path} href={r.path}>{r.label}</a>
            ))}
            <a href={site.social.facebook} rel="noopener">Facebook</a>
            <a href={site.social.instagram} rel="noopener">Instagram</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
