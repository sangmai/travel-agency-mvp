import { Glyph } from "./Art";
import { getSite, lien} from "@/lib/content";

/**
 * The brand lockup carries the byline, in the header and the footer alike.
 *
 * "Voyage Vietnam Sur Mesure" on the first line, "by Jasmin Travel" on the
 * second. That second line is the whole point of the split: a traveller who
 * googles the agency finds two sites, and this is what tells them in one glance
 * that both are legitimate and how they relate — instead of leaving them to
 * wonder which one is real, two minutes before wiring three thousand euros.
 *
 * It must appear on every page, not only on the "about" page, because the
 * question occurs wherever the visitor happens to land.
 */

/**
 * The anchors are absolute, not relative. The header is served on all sixteen
 * pages, but these sections exist only on the home page: written relatively,
 * "#budget" led nowhere from a trip page or a guide page — fifteen pages out of
 * sixteen where the main menu was dead.
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
 * WhatsApp is the main channel between a Vietnamese agency and French
 * customers: free from abroad, and the only one that stays reachable during the
 * trip. The number had been in the content from the start with no link making
 * it usable.
 *
 * The pre-filled message removes the blank page many people give up in front of.
 */
const wa = (numero: string, texte: string) =>
  `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texte)}`;

export async function Header() {
  const site = await getSite();

  return (
    <header className="hdr">
      <div className="hdr__in">
        {/* The accessible name has to contain the visible one, or voice control
            fails on the words the user can actually read: the label said
            "… by Jasmin Travel — accueil" while the line underneath also showed
            "· Da Nang". Built from the same three pieces rendered below so the
            two cannot drift apart again. */}
        <a
          className="mark"
          href="/"
          aria-label={`${site.name} ${site.byline} · ${site.address.city} — accueil`}
        >
          <Glyph className="mark__glyph" />
          <span>
            <span className="mark__name">{site.name}</span>
            <span className="mark__sub">{site.byline} · {site.address.city}</span>
          </span>
        </a>

        <nav className="hdr__nav" aria-label="Navigation principale">
          {NAV.map((i) => <a key={i.href} href={lien(i.href)}>{i.label}</a>)}
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

/** Fixed action bar on mobile — French traffic is roughly 70% mobile. */
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
