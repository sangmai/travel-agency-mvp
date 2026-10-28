import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import siteJson from "@/content/site.json";
import "./globals.css";

/**
 * Auto-hébergées par next/font : aucun appel à fonts.googleapis.com, donc pas
 * de requête bloquante au rendu ni de transfert vers un tiers (RGPD).
 */
const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

/**
 * Title sous 60 caractères, sinon il est tronqué dans les SERP.
 * ⚠️ `metadataBase` doit viser le domaine de production : il sert de base aux
 * URL canoniques et Open Graph.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteJson.url),
  title: {
    default: "Voyage Vietnam sur mesure — Agence locale francophone | Jasmine Travel",
    template: "%s | Jasmine Travel",
  },
  description:
    "Voyage au Vietnam sur mesure avec une agence locale francophone à Hanoï. Circuits privés dès 870 €/pers., guide francophone, devis gratuit sous 48 h. Noté 4,9/5 sur 384 avis.",
  keywords: [
    "voyage vietnam",
    "voyage au vietnam",
    "circuit vietnam",
    "agence de voyage vietnam",
    "voyage vietnam sur mesure",
    "agence locale vietnam francophone",
  ],
  authors: [{ name: siteJson.name, url: siteJson.url }],
  creator: siteJson.name,
  publisher: siteJson.legalName,
  applicationName: siteJson.name,
  alternates: {
    canonical: "/",
    languages: {
      "fr-FR": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: siteJson.locale,
    url: siteJson.url,
    siteName: siteJson.name,
    title: "Voyage Vietnam sur mesure — Jasmine Travel, agence locale francophone",
    description:
      "Circuits privés au Vietnam conçus depuis Hanoï pour les voyageurs francophones. Itinéraire chiffré sous 48 h, retouches sans frais, guide francophone et chauffeur privé.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voyage Vietnam sur mesure — Jasmine Travel",
    description:
      "Agence locale francophone à Hanoï. Circuits privés dès 870 €/pers., devis gratuit sous 48 h.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  category: "travel",
  // ⚠️ À renseigner après création des propriétés correspondantes :
  // verification: { google: "…", other: { "facebook-domain-verification": "…" } },
};

export const viewport: Viewport = {
  themeColor: "#1B4238",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={siteJson.lang}
      className={`${display.variable} ${body.variable}`}
    >
      <body>
        <a className="skip" href="#contenu">
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
