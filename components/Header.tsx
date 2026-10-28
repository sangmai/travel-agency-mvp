import { Glyph } from "./Art";
import { getSite } from "@/lib/content";

const NAV = [
  { href: "#regions", label: "Les régions" },
  { href: "#circuits", label: "Circuits" },
  { href: "#quand-partir", label: "Quand partir" },
  { href: "#budget", label: "Budget" },
  { href: "#avis", label: "Avis" },
  { href: "#faq", label: "Questions" },
];

const tel = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export async function Header() {
  const site = await getSite();

  return (
    <header className="hdr">
      <div className="hdr__in">
        <a className="mark" href="/" aria-label={`${site.name} — accueil`}>
          <Glyph className="mark__glyph" />
          <span>
            <span className="mark__name">{site.name}</span>
            <span className="mark__sub">Agence locale · {site.address.city}</span>
          </span>
        </a>

        <nav className="hdr__nav" aria-label="Navigation principale">
          {NAV.map((i) => <a key={i.href} href={i.href}>{i.label}</a>)}
        </nav>

        <div className="hdr__end">
          <a className="hdr__tel" href={tel(site.phone)}>{site.phoneDisplay}</a>
          <a className="btn btn--amber btn--sm" href="#devis">Devis gratuit</a>
        </div>
      </div>
    </header>
  );
}

/** Barre d'action fixe sur mobile — le trafic français est à ~70 % mobile. */
export async function MobileBar() {
  const site = await getSite();
  return (
    <div className="bar">
      <a href={tel(site.phone)}>Appeler</a>
      <a href="#devis">Demander un devis gratuit</a>
    </div>
  );
}
