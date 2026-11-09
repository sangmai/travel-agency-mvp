import { Glyph } from "./Art";
import { getSite, getTrips, tripUrl, lien} from "@/lib/content";
import { routesIn, type RouteGroup } from "@/lib/routes";

/**
 * Internal linking. `routesIn` returns only published routes, so an empty
 * column disappears on its own instead of showing a heading with no links.
 *
 * The type is a Record over every group except `legal`, which is rendered
 * separately below. That is deliberate: this used to be an array, and the
 * `agence` group was simply missing from it. The route was published, it was in
 * the sitemap, and nothing failed — /agence-de-voyage-vietnam just received two
 * internal links instead of twenty-one, which is a lot of lost weight for the
 * page carrying the brand and local queries.
 *
 * Written as a Record, adding a group to RouteGroup without giving it a title
 * stops compiling. A silent omission becomes a build error.
 */
const COLUMNS: Record<Exclude<RouteGroup, "legal">, string> = {
  circuits: "Circuits",
  envies: "Selon vos envies",
  preparer: "Préparer",
  comparer: "Comparer",
  agence: "L'agence",
};

export async function Footer() {
  const [site, trips] = await Promise.all([getSite(), getTrips()]);

  return (
    <footer className="ftr">
      <div className="wrap wrap--wide">
        <div className="ftr__top">
          <div className="ftr__brand">
            <div className="mark">
              <Glyph className="mark__glyph" />
              <span>
                <span className="mark__name">{site.name}</span>
                <span className="mark__sub">{site.byline} · {site.address.city}</span>
              </span>
            </div>

            <p className="ftr__about">
              {site.name} est la marque francophone de{" "}
              <b>{site.operator.name}</b>, agence de voyage locale basée à{" "}
              {site.address.city}, titulaire de la licence de tour-opérateur
              international {site.operator.license} et spécialisée depuis{" "}
              {site.operator.founded} dans les circuits privés sur mesure au
              Vietnam, au Laos et au Cambodge. {site.operator.name} conçoit et
              opère vos voyages, et c&apos;est avec elle que vous contractez.
            </p>

            {/* NAP: must be identical to the Google Business Profile and to
                the JSON-LD — any variation dilutes the local signal. */}
            <address className="ftr__nap">
              {/* Le <br/> est indispensable : JSX supprime tout blanc contenant
                  un retour à la ligne entre deux expressions, si bien que sans
                  lui le rendu collait « Jasmin Travel270 Nguyen Luong Bang ».
                  Un espace littéral suffirait à l'œil mais pas au sens — la
                  raison sociale est une ligne, la rue en est une autre, et ce
                  bloc doit se lire comme la fiche Google à laquelle il doit
                  être identique. */}
              <b>{site.operator.legalName}</b>
              <br />
              {site.address.street}
              <br />
              {site.address.city} {site.address.postalCode}, {site.address.countryName}
              <br />
              <a href={`tel:${site.phone.replace(/\s/g, "")}`}>{site.phoneDisplay}</a>
              <br />
              <a href={`mailto:${site.email}`}>{site.email}</a>
              <br />
              Licence {site.operator.license}
            </address>
          </div>

          {Object.entries(COLUMNS).map(([group, title]) => {
            const routes = routesIn(group as RouteGroup);
            if (routes.length === 0) return null;
            return (
              <nav key={group} aria-label={title}>
                <h3>{title}</h3>
                <ul>
                  {routes.map((r) => (
                    <li key={r.path}><a href={lien(r.path)}>{r.label}</a></li>
                  ))}
                  {/* The six itineraries, listed under "Circuits".

                      They are content, not routes, so routesIn() never saw
                      them — and the result was that the six selling pages had
                      the fewest inbound links on the site: ten to thirteen
                      source pages each, against twenty-four for every guide,
                      which all get theirs from this very footer. The pages that
                      sell were the hardest to reach.

                      A reader looking for an itinerary in the footer expects to
                      find the itineraries there, so this is not a link placed
                      for a crawler. It happens to fix both. */}
                  {group === "circuits" &&
                    trips.map((t) => (
                      <li key={t.slug}>
                        <a href={tripUrl(t.slug)}>{t.name}</a>
                      </li>
                    ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="ftr__bot">
          <p>© 2026 {site.name} · voyages opérés par {site.operator.legalName}</p>
          <nav className="ftr__legal" aria-label="Informations légales">
            {routesIn("legal").map((r) => (
              <a key={r.path} href={lien(r.path)}>{r.label}</a>
            ))}
            <a href={site.social.facebook} rel="noopener">Facebook</a>
            <a href={site.social.instagram} rel="noopener">Instagram</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
