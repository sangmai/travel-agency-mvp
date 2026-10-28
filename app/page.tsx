import { Header, MobileBar } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Envies } from "@/components/Envies";
import { Regions } from "@/components/Regions";
import { Gallery } from "@/components/Gallery";
import { Circuits } from "@/components/Circuits";
import { Story } from "@/components/Story";
import { Process } from "@/components/Process";
import { LocalAdvantage } from "@/components/LocalAdvantage";
import { WhenToGo } from "@/components/WhenToGo";
import { Budget } from "@/components/Budget";
import { Reviews } from "@/components/Reviews";
import { Advisor } from "@/components/Advisor";
import { Faq } from "@/components/Faq";
import { QuoteForm } from "@/components/QuoteForm";
import { Footer } from "@/components/Footer";
import { Closing, JsonLd } from "@/components/ui";
import { breadcrumb, organisationNode, siteId, touristTripNode } from "@/components/JsonLd";
import {
  getFaq,
  getReviews,
  getSite,
  getTrips,
  resolveStops,
  tripUrl,
} from "@/lib/content";

/**
 * Ordre : donner envie → proposer → rassurer → informer → convertir.
 * Aucun composant client ; la seule animation est en CSS.
 */
export default async function Home() {
  const [site, trips, faq, featured] = await Promise.all([
    getSite(),
    getTrips(),
    getFaq(),
    getReviews({ featured: true }),
  ]);

  const tripNodes = await Promise.all(
    trips.map(async (t) =>
      touristTripNode(t, {
        site,
        stops: (await resolveStops(t.stops)).map((s) => s.fr),
        reviews: await getReviews({ trip: t.slug }),
      }),
    ),
  );

  const graph = [
    ...organisationNode(site, featured),
    { "@type": "WebSite", "@id": siteId(site.url), url: site.url, name: site.name, inLanguage: "fr-FR" },
    {
      "@type": "WebPage",
      "@id": `${site.url}/#webpage`,
      url: site.url,
      name: "Voyage Vietnam sur mesure — Jasmine Travel, agence locale francophone",
      isPartOf: { "@id": siteId(site.url) },
      inLanguage: "fr-FR",
      breadcrumb: breadcrumb(site.url, [{ name: "Accueil" }]),
    },
    {
      "@type": "ItemList",
      name: "Circuits au Vietnam",
      numberOfItems: trips.length,
      itemListElement: trips.map((t, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: site.url + tripUrl(t.slug),
        item: tripNodes[i],
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@graph": graph }} />
      <Header />

      <main id="contenu">
        <Hero />
        <Envies />
        <Regions />
        <Gallery />
        <Circuits />
        <Story />
        <Process />
        <LocalAdvantage />
        <Reviews />
        <Advisor />
        <WhenToGo />
        <Budget />
        <Faq />
        <QuoteForm />
        <Closing
          title="Le Vietnam vous attend. Nous aussi."
          body="Un message suffit pour recevoir un itinéraire conçu pour vous, chiffré et sans engagement."
        />
      </main>

      <Footer />
      <MobileBar />
    </>
  );
}
