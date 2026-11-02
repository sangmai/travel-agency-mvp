import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import siteJson from "@/content/site.json";
import "./globals.css";

/**
 * Self-hosted by next/font: no call to fonts.googleapis.com, so no
 * render-blocking request and no transfer to a third party (GDPR).
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
 * Title under 60 characters, otherwise it is truncated in the SERP.
 * WARNING: `metadataBase` must point at the production domain: it is the base
 * for canonical and Open Graph URLs.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteJson.url),
  title: {
    default: "Voyage Vietnam sur mesure, agence locale francophone",
    /* No brand suffix, deliberately.
     *
     * "| Voyage Vietnam Sur Mesure" costs 27 characters and pushed twelve of
     * the twenty-one titles past the ~60 Google displays, so they came back
     * truncated mid-word. The previous suffix was twelve characters shorter and
     * fitted; this brand name does not.
     *
     * A suffix buys brand recognition in the SERP — which is worth paying for
     * once a brand is recognised. This one is days old with no search volume,
     * so it would be paying truncation for nothing. The brand is still in the
     * domain shown above the title, in the H1 and in the markup.
     *
     * Revisit when the brand has its own queries: at that point shorten the
     * page titles instead, rather than letting the suffix push them over. */
    template: "%s",
  },
  /* No rating in the description: the one that used to be there — 4.9/5 from
     384 reviews — was invented, and this is the snippet Google displays. The
     licence number replaces it: that one can be verified. */
  description:
    `Circuits privés sur mesure au Vietnam dès 870 €/pers., devis gratuit sous ${siteJson.responseTime}. Opérés par ${siteJson.operator.name}, agence locale francophone à ${siteJson.address.city}.`,
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
  publisher: siteJson.name,
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
    /* Without a preview image, Facebook, WhatsApp and LinkedIn show a grey
       rectangle: a travel link shared without an image does not get clicked.
       The images are produced at build time by scripts/make-images.mjs, at
       1200 × 630 and in JPEG — several preview renderers cannot read WebP. */
    images: [{ url: "/photos/og/halong.jpg", width: 1200, height: 630, alt: "Baie d'Halong, Vietnam" }],
    title: `Voyage Vietnam sur mesure — ${siteJson.name} ${siteJson.byline}`,
    description:
      `Circuits privés au Vietnam conçus depuis ${siteJson.address.city} pour les voyageurs francophones, opérés par ${siteJson.operator.name}. Itinéraire chiffré sous ${siteJson.responseTime}, retouches sans frais, guide francophone et chauffeur privé.`,
  },
  twitter: {
    card: "summary_large_image",
    images: ["/photos/og/halong.jpg"],
    title: `Voyage Vietnam sur mesure — ${siteJson.name}`,
    description:
      `Circuits privés dès 870 €/pers., devis gratuit sous ${siteJson.responseTime}. Opérés par ${siteJson.operator.name}, agence locale francophone à ${siteJson.address.city}.`,
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
  // TODO: fill in once the matching properties exist:
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
  const m = siteJson.mesure;

  return (
    <html
      lang={siteJson.lang}
      className={`${display.variable} ${body.variable}`}
    >
      <head>
        {/* Search Console: one meta tag, no script, no cookie. Now that the
            site has its own domain, prefer DNS TXT verification — it covers
            every subdomain and survives a site rebuild. */}
        {m.searchConsole && (
          <meta name="google-site-verification" content={m.searchConsole} />
        )}

        {/* Cloudflare Web Analytics: no cookie, no personal data, so no
            consent banner to put up in France. Roughly 1.5 KB, against 30 KB
            for GA4. */}
        {m.cloudflare && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${m.cloudflare}"}`}
          />
        )}

        {/* WARNING: GA4 sets cookies and transfers personal data. In France it
            must only load AFTER explicit consent: filling this key in without
            having put up a banner exposes you to a CNIL penalty. The field is
            deliberately empty. */}
        {m.ga4 && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${m.ga4}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  `window.dataLayer=window.dataLayer||[];` +
                  `function gtag(){dataLayer.push(arguments)}` +
                  `gtag('js',new Date());` +
                  `gtag('config','${m.ga4}',{anonymize_ip:true});`,
              }}
            />
          </>
        )}
      </head>
      <body>
        <a className="skip" href="#contenu">
          Aller au contenu principal
        </a>
        {children}

        {/* Counts departures towards the operator — call, WhatsApp, email,
            Facebook. Those visitors leave the site without a trace anywhere
            else, and they are often the most decided ones.

            No cookie, no identifier, no IP address stored: only the channel and
            the page path are sent. So no consent banner to put up — and that is
            deliberate, a banner would depress precisely what we are measuring.

            `sendBeacon` rather than `fetch`: the browser leaves the page the
            instant a `tel:` link is clicked, and an ordinary request would be
            cancelled in flight. A beacon is guaranteed by the browser after the
            page is gone.

            Capture phase (`true`): the listener sits ahead of any handler that
            might stop propagation.

            Placed at the end of <body>: the site stays usable without
            JavaScript, the links work regardless, only the measurement is lost.

            The channel names must match the allow-list in worker/clicks.ts — a
            mismatch is dropped silently, with a 204 and no row written. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              `addEventListener("click",function(e){` +
              `var t=e.target,a=t&&t.closest&&t.closest("a[href]");if(!a)return;` +
              `var h=a.getAttribute("href")||"",c="";` +
              `if(h.indexOf("tel:")===0)c="phone";` +
              `else if(h.indexOf("https://wa.me/")===0)c="whatsapp";` +
              `else if(h.indexOf("mailto:")===0)c="email";` +
              `else if(h.indexOf("facebook.com/")>0)c="facebook";` +
              `if(!c||!navigator.sendBeacon)return;` +
              `try{navigator.sendBeacon("/api/clic",JSON.stringify(` +
              `{c:c,p:location.pathname}))}catch(_){}` +
              `},true);`,
          }}
        />
      </body>
    </html>
  );
}
