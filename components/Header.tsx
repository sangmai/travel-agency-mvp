import { Glyph } from "./Art";
import { getSite } from "@/lib/content";

/**
 * Les ancres sont absolues et non relatives. L'en-tête est servi sur les
 * seize pages, mais ces sections n'existent que sur l'accueil : en écriture
 * relative, « #budget » ne menait nulle part depuis une fiche voyage ou une
 * page guide — soit quinze pages sur seize où le menu principal était inerte.
 */
const NAV = [
  { href: "/#regions", label: "Les régions" },
  { href: "/#circuits", label: "Circuits" },
  { href: "/quand-partir-au-vietnam", label: "Quand partir" },
  { href: "/budget-voyage-vietnam", label: "Budget" },
  { href: "/#avis", label: "Avis" },
  { href: "/#faq", label: "Questions" },
];

const tel = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

/**
 * WhatsApp est le canal principal entre une agence vietnamienne et une
 * clientèle française : gratuit depuis l'étranger, et le seul qui reste
 * joignable pendant le voyage. Le numéro figurait dans le contenu depuis le
 * début sans qu'aucun lien ne permette de l'utiliser.
 *
 * Le message pré-rempli évite le blanc devant lequel beaucoup renoncent.
 */
const wa = (numero: string, texte: string) =>
  `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texte)}`;

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
          <a
            className="hdr__wa"
            href={wa(site.whatsapp, "Bonjour, je prépare un voyage au Vietnam.")}
            rel="noopener"
          >
            WhatsApp
          </a>
          <a className="btn btn--amber btn--sm" href="/#devis">Devis gratuit</a>
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
      <a href={wa(site.whatsapp, "Bonjour, je prépare un voyage au Vietnam.")} rel="noopener">
        WhatsApp
      </a>
      <a href="/#devis">Demander un devis gratuit</a>
    </div>
  );
}
